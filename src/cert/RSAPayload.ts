/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Log} from "../utils/Logger";
import {Uint16} from "../utils/Binary";
import {fingerprintCertificateDER} from "../enc/Tls";
import {NodeIdentityKeySize} from "../defines/Onion";
// RSAPayloadCode is a code byte for RSA payload
const RSAPayloadCode = 0xAA;

export class RSAPayload {
    public Certificate : Buffer;
    public Signature : Buffer;
    public FingerPrint : Buffer;

    constructor() {}

    unmarshal(raw : Buffer) : boolean {
        if(raw.length > 65535 || raw.length < 3) {
            Log("[1] Invalid Payload");
            return false;
        }

        if(raw[0] != RSAPayloadCode) {
            Log("[2] Invalid Payload");
            return false;
        }

        let certSize = Uint16(raw.slice(1));
        if(certSize >= raw.length-3) {
            Log("[3] Invalid Payload");
            return false;
        }

        let cert = raw.slice(3, 3+ certSize);
        let signature = raw.slice(3+cert.length, (3+cert.length) + raw.length - 3 - certSize);
        let fp = fingerprintCertificateDER(cert, NodeIdentityKeySize);

        this.FingerPrint = fp;
        this.Certificate = cert;
        this.Signature = signature;

        return true;
    }

    verify(msg : Buffer){
        if(this.Certificate == null || this.Signature == null) {
            Log("Error Empty RSA Payload");
            return false;
        }

       //TODO: hash and rsa verify, implement once we have a reliable TLS library for nodejs/typescript

        return true;
    }

    payload() : Buffer {
        if(this.Certificate == null) {
            Log("Error Empty RSA payload");
            return null;
        }

        return this.FingerPrint;
    }
}