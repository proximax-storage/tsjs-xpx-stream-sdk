/**
 *  Sample client frontend for brodcasting a stream
 *  1. capture image from video cam, initial capture is after 3second (300ms) after initialization, suceeding capture is
 *  every after an image is encoded and sents thru websocket to the nodejs server.
 *  2. captured image is then passed to a worker (encoderWorker) that converts to YUV420 and encode using X264 (webasm)
 *  3. audio is captured every 4096 samples, it is passed to a worker which encodes to Speex codex before sending to websocket
 *
 * Note:
 *  1. Follows the same flow as Zoom version of its browser, but this application uses H264/x264 with speex while zoom uses different encoders
 * */

/**
 * Image frame dimension, it is intended as small so performance will be better, increasing the dimension also means
 * slowing down some part of the capture and encoding
 * */
const IMAGE_WIDTH = 640;
const IMAGE_HEIGHT = 360;

/**
 * HTML canvas for display, the video capture is stream in a video component but repainted to canvs
 * */
var canvas = document.getElementById("preview");
var context = canvas.getContext("2d");
canvas.width = IMAGE_WIDTH;
canvas.height = IMAGE_HEIGHT;
context.width = canvas.width;
context.height = canvas.height;

/**
 * The video component element, receives video but it is hidden to user
 * */
const video = document.querySelector('video');

/**
 * Websocket object
 * */
let ws = null;

/**
 * Cached raw PCM data
 * */
let audioList = [];

/**
 * The web API audio context
 * */
let audioContext = null;

/**
 * paints the video into canvas and returns an RGBA data
 * */
const getFrame = () => {
    context.clearRect(0,0,canvas.width, canvas.height);
    context.drawImage(video, 0, 0);
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imgData.data;
}

/**
 * WebRTC video capture setup
 * */
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia || navigator.msgGetUserMedia);

if(navigator.getUserMedia) {
    navigator.mediaDevices.getUserMedia({video: {width: IMAGE_WIDTH, height: IMAGE_HEIGHT}}
    ).then((stream) => video.srcObject = stream);
}

/**
 * x264 web worker, encodes RGBA data
 * sends audio as well to guaranteed timing
 * */
let worker = new Worker("./client/encoderWorker.js");
worker.onmessage = (event)=>{
    ws.send(event.data.buffer);

    for(let i = 0; i < audioList.length;i++) {
        let frame = audioList.shift();
        ws.send(frame);
    }

    Capture();
};

/**
 * Encodes raw PCM data to Speex codex and stored in audio cache list
 * */
let speexWorker = new Worker("./client/sirius-stream-sdk-client/speexWorker.js");
speexWorker.onmessage = (event)=>{
    audioList.push(event.data.data);
};

/**
 * Connects to nodejs server, and perform initial capture after 3 seconds
 * */
function start() {
    const WS_URL = 'ws://localhost:3001';
    ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
        console.log(`Connected to ${WS_URL}`);
        worker.postMessage({
            command : "initialize"
        });
    };

    ws.onmessage = (data) =>{
        document.getElementById('tokenid').innerHTML = "<br><b> Streaming at :</b> " + data.data;
    }

    setTimeout(()=>{
        Capture();
    }, 3000);
}

/**
 * Capture a frame and sends to encoder worker for processing
 * */
function Capture() {
    let imgData = getFrame();
    let timestamp = HighResolutionClock_Now();

    worker.postMessage({
        command : "encode",
        image : imgData,
        width : IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        ts : timestamp
    });
}

/**
 * initializes Web API audio context with 16000 sampling rate
 * */
function initAudio() {
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    audioContext = new AudioContext({sampleRate: 16000});
    navigator.getUserMedia({audio: true}, setupAudioStream, function(err){});

    speexWorker.postMessage({
        command : "initialize"
    });
}

function setupAudioStream(stream) {
    var mediaStreamSource = audioContext.createMediaStreamSource(stream);
    var context = mediaStreamSource.context;

    var numChannelsIn = 1;
    var numChannelsOut = 1;
    var node = context.createScriptProcessor(4096, numChannelsIn, numChannelsOut);
    node.onaudioprocess = handleAudio;

    mediaStreamSource.connect(node);
    node.connect(context.destination);

}

function handleAudio(event) {
    var buffer = event.inputBuffer.getChannelData(0);       //float32 array PCM
    let timestamp = HighResolutionClock_Now();

    speexWorker.postMessage({
        command : "encode",
        buffer : buffer,
        ts : timestamp
    });
}
