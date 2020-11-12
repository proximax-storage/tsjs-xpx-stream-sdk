/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {StreamRelayCell} from "./cell/StreamRelayCell";
import {Log} from "../utils/Logger";
import {int32, int8} from "../utils/typeCaster";
import {PutUint32, Uint32} from "../utils/Binary";

export const FanoutMessage = Object.freeze({
    StreamParameters    : 0,
    KeyVideo            : 1,
    IntermediateVideo   : 2,
    Audio               : 3,
    Report              : 4,
    ViewersChanged      : 5,
    Data                : 6
});

export class FanoutPayload {
    public MessageType : number;    //byte
    public SequenceID : number;     //uint32
    public RemainingParts : number; //byte
    public Data : Buffer;
    public Length : number;         //uint32
    public TotalParts : number;     //byte
    public IsFirst : boolean;

    constructor() {
        this.IsFirst = false;
    }

    serialize() : Buffer {
        let length = 1 /*message type*/ +
            4  /*sequenceid*/ +
            1   /*remaining parts*/ +
            this.Data.length;

        let data = Buffer.alloc(length);
        data[0] = this.MessageType & 0xFF;
        PutUint32(data, this.SequenceID, 1);

        let remainingParts = this.RemainingParts;

        if(this.IsFirst) {
            /// MSB must be set to '1' for the first segment of a split payload
            remainingParts |= 0x80;
        }

        data[5] = remainingParts;
        this.Data.copy(data, 6);

        return data;
    }
}

export function readFanoutPayload(sc : StreamRelayCell) : FanoutPayload {
    let data = sc.relayData();

    if(data == null)
        return null;

    if(data.length < 1) {
        Log("Incomplete Stream relay payload");
        return null;
    }


    let fp = new FanoutPayload();
    fp.MessageType = int8(data[0]);
    fp.Length = int32(data.length);

    if(fp.MessageType != FanoutMessage.Report && fp.MessageType != FanoutMessage.ViewersChanged) {
        if(data.length < 5) {
            Log("Missing sequence ID in fanout payload");
            return null;
        }

        fp.SequenceID = Uint32(data.slice(1));

        let numRemainingParts  = data[5];
        if((numRemainingParts & 0x80)) {
            fp.IsFirst = true;
            fp.RemainingParts = numRemainingParts & 0x7F;
        }
        else {
            fp.IsFirst = false;
            fp.RemainingParts = numRemainingParts;
        }

        fp.Data = data.slice(6);

    } else {
        fp.Data = data.slice(1);
    }


    return fp;
}

// FanoutReport builds a fanout report cell to deliver back to the broadcaster
export class FanoutReport {
    public LastKnownSequenceID : number;
    public BytesReceived : number;
}

// FanoutViewersChange builds a "viewers changed" cell to deliver it back to the broadcaster
export class FanoutViewersChange {
    public Viewers : number;
}