/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {CellFactory} from "./CellFactory";
import {CellSender} from "./CellSender";
import * as binary from "../utils/Binary";
import * as defines from "./Identifiers"
import * as cmd from "./Command"

export type CircID = number;

export class Cell {
    private data : Buffer;

    constructor(data : Buffer) {
        this.data = data;
    }

    getData() : Buffer {
        return this.data;
    }

    setCircID(circID : CircID) {
        let data = this.data.slice(0);
        binary.PutUint32(data, circID);
        this.data = data;
    }

    getCircID() {
        return binary.Uint32(this.data);
    }

    payLoad(command? : cmd.Command) : Buffer {
        var c : cmd.Command = (command == undefined)? this.data[4]: command;

        var offset = cmd.PayloadOffset(c);
        return this.data.slice(offset);
    }

    setPayLoad(data : Buffer, command? : cmd.Command ) {
        var c : cmd.Command = (command == undefined)? this.data[4]: command;
        var offset = cmd.PayloadOffset(c);
        data.copy(this.data, offset);

    }

    command() : number {
        return this.data[4] as number;
    }
}

export class DetailedCell{
    private command : number;

    constructor(command) {
        this.command = command;
    }

    getCommand() {
        return this.command;
    }
}

export function BuildAndSend(sender: CellSender, factory : CellFactory) {
    var cell = factory.createCell();
    sender.send(cell);
}

export function NewCellFromBuffer(x : Buffer) : Cell {
    return new Cell(x)
}

export function NewVariableCell(circID: CircID, cmd: cmd.Command, n: number) : Cell
{
    var data = Buffer.alloc(7 + n);
    binary.PutUint32(data, circID & 0xFFFFFFFF);
    data[4] = cmd & 0xFF;
    binary.PutUint16(data, n & 0xFFFF, 5);

    return NewCellFromBuffer(data);
}

export function NewFixedCell(circID : CircID, command : cmd.Command) : Cell {

    var data = Buffer.alloc(5 + defines.MaxPayloadLength);

    binary.PutUint32(data, (circID) &  0xFFFFFFFF);
    data[4] = (command) & 0xFF;

    return NewCellFromBuffer(data)
}

