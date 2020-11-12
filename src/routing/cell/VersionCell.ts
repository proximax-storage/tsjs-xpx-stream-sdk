/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {CellFactory} from "../CellFactory";
import {Cell, DetailedCell, NewVariableCell} from "../Cell";
import * as defines from "../Identifiers";
import {PutUint16} from "../../utils/Binary";
import * as cmd from "../Command";

export const SupportedVersion = new Uint16Array(1);
SupportedVersion[0] = 1;

export class VersionCell extends DetailedCell implements CellFactory {
    supportedVersions : Uint16Array;

    constructor(supportedVersion : Uint16Array) {
        super(defines.Command.Versions);
        this.supportedVersions = supportedVersion;
    }

    createCell() : Cell {
        var n = (2 * this.supportedVersions.length) & 0xFFFF;

        var c = NewVariableCell(0, defines.Command.Versions, n);
        var offset = cmd.PayloadOffset(defines.Command.Versions);
        var data = c.getData();

        for(let i = 0; i < this.supportedVersions.length; i++) {
            PutUint16(data, this.supportedVersions[i] & 0xFFFF, offset + (2*i));
        }

        return c;
    }
}
