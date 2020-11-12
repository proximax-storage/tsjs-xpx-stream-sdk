/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {detectEndianess, Endianess, PutUint32, Uint32, PutUint32LE, Uint32LE} from "../utils/Binary";

export const fProtocol = 0x40000000;
export const BUFL = 10200;
export const fCompSPEEX = 64;

/**
 * Represents a structure that reprsents a sound data
 */
export class SoundBuf {
    public compression : number = 0;            // uint32_t
    public sendinghost : Int8Array = null;      // char[16]
    public buffer_len : number = 0;             // uint32_t
    public buffer_val : Buffer;                 // char[BUFL]

    constructor() {
        this.sendinghost = new Int8Array(16);
        this.buffer_val = Buffer.alloc(BUFL);
    }

    serialize() : Uint8Array {
        let size = 4 + 16 + 4 + this.buffer_val.length;
        let buffer = Buffer.alloc(size);
        if( detectEndianess() == Endianess.Big) {
            PutUint32(buffer, this.compression);
            PutUint32(buffer, this.buffer_len, 20);
        }
        else {
            PutUint32LE(buffer, this.compression);
            PutUint32LE(buffer, this.buffer_len, 20);
        }
        this.buffer_val.copy(buffer, 24);

        return new Uint8Array(buffer);
    }

    static deserialize(data : Uint8Array) : SoundBuf {
        let bufferB = Buffer.from(data);
        let buffer = bufferB.slice(24);

        let sb = new SoundBuf();
        if( detectEndianess() == Endianess.Big) {
            sb.compression = Uint32(bufferB);
            sb.buffer_len = Uint32(bufferB, 20);
        }else {
            sb.compression = Uint32LE(bufferB);
            sb.buffer_len = Uint32LE(bufferB, 20);
        }

        sb.buffer_val = buffer.slice(0, sb.buffer_len);
        return sb;
    }
}