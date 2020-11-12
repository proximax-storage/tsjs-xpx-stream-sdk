/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Identity} from "../pki/Identity";
import {Curve25519KeyPair} from "../enc/Curve25519";
import {
    CreateRVAuth,
    HSHandshakeExpand,
    HSHandshakeKey, HSHashSize,
    HSStreamCipherKeySize, PresenceHandshake,
    PublicHandshakePart,
    ReceiverHandshake, RVKDF, RvPublicHandshakePart
} from "./RvHandshake";
import {
    backwardCryptoState,
    buildCircuitKeys,
    CircuitCryptoState,
    forwardCryptoState,
    newCircuitCryptoState
} from "../routing/circuit/CircuitCrypto";
import {NewIntroduceRequest} from "../routing/Introduce";
import {Log} from "../utils/Logger";
import {isArraySame} from "../utils/CommonHelpers";
const crypto = require('crypto');
import * as curve from "../3rd-party/curve25519-js"
import {Curve25519KeySize, Curve25519SeedSize} from "../defines/Crypto";
import {stringToAsciiByteArray} from "../utils/Hex";
import hkdf = require("futoin-hkdf");
import * as forge from "node-forge";
import {RvCircuitHandler} from "./RvCircuitHandler";

export class RvCircuitPresence extends RvCircuitHandler{
    public Identity : Identity;
    public PresenceKeyPair : Curve25519KeyPair;
    public PayLoad : Buffer;
    public CircuitKeyPair : Curve25519KeyPair;
    public ReceiverHandshake : ReceiverHandshake;
    public Sender : Identity;

    constructor() {
        super();
    }

    createRVAuth() : Buffer {
        if(this.ReceiverHandshake == null) {
            Log("handshake is not started");
            return null;
        }

        let presenceHandShake = new PresenceHandshake();
        presenceHandShake.PublicHandshakePart = new RvPublicHandshakePart();
        presenceHandShake.PublicHandshakePart.KX = this.ReceiverHandshake.publicHanshakePart.KX;
        presenceHandShake.PublicHandshakePart.KY = this.CircuitKeyPair.PublicKey;
        presenceHandShake.PublicHandshakePart.KB = this.ReceiverHandshake.publicHanshakePart.KB;
        presenceHandShake.PublicHandshakePart.ID = this.ReceiverHandshake.publicHanshakePart.ID;
        presenceHandShake.Kb = this.PresenceKeyPair.PrivateKey;
        presenceHandShake.Ky = this.CircuitKeyPair.PrivateKey;

        let auth = CreateRVAuth(presenceHandShake);
        let result = Buffer.alloc(Curve25519KeySize+auth.length);
        this.CircuitKeyPair.PublicKey.copy(result,0,0, Curve25519KeySize);
        auth.copy(result, Curve25519KeySize);

        let d = RVKDF(presenceHandShake);
        let keys = buildCircuitKeys(d);

        this.Recieve = forwardCryptoState(keys);
        this.Send = backwardCryptoState(keys);

        return result;
    }
}

export function NewRvCircuitPresence(identity : Identity, keypair : Curve25519KeyPair, payload : Buffer) :  RvCircuitPresence {
    let rv = new RvCircuitPresence();
    rv.Identity = identity;
    rv.PresenceKeyPair = keypair;

    let newIR = NewIntroduceRequest(payload);
    if (newIR == null) {
        return null;
    }

    if( newIR.Identity.Id != identity.Id ) {
        Log("invalid identity in request");
        return null;
    }

    if(!isArraySame(newIR.Key, keypair.PublicKey)){
        Log("invalid keyy in request");
        return null;
    }

    const clientKeyPair = curve.generateKeyPair(crypto.randomBytes(Curve25519SeedSize));
    rv.CircuitKeyPair = new Curve25519KeyPair(Buffer.from(clientKeyPair.private),
        Buffer.from(clientKeyPair.public));

    rv.ReceiverHandshake = new ReceiverHandshake();
    rv.ReceiverHandshake.publicHanshakePart = new PublicHandshakePart();
    rv.ReceiverHandshake.publicHanshakePart.ID = identity;
    rv.ReceiverHandshake.publicHanshakePart.KX = newIR.ClientKey;
    rv.ReceiverHandshake.publicHanshakePart.KB = keypair.PublicKey;
    rv.ReceiverHandshake.Kb = keypair.PrivateKey;

    var salt = stringToAsciiByteArray(HSHandshakeKey);
    var info = stringToAsciiByteArray(HSHandshakeExpand);
    var d = hkdf(Buffer.from(rv.ReceiverHandshake.secretInput()), HSStreamCipherKeySize + HSHashSize,
        {salt:Buffer.from(salt), info: Buffer.from(info),hash: "SHA-256"});

    let recvEncodeKey = d.slice(0, HSStreamCipherKeySize);
    let recvMacKey = d.slice(HSStreamCipherKeySize, HSStreamCipherKeySize + HSHashSize);

    if(!newIR.verify(recvMacKey)) {
        return null;
    }

    const key = new forge.util.ByteStringBuffer(recvEncodeKey);
    let cipher = forge.cipher.createCipher('AES-CTR', key);
    let iv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    cipher.start({iv: iv});
    const inputBuffer = new forge.util.ByteStringBuffer(newIR.Encrypted);
    cipher.update(inputBuffer);
    cipher.finish();
    rv.PayLoad = Buffer.from(stringToAsciiByteArray(cipher.output.getBytes()))

    return rv;
}
