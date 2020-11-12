/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell, CircID, DetailedCell, NewFixedCell, NewVariableCell} from "../Cell";
import {CellFactory} from "../CellFactory";
import * as defines from "../Identifiers";
import * as cmd from "../Command";
import {PutUint16} from "../../utils/Binary";
import * as caster from "../../utils/typeCaster";
import {int16} from "../../utils/typeCaster";

export type HandShakeType = number;

export class ClientCreateHandshakeData{
    public Fingerprint : Buffer;
    public Handshake: Buffer;
    public PublicKey : Buffer;

    constructor( fp : Buffer, hs : Buffer, pub : Buffer) {
        this.Fingerprint = fp;
        this.Handshake = hs;
        this.PublicKey = pub;
    }

    get Payload() {
        return Buffer.concat([this.Fingerprint, this.Handshake, this.PublicKey]);
    }
}

export class CreateCell implements CellFactory{
    private circID : CircID;
    private handshakeType : HandShakeType;
    private handshakeData : Buffer;

    constructor(circId : CircID, handshakeType : HandShakeType) {
        this.circID = circId;
        this.handshakeType = handshakeType;
    }

    createCell() : Cell {
        var hlen = this.handshakeData.length;

        var cell = NewFixedCell(this.circID, defines.Command.Create);

        var offset = cmd.PayloadOffset(defines.Command.Create);
        var data = cell.getData();

        PutUint16(data, caster.int16(this.handshakeType), offset);
        PutUint16(data, caster.int16(hlen), offset + 2);
        this.handshakeData.copy(data, offset + 4);

        return cell;
    }

    set HandshakeData(data : Buffer) {
        this.handshakeData = data;
    }
}
