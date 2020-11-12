import {deserializedFrame, Frame, serializeFrame} from "../../src/media/Frame";
import {expect} from "chai";


describe('Frame test', () => {
    it('can serialize with protobuff', () => {
        let frame = new Frame();
        frame.Orientation = 0;
        frame.FrameType = 1;
        frame.TimeStamp = BigInt(17197979045899);
        frame.Sequence = 0;
        frame.Uid = 0;
        frame.Bytes = new Array<Uint8Array>();

        frame.Bytes[0] = new Uint8Array();
        frame.Bytes[2] = new Uint8Array();

        frame.Bytes[1] = new Uint8Array(10);
        for(let i = 0; i < 10; i++)
            frame.Bytes[1][i] = i;

        let data = serializeFrame(frame);
        let dframe = deserializedFrame(Buffer.from(data));

        expect(frame.TimeStamp).equal(dframe.TimeStamp);
        expect(frame.FrameType).equal(dframe.FrameType);
        expect(frame.Bytes[1]).to.eql(dframe.Bytes[1]);
    })
});
