/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {FlatCertificate} from "./FlatCertificate";
import {SignedEd25519KeyPair} from "./KeyPair";
import {Ed25519CertificateRegular, Ed25519CertificateSelfSigned, MaximumMessageSize} from "../defines/Certificate";
import * as forge from "node-forge";
import {Ed25519SignatureSize} from "../defines/Crypto";
import {PutUint32, Uint32} from "../utils/Binary";
import {int32} from "../utils/typeCaster";
import {Log} from "../utils/Logger";

export class SignedMessage {
    public Message : Buffer;
    public Signature : Buffer;          //enc.Ed25519Signature, byte[Ed25519SignatureSize:64]
    public Certificate: FlatCertificate;

    constructor() {
    }

    marshal() : Buffer {
        let cert = this.Certificate.marshal();
        let length = cert.length + Ed25519SignatureSize + this.Message.length + 4 + 1;
        let ret = Buffer.alloc(length);

        ret[0] = this.Certificate.method();
        PutUint32(ret, int32(this.Message.length), 1);
        this.Message.copy(ret, 5);

        let idx = 5 + this.Message.length;
        this.Signature.copy(ret, idx);
        idx += Ed25519SignatureSize;
        cert.copy(ret, idx);

        return ret;
    }
}

export function newSignedMessage(message : Buffer, key : SignedEd25519KeyPair) {
    if(message.length > MaximumMessageSize)
        throw ("message is too big");

    let sm = new SignedMessage();
    sm.Certificate = key.Certificate;

    let s = forge.pki.ed25519.sign({
        message: message,
        privateKey : key.KeyPair.PrivateKey
    });

    sm.Message = Buffer.alloc(message.length);
    message.copy(sm.Message);
    sm.Signature = Buffer.from(s.slice());

    return sm;
}

function unmarshalMessage(data : Buffer) : SignedMessage {
    if(data.length > MaximumMessageSize) {
       Log("Message is too big");
       return null;
    }

    if(data.length < 5) {
        Log("[1] Message is too short");
        return null;
    }

    let selfSigned = false;
    switch(data[0]){
        case Ed25519CertificateSelfSigned:
            selfSigned = true;
            break;
        case Ed25519CertificateRegular:
            selfSigned = false;
            break;
        default:
            Log("Unknown message method");
            return null;
    }

    let cert = new FlatCertificate();
    let ln = Uint32(data.slice(1));
    let ptr = data.slice(5);
    let remaining = data.length - 5;

    if(remaining < ln) {
        Log("[2] Message is too short");
        return null;
    }

    let sm = new SignedMessage();
    sm.Message = ptr.slice(0, ln);
    ptr = ptr.slice(ln);
    remaining -= ln;

    if(remaining < Ed25519SignatureSize) {
        Log("[3] Message is too short");
        return null;
    }

    sm.Signature = ptr.slice(0, Ed25519SignatureSize);
    ptr = ptr.slice(Ed25519SignatureSize);
    remaining -= Ed25519SignatureSize;

    if(remaining <= 0) {
        Log("[4] Message is too short");
        return null;
    }

    if( cert.unmarshal(ptr) < 0) {
        return null;
    }

    if(cert.SelfSigned != selfSigned) {
        Log("mismatching certificate type");
        return null;
    }

    // verify that data in the message is correctly signed with the given key
    if(!cert.verify(sm.Message, sm.Signature)) {
        Log("Unable to verifty the message");
        return null;
    }

    sm.Certificate = cert;

    return sm;
}

export function unmarshalSignedMessage(data : Buffer, validator) : SignedMessage {
    let sm = unmarshalMessage(data);
    if(sm == null)
        return;

    if(sm.Certificate.SelfSigned) {
        Log("Invalid validation type");
        return null;
    }

    if( validator && !sm.Certificate.validate(validator)) {
        return null;
    }

    return sm;
}
