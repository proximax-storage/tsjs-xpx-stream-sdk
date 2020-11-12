/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as protobuf from "../../proto/out/video";
import {Log} from "../utils/Logger";
import {uint32} from "../utils/typeCaster";

export enum Orientation {
    rotate0 =  0,
    rotate90= 90,
    rotate180 = 180,
    rotate270 = 270
};

export enum FrameType{
    AUDIO = 0,
    VIDEO_IDR = 1,
    VIDEO_I = 2,
    VIDEO_P = 3,
    VIDEO_B = 4,
    AUDIO_C = 5,
    VIDEO_C = 6
};

export const LayerCount = 3;

/**
 * Represents a frame that contains an audio or a video data
 */
export class Frame {
    public FrameType : FrameType;
    public TimeStamp : bigint;
    public Sequence : number;

    public Uid : number;
    public Bytes : Array<Uint8Array>;
    public Orientation : Orientation;

    constructor() {
        this.Orientation = Orientation.rotate0;
    }

    set(type : FrameType, ts : bigint, seq : number, newOrientation : Orientation, frame_bytes : Array<Uint8Array> ) {
        this.FrameType = type;
        this.TimeStamp = ts;
        this.Sequence = seq;
        this.Orientation = newOrientation;

        this.Bytes = new Array<Uint8Array>();

        for(let i = 0; i < 3; ++i) {
            let length = frame_bytes[i].length;
            this.Bytes.push(new Uint8Array());

            if (length <= 8 && (type == FrameType.VIDEO_IDR || type == FrameType.VIDEO_I ||
                type == FrameType.VIDEO_P || type == FrameType.VIDEO_B))
            {
                frame_bytes[i] = null;
            }
            else if (length == 0)
            {
                frame_bytes[i] = null;
            }
            else
            {
                this.Bytes[i] = frame_bytes[i];
            }
        }
    }
}

/**
 * deserialize a data buffer to a frame object
 */
export function deserializedFrame(data : Buffer) : Frame{
    let frame = protobuf.protocol.Frame.deserialize(data);
    if(frame == null) {
        Log("Unable to deserialized Frame");
        return null;
    }

    let numLayers = frame.layers.length;
    if(numLayers > LayerCount) {
        Log("Received too many layers. Max layers is " + LayerCount
            + " received "+ numLayers + " layers. Skipping any extra layers...");
        numLayers = LayerCount;
    }
    else if(numLayers == 0) {
        Log("Received zero layers");
    }

    let frameBytes = new Array<Uint8Array>(3);
    for(let index = 0; index < numLayers; ++index) {
       let frameLayer = frame.layers[index];
       frameBytes[index] = frameLayer;
    }

    let videoFrame = new Frame();
    videoFrame.FrameType = frame.frameType != undefined? frame.frameType : 0;
    videoFrame.Sequence = frame.sequenceID;
    videoFrame.Orientation = frame.orientation;
    videoFrame.Bytes = frameBytes;

    // there is an issue with javascript version of protobuf (at the time of this writing Oct 2020)
    // the function writeUnsignedVarint64 of google-protobuf calles Math.floor but it cant use for
    // Bigint variable and crash. the quickest solution is to split the 64bit into two 32bit and change
    // across all SDKs (C++ and Go)
    let upper = uint32(frame.timestampHi);
    let lower = uint32(frame.timestampLo);
    videoFrame.TimeStamp = BigInt(BigInt(upper) << 32n) | BigInt(BigInt(lower) & 0xffffffffn);

    return videoFrame;
}

/**
 * serialize a frame into a protobuf stream
 */
export function serializeFrame(frame : Frame) : Uint8Array {
   /* int frametype_;
    ::google::protobuf::uint32 sequenceid_;
    ::google::protobuf::uint64 timestamp_;
    ::google::protobuf::uint32 uid_;
    int orientation_;
    */
    let size = 4 + 4 + 8 + 4 + 4;
    for(let i = 0; i < frame.Bytes.length; i++) {
        size += frame.Bytes[i].length;
    }

    let offset = 0;
    let data = Buffer.alloc(size);

    let numLayers = frame.Bytes.length;
    if(numLayers > LayerCount) {
        Log("Warning Sending too many layers. Max layers " + LayerCount +
            " but numbber of layers " + numLayers);
    }
    else if (numLayers == 0) {
        Log("Warning sending 0 layers...");
    }

    let protobufFrame = new protobuf.protocol.Frame();
    protobufFrame.frameType = frame.FrameType;
    protobufFrame.sequenceID = frame.Sequence;
    protobufFrame.orientation = frame.Orientation;
    protobufFrame.timestampHi = Number(frame.TimeStamp >> 32n);
    protobufFrame.timestampLo = Number(frame.TimeStamp & BigInt(0xffffffff));

    protobufFrame.layers = new Array<Uint8Array>();

    for(let i = 0; i < frame.Bytes.length; i++) {
        protobufFrame.layers.push(frame.Bytes[i]);
    }

    return  protobufFrame.serialize();
}