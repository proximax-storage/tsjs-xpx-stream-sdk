
import {checksum} from "../../src/pki/Identity";
import {expect} from "chai";
import {bytesToHex, hexToBytes} from "../../src/utils/Hex";
import * as bs58 from "../../src/3rd-party/bs58";

describe('Identity tests', () => {
    it('should generate sha256 checksum', () => {
        var checksum256 = checksum("psp.auth.node.F0857E431621430D5912F8831D3670505F7D1267BE1CCE32CB04E8C45405A063");
        var expected = [
            110, 65, 71, 249
        ];

        expect(checksum256).to.eql(Buffer.from(expected));
    })

    it('should generate correct base58', () => {
        var key = [
            77, 74, 179, 165, 137, 254, 74, 108,
            105, 94, 32, 149, 128, 57, 30, 244, 4,
            153, 29, 79, 143, 239, 211, 180, 57, 40, 214, 212,
            232, 168, 175, 144
        ];

        var expected = "b3KHy7sonsjMzWEsq9zgUfZLuswtKXFQMfGgeJKe76y6eQ7Q4";

        var chcksum = [3, 177, 151, 153];
        var buffer = Buffer.concat([Buffer.from(key), Buffer.from(chcksum)]);
        var result = bs58.encode(bytesToHex(buffer));

        expect(result).to.equal(expected);

        var reverse = bs58.decode(result);
        var bytRev = hexToBytes(reverse);

        expect(Buffer.from(bytRev)).to.eql(buffer);
    })
});