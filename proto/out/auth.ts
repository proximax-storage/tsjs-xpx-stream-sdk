import * as pb_1 from "google-protobuf";
export namespace protocol {
    export class AuthRequestCertificate extends pb_1.Message {
        constructor(data?: any[] | {
            certificateStub?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.certificateStub = data.certificateStub;
            }
        }
        get certificateStub(): Uint8Array | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as Uint8Array | undefined;
        }
        set certificateStub(value: Uint8Array) {
            pb_1.Message.setField(this, 1, value);
        }
        toObject() {
            return {
                certificateStub: this.certificateStub
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.certificateStub !== undefined)
                writer.writeBytes(1, this.certificateStub);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): AuthRequestCertificate {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new AuthRequestCertificate();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.certificateStub = reader.readBytes();
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
    export class AuthRequestCertificateResult extends pb_1.Message {
        constructor(data?: any[] | {
            result?: AuthRequestCertificateResult.requestResult;
            signature?: Uint8Array;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.result = data.result;
                this.signature = data.signature;
            }
        }
        get result(): AuthRequestCertificateResult.requestResult | undefined {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as AuthRequestCertificateResult.requestResult | undefined;
        }
        set result(value: AuthRequestCertificateResult.requestResult) {
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
                result: this.result,
                signature: this.signature
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (this.result !== undefined)
                writer.writeEnum(1, this.result);
            if (this.signature !== undefined)
                writer.writeBytes(2, this.signature);
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): AuthRequestCertificateResult {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new AuthRequestCertificateResult();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.result = reader.readEnum();
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
    export namespace AuthRequestCertificateResult {
        export enum requestResult {
            success = 0,
            formatError = 1,
            unsupportedVersion = 2,
            signatureInvalid = 3,
            internalError = 4
        }
    }
}
