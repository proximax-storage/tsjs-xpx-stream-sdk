const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const {Worker} = require('worker_threads');

const app = express();

const MESSAGE_ID_VIEWSTREAM = 1;

const WS_PORT = process.env.WS_PORT || 3003;
const HTTP_PORT = process.env.HTTP_PORT || 3002;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

wsServer.on('connection', (ws, req) => {
    console.log('Connected new client');

    ws.on('message', data => {
        const message = JSON.parse(data);

        switch(message.id) {
            case MESSAGE_ID_VIEWSTREAM:
                let worker = new Worker("./clientWorker.js")
                worker.postMessage({
                    command: "initialize",
                    clientID : message.data
                });

                worker.on('message', (event) => {
                    if(event.command == "video_ready" || event.command == "audio_ready") {
                        ws.send(event.data);
                    }
                });

                break;
        }
    });

    // TODO handle ws socket close and viewer manager cleanup, after fixing frame rate
    // setable framerater  option as well, maybe accessor to videostream object instead
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