/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell, CircID, NewVariableCell} from "../Cell";
import * as caster from "../../utils/typeCaster";
import * as defines from "../Identifiers";
import {RelayCell} from "./RelayCell";
import {CellFactory} from "../CellFactory";
import * as cmd from "../Command";

export class StreamRelayCell extends RelayCell implements CellFactory{
    private circID : CircID;

    constructor(circID : CircID, payload : Buffer) {
        super(payload, defines.Command.StreamRelay);
        this.circID = circID;
    }

    isVariableLen() : boolean {
        return true;
    }

    relayData() {
        return this.getData();
    }

    createCell() : Cell {
        var c = NewVariableCell(this.circID, defines.Command.StreamRelay, this.getData().length);
        var offset = cmd.PayloadOffset(defines.Command.StreamRelay);
        var data = c.getData();
        this.relayData().copy(data, offset);
        return c;
    }

}

export function inPlaceStreamRelayCell(place : Buffer, length : number) {
    if(place.length != caster.int32(length)) {
        console.log("not enough space for the stream cell");
        return null;
    }

    return place;
}

