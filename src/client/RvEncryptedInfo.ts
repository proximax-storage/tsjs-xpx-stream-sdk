/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {IsLinkSpecType, LinkSpec} from "../routing/LinkSpec";
import {Log} from "../utils/Logger";
import {Curve25519KeySize, FingerprintSize} from "../defines/Crypto";
import {HSHashSize} from "./RvHandshake";
import {int32, int8} from "../utils/typeCaster";

export class EncryptedInfoPayload {
    public Cookie : Buffer; // HSHashSize  = 32
    public Fingerprint : Buffer;
    public Handshake : Buffer;
    public linkSpecs : Array<LinkSpec>;

    constructor(){}

    marshal() : Buffer {
        if(this.linkSpecs.length == 0) {
            Log("Empty Payload");
            return null;
        }

        let result = Buffer.alloc(HSHashSize +
            FingerprintSize + Curve25519KeySize);

        this.Cookie.copy(result,0,0, HSHashSize);
        this.Fingerprint.copy(result, HSHashSize, 0, FingerprintSize);
        this.Handshake.copy(result, HSHashSize + FingerprintSize, 0, Curve25519KeySize);

        let ls = Buffer.alloc(1);
        ls[0] = int8(this.linkSpecs.length);
        let lsbyte = Buffer.alloc(1);

        for(let i = 0; i < this.linkSpecs.length; i++) {
            let lspec = this.linkSpecs[i];
            lsbyte[0] = int8(lspec.Type);
            ls = Buffer.concat([ls, lsbyte]);
            lsbyte[0] = int8(lspec.Spec.length);
            ls = Buffer.concat([ls, lsbyte]);
            ls = Buffer.concat([ls, lspec.Spec]);
        }

        return Buffer.concat([result, ls]);
    }
}

export function newEncryptedInfoPayload(payload : Buffer) : EncryptedInfoPayload {
    if (payload.length < (HSHashSize + FingerprintSize + Curve25519KeySize + 1)) {
        Log("[1] Cell payload too short");
        return null;
    }

    let e = new EncryptedInfoPayload();
    e.Cookie = payload.slice(0, HSHashSize);
    e.Fingerprint = payload.slice(HSHashSize, HSHashSize + Curve25519KeySize);
    e.Handshake = payload.slice(HSHashSize+Curve25519KeySize, HSHashSize+Curve25519KeySize +FingerprintSize);

    let p = payload.slice(HSHashSize+FingerprintSize+Curve25519KeySize);
    let nspec = int32(p[0]);
    p = p.slice(1);
    e.linkSpecs = new Array<LinkSpec>();

    for(let i = 0; i < nspec;i++) {
        if(p.length < 2){
            Log("[2] Cell payload too short");
            return null;
        }

        let lsttype = p[0];
        if(!IsLinkSpecType(lsttype)) {
            Log("unrecognized link spec type");
            return null;
        }

        let lslen = int32(p[1]);
        p = p.slice(2);

        if(p.length < lslen) {
            Log("[3] Cell payload too short");
            return null;
        }
        let lspec = p.slice(0,lslen);
        p = p.slice(lslen);

        let linkspec = new LinkSpec(lsttype);
        linkspec.Spec = lspec;

        e.linkSpecs.push(linkspec);
    }

    return e;
}