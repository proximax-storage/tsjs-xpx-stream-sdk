import * as pb_1 from "google-protobuf";
export namespace protocol {
    export enum FrameType {
        AUDIO = 0,
        VIDEO_IDR = 1,
        VIDEO_I = 2,
        VIDEO_P = 3,
        VIDEO_B = 4,
        AUDIO_C = 5,
        VIDEO_C = 6,
    }

    export enum Orientation {
        rotate0 = 0,
        rotate90 = 90,
        rotate180 = 180,
        rotate270 = 270
    }

    export class Frame extends pb_1.Message {
        constructor(data?: any[] | {
            frameType?: FrameType;
            sequenceID?: number;
            timestampHi?: number;
            timestampLo?: number;
            uid?: number;
            layers?: Uint8Array[];
            orientation?: Orientation;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [6], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.frameType = data.frameType;
                this.sequenceID = data.sequenceID;
                this.timestampHi = data.timestampHi;
                this.timestampLo = data.timestampLo;
                this.uid = data.uid;
                this.layers = data.layers;
                this.orientation = data.orientation;
            }
        }
        get frameType(): FrameType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as FrameType | undefined;
        }
        set frameType(value: FrameType) {
            pb_1.Message.setField(this, 1, value);
        }
        get sequenceID(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as number | undefined;
        }
        set sequenceID(value: number) {
            pb_1.Message.setField(this, 2, value);
        }
        get timestampHi(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as number | undefined;
        }
        set timestampHi(value: number) {
            pb_1.Message.setField(this, 3, value);
        }
        get timestampLo(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as number | undefined;
        }
        set timestampLo(value: number) {
            pb_1.Message.setField(this, 4, value);
        }
        get uid(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 5, undefined) as number | undefined;
        }
        set uid(value: number) {
            pb_1.Message.setField(this, 5, value);
        }
        get layers(): Uint8Array[] {
            return pb_1.Message.getField(this, 6) as Uint8Array[];
        }
        set layers(value: Uint8Array[]) {
            pb_1.Message.setField(this, 6, value);
        }
        get orientation(): Orientation | undefined {
            return pb_1.Message.getFieldWithDefault(this, 7, undefined) as Orientation | undefined;
        }
        set orientation(value: Orientation) {
            pb_1.Message.setField(this, 7, value);
        }
        toObject() {
            return {
                frameType: this.frameType,
                sequenceID: this.sequenceID,
                timestampHi: this.timestampHi,
                timestampLo: this.timestampLo,
                uid: this.uid,
                layers: this.layers,
                orientation: this.orientation
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.frameType !== undefined)
                writer.writeEnum(1, this.frameType);
            if (this.sequenceID !== undefined)
                writer.writeUint32(2, this.sequenceID);
            if (this.timestampHi !== undefined)
                writer.writeUint32(3, this.timestampHi);
            if (this.timestampLo !== undefined)
                writer.writeUint32(4, this.timestampLo);
            if (this.uid !== undefined)
                writer.writeUint32(5, this.uid);
            if (this.layers !== undefined)
                writer.writeRepeatedBytes(6, this.layers);
            if (this.orientation !== undefined)
                writer.writeEnum(7, this.orientation);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Frame {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new Frame();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.frameType = reader.readEnum();
                        break;
                    case 2:
                        message.sequenceID = reader.readUint32();
                        break;
                    case 3:
                        message.timestampHi = reader.readUint32();
                        break;
                    case 4:
                        message.timestampLo = reader.readUint32();
                        break;
                    case 5:
                        message.uid = reader.readUint32();
                        break;
                    case 6:
                        pb_1.Message.addToRepeatedField(message, 6, reader.readBytes());
                        break;
                    case 7:
                        message.orientation = reader.readEnum();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class VideoStreamParameters extends pb_1.Message {
        constructor(data?: any[] | {
            version?: number;
            isCamEnabled?: boolean;
            isMicEnabled?: boolean;
            width?: number;
            height?: number;
            codecs?: string[];
            ratchet?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [6], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.isCamEnabled = data.isCamEnabled;
                this.isMicEnabled = data.isMicEnabled;
                this.width = data.width;
                this.height = data.height;
                this.codecs = data.codecs;
                this.ratchet = data.ratchet;
            }
        }
        get version(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as number | undefined;
        }
        set version(value: number) {
            pb_1.Message.setField(this, 1, value);
        }
        get isCamEnabled(): boolean | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as boolean | undefined;
        }
        set isCamEnabled(value: boolean) {
            pb_1.Message.setField(this, 2, value);
        }
        get isMicEnabled(): boolean | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as boolean | undefined;
        }
        set isMicEnabled(value: boolean) {
            pb_1.Message.setField(this, 3, value);
        }
        get width(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as number | undefined;
        }
        set width(value: number) {
            pb_1.Message.setField(this, 4, value);
        }
        get height(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 5, undefined) as number | undefined;
        }
        set height(value: number) {
            pb_1.Message.setField(this, 5, value);
        }
        get codecs(): string[] {
            return pb_1.Message.getField(this, 6) as string[];
        }
        set codecs(value: string[]) {
            pb_1.Message.setField(this, 6, value);
        }
        get ratchet(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 7, undefined) as Uint8Array | undefined;
        }
        set ratchet(value: Uint8Array) {
            pb_1.Message.setField(this, 7, value);
        }
        toObject() {
            return {
                version: this.version,
                isCamEnabled: this.isCamEnabled,
                isMicEnabled: this.isMicEnabled,
                width: this.width,
                height: this.height,
                codecs: this.codecs,
                ratchet: this.ratchet
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeUint32(1, this.version);
            if (this.isCamEnabled !== undefined)
                writer.writeBool(2, this.isCamEnabled);
            if (this.isMicEnabled !== undefined)
                writer.writeBool(3, this.isMicEnabled);
            if (this.width !== undefined)
                writer.writeUint32(4, this.width);
            if (this.height !== undefined)
                writer.writeUint32(5, this.height);
            if (this.codecs !== undefined)
                writer.writeRepeatedString(6, this.codecs);
            if (this.ratchet !== undefined)
                writer.writeBytes(7, this.ratchet);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): VideoStreamParameters {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new VideoStreamParameters();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readUint32();
                        break;
                    case 2:
                        message.isCamEnabled = reader.readBool();
                        break;
                    case 3:
                        message.isMicEnabled = reader.readBool();
                        break;
                    case 4:
                        message.width = reader.readUint32();
                        break;
                    case 5:
                        message.height = reader.readUint32();
                        break;
                    case 6:
                        pb_1.Message.addToRepeatedField(message, 6, reader.readString());
                        break;
                    case 7:
                        message.ratchet = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
}
