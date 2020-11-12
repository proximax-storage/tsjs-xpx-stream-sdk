/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell, NewFixedCell, NewVariableCell} from "./Cell";
import * as def from "../defines/SiriusStream";
import * as caster from "../utils/typeCaster";
import * as ident from "./Identifiers";
import * as binary from "../utils/Binary";
import {inPlaceRelayCell, RelayCell} from "./cell/RelayCell";
import {inPlaceStreamRelayCell, StreamRelayCell} from "./cell/StreamRelayCell";
import {Log} from "../utils/Logger";

/// The maximum length for variable length relay payload content
export const maxVariableRelayDataLength = (1 << (8 * 2/*sizeof(uint16_t)*/)) - 1;

export class ApplicationMessage {
    private data : Buffer;
    constructor(data : Buffer) {
        this.data = data;
    }

    length() : def.ApplicationMessageSizeType {
        var ret : def.ApplicationMessageSizeType;
        if(this.data.length < 4)  //sizeof(ret) --> sizeof(int32)
            return 0;

        let s = binary.Uint32(this.data);
        return caster.int32(binary.Uint32(this.data));
    }

    getPayload() : Buffer {
        var size = this.length();
        if(size != this.data.length)
            return null;
        return this.data.slice(4);
    }

    append(r : RelayCell) {
        let payload = r.relayData();
        if(payload == null) {
            return null;
        }

        var relayCellLength : number;
        if (!r.isVariableLen()) {
            relayCellLength = def.MaxRelayDataLength;
        } else {
            relayCellLength = def.MaxVariableRelayDataLength;
        }

        var length = this.length();
        if( length <= this.data.length) {
            Log("appending to already complete cell");
            return null;
        }

        var remainder = length - this.data.length;
        if (remainder > relayCellLength) {
            // we expect more cells to come
            if (payload.length != relayCellLength) {
                Log("malformed message part");
                return null;
            }
        } else {
            // this is the last and final cell
            if (payload.length != remainder) {
                Log("malformed message part");
                return null;
            }
        }

        return new ApplicationMessage(Buffer.concat([this.data, payload]));
    }
}

export class ApplicationMessageProcessor {
    private currentMessage : ApplicationMessage;

    constructor() {
    }

    buildStreamOutput(message : Buffer) {
        return this.send(message, false);
    }

    buildSRelayOutput(message : Buffer) {
        return this.send(message, true);
    }

    send(message : Buffer, isRelay: boolean) {
        if(message.length > def.MaxApplicationMessageSize) {
            Log("Message is too long");
            return null;
        }

        let ret = new Array<Cell>();
        let ptr = message;
        let remainder = message.length;

        let mesageSize = caster.int32(remainder);
        let sizeFieldSize = 4; //sizeof(messageSize);
        mesageSize += sizeFieldSize;

        var relayCellLength = (isRelay)? def.MaxRelayDataLength
            : def.MaxVariableRelayDataLength;

        while(true) {
            if( remainder == 0)
                break;

            var nextCellLen : number;
            var sentLen : number;

            if(ret.length == 0) {
                if( remainder <= (relayCellLength - sizeFieldSize)) {
                    // we can fit everything in a single cell
                    nextCellLen = caster.int16(remainder + sizeFieldSize);
                    sentLen = caster.int16(remainder);
                } else {
                    nextCellLen = caster.int16(relayCellLength);
                    sentLen = caster.int16(relayCellLength - sizeFieldSize);
                }
            }else {
                if (remainder <= relayCellLength) {
                    // we can fit everything in a single cell
                    nextCellLen = caster.int16(remainder)
                    sentLen = caster.int16(remainder)
                } else {
                    nextCellLen = caster.int16(relayCellLength)
                    sentLen = caster.int16(relayCellLength)
                }
            }

            // we don't set CircID here because it will be overridden later in router class
            var cell : Cell;
            if (isRelay) {
                cell = NewFixedCell(0, ident.Command.Relay);
            } else {
                cell = NewVariableCell(0, ident.Command.StreamRelay, nextCellLen);
            }

            var payload : Buffer;

            if(isRelay)
                payload = inPlaceRelayCell(cell.payLoad(), ident.Relay.Escape, nextCellLen);
            else
                payload = inPlaceStreamRelayCell(cell.payLoad(), nextCellLen);

            if( payload == null) {
                Log("ERROR! AppMessageProcessor::send unable to get payloadd");
                return null;
            }

            if(ret.length == 0) {
                if(sizeFieldSize == 2){
                    binary.PutUint16(payload, caster.int16(mesageSize));
                } else {
                    binary.PutUint32(payload, caster.int32(mesageSize));
                }

                ptr.copy(payload, sizeFieldSize);
            } else {
                ptr.copy(payload);
            }

            ret.push(cell);
            ptr = ptr.slice(sentLen);
            remainder -= caster.int32(sentLen);
        }
        return ret;
    }

    receive(r : RelayCell) : Buffer {
        if(this.currentMessage == null) {
            // beginning of a new message
            let cm = NewApplicationMessage(r);
            if(cm == null)
                return null;

            let payload = cm.getPayload();
            if(payload != null)
                return payload;

            this.currentMessage = cm;
            return null;
        }

        this.currentMessage = this.currentMessage.append(r);
        if(this.currentMessage == null)
            return null;

        var payload = this.currentMessage.getPayload();
        if(payload != null) {
            this.currentMessage = null;
            return payload;
        }

        return null;
    }
}

function NewApplicationMessage(r : RelayCell) : ApplicationMessage {
    var payload = r.relayData();
    if(payload == null)
        return null;

    let msg = new ApplicationMessage(payload);
    let length = caster.int32(msg.length());

    if( length == 0 || length > def.MaxApplicationMessageSize) {
        Log("wrong application message size");
        return null;
    }

    var relayCellLength : number;

    if (!r.isVariableLen()) {
        relayCellLength = def.MaxRelayDataLength;
    } else {
        relayCellLength = def.MaxVariableRelayDataLength;
    }

    if (length <= relayCellLength) {
        // message should fit in one cell
        if (length != payload.length) {
            Log("malformed message part");
            return null;
        }
    } else {
        // message is split between several cell
        if (payload.length != relayCellLength) {
            Log("malformed message part");
            return null;
        }
    }

    var appPayload = Buffer.alloc(payload.length);
    payload.copy(appPayload);

    return new ApplicationMessage(appPayload);
}

