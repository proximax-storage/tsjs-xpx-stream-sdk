/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as curve from "../3rd-party/curve25519-js";
import {Curve25519KeySize} from "../defines/Crypto";
import * as def from "../defines/Onion";
import {hexToBytes, stringToAsciiByteArray} from "../utils/Hex";
import * as c from "crypto";

export class Public {
    public KX : Buffer;
    public KY : Buffer;
    public KB : Buffer;
    public ID : Buffer;

    constructor() {
    }
}

export class ClientHandshake {
    public Public : Public;
    public Kx : Buffer;

    constructor(pub : Public, Kx : Buffer) {
        this.Public = pub;
        this.Kx = Kx;
    }

    secretInput () {
        let exp1 = exp(this.Public.KY, this.Kx);
        let exp2 = exp(this.Public.KB, this.Kx);
        let protocolId = stringToAsciiByteArray(def.HandshakeProtoID);
        return Buffer.concat([
            exp1,
            exp2,
            this.Public.ID,
            this.Public.KB,
            this.Public.KX,
            this.Public.KY,
            Buffer.from(protocolId)
        ]);
    }

    verify() {
        let byteBuffer = this.secretInput();
        let hash = c.createHmac('sha256', def.HandshakeVerify).update(byteBuffer).digest('hex').toUpperCase();
        return hexToBytes(hash);
    }
}

export function exp(a, b) : Buffer {
    var t = Buffer.alloc(Curve25519KeySize);
    curve.crypto_scalarmult(t, b, a);
    return t;
}

function authInput(h : ClientHandshake)  {
    let s = h.Public;
    let auth = stringToAsciiByteArray(def.HandshakeProtoID + def.HandshakeAuthSuffix);
    var verify  = h.verify();
    return Buffer.concat([
        Buffer.from(verify),
        h.Public.ID,
        h.Public.KB,
        h.Public.KY,
        h.Public.KX,
        Buffer.from(auth)
    ]);
}

export function createHandshakeAuth(h : ClientHandshake){
    let byteBuffer = authInput(h);
    let hash = c.createHmac('sha256', def.HandshakeMac).update(byteBuffer).digest('hex').toUpperCase();
    return hexToBytes(hash);
}