/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {DetailedCell} from "../Cell";
import { CertType, Command } from "../Identifiers";
import * as onion from "../../defines/Onion"
import { AsnParser } from "@peculiar/asn1-schema";
import { Certificate } from "@peculiar/asn1-x509";
import * as c from "crypto"
import * as forge from "node-forge";

type CertType = number;

class CertCellEntry {
    private type : CertType;
    private certs : Buffer;

    constructor(type : CertType, certDER : Buffer) {
        this.type = type;
        this.certs = certDER;
    }

    Type() {
        return this.type;
    }

    certDER() : Buffer {
        return this.certs;
    }
}

export class CertificateCell extends DetailedCell {

    private Certs : Array<CertCellEntry>;

    constructor() {
        super(Command.Certs);

        this.Certs = new Array<CertCellEntry>();
    }

    addCertsDER( t : CertType, der : Buffer) {
        this.Certs.push(new CertCellEntry(t, der));
    }

    countType(type : CertType) {
        let count = 0;
        for (let i=0; i < this.Certs.length; i++){
            if(this.Certs[i].Type() == type)
                count++;
        }

        return count;
    }

    // Search looks for a certificate of type t in the cell. If found it returns the
    // DER-encoded certificate. Errors if there are multiple certificates of that type.
    // Returns nil if there is no such certificate.
    search(t: CertType) : Buffer {
        if (this.countType(t) > 1) {
            console.log("multiple certificates of same type");
            return null;
        }

        for (let i=0; i < this.Certs.length; i++){
            if(this.Certs[i].Type() == t)
                return this.Certs[i].certDER();
        }

        return null;
    }

    // LookupX509 is like Lookup except it also parses the certificate as X509.
    lookupX509Forge( t : CertType) {
        let der  = this.search(t);
        if( der == null) {
            console.log("Missing certifcate");
            return null;
        }

        return derToCertForge(der);
    }

    validateResponderRSAOnly(peerCerts){

        var tlsCert = derToCertForge(peerCerts.raw);
        let link = this.lookupX509Forge(CertType.Link);
        if(link == null) {
            console.log("Cert type link not found");
            return false;
        }

        let ident = this.lookupX509Forge(CertType.Identity);
        if(ident == null) {
            console.log("Cert type identity not found");
            return false;
        }

        if(!this.certificateChecks(link, ident, Date.now(), 0))
            return false;

        if(!this.certificateChecks(ident, ident, Date.now(), onion.NodeIdentityKeySize))
            return false;

        if ("n" in link.publicKey && "n" in tlsCert.publicKey) {
            const pubLink = link.publicKey.n.toString();
            const pubTls = tlsCert.publicKey.n.toString();

            if( pubLink != pubTls) {
                console.log("link certificate does not match TLS certificate");
                return false;
            }
        } else {
            throw "Unexpected error in node-forge, " +
            "property n is missing certificate public key";
        }

        return true;
    }

    certificateChecks(crt, parent, t, bitValidation : number) : boolean {
        try{
            if(!this.validateCertificateDates(crt,t)) {
                console.log("outside certificate validity period");
                return false;
            }

            if (bitValidation != 0 && crt.publicKey.n.bitLength() < bitValidation) {
                console.log("wrong RSA key size");
                return false;
            }

            if(!parent.verify(crt)) {
                console.log("Unable to verify signature of certificate");
                return false;
            }

        }catch(e) {
            console.log(e);
            return false;
        }

        return true;
    }

    validateCertificateDates(crt, t) {
        return t < crt.validity.notAfter && t > crt.validity.notBefore;
    }
}

function derToCertForge(der) {
    const data = new forge.util.ByteStringBuffer(der);
    let asn1 = forge.asn1.fromDer(data);
    return forge.pki.certificateFromAsn1(asn1);
}

// IsCertType determines whether c is a possible CertType value.
export function IsCertType(c : number) : boolean {
    return c >= 1 && c <= 3;
}

export function fingerPrint256(der : Buffer) {
    const cert = AsnParser.parse(der, Certificate);
    let byteBuffer = new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey);
    return c.createHash('sha256').update(byteBuffer).digest('hex').toUpperCase();
}