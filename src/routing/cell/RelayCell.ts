/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as caster from "../../utils/typeCaster";
import * as binary from "../../utils/Binary";
import {MaxPayloadLength} from "../Identifiers";
import {int32, int8} from "../../utils/typeCaster";
import {Log} from "../../utils/Logger";
import {CircID, DetailedCell} from "../Cell";
import {Command } from "../Identifiers";
export type RelayCommand = number;

export class RelayCell extends DetailedCell{
    private data : Buffer;

    constructor(data : Buffer, command = Command.Relay) {
        super(command);
        this.data = data.slice();
    }

    setRelayCommand(cmd : RelayCommand) {
        this.data[0] = caster.int8(cmd);
    }

    getRelayCommand() : number {
        return int8(this.data[0]);
    }

    clearRecognized() {
        this.data[1] = 0;
        this.data[2] = 0;
    }

    setDigest(d: number) {
        binary.PutUint32(this.data, d, 3);
    }

    getDigest() : number {
        let r = this.data.slice(3, 7);
        return binary.Uint32(r);
    }

    setDataLength(n : number) {
        binary.PutUint16(this.data, n, 7);
    }

    dataLength() : number {
        return int32(binary.Uint16(this.data, 7));
    }

    clearDigest() {
        this.setDigest(0);
    }

    length() {
        return this.data.length;
    }

    getData() {
        return this.data;
    }

    recognized () : number {
        return binary.Uint16(this.data, 1);
    }

    relayData() {
        if (this.dataLength() > this.data.length-9) {
            Log("relay cell data length is too large");
            return null;
        }
        return this.data.slice(9 , 9+this.dataLength());
    }

    setData(data : Buffer) {
        this.setDataLength(data.length);
        data.copy(this.data, 9, 0, 9+this.dataLength());
    }

    isVariableLen() : boolean {
        return false;
    }
}

export function inPlaceRelayCell(place : Buffer, cmd : RelayCommand, length: number) : Buffer {
    let r = new RelayCell(place);
    r.setRelayCommand(cmd);
    r.clearRecognized();
    r.clearDigest();
    r.setDataLength(length);

    if(length > r.length() - 9) {
        console.log("ERROR: relay cell data length is too large");
        return null;
    }

    return r.getData().slice(9, 9+length);
}

export function newRelayCell(cmd : RelayCommand, data : Buffer) {
    let r = new RelayCell(Buffer.alloc(MaxPayloadLength));
    r.setRelayCommand(cmd);
    r.clearRecognized();
    r.clearDigest();
    r.setData(data);
    return r;
}

export function newRelayCellFromBytes(b : Buffer) : RelayCell{
    let r = new RelayCell(b);

    if(b.length != MaxPayloadLength) {
        Log("relay cell payload expected to be max payload length");
        return null;
    }

    return r;
}