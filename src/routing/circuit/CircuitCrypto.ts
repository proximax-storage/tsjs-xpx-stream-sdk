/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as def from "../../defines/Onion";
import * as c from "crypto";
import {RelayCell} from "../cell/RelayCell";
import {Uint32} from "../../utils/Binary";
import * as forge from "node-forge";
import {stringToAsciiByteArray} from "../../utils/Hex";
import * as binary from "../../utils/Binary";
import {CircID} from "../Cell";

// circuitKeySize is the number of bytes of key required for circuit keys.
export const circuitKeySize = 2*def.StreamCipherKeySize + 2*def.HashSize;

export class CircuitKeys {
    public Df : Buffer; // Forward digest
    public Db : Buffer; // Backward digest
    public Kf : Buffer; // Forward key
    public Kb : Buffer; // Backward key

    constructor(){
    }
}

export function buildCircuitKeys(d : Buffer) : CircuitKeys{
    let k = new CircuitKeys();
    let current = 0;

    k.Df = d.slice(current, def.HashSize);
    current += def.HashSize;

    k.Db = d.slice(current, current + def.HashSize);
    current += def.HashSize;

    k.Kf = d.slice(current, current + def.StreamCipherKeySize);
    current += def.StreamCipherKeySize;

    k.Kb = d.slice(current, current + def.StreamCipherKeySize);

    return k;
}

export class CircuitCryptoState {
    private cipher : forge.cipher.BlockCipher;
    private currDigest : c.Hash;
    private oldDigest : c.Hash;
    private key : Buffer;

    constructor(stream, digest, k : Buffer ) {
        this.cipher = stream;
        this.currDigest = digest;
        this.key = k;
    }

    encryptOrigin(b : Buffer) {
        this.oldDigest = this.currDigest;

        let r = new RelayCell(b);
        r.clearDigest();

        let byteBuffer = new Uint8Array(b);
        this.currDigest.update(byteBuffer);
        let sum = this.currDigest.copy().digest();

        r.setDigest(Uint32(sum));
        return this.encrypt(b);
    }

    encrypt(b : Buffer) : Buffer {
        const inputBuffer = new forge.util.ByteStringBuffer(b);
        this.cipher.update(inputBuffer);
        return Buffer.from(stringToAsciiByteArray(this.cipher.output.getBytes()));
    }

    decrypt(b : Buffer) : Buffer {
        let bprime = this.encrypt(b);

        this.oldDigest = this.currDigest.copy();

        // Update digest by hashing the relay cell with digest cleared.
        let r = new RelayCell(bprime);
        let digest = r.getDigest();
        let d = digest >>> 0;
        r.clearDigest();

        let byteBuffer = new Uint8Array(bprime);
        this.currDigest.update(byteBuffer);

        r.setDigest(d);

        return bprime;
    }

    // RewindDigest rewinds digest backwards
    rewindDigest() {
        if(this.oldDigest != null) {
            this.currDigest = this.oldDigest;
            this.oldDigest = null;
        }
    }

    digest() : number {
        let copy = this.currDigest.copy();
        return binary.Uint32(copy.digest());
    }
}

export function newCircuitCryptoState(d : Buffer, k : Buffer) {

    let byteBuffer = new Uint8Array(d);
    let digest = c.createHash('sha1');
    digest.update(byteBuffer);

    //let iv = Buffer.alloc(16); // aes.blocksize

    const key = new forge.util.ByteStringBuffer(k);

    let cipher = forge.cipher.createCipher('AES-CTR', key);
    let iv = [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0];

    cipher.start({iv: iv});
    return new CircuitCryptoState(cipher, digest, k);
}

export function generateCircId(msb : number) : CircID {
    let b = c.randomBytes(4);
    let x = binary.Uint32(b);
    x = (x >> 1) | (msb << 31);
    return x >>> 0;
}

export function forwardCryptoState(k : CircuitKeys) : CircuitCryptoState {
    return newCircuitCryptoState(k.Df, k.Kf);
}

export function backwardCryptoState(k : CircuitKeys) : CircuitCryptoState {
    return newCircuitCryptoState(k.Db, k.Kb);
}