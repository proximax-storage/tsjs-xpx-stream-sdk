import * as pb_1 from "google-protobuf";
export namespace protocol {
    export class DiscoveryItem extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            identity?: string;
            fingerprint?: string;
            handshake?: string;
            mode?: string;
            address?: string[];
            expiration?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [6], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.identity = data.identity;
                this.fingerprint = data.fingerprint;
                this.handshake = data.handshake;
                this.mode = data.mode;
                this.address = data.address;
                this.expiration = data.expiration;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get identity(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as string | undefined;
        }
        set identity(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get fingerprint(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as string | undefined;
        }
        set fingerprint(value: string) {
            pb_1.Message.setField(this, 3, value);
        }
        get handshake(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as string | undefined;
        }
        set handshake(value: string) {
            pb_1.Message.setField(this, 4, value);
        }
        get mode(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 5, undefined) as string | undefined;
        }
        set mode(value: string) {
            pb_1.Message.setField(this, 5, value);
        }
        get address(): string[] {
            return pb_1.Message.getField(this, 6) as string[];
        }
        set address(value: string[]) {
            pb_1.Message.setField(this, 6, value);
        }
        get expiration(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 7, undefined) as number | undefined;
        }
        set expiration(value: number) {
            pb_1.Message.setField(this, 7, value);
        }
        toObject() {
            return {
                version: this.version,
                identity: this.identity,
                fingerprint: this.fingerprint,
                handshake: this.handshake,
                mode: this.mode,
                address: this.address,
                expiration: this.expiration
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.identity !== undefined)
                writer.writeString(2, this.identity);
            if (this.fingerprint !== undefined)
                writer.writeString(3, this.fingerprint);
            if (this.handshake !== undefined)
                writer.writeString(4, this.handshake);
            if (this.mode !== undefined)
                writer.writeString(5, this.mode);
            if (this.address !== undefined)
                writer.writeRepeatedString(6, this.address);
            if (this.expiration !== undefined)
                writer.writeUint64(7, this.expiration);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryItem {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryItem();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        message.identity = reader.readString();
                        break;
                    case 3:
                        message.fingerprint = reader.readString();
                        break;
                    case 4:
                        message.handshake = reader.readString();
                        break;
                    case 5:
                        message.mode = reader.readString();
                        break;
                    case 6:
                        pb_1.Message.addToRepeatedField(message, 6, reader.readString());
                        break;
                    case 7:
                        message.expiration = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryListing extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            items?: Uint8Array[];
            creation?: number;
            expiration?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [2], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.items = data.items;
                this.creation = data.creation;
                this.expiration = data.expiration;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get items(): Uint8Array[] {
            return pb_1.Message.getField(this, 2) as Uint8Array[];
        }
        set items(value: Uint8Array[]) {
            pb_1.Message.setField(this, 2, value);
        }
        get creation(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as number | undefined;
        }
        set creation(value: number) {
            pb_1.Message.setField(this, 3, value);
        }
        get expiration(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as number | undefined;
        }
        set expiration(value: number) {
            pb_1.Message.setField(this, 4, value);
        }
        toObject() {
            return {
                version: this.version,
                items: this.items,
                creation: this.creation,
                expiration: this.expiration
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.items !== undefined)
                writer.writeRepeatedBytes(2, this.items);
            if (this.creation !== undefined)
                writer.writeUint64(3, this.creation);
            if (this.expiration !== undefined)
                writer.writeUint64(4, this.expiration);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryListing {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryListing();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        pb_1.Message.addToRepeatedField(message, 2, reader.readBytes());
                        break;
                    case 3:
                        message.creation = reader.readUint64();
                        break;
                    case 4:
                        message.expiration = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoverySignature extends pb_1.Message {
        constructor(data?: any[] | {
            certificate?: Uint8Array;
            signature?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.certificate = data.certificate;
                this.signature = data.signature;
            }
        }
        get certificate(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set certificate(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        get signature(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as Uint8Array | undefined;
        }
        set signature(value: Uint8Array) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                certificate: this.certificate,
                signature: this.signature
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.certificate !== undefined)
                writer.writeBytes(1, this.certificate);
            if (this.signature !== undefined)
                writer.writeBytes(2, this.signature);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoverySignature {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoverySignature();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.certificate = reader.readBytes();
                        break;
                    case 2:
                        message.signature = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class PublishToDiscovery extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            signedDiscoveryItem?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.signedDiscoveryItem = data.signedDiscoveryItem;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get signedDiscoveryItem(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as Uint8Array | undefined;
        }
        set signedDiscoveryItem(value: Uint8Array) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                version: this.version,
                signedDiscoveryItem: this.signedDiscoveryItem
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.signedDiscoveryItem !== undefined)
                writer.writeBytes(2, this.signedDiscoveryItem);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): PublishToDiscovery {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new PublishToDiscovery();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        message.signedDiscoveryItem = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class PullDiscovery extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                version: this.version
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): PullDiscovery {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new PullDiscovery();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryDirectory extends pb_1.Message {
        constructor(data?: any[] | {
            directory?: Uint8Array;
            signatures?: DiscoverySignature[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [2], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.directory = data.directory;
                this.signatures = data.signatures;
            }
        }
        get directory(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set directory(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        get signatures(): DiscoverySignature[] {
            return pb_1.Message.getRepeatedWrapperField(this, DiscoverySignature, 2) as DiscoverySignature[];
        }
        set signatures(value: DiscoverySignature[]) {
            pb_1.Message.setRepeatedWrapperField(this, 2, value);
        }
        toObject() {
            return {
                directory: this.directory,
                signatures: this.signatures.map((item: DiscoverySignature) => item.toObject())
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.directory !== undefined)
                writer.writeBytes(1, this.directory);
            if (this.signatures !== undefined)
                writer.writeRepeatedMessage(2, this.signatures, (item: DiscoverySignature) => item.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryDirectory {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryDirectory();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.directory = reader.readBytes();
                        break;
                    case 2:
                        reader.readMessage(message.signatures, () => pb_1.Message.addToRepeatedWrapperField(message, 2, DiscoverySignature.deserialize(reader), DiscoverySignature));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryRaftPacket extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            sourceID?: string;
            desitnationID?: string;
            msgType?: DiscoveryRaftPacket.raftMsgType;
            packetID?: number;
            packet?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.sourceID = data.sourceID;
                this.desitnationID = data.desitnationID;
                this.msgType = data.msgType;
                this.packetID = data.packetID;
                this.packet = data.packet;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get sourceID(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as string | undefined;
        }
        set sourceID(value: string) {
            pb_1.Message.setField(this, 3, value);
        }
        get desitnationID(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 4, undefined) as string | undefined;
        }
        set desitnationID(value: string) {
            pb_1.Message.setField(this, 4, value);
        }
        get msgType(): DiscoveryRaftPacket.raftMsgType | undefined {
            return pb_1.Message.getFieldWithDefault(this, 5, undefined) as DiscoveryRaftPacket.raftMsgType | undefined;
        }
        set msgType(value: DiscoveryRaftPacket.raftMsgType) {
            pb_1.Message.setField(this, 5, value);
        }
        get packetID(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 6, undefined) as number | undefined;
        }
        set packetID(value: number) {
            pb_1.Message.setField(this, 6, value);
        }
        get packet(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 7, undefined) as Uint8Array | undefined;
        }
        set packet(value: Uint8Array) {
            pb_1.Message.setField(this, 7, value);
        }
        toObject() {
            return {
                version: this.version,
                sourceID: this.sourceID,
                desitnationID: this.desitnationID,
                msgType: this.msgType,
                packetID: this.packetID,
                packet: this.packet
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.sourceID !== undefined)
                writer.writeString(3, this.sourceID);
            if (this.desitnationID !== undefined)
                writer.writeString(4, this.desitnationID);
            if (this.msgType !== undefined)
                writer.writeEnum(5, this.msgType);
            if (this.packetID !== undefined)
                writer.writeUint64(6, this.packetID);
            if (this.packet !== undefined)
                writer.writeBytes(7, this.packet);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryRaftPacket {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryRaftPacket();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 3:
                        message.sourceID = reader.readString();
                        break;
                    case 4:
                        message.desitnationID = reader.readString();
                        break;
                    case 5:
                        message.msgType = reader.readEnum();
                        break;
                    case 6:
                        message.packetID = reader.readUint64();
                        break;
                    case 7:
                        message.packet = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export namespace DiscoveryRaftPacket {
        export enum raftMsgType {
            appendEntriesRequest = 0,
            requestVoteRequest = 1,
            installSnapshotRequest = 2,
            appendEntriesResponse = 3,
            requestVoteResponse = 4,
            installSnapshotResponse = 5
        }
    }
    export class RaftLogSignatureEntry extends pb_1.Message {
        constructor(data?: any[] | {
            signature?: DiscoverySignature;
            expiration?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.signature = data.signature;
                this.expiration = data.expiration;
            }
        }
        get signature(): DiscoverySignature | undefined {
            return pb_1.Message.getWrapperField(this, DiscoverySignature, 1) as DiscoverySignature | undefined;
        }
        set signature(value: DiscoverySignature) {
            pb_1.Message.setWrapperField(this, 1, value);
        }
        get expiration(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as number | undefined;
        }
        set expiration(value: number) {
            pb_1.Message.setField(this, 2, value);
        }
        toObject() {
            return {
                signature: this.signature && this.signature.toObject(),
                expiration: this.expiration
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.signature !== undefined)
                writer.writeMessage(1, this.signature, () => this.signature.serialize(writer));
            if (this.expiration !== undefined)
                writer.writeUint64(2, this.expiration);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): RaftLogSignatureEntry {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new RaftLogSignatureEntry();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        reader.readMessage(message.signature, () => message.signature = DiscoverySignature.deserialize(reader));
                        break;
                    case 2:
                        message.expiration = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class RaftLogEntry extends pb_1.Message {
        constructor(data?: any[] | {
            packet?: Uint8Array;
            signatures?: RaftLogSignatureEntry[];
            deleteIndex?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [2], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.packet = data.packet;
                this.signatures = data.signatures;
                this.deleteIndex = data.deleteIndex;
            }
        }
        get packet(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set packet(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        get signatures(): RaftLogSignatureEntry[] {
            return pb_1.Message.getRepeatedWrapperField(this, RaftLogSignatureEntry, 2) as RaftLogSignatureEntry[];
        }
        set signatures(value: RaftLogSignatureEntry[]) {
            pb_1.Message.setRepeatedWrapperField(this, 2, value);
        }
        get deleteIndex(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as number | undefined;
        }
        set deleteIndex(value: number) {
            pb_1.Message.setField(this, 3, value);
        }
        toObject() {
            return {
                packet: this.packet,
                signatures: this.signatures.map((item: RaftLogSignatureEntry) => item.toObject()),
                deleteIndex: this.deleteIndex
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.packet !== undefined)
                writer.writeBytes(1, this.packet);
            if (this.signatures !== undefined)
                writer.writeRepeatedMessage(2, this.signatures, (item: RaftLogSignatureEntry) => item.serialize(writer));
            if (this.deleteIndex !== undefined)
                writer.writeUint64(3, this.deleteIndex);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): RaftLogEntry {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new RaftLogEntry();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.packet = reader.readBytes();
                        break;
                    case 2:
                        reader.readMessage(message.signatures, () => pb_1.Message.addToRepeatedWrapperField(message, 2, RaftLogSignatureEntry.deserialize(reader), RaftLogSignatureEntry));
                        break;
                    case 3:
                        message.deleteIndex = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryRequestConsensusVote extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            creation?: number;
            expiration?: number;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.creation = data.creation;
                this.expiration = data.expiration;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get creation(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as number | undefined;
        }
        set creation(value: number) {
            pb_1.Message.setField(this, 2, value);
        }
        get expiration(): number | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as number | undefined;
        }
        set expiration(value: number) {
            pb_1.Message.setField(this, 3, value);
        }
        toObject() {
            return {
                version: this.version,
                creation: this.creation,
                expiration: this.expiration
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.creation !== undefined)
                writer.writeUint64(2, this.creation);
            if (this.expiration !== undefined)
                writer.writeUint64(3, this.expiration);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryRequestConsensusVote {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryRequestConsensusVote();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        message.creation = reader.readUint64();
                        break;
                    case 3:
                        message.expiration = reader.readUint64();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryConsensusVote extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            signature?: DiscoverySignature;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.signature = data.signature;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get signature(): DiscoverySignature | undefined {
            return pb_1.Message.getWrapperField(this, DiscoverySignature, 2) as DiscoverySignature | undefined;
        }
        set signature(value: DiscoverySignature) {
            pb_1.Message.setWrapperField(this, 2, value);
        }
        toObject() {
            return {
                version: this.version,
                signature: this.signature && this.signature.toObject()
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.signature !== undefined)
                writer.writeMessage(2, this.signature, () => this.signature.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryConsensusVote {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryConsensusVote();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        reader.readMessage(message.signature, () => message.signature = DiscoverySignature.deserialize(reader));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class DiscoveryFinalConsensus extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            signatures?: DiscoverySignature[];
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [2], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.signatures = data.signatures;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get signatures(): DiscoverySignature[] {
            return pb_1.Message.getRepeatedWrapperField(this, DiscoverySignature, 2) as DiscoverySignature[];
        }
        set signatures(value: DiscoverySignature[]) {
            pb_1.Message.setRepeatedWrapperField(this, 2, value);
        }
        toObject() {
            return {
                version: this.version,
                signatures: this.signatures.map((item: DiscoverySignature) => item.toObject())
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.signatures !== undefined)
                writer.writeRepeatedMessage(2, this.signatures, (item: DiscoverySignature) => item.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): DiscoveryFinalConsensus {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new DiscoveryFinalConsensus();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        reader.readMessage(message.signatures, () => pb_1.Message.addToRepeatedWrapperField(message, 2, DiscoverySignature.deserialize(reader), DiscoverySignature));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class PublishToDiscoveryForwarded extends pb_1.Message {
        constructor(data?: any[] | {
            version?: string;
            fingerprint?: string;
            publishPacket?: Uint8Array;
            signature?: DiscoverySignature;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.version = data.version;
                this.fingerprint = data.fingerprint;
                this.publishPacket = data.publishPacket;
                this.signature = data.signature;
            }
        }
        get version(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string | undefined;
        }
        set version(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get fingerprint(): string | undefined {
            return pb_1.Message.getFieldWithDefault(this, 2, undefined) as string | undefined;
        }
        set fingerprint(value: string) {
            pb_1.Message.setField(this, 2, value);
        }
        get publishPacket(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 3, undefined) as Uint8Array | undefined;
        }
        set publishPacket(value: Uint8Array) {
            pb_1.Message.setField(this, 3, value);
        }
        get signature(): DiscoverySignature | undefined {
            return pb_1.Message.getWrapperField(this, DiscoverySignature, 4) as DiscoverySignature | undefined;
        }
        set signature(value: DiscoverySignature) {
            pb_1.Message.setWrapperField(this, 4, value);
        }
        toObject() {
            return {
                version: this.version,
                fingerprint: this.fingerprint,
                publishPacket: this.publishPacket,
                signature: this.signature && this.signature.toObject()
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.version !== undefined)
                writer.writeString(1, this.version);
            if (this.fingerprint !== undefined)
                writer.writeString(2, this.fingerprint);
            if (this.publishPacket !== undefined)
                writer.writeBytes(3, this.publishPacket);
            if (this.signature !== undefined)
                writer.writeMessage(4, this.signature, () => this.signature.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): PublishToDiscoveryForwarded {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new PublishToDiscoveryForwarded();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.version = reader.readString();
                        break;
                    case 2:
                        message.fingerprint = reader.readString();
                        break;
                    case 3:
                        message.publishPacket = reader.readBytes();
                        break;
                    case 4:
                        reader.readMessage(message.signature, () => message.signature = DiscoverySignature.deserialize(reader));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
}
