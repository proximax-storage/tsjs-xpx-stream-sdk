const path = require('path');
const express = require('express');
const WebSocket = require('ws');

const VideoStream = require('tsjs-xpx-stream-sdk').VideoStream;
const BinaryHelper = require('tsjs-xpx-stream-sdk').BinaryHelper;
const SoundBuff = require('tsjs-xpx-stream-sdk').SoundBuf;

let videoStream = null;
//defined but not exposed in Frame.tss
let LayerCount = 3;

const app = express();

const MESSAGE_ID_VIEWSTREAM = 1;

const WS_PORT = process.env.WS_PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

wsServer.on('connection', (ws, req) => {
    console.log('Connected new client');

    ws.on('message', data => {
        const message = JSON.parse(data);

        switch(message.id) {
            case MESSAGE_ID_VIEWSTREAM:
                videoStream = new VideoStream();
                videoStream.createViewer(message.data);
                videoStream.OnViewStreamSuccess = () => {
                    console.log("view stream success!");
                };

                videoStream.OnVideoFrameReceived = (frame) =>{

                    // get the buffer with value
                    let buf = null;
                    for(let i = 0; i < LayerCount; i++) {
                        if(frame.Bytes[i].length > 0) {
                            buf = frame.Bytes[i].slice(0);
                            break;
                        }
                    }

                    if(buf == null)
                        return;

                    //serialize a reply to client side
                    // 0: message type (1: video, 2 : audio)
                    // 1: frametype from video frame type
                    // 2: time stamp
                    // 10: data
                    let length = 1 + 1 + 8 + buf.length;
                    let msg = Buffer.alloc(length);
                    msg[0] = 1; // video
                    msg[1] = frame.FrameType;
                    BinaryHelper.PutUint64(msg, frame.TimeStamp, 2);

                    let data = Buffer.from(buf);
                    data.copy(msg, 10);
                    ws.send(msg);
                };

                videoStream.OnAudioFrameReceived = (frame) => {
                    let sb = SoundBuff.deserialize(frame.Bytes[0]);
                    //serialize a reply to client side
                    // 0: message type (1: video, 2 : audio)
                    // 1: time stamp
                    // 9: data
                    let length = 1 + 8 + sb.buffer_val.length;
                    let msg = Buffer.alloc(length);
                    msg[0] = 2; // audio
                    BinaryHelper.PutUint64(msg, frame.TimeStamp, 1);
                    sb.buffer_val.copy(msg, 9);
                    ws.send(msg);
                };

                break;
        }
    });
});

// HTTP stuff
//app.use(express.static(__dirname + '../client'));
app.get('/client', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

app.get('/client/index.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/index.js'));
});

app.get('/client/yuv.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/yuv.js'));
});

app.get('/client/deserializer.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/binary.js'));
});

app.get('/client/worker.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/timerWorker.js'));
});

app.get('/client/cpp_high_resolution_clock.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/cpp_high_resolution_clock.js'));
});

app.get('/client/cpp_high_resolution_clock.wasm',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/cpp_high_resolution_clock.wasm'));
});

app.get('/client/sirius-stream-client/HighResolutionClock.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/adapter/HighResolutionClock.js'));
});

app.get('/client/sirius-stream-client/speexDecoderWorker.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/workers/speexDecoderWorker.js'));
});

app.get('/client/sirius-stream-client/libspeex.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libspeex.js'));
});

app.get('/client/sirius-stream-client/libspeex.wasm',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/libspeex.wasm'));
});

app.get('/client/sirius-stream-client/h264DecoderWorker.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/workers/h264DecoderWorker.js'));
});

app.get('/client/sirius-stream-client/H264lib_opencore.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/H264lib_opencore.js'));
});

app.get('/client/sirius-stream-client/H264lib_opencore.wasm',function(req,res){
    res.sendFile(path.resolve(__dirname, '../../common/webasm/H264lib_opencore.wasm'));
});

app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));