/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {FlatCertificate} from "./FlatCertificate";

export class Ed25519KeyPair {
    public PublicKey : Buffer;
    public PrivateKey : Buffer;

    constructor(publicKey : Buffer, privateKey : Buffer) {
        this.PublicKey = publicKey;
        this.PrivateKey = privateKey;
    }
}
export class SignedEd25519KeyPair {
    public KeyPair : Ed25519KeyPair;
    public Certificate : FlatCertificate;

    constructor(keypair : Ed25519KeyPair, cert : FlatCertificate) {
        this.KeyPair = keypair;
        this.Certificate = cert;
    }
}