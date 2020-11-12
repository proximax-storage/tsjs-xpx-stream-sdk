import {bytesToHex, hexToBytes, stringToAsciiByteArray} from "../src/utils/Hex";
import { expect } from "chai";
import {HandshakeProtoID} from "../src/defines/Onion";

describe('Hex conversion test', () => {
    it('can convert string to bytes', () => {
        var fingerprint = "3C02999269C180662B1A630C309E9F55375F4CEF145B94FCCA2EFF0075E872B1";
        var converted = hexToBytes(fingerprint);
        var expected = [
            60, 2, 153, 146, 105, 193, 128, 102, 43, 26, 99, 12, 48,158,
            159, 85, 55, 95, 76, 239, 20, 91, 148, 252, 202, 46, 255, 0,
            117, 232, 114, 177
        ];

        expect(expected).to.eql(converted);
    })

    it('can convert to string', () => {
        var fingerprint = "3C02999269C180662B1A630C309E9F55375F4CEF145B94FCCA2EFF0075E872B1";
        var input = [
            60, 2, 153, 146, 105, 193, 128, 102, 43, 26, 99, 12, 48,158,
            159, 85, 55, 95, 76, 239, 20, 91, 148, 252, 202, 46, 255, 0,
            117, 232, 114, 177
        ];
        var converted = bytesToHex(input);
        expect(converted).to.eql(fingerprint);
    })

    it('can convert string to bytes', () => {
        var byte = stringToAsciiByteArray(HandshakeProtoID);
        var result = [
            112, 115, 112, 45, 99, 117, 114, 118, 101, 50, 53, 53,
            49, 57, 45, 115, 104, 97, 50, 53, 54, 45, 48, 49
        ];

        expect(byte).to.eql(result);
    })
});