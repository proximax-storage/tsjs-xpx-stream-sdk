/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {TLSSocket} from "tls";
import * as cell from "./Cell";
import {IsCommand, MaxPayloadLength} from "./Identifiers";
import {IsVariableLength} from "./Command";
import * as binary from "../utils/Binary";
import * as command from "./Command";
import {Cell} from "./Cell";
import {Dispatcher} from "./Dispatcher";
import {Log} from "../utils/Logger";
import {int16, int32} from "../utils/typeCaster";

export class CellReceiver {
    private tlsConn: TLSSocket;
    private dispatacher : Dispatcher;

    private lastCellEnded : boolean;
    private cachedBuffer : Buffer;
    private lastPayLoadLackSize : number;

    constructor(tlsCon : TLSSocket) {
        this.tlsConn = tlsCon;
        this.dispatacher = new Dispatcher();

        this.resetCellCache();

        var object = this;
        this.tlsConn.on("data", function (data){
            object.handleData(data);
        });
    }

    resetCellCache() {
        this.lastCellEnded = true;
        this.cachedBuffer = null;
        this.lastPayLoadLackSize = 0;
    }

    parseCell(data : Buffer, startOffset : number) : { endOffset : number, cell : Cell} {

        // read cell header
        var cmdByte = data[startOffset+4];
        if(!IsCommand(cmdByte)) {
            Log("Unknown command");
            return {
                endOffset : -1,
                cell : null
            };
        }

        let cmd = cmdByte & 0xFF;

        // fixed vs. variable cell
        let payloadLen = int16(MaxPayloadLength);
        if (IsVariableLength(cmd))
            payloadLen = binary.Uint16(data, 5 + startOffset);

        const payloadOffset = command.PayloadOffset(cmd);
        const cellLength = payloadOffset + int32(payloadLen);

        if(startOffset + cellLength > data.length) {
            this.lastCellEnded = false;
            this.lastPayLoadLackSize = (startOffset + cellLength) - data.length;
            this.cachedBuffer = data.slice(startOffset, startOffset + cellLength);

            return {
                endOffset : -1,
                cell : null
            };
        }

        var buffer = data.slice(startOffset, startOffset + cellLength);
        let c = cell.NewCellFromBuffer(buffer);

        this.resetCellCache();

        return {
            endOffset : startOffset + cellLength,
            cell : c
        };
    }

    handleData(data) {
        let startOffset = 0;

        if(!this.lastCellEnded) {
            let deduct = data.length - this.lastPayLoadLackSize;
            if(deduct >= 0) {

                let buff = Buffer.concat([this.cachedBuffer,
                    data.slice(0, this.lastPayLoadLackSize)]);

                let c = cell.NewCellFromBuffer(buff);
                this.dispatacher.dispatch(c);

                this.resetCellCache();

                if(deduct > 0) {
                    data = data.slice(this.lastPayLoadLackSize);
                }
                else {
                    //if all data were consumed, no need to proceed.
                    return;
                }
            }
            else {
                this.lastPayLoadLackSize -= data.length;
                this.cachedBuffer = Buffer.concat([this.cachedBuffer, data]);
                return;
            }
        }

        do {
            var result = this.parseCell(data, startOffset);
            if (result.cell == null)
                break;

            this.dispatacher.dispatch(result.cell);
            startOffset += result.endOffset;

        }while(result.endOffset < data.length);
    }

    getDispatcher() : Dispatcher {
        return this.dispatacher;
    }
}