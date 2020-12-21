/**
 *  Sample server for brodcasting a stream
 *  1. creates a connenction to stream network by SiriusStreamClient
 *  2. create a VideoStream object on client connect, supplying the Nodes from #1
 *  3. receives encoded image data (x264) or audio (SPeex)
 *  4. builds a Frame object based from data provided by front end
 *  5. sends the frame
 * */
const path = require('path');
const express = require('express');
const WebSocket = require('ws')
const SiriusStreamClient = require('tsjs-xpx-stream-sdk').SiriusStreamClient;
const VideoStream = require('tsjs-xpx-stream-sdk').VideoStream;
const VideoStreamParameters = require('tsjs-xpx-stream-sdk').VideoStreamParameters;
const Deserializer = require('tsjs-xpx-stream-sdk').BinaryHelper;
const Frame = require('tsjs-xpx-stream-sdk').Frame;
const Orientation = require('tsjs-xpx-stream-sdk').Orientation;
const FrameType = require('tsjs-xpx-stream-sdk').FrameType;
const SoundBuf = require('tsjs-xpx-stream-sdk').SoundBuf;
const fProtocol = require('tsjs-xpx-stream-sdk').fProtocol;
const fCompSPEEX = require('tsjs-xpx-stream-sdk').fCompSPEEX;
const getConfig = require("../../../../config/test-config");

/**
 * create sirius client object with the config
 * we need for node list during broadcast
 * */
let client = new SiriusStreamClient(getConfig());

client.start();
client.OnApplicationReady = () => {
    console.log("Server ready");
};

const app = express();

const WS_PORT = process.env.WS_PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () =>
    console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

wsServer.binaryType = "arraybuffer";

let ready = false;
let micSeq_num = 0;

wsServer.on('connection', (ws, req) => {
    console.log('Connected new client');

    let param = new VideoStreamParameters();
    param.width = 640;
    param.height = 360;
    param.isMicEnabled = false;
    param.isCamEnabled = false;
    param.version = 1;

    let videoStream = new VideoStream();
    videoStream.Nodes = client.Discovery.NodeList;
    videoStream.createBroadcastStream(param, (token) =>{
        //... token created event
        console.log("Success creating broadcast stream1 with token " + token);
        ready = true;

        ws.send(token);
    });

    /**
     * Receives data from frontend and builds the Frame object,
     * serialized the frame object and sends thru stream network
     * */
    ws.on('message', data => {

        if(!ready)
            return;

        if(data[0] == 1) { // video

            let type  = FrameType.VIDEO_IDR;

            if(data[1] == 0)
                type = FrameType.VIDEO_IDR
            else if(data[1] == 1)
                type = FrameType.VIDEO_I;
            else
                type = FrameType.VIDEO_P;

            let ts = Deserializer.Uint64(data, 2);

            let fb = new Array();
            let buffer = data.slice(10);
            for(let i =0; i < 3; ++i) {
                if( i == 1)
                    fb.push(buffer);
                else
                    fb.push(new Uint8Array(0));
            }

            let frame = new Frame();
            frame.set(type, ts, 0, Orientation.rotate0, fb);
            videoStream.sendVideoFrame(frame);
        }
        else if(data[0] == 2) { // audio
            let ts = Deserializer.Uint64(data, 1);
            let audio = data.slice(9);

            let sb = new SoundBuf();
            sb.buffer_len = audio.length;
            sb.buffer_val = Buffer.from(audio);
            sb.compression = fProtocol | fCompSPEEX;

            let fb = new Array();
            for(let i =0; i < 3; ++i) {
                if( i == 0) {
                    let buf = sb.serialize();
                    // copied from C++ SDK for some reason a blank uid (4 bytes is written at the last part)
                    let buffer = Buffer.from(buf);
                    let finalBuffer = Buffer.alloc(buf.length + 4);
                    buffer.copy(finalBuffer);

                    fb.push(finalBuffer);
                }
                else {
                    fb.push(new Uint8Array(0));
                }
            }

            let frame = new Frame();
            frame.set(FrameType.AUDIO, ts, micSeq_num, Orientation.rotate0, fb);
            ++micSeq_num;

            videoStream.sendAudioFrame(frame);
        }
    });
});


app.get('/client', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

app.get('/client/libx264_webasm.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libx264_webasm.js'));
});

app.get('/client/index.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/index.js'));
});

app.get('/client/libx264_webasm.wasm',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libx264_webasm.wasm'));
});

app.get('/client/encoderWorker.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/workers/encoderWorker.js'));
});

app.get('/client/worker.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/timerWorker.js'));
});

app.get('/client/HighResolutionClock.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/adapter/HighResolutionClock.js'));
});

app.get('/client/cpp_high_resolution_clock.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../common/webasm/cpp_high_resolution_clock.js'));
});

app.get('/client/cpp_high_resolution_clock.wasm', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../common/webasm/cpp_high_resolution_clock.wasm'));
});

app.get('/client/serializer.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../common/binary.js'));
});

app.get('/client/tsjs-xpx-stream-sdk-client/speexWorker.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/workers/speexWorker.js'));
});

app.get('/client/tsjs-xpx-stream-sdk-client/libspeex.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libspeex.js'));
});

app.get('/client/tsjs-xpx-stream-sdk-client/libspeex.wasm', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libspeex.wasm'));
});

app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));