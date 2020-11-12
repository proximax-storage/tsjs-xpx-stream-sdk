/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Identity} from "../pki/Identity";
import {Curve25519KeyPair} from "../enc/Curve25519";
import {
    ClientHandshake, CreateRVAuth,
    HSHandshakeExpand,
    HSHandshakeKey,
    HSHashSize,
    HSStreamCipherKeySize,
    PublicHandshakePart, RVKDF, RvPublicHandshakePart,
    SenderHandshake
} from "./RvHandshake";
import {
    backwardCryptoState,
    buildCircuitKeys,
    CircuitCryptoState,
    circuitKeySize, forwardCryptoState,
    newCircuitCryptoState
} from "../routing/circuit/CircuitCrypto";
import * as curve from "../3rd-party/curve25519-js"
import {Curve25519KeySize, Curve25519SeedSize} from "../defines/Crypto";
const crypto = require('crypto');
import hkdf = require("futoin-hkdf");
import {stringToAsciiByteArray} from "../utils/Hex";
import {HandshakeExpand, HandshakeKey} from "../defines/Onion";
import * as forge from "node-forge";
import {IntroduceRequest} from "../routing/Introduce";
import {Log} from "../utils/Logger";
import {isArraySame} from "../utils/CommonHelpers";
import {RvCircuitHandler} from "./RvCircuitHandler";

export class RVCircuitInitiator extends RvCircuitHandler{
    public Identity : Identity;
    public PresenceKey : Buffer; // Curve25519KeySize : 32
    public FirstLegKeyPair : Curve25519KeyPair;
    public SenderHandShake : SenderHandshake;

    constructor(identity : Identity, presenceKey : Buffer) {
        super();
        this.Identity = identity;
        this.PresenceKey = presenceKey;

        const clientKeyPair = curve.generateKeyPair(crypto.randomBytes(Curve25519SeedSize));
        this.FirstLegKeyPair = new Curve25519KeyPair(Buffer.from(clientKeyPair.private),
            Buffer.from(clientKeyPair.public));
    }

    generateIntroduceRequest(payload : Buffer) : Buffer {

        let publicHandshake = new PublicHandshakePart();
        publicHandshake.ID = this.Identity;
        publicHandshake.KX = this.FirstLegKeyPair.PublicKey;
        publicHandshake.KB = this.PresenceKey;

        this.SenderHandShake = new SenderHandshake(publicHandshake, this.FirstLegKeyPair.PrivateKey);

        var salt = stringToAsciiByteArray(HSHandshakeKey);
        var info = stringToAsciiByteArray(HSHandshakeExpand);
        var d = hkdf(Buffer.from(this.SenderHandShake.secretInput()), HSStreamCipherKeySize + HSHashSize,
            {salt:Buffer.from(salt), info: Buffer.from(info),hash: "SHA-256"});

        let encodedKey = d.slice(0, HSStreamCipherKeySize);
        let macKey = d.slice(HSStreamCipherKeySize, HSStreamCipherKeySize + HSHashSize);

        const key = new forge.util.ByteStringBuffer(encodedKey);
        let cipher = forge.cipher.createCipher('AES-CTR', key);
        let iv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        cipher.start({iv: iv});

        const inputBuffer = new forge.util.ByteStringBuffer(payload);
        cipher.update(inputBuffer);
        cipher.finish();
        let encryptedMessage = Buffer.from(stringToAsciiByteArray(cipher.output.getBytes()))

        let ir = new IntroduceRequest();
        ir.Identity = this.Identity;
        ir.Key = this.PresenceKey;
        ir.ClientKey = this.FirstLegKeyPair.PublicKey;
        ir.Encrypted = encryptedMessage;

        let marshalled = ir.marshal(macKey);
        return marshalled;
    }

    acceptRVAuth(auth : Buffer) : boolean {
        if(this.SenderHandShake == null) {
            Log("handshake is not initialized");
            return false;
        }

        if(auth.length <= Curve25519KeySize) {
            Log("handshake info is too short");
            return false;
        }

        let KY = auth.slice(0, Curve25519KeySize);
        let rvAuth = auth.slice(Curve25519KeySize);

        let clientHandshake = new ClientHandshake();
        clientHandshake.PublicHandshakePart = new RvPublicHandshakePart();
        clientHandshake.PublicHandshakePart.KX = this.SenderHandShake.publicHanshakePart.KX;
        clientHandshake.PublicHandshakePart.KY = KY;
        clientHandshake.PublicHandshakePart.KB = this.SenderHandShake.publicHanshakePart.KB;
        clientHandshake.PublicHandshakePart.ID = this.SenderHandShake.publicHanshakePart.ID;
        clientHandshake.Kx = this.FirstLegKeyPair.PrivateKey;

        let localAuth = CreateRVAuth(clientHandshake);
        if(!isArraySame(rvAuth,localAuth )) {
            Log("Invalid Auth token");
            return false;
        }

        let d = RVKDF(clientHandshake);
        let keys = buildCircuitKeys(d);

        this.Send = forwardCryptoState(keys);
        this.Recieve = backwardCryptoState(keys);

        return true;
    }
}
