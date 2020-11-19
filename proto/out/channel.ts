import * as pb_1 from "google-protobuf";
export namespace protocol {
    export enum MessageType {
        Raw = 0,
        String = 1,
        ConfirmChannel = 2,
        DenyChannel = 3,
        ShareStream = 4,
        RequestStream = 5,
        ConfirmStreamRequest = 6,
        DenyStreamRequest = 7,
        ConfirmStreamShare = 8,
        DenyStreamShare = 9,
        StopStreamView = 10
    }
    export class ChannelMessage extends pb_1.Message {
        constructor(data?: any[] | {
            messageType?: MessageType;
            data?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.messageType = data.messageType;
                this.data = data.data;
            }
        }
        get messageType(): MessageType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as MessageType | undefined;
        }
        set messageType(value: MessageType) {
            pb_1.Message.setField(this, 1, value);
        }
        get data(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as Uint8Array | undefined;
        }
        set data(value: Uint8Array) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                messageType: this.messageType,
                data: this.data
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.messageType !== undefined)
                writer.writeEnum(1, this.messageType);
            if (this.data !== undefined)
                writer.writeBytes(2, this.data);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ChannelMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ChannelMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.messageType = reader.readEnum();
                        break;
                    case 2:
                        message.data = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class RawMessage extends pb_1.Message {
        constructor(data?: any[] | {
            data?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.data = data.data;
            }
        }
        get data(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set data(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                data: this.data
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.data !== undefined)
                writer.writeBytes(1, this.data);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): RawMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new RawMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.data = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class StringMessage extends pb_1.Message {
        constructor(data?: any[] | {
            data?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.data = data.data;
            }
        }
        get data(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set data(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                data: this.data
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.data !== undefined)
                writer.writeString(1, this.data);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): StringMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new StringMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.data = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class ConfirmChannelMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ConfirmChannelMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ConfirmChannelMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DenyChannelMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DenyChannelMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DenyChannelMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class ShareStreamMessage extends pb_1.Message {
        constructor(data?: any[] | {
            streamID?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.streamID = data.streamID;
            }
        }
        get streamID(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set streamID(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                streamID: this.streamID
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.streamID !== undefined)
                writer.writeString(1, this.streamID);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ShareStreamMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ShareStreamMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.streamID = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class RequestStreamMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): RequestStreamMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new RequestStreamMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class ConfirmVideoStreamRequestMessage extends pb_1.Message {
        constructor(data?: any[] | {
            streamID?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.streamID = data.streamID;
            }
        }
        get streamID(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set streamID(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                streamID: this.streamID
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.streamID !== undefined)
                writer.writeString(1, this.streamID);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ConfirmVideoStreamRequestMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ConfirmVideoStreamRequestMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.streamID = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DenyVideoStreamRequestMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DenyVideoStreamRequestMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DenyVideoStreamRequestMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class ConfirmVideoStreamShareMessage extends pb_1.Message {
        constructor(data?: any[] | {
            streamID?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.streamID = data.streamID;
            }
        }
        get streamID(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set streamID(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                streamID: this.streamID
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.streamID !== undefined)
                writer.writeString(1, this.streamID);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ConfirmVideoStreamShareMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ConfirmVideoStreamShareMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.streamID = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DenyVideoStreamShareMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DenyVideoStreamShareMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DenyVideoStreamShareMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class StopVideoStreamViewMessage extends pb_1.Message {
        constructor(data?: any[] | {}) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") { }
        }
        toObject() {
            return {};
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): StopVideoStreamViewMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new StopVideoStreamViewMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
}
