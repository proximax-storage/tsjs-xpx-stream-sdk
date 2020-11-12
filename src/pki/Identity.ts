/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {hexToBytes, stringToAsciiByteArray} from "../utils/Hex";
import * as c from "crypto"
import {bytesToHex} from "../../src/utils/Hex";
import * as bs58 from "../3rd-party/bs58";
import {Ed25519PublicKeySize} from "../defines/Crypto";
import {isArraySame} from "../utils/CommonHelpers";

export const IdentityType = Object.freeze({
    Account : 1,
    Node    : 2
});

export const IdentityTypeAccountStr = "account"
export const IdentityTypeNodeStr    = "node"
const ErrMalformedIdentity = "malformed identity";

export class Identity {
    public Id : string;
    public Namespace : string;
    public SubNamespace : string;
    public Tp : number;             // Identity Type
    public Key : Buffer;            // ed25519 key

    constructor() {
    }

    length() {
        return this.Id.length;
    }

    bytes() {
       return stringToAsciiByteArray(this.Id);
    }

    publicKey() : Buffer {
        return this.Key;
    }
}

export function checksum(input : string) : Buffer {
    var hash = c.createHash("sha256").update(input).digest();
    var h2 = c.createHash("sha256").update(hash).digest();
    return h2.slice(0,4);
}

export function newIdentity(id : string) : Identity {
    if(id.length > 255)
        throw(ErrMalformedIdentity);

    var parts = id.split(".");
    if(parts.length != 4)
        throw (ErrMalformedIdentity);

    if(parts[0].length == 0 || parts[1].length == 0 || parts[3].length == 0)
        throw (ErrMalformedIdentity);

    var tp : number;
    if(parts[2] == IdentityTypeAccountStr)
        tp = IdentityType.Account;
    else if (parts[2] == IdentityTypeNodeStr)
        tp = IdentityType.Account;
    else
        throw (ErrMalformedIdentity);

    var reverse = bs58.decode(parts[3]);
    var key = hexToBytes(reverse);
    if(key.length != Ed25519PublicKeySize + 4)
        throw (ErrMalformedIdentity);

    let idi = new Identity();
    idi.Id = id;
    idi.Namespace = parts[0];
    idi.SubNamespace = parts[1];
    idi.Tp = tp;
    idi.Key = Buffer.from(key).slice(0, Ed25519PublicKeySize);

    let keyStr = bytesToHex(idi.Key);
    let chksum = checksum(parts[0] + "." + parts[1] + "." + parts[2] + "." + keyStr);

    if(!isArraySame(chksum, key.slice(Ed25519PublicKeySize)))
        throw (ErrMalformedIdentity);

    return idi;
}



export function buildIdentity(namespace : string, subnamespace : string, tp : number, key : Buffer) : Identity {
    var tps : string;

    switch(tp) {
        case IdentityType.Account:
            tps = IdentityTypeAccountStr;
            break;
        case IdentityType.Node:
            tps = IdentityTypeNodeStr;
            break;
        default:
            throw ("malformed identity");
    }

    let chksum = checksum(namespace + "." + subnamespace + "." + tps + "." + bytesToHex(key));
    let keyCheck = Buffer.concat([key, chksum]);
    let b58 = bs58.encode(bytesToHex(keyCheck));

    return newIdentity(namespace + "." + subnamespace + "." + tps + "." + b58);
}

// reference :