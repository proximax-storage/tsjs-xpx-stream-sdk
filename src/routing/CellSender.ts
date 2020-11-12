/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {TLSSocket} from "tls";
import {Cell} from "./Cell";

export class CellSender {
    private tlsConn: TLSSocket;

    constructor(tlsCon : TLSSocket) {
        this.tlsConn = tlsCon;
    }

    send(cell : Cell) {
         this.tlsConn.write(cell.getData());
    }
}