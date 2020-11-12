import * as pb_1 from "google-protobuf";
export namespace protocol {
    export class AnnouncementMessage extends pb_1.Message {
        constructor(data?: any[] | {
            identity?: string;
            nodeIdentity?: string;
            expires?: number;
            key?: Uint8Array;
            address?: string[];
            fingerprint?: Uint8Array;
            handshake?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [5], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.identity = data.identity;
                this.nodeIdentity = data.nodeIdentity;
                this.expires = data.expires;
                this.key = data.key;
                this.address = data.address;
                this.fingerprint = data.fingerprint;
                this.handshake = data.handshake;
            }
        }
        get identity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set identity(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get nodeIdentity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as string | undefined;
        }
        set nodeIdentity(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get expires(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as number | undefined;
        }
        set expires(value: number) {
            pb_1.Message.setField(this, 3, value);
        }
        get key(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as Uint8Array | undefined;
        }
        set key(value: Uint8Array) {
            pb_1.Message.setField(this, 4, value);
        }
        get address(): string[] {
            return pb_1.Message.getField(this, 5) as string[];
        }
        set address(value: string[]) {
            pb_1.Message.setField(this, 5, value);
        }
        get fingerprint(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 6, undefined) as Uint8Array | undefined;
        }
        set fingerprint(value: Uint8Array) {
            pb_1.Message.setField(this, 6, value);
        }
        get handshake(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 7, undefined) as Uint8Array | undefined;
        }
        set handshake(value: Uint8Array) {
            pb_1.Message.setField(this, 7, value);
        }
        toObject() {
            return {
                identity: this.identity,
                nodeIdentity: this.nodeIdentity,
                expires: this.expires,
                key: this.key,
                address: this.address,
                fingerprint: this.fingerprint,
                handshake: this.handshake
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.identity !== undefined)
                writer.writeString(1, this.identity);
            if (this.nodeIdentity !== undefined)
                writer.writeString(2, this.nodeIdentity);
            if (this.expires !== undefined)
                writer.writeUint64(3, this.expires);
            if (this.key !== undefined)
                writer.writeBytes(4, this.key);
            if (this.address !== undefined)
                writer.writeRepeatedString(5, this.address);
            if (this.fingerprint !== undefined)
                writer.writeBytes(6, this.fingerprint);
            if (this.handshake !== undefined)
                writer.writeBytes(7, this.handshake);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): AnnouncementMessage {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new AnnouncementMessage();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.identity = reader.readString();
                        break;
                    case 2:
                        message.nodeIdentity = reader.readString();
                        break;
                    case 3:
                        message.expires = reader.readUint64();
                        break;
                    case 4:
                        message.key = reader.readBytes();
                        break;
                    case 5:
                        pb_1.Message.addToRepeatedField(message, 5, reader.readString());
                        break;
                    case 6:
                        message.fingerprint = reader.readBytes();
                        break;
                    case 7:
                        message.handshake = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class PresenceRequest extends pb_1.Message {
        constructor(data?: any[] | {
            clientPK?: Uint8Array;
            encryptedBlob?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.clientPK = data.clientPK;
                this.encryptedBlob = data.encryptedBlob;
            }
        }
        get clientPK(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set clientPK(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        get encryptedBlob(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as Uint8Array | undefined;
        }
        set encryptedBlob(value: Uint8Array) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                clientPK: this.clientPK,
                encryptedBlob: this.encryptedBlob
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.clientPK !== undefined)
                writer.writeBytes(1, this.clientPK);
            if (this.encryptedBlob !== undefined)
                writer.writeBytes(2, this.encryptedBlob);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): PresenceRequest {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new PresenceRequest();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.clientPK = reader.readBytes();
                        break;
                    case 2:
                        message.encryptedBlob = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class AnnouncePresence extends pb_1.Message {
        constructor(data?: any[] | {
            request?: Uint8Array;
            key?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.request = data.request;
                this.key = data.key;
            }
        }
        get request(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set request(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        get key(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as Uint8Array | undefined;
        }
        set key(value: Uint8Array) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                request: this.request,
                key: this.key
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.request !== undefined)
                writer.writeBytes(1, this.request);
            if (this.key !== undefined)
                writer.writeBytes(2, this.key);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): AnnouncePresence {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new AnnouncePresence();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.request = reader.readBytes();
                        break;
                    case 2:
                        message.key = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class AnnouncementResult extends pb_1.Message {
        constructor(data?: any[] | {
            result?: AnnouncementResult.resultType;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.result = data.result;
            }
        }
        get result(): AnnouncementResult.resultType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as AnnouncementResult.resultType | undefined;
        }
        set result(value: AnnouncementResult.resultType) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                result: this.result
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.result !== undefined)
                writer.writeEnum(1, this.result);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): AnnouncementResult {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new AnnouncementResult();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.result = reader.readEnum();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export namespace AnnouncementResult {
        export enum resultType {
            success = 0,
            formatError = 1,
            expirationInvalid = 2,
            signatureInvalid = 3,
            internalError = 4,
            alreadyRegistered = 5
        }
    }
    export class LookupPresence extends pb_1.Message {
        constructor(data?: any[] | {
            identity?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.identity = data.identity;
            }
        }
        get identity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set identity(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                identity: this.identity
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.identity !== undefined)
                writer.writeString(1, this.identity);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): LookupPresence {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new LookupPresence();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.identity = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class LookupResult extends pb_1.Message {
        constructor(data?: any[] | {
            identity?: string;
            result?: LookupResult.resultType;
            announcements?: Uint8Array[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [3], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.identity = data.identity;
                this.result = data.result;
                this.announcements = data.announcements;
            }
        }
        get identity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set identity(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get result(): LookupResult.resultType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as LookupResult.resultType | undefined;
        }
        set result(value: LookupResult.resultType) {
            pb_1.Message.setField(this, 2, value);
        }
        get announcements(): Uint8Array[] {
            return pb_1.Message.getField(this, 3) as Uint8Array[];
        }
        set announcements(value: Uint8Array[]) {
            pb_1.Message.setField(this, 3, value);
        }
        toObject() {
            return {
                identity: this.identity,
                result: this.result,
                announcements: this.announcements
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.identity !== undefined)
                writer.writeString(1, this.identity);
            if (this.result !== undefined)
                writer.writeEnum(2, this.result);
            if (this.announcements !== undefined)
                writer.writeRepeatedBytes(3, this.announcements);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): LookupResult {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new LookupResult();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.identity = reader.readString();
                        break;
                    case 2:
                        message.result = reader.readEnum();
                        break;
                    case 3:
                        pb_1.Message.addToRepeatedField(message, 3, reader.readBytes());
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export namespace LookupResult {
        export enum resultType {
            success = 0,
            notFound = 1,
            failure = 2
        }
    }
    export class ForwardPresenceRequest extends pb_1.Message {
        constructor(data?: any[] | {
            request?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.request = data.request;
            }
        }
        get request(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set request(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                request: this.request
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.request !== undefined)
                writer.writeBytes(1, this.request);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ForwardPresenceRequest {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ForwardPresenceRequest();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.request = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class ForwardPresenceRequestResult extends pb_1.Message {
        constructor(data?: any[] | {
            identity?: string;
            result?: ForwardPresenceRequestResult.resultType;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.identity = data.identity;
                this.result = data.result;
            }
        }
        get identity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set identity(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get result(): ForwardPresenceRequestResult.resultType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as ForwardPresenceRequestResult.resultType | undefined;
        }
        set result(value: ForwardPresenceRequestResult.resultType) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                identity: this.identity,
                result: this.result
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.identity !== undefined)
                writer.writeString(1, this.identity);
            if (this.result !== undefined)
                writer.writeEnum(2, this.result);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): ForwardPresenceRequestResult {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new ForwardPresenceRequestResult();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.identity = reader.readString();
                        break;
                    case 2:
                        message.result = reader.readEnum();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export namespace ForwardPresenceRequestResult {
        export enum resultType {
            success = 0,
            notFound = 1,
            notAllowed = 2,
            internalError = 3
        }
    }
}
