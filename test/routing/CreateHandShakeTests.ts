
import {ClientHandshake, createHandshakeAuth, Public} from "../../src/routing/CreateHandshake";
import {expect} from "chai";
import {stringToAsciiByteArray} from "../../src/utils/Hex";
import {HandshakeExpand, HandshakeKey, HandshakeProtoID} from "../../src/defines/Onion";
import hkdf = require("futoin-hkdf");

// results and input generated using Go version of sdk

describe('CreateHanshake test', () => {
    it('should create createHandshakeAuth', () => {
        var fingerprint = [
            116, 208, 119, 62, 129, 126, 23,
            196, 142, 3, 241, 100, 223, 61, 203,
            215, 195, 10, 136, 24, 150, 49, 93, 105,
            97, 118, 31, 79, 167, 192, 169, 61
        ];

        var clientPair_Pub = [
            0, 44, 234,11, 174, 71, 145, 32, 156,
            252, 32, 12, 46, 112, 215, 220, 204,
            254, 197, 15, 7, 150, 237, 248, 142,
            239, 170, 211, 109, 64, 204, 58
        ];

        var clientPair_Pk = [
            13, 138, 14, 182, 220, 109, 248, 140,
            63, 107, 166, 235, 156, 254, 224, 119,
            172, 105, 25, 28, 67, 100, 9, 76, 241,
            226, 247, 158, 15, 188, 170, 219
        ];

        var KY = [
            146, 52, 176, 189, 53, 219, 56, 120, 248,
            164, 237, 52, 194, 162, 0, 70, 243, 53,
            231, 99, 54, 175, 203, 21, 54, 118, 166,
            152, 36, 142, 112, 114
        ];

        var handshakeKey = [
            171, 90, 248, 117, 172, 155, 82,
            167, 158, 106, 93, 220, 23, 219,
            128, 38, 82, 29, 252, 138, 226, 29,
            112, 152, 48, 120, 250, 190, 98, 56,
            178, 60
        ];

        var authResult = [
            161,79,221,118,2,250,41,124,230,140,162,
            153,94,103,10,219,220,93,40,121,188,248,16,
            77,138,90,75,44,49,189,108,226,
        ];

        let pub = new Public();
        pub.ID = Buffer.from(fingerprint);
        pub.KX = Buffer.from(clientPair_Pub);
        pub.KY = Buffer.from(KY);
        pub.KB = Buffer.from(handshakeKey);

        let h = new ClientHandshake(pub, Buffer.from(clientPair_Pk));

        let auth = createHandshakeAuth(h);

        expect(auth).to.eql(authResult);
    })

    it('it should extract with HKDDF',()=>{
        var secretInput = [
            196, 54, 163, 221, 141, 135, 113, 147, 12, 51,
            150, 92, 42, 185, 24, 183, 230, 12, 110, 88,
            166, 220, 149, 237, 219, 7, 95, 163, 230, 133,
            217, 119, 165, 148, 77, 55, 10, 193, 255, 3, 54,
            36, 44, 208, 239, 29, 126, 187, 97, 58, 27, 211,
            93, 252, 213, 130, 74, 45, 128, 157, 250, 238, 201,
            37, 63, 35, 41, 188, 224, 184, 196, 89, 15, 58, 178,
            105, 143, 114, 235, 39, 4, 73, 102, 68, 190, 232, 50,
            222, 181, 67, 37, 24, 38, 13, 218, 73, 22, 119, 121, 200,
            196, 74, 55, 233, 45, 95, 135, 168, 209, 34, 3, 222, 113,
            158, 233, 65, 1, 215, 115, 209, 239, 57, 108, 198, 52, 213, 226,
            96, 213, 182, 184, 146, 192, 243, 33, 192, 243, 43, 249, 253,
            87, 247, 96, 96, 93, 43, 69, 185, 71, 24, 26, 32, 127, 118, 147,
            184, 134, 40, 166, 38, 221, 171, 216, 32, 105, 243, 34, 75, 255, 141, 163,
            83, 247, 228, 176, 76, 135, 233, 191, 171, 71, 60, 176, 225, 202, 212, 64,
            162, 111, 5, 49, 29, 112, 115, 112, 45, 99, 117, 114, 118, 101, 50, 53, 53,
            49, 57, 45, 115, 104, 97, 50, 53, 54, 45, 48, 49
        ];

        // results are generated using Go version of sdk
        var expected = [
            47,85,246,99,79,248,150,70,0,84,163,19,22,253,104,98,143,
            68,7,186,196,38,160,213,38,255,35,13,128,176,187,82,238,238,
            80,90,53,154,232,91,124,215,24,71,254,6,153,186,179,131,211,
            180,232,91,58,140,134,96,40,113,212,164,237,154,79,125,29,44,
            72,84,235,139,

        ];

        var salt = stringToAsciiByteArray(HandshakeKey);
        var info = stringToAsciiByteArray(HandshakeExpand);
        var circuitKeySize = 72;
        var result = hkdf(Buffer.from(secretInput), circuitKeySize,
            {salt:Buffer.from(salt), info: Buffer.from(info),hash: "SHA-256"});

        expect(result).to.eql(Buffer.from(expected));
    })
});