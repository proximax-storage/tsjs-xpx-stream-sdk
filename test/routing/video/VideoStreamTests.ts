import {VideoStream, VideoStreamParameters} from "../../../src/routing/video/VideoStream";
import {expect} from "chai";
import {SiriusStreamClient} from "../../../src/client/SiriusStreamClient";
const {getConfig, CONFIG_ENVIRONMENT_STAGING} = require("../../../config/test-config");
import {connectAttempt} from "../../common/common";
import {Frame, FrameType, Orientation} from "../../../src/media/Frame";

describe('VideoStream test', () => {
    it('Video Stream test', async function() {
        // due to connection, we set mocha timeout to 20 seconds
        this.timeout(20 * 1000);

        /**
         * Initiate discovery
         * */
        let client = new SiriusStreamClient(getConfig(CONFIG_ENVIRONMENT_STAGING));

        let discoveryPromise = new Promise(function (resolve, reject){
            connectAttempt(client, ()=>{
                expect(client.Discovery.NodeList.length).greaterThan(0);
                resolve();
            });
        });

        await discoveryPromise;

        /**
         * Prepare broadcaster
         * */
        let param = new VideoStreamParameters();
        param.width = 640;
        param.height = 360;
        param.isMicEnabled = false;
        param.isCamEnabled = false;
        param.version = 1;

        let videoStream = new VideoStream();
        videoStream.Nodes = client.Discovery.NodeList;
        let streamToken = '';

        let createBroadCasterPromise =  new Promise(function (resolve, reject){
            videoStream.createBroadcastStream(param, (token) =>{
                streamToken = token;
                resolve();
            });
        });

        await createBroadCasterPromise;
        expect(streamToken.length).not.equal(0);

        /**
         * Prepare viewer
         * */
        let videoViewer = new VideoStream();
        videoViewer.createViewer(streamToken);
        let viewerConnected = false;
        let viewerPromise =  new Promise(function (resolve, reject){
            videoViewer.OnViewStreamSuccess = () => {
                viewerConnected = true;
                resolve();
            };
        });

        await viewerPromise;
        expect(viewerConnected).equal(true);

        // wait for two seconds for broadcaster to process events, ie video viewer change
        const waiterPromise = ms => new Promise(resolve => setTimeout(resolve, ms));
        await waiterPromise(2000);

        /**
         * prepare frame to be sent
         * */
        let fb = new Array();
        let size = 8 * 1024; //8kb
        for(let i =0; i < 3; ++i) {
            if( i == 1) {
                let buffer = Buffer.alloc(size);
                for(let d = 0; d < size; d++){
                    buffer[d] = Math.floor(Math.random() * (255 + 1));
                }
                fb.push(buffer);
            }
            else
                fb.push(new Uint8Array(0));
        }

        let frame = new Frame();
        frame.set(FrameType.VIDEO_IDR, 123456789n, 0, Orientation.rotate0, fb);

        /**
         * receive the frame
         * */
        let frameReceived = null;
        let frameReceivedPromise =  new Promise(function (resolve, reject){
           videoViewer.OnVideoFrameReceived = (frame) =>{
               frameReceived = frame;
               resolve();
           };
        });

        videoStream.sendVideoFrame(frame);

        await frameReceivedPromise;

        expect(frameReceived).not.equal(null);
        expect(frameReceived.FrameType).equal(frame.FrameType);
        expect(frameReceived.TimeStamp).equal(frame.TimeStamp);
        expect(frameReceived.Sequence).equal(frame.Sequence);
        expect(frameReceived.Orientation).equal(frame.Orientation);

        for(let i = 0; i < 3;i++)
            expect(Buffer.from(frameReceived.Bytes[i])).to.eql(frame.Bytes[i]);

        client.shutdown();
        videoStream.shutdown();
        videoViewer.shutdown();
    })
});