/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Identity, newIdentity} from "../pki/Identity";
import {BegginingOfChainShift, Ed25519CertificateRegular, Ed25519CertificateSelfSigned} from "../defines/Certificate";
import * as forge from "node-forge";
import {Ed25519PublicKeySize, Ed25519SignatureSize} from "../defines/Crypto";
import {PutUint16, PutUint64, Uint16, Uint64} from "../utils/Binary";
import {int16, int32} from "../utils/typeCaster";
import {Log} from "../utils/Logger";
import {Ed25519KeyPair} from "./KeyPair";
import {NumberOfAuthSignaturesRequiredByClient} from "../defines/SiriusStream";
import {RSAPayload} from "./RSAPayload";

export class CertificateTrustSignatures {
    public Certificate;      // points to Flatcertificate
    public Signature : Buffer; //Ed25519Signature: byte[Ed25519SignatureSize]

    marshal() : Buffer {
        let crt = this.Certificate.marshal();
        if(crt.length > 65535)
            throw("sub certificate is too long");

        let ret = Buffer.alloc(2+Ed25519SignatureSize + crt.length);
        this.Signature.copy(ret);
        PutUint16(ret, int16(crt.length), Ed25519SignatureSize);
        crt.copy(ret, Ed25519SignatureSize+2);

        return ret;
    }

    unmarshal(input : Buffer) : number {
        let remainingLen = input.length;
        let src = input;

        if(remainingLen < Ed25519SignatureSize+ 2) {
            return -1;
        }

        this.Signature = src.slice(0, Ed25519SignatureSize);
        src = src.slice(Ed25519SignatureSize);
        remainingLen -= Ed25519SignatureSize;
        let crtLen = Uint16(src);
        src = src.slice(2);
        remainingLen -= 2;

        if(remainingLen < int32(crtLen)){
            return -1;
        }

        let crt = Buffer.alloc(crtLen);
        src.copy(crt);
        remainingLen -= int32(crtLen);

        this.Certificate = new FlatCertificate();
        if(this.Certificate.unmarshal(crt) != null){
            return -1;
        }

        return remainingLen;
    }
}

export class FlatCertificate {
    public TimeNotBefore : Date;
    public TimeNotAfter : Date;
    public CertificatePublicKey : Buffer;
    public PKIAccountID : Identity;
    public Payload : Buffer;
    public SelfSigned : boolean;
    public MasterSignature : Buffer;    //Ed25519Signature: byte[Ed25519SignatureSize]
    public Signatures : Array<CertificateTrustSignatures>;

    constructor() {
        this.Signatures = new Array<CertificateTrustSignatures>();
    }

    signedPart() : Buffer {
        if(this.CertificatePublicKey == null)
            return null;

        let size = 8 + 8 /*time before and after*/ + Ed25519PublicKeySize + 2 + this.PKIAccountID.length() + 2;
        if (this.Payload != null) {
            size += this.Payload.length;
        }

        let ret = Buffer.alloc(size);

        let t : bigint = BigInt(this.TimeNotBefore.getTime()) / BigInt(1000);
        PutUint64(ret, t);
        t = BigInt(this.TimeNotAfter.getTime())  / BigInt(1000);
        PutUint64(ret, t, 8);

        let idx = 16;
        this.CertificatePublicKey.copy(ret, idx);
        idx += Ed25519PublicKeySize;

        let ln = int16(this.PKIAccountID.length());
        PutUint16(ret, ln, idx);
        idx += 2;
        Buffer.from(this.PKIAccountID.bytes()).copy(ret, idx);
        idx += this.PKIAccountID.length();

        if(this.Payload) {
            ln = this.Payload.length;
            PutUint16(ret, ln, idx);
            idx += 2;
            this.Payload.copy(ret, idx);
        } else {
            PutUint16(ret, 0, idx);
        }

        return ret;
    }

    wholeBody() : Buffer {
        let body = this.signedPart();
        if( body == null)
            throw("whole body not exist");

        return Buffer.concat([body, this.MasterSignature]);
    }

    method() {
        if(this.SelfSigned)
            return Ed25519CertificateSelfSigned;

        return Ed25519CertificateRegular;
    }

    marshal() : Buffer {
        let wholeBody = this.wholeBody();

        let ret = Buffer.alloc(1);
        ret[0] = this.method();
        ret = Buffer.concat([ret, wholeBody]);

        for(let i = 0; i < this.Signatures.length; i++) {
            let cert = this.Signatures[i].marshal();
            ret = Buffer.concat([ret, cert]);
        }

        return ret;
    }

    depth() : number {
        if(this.CertificatePublicKey == null)
            return 0;
        return 1 + this.Signatures.length;
    }

    unmarshal(input : Buffer) {
        let remainingLen = input.length;

        if(remainingLen < 1) {
            Log("Certificate is too short");
            return -1;
        }

        switch(input[0]) {
            case Ed25519CertificateSelfSigned:
                this.SelfSigned = true;
                break;
            case Ed25519CertificateRegular:
                this.SelfSigned = false;
                break;
            default:
                Log("Unknow Certificate Method");
                return -1;
        }

        let unixTime : bigint;
        unixTime = Uint64(input.slice(1));
        this.TimeNotBefore = new Date(Number(unixTime) * 1000);
        unixTime = Uint64(input.slice(9));
        this.TimeNotAfter = new Date(Number(unixTime) * 1000);

        let now = new Date();
        if( this.TimeNotBefore > now && this.TimeNotAfter < now) {
            Log("Certificate expired");
            return -1;
        }

        let src = input.slice(17);
        remainingLen -= 17;

        if(remainingLen < Ed25519PublicKeySize) {
            Log("FlatCertificate::unmarshal Certificate too Short");
            return -1;
        }

        this.CertificatePublicKey = Buffer.alloc(Ed25519PublicKeySize);
        src.copy(this.CertificatePublicKey,0,0, Ed25519PublicKeySize);
        remainingLen -= Ed25519PublicKeySize;
        src = src.slice(Ed25519PublicKeySize);

        if(remainingLen < 2) {
            Log("FlatCertificate::unmarshal Certificate too Short");
            return -1;
        }

        let idLen = Uint16(src);
        remainingLen -= 2;
        src = src.slice(2);
        if(remainingLen < idLen) {
            Log("FlatCertificate::unmarshal Certificate too Short");
            return -1;
        }

        let id = Buffer.alloc(idLen);
        src.copy(id,0,0, idLen);
        remainingLen -= idLen;
        src = src.slice(idLen);

        let hostsName = String.fromCharCode.apply(String, id);
        this.PKIAccountID = newIdentity(hostsName);

        if(remainingLen < 2) {
            Log("FlatCertificate::unmarshal Certificate too Short");
            return -1;
        }

        let nsLen = Uint16(src);
        remainingLen -= 2;
        src = src.slice(2);

        if(nsLen > 0){
            if(remainingLen < nsLen) {
                Log("FlatCertificate::unmarshal Certificate too Short");
                return -1;
            }
            this.Payload = Buffer.alloc(nsLen);
            src.copy(this.Payload,0,0, nsLen);
            remainingLen -= nsLen;
            src = src.slice(nsLen);
        } else {
          this.Payload = null;
        }

        if(remainingLen < Ed25519SignatureSize) {
            Log("FlatCertificate::unmarshal Certificate too Short");
            return -1;
        }

        this.MasterSignature = src.slice(0, Ed25519SignatureSize);
        remainingLen -= Ed25519SignatureSize;
        src = src.slice(Ed25519SignatureSize);

        let identitiesOnAChain = new Map<string, boolean>();
        if(remainingLen > 0) {
            while(true) {
                let cts = new CertificateTrustSignatures();
                let rem = cts.unmarshal(src);
                if (rem < 0) {
                    Log("malformed trusted signature");
                    return -1;
                }

                src = src.slice(src.length - rem);
                if (cts.Certificate.depth() != 1) {
                    Log("multilevel certificate is not allowed on a chain");
                    return -1;
                }

                if (identitiesOnAChain.has(cts.Certificate.PKIAccountID.Id) &&
                    identitiesOnAChain.get(cts.Certificate.PKIAccountID.Id)) {
                    Log("repeating signature");
                    return -1;
                }

                identitiesOnAChain.set(cts.Certificate.PKIAccountID.Id, true);
                this.Signatures.push(cts);

                if(rem == 0)
                    break;
            }
        }

        return null;
    }

    publicKey() {
        if(this.CertificatePublicKey == null) {
            return null;
        }
        let k = Buffer.alloc(Ed25519PublicKeySize);
        this.CertificatePublicKey.copy(k);
        return k;
    }

    validate( validateNode : (id) => boolean ) : boolean {
        if(this.SelfSigned) {
            Log("Invalid certificate validator");
            return false;
        }

        let wholeBody = this.wholeBody();
        let numLeft = NumberOfAuthSignaturesRequiredByClient;
        let verifiedMaster = false;
        let identitiesSeen = new Map<string,boolean>();
        for(let i = 0; i < this.Signatures.length; i++) {
            let signature = this.Signatures[i];
            let flatten = signature.Certificate;

            if(signature.Certificate.depth() != 1) {
                Log("signature chain is too ddeep");
                return false;
            }

            if(identitiesSeen.has(signature.Certificate.PKIAccountID.Id) &&
                identitiesSeen.get(signature.Certificate.PKIAccountID.Id)){
                Log("duplicate signature");
                return false;
            }

            identitiesSeen.set(signature.Certificate.PKIAccountID.Id, true);

            let validateSignature = false;
            let validateSelfSigned = false;
            if(validateNode(flatten.PKIAccountID.Id)) {
                validateSignature = true;
            } else {
                if(flatten.PKIAccountID.Id == this.PKIAccountID.Id)
                    validateSelfSigned = true;
            }

            if(validateSignature || validateSelfSigned) {
                let pubKey = flatten.PKIAccountID.publicKey();
                let ed25519 = forge.pki.ed25519;

                var verified = ed25519.verify({
                    message: flatten.signedPart(),
                    signature: flatten.MasterSignature,
                    publicKey: pubKey
                });

                if(verified) {
                    let signingPubKey = signature.Certificate.publicKey();

                    verified = ed25519.verify({
                        message: wholeBody,
                        signature: signature.Signature,
                        publicKey: signingPubKey
                    });

                    if(!verified) {
                        Log("invalid signature on a signature chain");
                        return false;
                    }

                    if (validateSignature){
                        numLeft--
                    }

                    if (validateSelfSigned) {
                        verifiedMaster = true
                    }
                }else{
                    Log("invalid master signature on a signature chain");
                    return false;
                }

            }
        }

        // do we have enough auth signatures on a chain?
        if (numLeft > 0) {
            Log("not enough auth certificates on a chain");
            return false;
        }

        if (!verifiedMaster) {
            // we didn't have master signature on a chain so let's check the main signature instead
            // root certificate in this case is signed by master key
            let pubKey = this.PKIAccountID.publicKey();
            let ed25519 = forge.pki.ed25519;

            var verified = ed25519.verify({
                message: this.signedPart(),
                signature: this.MasterSignature,
                publicKey: pubKey
            });

            if(!verified) {
                Log("invalid master root signature");
                return false;
            }
        } else {
            // certificate is signed by self-signed certificate
            // root certificate in this case is signed by the announced public key
            let masterPK = this.publicKey();
            let ed25519 = forge.pki.ed25519;

            var verified = ed25519.verify({
                message: this.signedPart(),
                signature: this.MasterSignature,
                publicKey: masterPK
            });

            if(!verified) {
                Log("invalid master root signature");
                return false;
            }
        }

        return true;
    }

    verify( msg : Buffer, signature : Buffer) : boolean {
        if(this.CertificatePublicKey == null)
            return false;

        let ed25519 = forge.pki.ed25519;
        return ed25519.verify({
            message: msg,
            signature: signature,
            publicKey: this.CertificatePublicKey
        });
    }

    readPayLoad(payload : RSAPayload) : boolean{
        if(this.Payload == null) {
            Log("Error Empty payload");
            return false;
        }

        let err = payload.unmarshal(this.Payload);
        if(!err)
            return false;

        let payloadCopy = this.Payload;
        this.Payload = null;
        let b = payload.verify(this.signedPart());
        this.Payload = payloadCopy;
        return b;
    }
}

export function newFlatCertificate(publicKey : Buffer, pkiAccount : Identity, duration : number, privateKey : Buffer) {
    let cert = new FlatCertificate();

    var before = new Date();
    before.setHours(before.getHours()-BegginingOfChainShift);
    cert.TimeNotBefore = before;

    var after = new Date();
    after.setSeconds(after.getSeconds() + duration);
    cert.TimeNotAfter = after;

    cert.CertificatePublicKey = publicKey.slice();
    cert.PKIAccountID = pkiAccount;
    cert.SelfSigned = true;

    let signature = forge.pki.ed25519.sign({
        message: cert.signedPart(),
        privateKey : privateKey
    });

    cert.MasterSignature = Buffer.from(signature.slice());
    return cert;
}

export function addSignature(certificate : FlatCertificate, signature : Buffer, resetSelfSigned : boolean) {
    let cts = new CertificateTrustSignatures();
    let rem = cts.unmarshal(signature);
    if(rem < 0) {
        throw("malformed signature")
    }

    if(cts.Certificate.depth() != 1) {
        throw("Signature chain is too deep");
    }

    let wholeBody = certificate.wholeBody();
    let signingPK = cts.Certificate.publicKey();
    let signingKP = new Ed25519KeyPair(signingPK, null);
    let ed25519 = forge.pki.ed25519;
    var verified = ed25519.verify({
        // also accepts a forge ByteBuffer or Uint8Array
        message: wholeBody,
        // node.js Buffer, Uint8Array, forge ByteBuffer, or binary string
        signature: cts.Signature,
        // node.js Buffer, Uint8Array, forge ByteBuffer, or binary string
        publicKey: signingPK
    });

    if(!verified)
        throw("unable to add signature to certificate");

    certificate.Signatures.push(cts);
    if(resetSelfSigned)
        certificate.SelfSigned = false;
}