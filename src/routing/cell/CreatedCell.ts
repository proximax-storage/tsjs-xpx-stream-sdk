/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {CircID, DetailedCell} from "../Cell";
import * as defines from "../Identifiers";

export class CreatedCell extends DetailedCell{
    public circId : CircID;
    public handshakeData : Buffer;

    constructor(circId : CircID, data : Buffer){
        super(defines.Command.Created);

        this.circId = circId;
        this.handshakeData = data;
    }
}