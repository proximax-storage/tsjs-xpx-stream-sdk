/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Identity} from "../pki/Identity";
import {stringToAsciiByteArray} from "../utils/Hex";
import {exp} from "../routing/CreateHandshake";
import * as c from "crypto";
import hkdf = require("futoin-hkdf");
import {circuitKeySize} from "../routing/circuit/CircuitCrypto";
export const 	HSHashSize            = 32;
export const    HSStreamCipherKeySize = 16;
export const    HSHandshakeProtoID    = "psp-hs-curve25519-sha256-01";
export const    HSHandshakeKey        = HSHandshakeProtoID + ":hs_key_extract";
export const 	HSHandshakeExpand     = HSHandshakeProtoID + ":hs_key_expand";
export const    HSHandshakeAuthSuffix = ":server";
export const   	HSHandshakeVerify     = HSHandshakeProtoID + ":hs_verify";
export const    HSHandshakeMac        = HSHandshakeProtoID + ":hs_mac";

export class PublicHandshakePart {
    public KX : Buffer; // Curve25519KeySize : 32
    public KB : Buffer;
    public ID : Identity;
}

export class RvPublicHandshakePart {
    public KX : Buffer; // Curve25519KeySize : 32
    public KY : Buffer;
    public KB : Buffer;
    public ID : Identity;
}

export class SenderHandshake {
    public publicHanshakePart : PublicHandshakePart;
    public Kx : Buffer; // Curve25519KeySize : 32
    constructor( publicHandshake? : PublicHandshakePart, kx? : Buffer) {
        this.publicHanshakePart = (publicHandshake == undefined)? null : publicHandshake;
        this.Kx = (kx == undefined)? null : kx;
    }

    secretInput() : Buffer {
        let exp1 = exp(this.publicHanshakePart.KB, this.Kx);
        let id = stringToAsciiByteArray(this.publicHanshakePart.ID.Id);
        let protocolId = stringToAsciiByteArray(HSHandshakeProtoID);
        return Buffer.concat([
            exp1,
            Buffer.from(id),
            this.publicHanshakePart.KX,
            this.publicHanshakePart.KB,
            Buffer.from(protocolId)
        ]);
    }
}

export class ReceiverHandshake {
    public publicHanshakePart : PublicHandshakePart;
    public Kb : Buffer; // Curve25519KeySize : 32
    constructor( publicHandshake? : PublicHandshakePart, kb? : Buffer) {
        this.publicHanshakePart = (publicHandshake == undefined)? null : publicHandshake;
        this.Kb = (kb == undefined)? null : kb;
    }

    secretInput () : Buffer {
        let exp1 = exp(this.publicHanshakePart.KX, this.Kb);
        let id = stringToAsciiByteArray(this.publicHanshakePart.ID.Id);
        let protocolId = stringToAsciiByteArray(HSHandshakeProtoID);
        return Buffer.concat([
            exp1,
            Buffer.from(id),
            this.publicHanshakePart.KX,
            this.publicHanshakePart.KB,
            Buffer.from(protocolId)
        ]);
    }
}

interface ClientToRVHandshake {
    shared() : RvPublicHandshakePart;
    secretInput() : Buffer;
}

export class PresenceHandshake implements ClientToRVHandshake{
    public PublicHandshakePart : RvPublicHandshakePart;
    public Kb : Buffer;
    public Ky : Buffer;

    shared() : RvPublicHandshakePart {
        return this.PublicHandshakePart;
    }
    secretInput() : Buffer {
        let exp1 = exp(this.PublicHandshakePart.KX, this.Ky);
        let exp2 = exp(this.PublicHandshakePart.KX, this.Kb);
        let id = stringToAsciiByteArray(this.PublicHandshakePart.ID.Id);
        let protocolId = stringToAsciiByteArray(HSHandshakeProtoID);
        return Buffer.concat([
            exp1,
            exp2,
            Buffer.from(id),
            this.PublicHandshakePart.KB,
            this.PublicHandshakePart.KX,
            this.PublicHandshakePart.KY,
            Buffer.from(protocolId)
        ]);
    }
}

export class ClientHandshake implements ClientToRVHandshake {
    public PublicHandshakePart : RvPublicHandshakePart;
    public Kx : Buffer;

    shared() : RvPublicHandshakePart {
        return this.PublicHandshakePart;
    }

    secretInput() : Buffer {
        let exp1 = exp(this.PublicHandshakePart.KY, this.Kx);
        let exp2 = exp(this.PublicHandshakePart.KB, this.Kx);
        let id = stringToAsciiByteArray(this.PublicHandshakePart.ID.Id);
        let protocolId = stringToAsciiByteArray(HSHandshakeProtoID);
        return Buffer.concat([
            exp1,
            exp2,
            Buffer.from(id),
            this.PublicHandshakePart.KB,
            this.PublicHandshakePart.KX,
            this.PublicHandshakePart.KY,
            Buffer.from(protocolId)
        ]);
    }
}

function verify(h : ClientToRVHandshake) : Buffer {
    let byteBuffer = h.secretInput();
    let hash = c.createHmac('sha256', HSHandshakeVerify).update(byteBuffer).digest();
    return Buffer.from(hash);
}

function authInput(h : ClientToRVHandshake) : Buffer {
    let s = h.shared();
    var v  = verify(h);
    let id = stringToAsciiByteArray(s.ID.Id);
    let auth = stringToAsciiByteArray(HSHandshakeProtoID + HSHandshakeAuthSuffix);
    return Buffer.concat([
        v,
        Buffer.from(id),
        s.KB,
        s.KY,
        s.KX,
        Buffer.from(auth)
    ]);
}

export function CreateRVAuth(h : ClientToRVHandshake) : Buffer{
    let input = authInput(h);
    let hash = c.createHmac('sha256', HSHandshakeMac).update(input).digest();
    return Buffer.from(hash);
}

export function RVKDF(h : ClientToRVHandshake) : Buffer {
    var salt = stringToAsciiByteArray(HSHandshakeKey);
    var info = stringToAsciiByteArray(HSHandshakeExpand);

    return hkdf(Buffer.from(h.secretInput()), circuitKeySize,
        {salt:Buffer.from(salt), info: Buffer.from(info),hash: "SHA-256"});
}