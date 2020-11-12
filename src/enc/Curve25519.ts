/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

/**
 * Custom structure for Curve25519 pair
 * used internallyy within the SDK
 */
export class Curve25519KeyPair {
    public PrivateKey : Buffer;
    public PublicKey : Buffer;
    constructor(privKey? : Buffer, pubKey? : Buffer) {
        this.PrivateKey = (privKey == undefined)? null : privKey;
        this.PublicKey = (pubKey == undefined)? null : pubKey;
    }
}