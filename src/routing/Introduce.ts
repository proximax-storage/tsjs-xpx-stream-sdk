/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Identity, newIdentity} from "../pki/Identity";
import {Curve25519KeySize} from "../defines/Crypto";
import {PutUint16, Uint16} from "../utils/Binary";
import {int16} from "../utils/typeCaster";
import {stringToAsciiByteArray} from "../utils/Hex";
import * as c from "crypto";
import {Log} from "../utils/Logger";
import {isArraySame} from "../utils/CommonHelpers";

export class IntroduceRequest {
    public Identity : Identity;
    public Key : Buffer;  //Curve25519KeySize:32
    public ClientKey : Buffer;
    public Encrypted : Buffer;
    public Mac : Buffer;
    public InternalMacVerify : Buffer;

    constructor() {
    }

    marshal(MACKey : Buffer) : Buffer {
        let idlen = this.Identity.Id.length;
        let length = 2 + idlen + Curve25519KeySize + Curve25519KeySize +
            2 + this.Encrypted.length;

        let result = Buffer.alloc(length);
        PutUint16(result, int16(idlen));

        let idbyte = Buffer.from(stringToAsciiByteArray(this.Identity.Id));
        idbyte.copy(result, 2);
        this.Key.copy(result, 2 + idlen);
        this.ClientKey.copy(result, 2 + idlen + Curve25519KeySize);
        PutUint16(result, int16(this.Encrypted.length), 2 + idlen + Curve25519KeySize + Curve25519KeySize);
        this.Encrypted.copy(result, 2+idlen+Curve25519KeySize+Curve25519KeySize+2);

        let hash = c.createHmac('sha256', MACKey).update(result).digest();
        result = Buffer.concat([result, hash]);
        return result;
    }

    verify(MACKey : Buffer) : boolean {
        if(this.InternalMacVerify == null) {
            Log("Payload is not unmarshalled");
            return false;
        }

        let mac = c.createHmac('sha256', MACKey).update(this.InternalMacVerify).digest();
        if(!isArraySame(mac, this.Mac)) {
            Log("Mac is not equal");
            return false;
        }
        return true;
    }
}

export function NewIntroduceRequest(payload : Buffer) {
    let remainder = payload.length;
    if( remainder < 2){
        Log("[1] invalid introduce request payload");
        return null;
    }

    let identityLen = Uint16(payload);
    remainder -= 2;

    if(remainder < identityLen) {
        Log("[2] invalid introduce request payload");
        return null;
    }

    let idi = Buffer.alloc(identityLen);
    payload.copy(idi, 0, 2, 2 + identityLen);

    let ir = new IntroduceRequest();
    let identity = String.fromCharCode.apply(String, idi);
    ir.Identity = newIdentity(identity);

    remainder -= identityLen;

    if(remainder < Curve25519KeySize * 2) {
        Log("[3] invalid introduce request payload");
        return null;
    }

    ir.Key = payload.slice(2+identityLen, 2+identityLen + Curve25519KeySize);
    ir.ClientKey = payload.slice(2+identityLen+Curve25519KeySize, 2+identityLen+Curve25519KeySize + Curve25519KeySize);
    remainder -= (Curve25519KeySize * 2);

    if (remainder < 2) {
        Log("[4] invalid introduce request payload");
        return null;
    }

    let encryptedLen = Uint16(payload, 2+identityLen+
        Curve25519KeySize+Curve25519KeySize);

    remainder -= 2;
    if (remainder < encryptedLen) {
        Log("[4] invalid introduce request payload");
        return null;
    }

    ir.Encrypted = payload.slice(2+identityLen+Curve25519KeySize+Curve25519KeySize+2,
        2+identityLen+Curve25519KeySize+Curve25519KeySize+2 + encryptedLen);

    remainder -= encryptedLen;
    if(encryptedLen <= 0) {
        Log("[5] invalid introduce request payload");
        return null;
    }

    ir.Mac = payload.slice(2+identityLen+Curve25519KeySize+Curve25519KeySize+2+encryptedLen);

    // check this there might be an issue
    ir.InternalMacVerify = payload.slice(0, payload.length - remainder);

    return ir;
}