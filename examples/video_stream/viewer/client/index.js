/**
 *  Sample frontend for stream viewer
 *  1. connects to websocket
 *  2. initializes decoder and timer workers
 *  3. receives raw data from nodejs server
 *  4. pass the raw data to specific decoder
 *  5. after decoding, inserts decoded data to specific data list
 *  6. Timer workers of each data(audio,video) triggers basedon settings (60 FPS for video, 16000 samples per second for audio)
 *
 *  Important note:
 *  1. Known Issue on this demo: Choppy sound, because Javascript is single threaded by nature, even if there are separate threadd
 *  to decode data, when result is passed back to main thread, it waits until it is executed, thus starving the HTML audio player causing
 *  "clunky" sound if data playedd does not reach 16000 samples.
 *  2. This demo implements basic Audio and Video synchign based on timestamp and stream time. See playFront
 *      a. When audio is ahead, set the audio timestamp as the stream time so video can start from it.
 *      b. when audio is behind, drop/delete the audio data on the list.
 *  3. To keep the video up to date, frames behind the application stream time are dropped. See PalViewerHeadless.
 * */

// message constants
const VIDEO_FPS = 30;
const MESSAGE_ID_VIEWSTREAM = 1;

let viewStreamId = "";
let ws = null;

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// VIDEO cache buffer
let videoBuffer = [];
let incomingTimeStamp = BigInt(0);
let videoTimeStamp = BigInt(0);

// AUDIO definitions
let audio_buffer = [];
let timestamp_cache = [];

let samplingRate = -1;
let frameSize = -1;
let nextTime = 0;
let audioContext = null;

let lastTime = 0;

let triggered = false;
let dataCache = [];

let videoWorker = new Worker("/client/worker.js");
videoWorker.onmessage = function (event) {
    palViewerHeadless();
};

let audio_worker = new Worker("/client/worker.js");
audio_worker.onmessage = function (event) {
   let currTime = Date.now();
    let elapsed = (currTime - lastTime)/1000;

    let emitTime = frameSize / samplingRate;
    let secPerSample = emitTime / frameSize;

    let diff = emitTime - elapsed;

    let samples = Math.abs(diff) / secPerSample;
    samples = (diff < 0)? samples : -samples;

    let count = frameSize + samples;
    playFront(count);
    lastTime = currTime;
}

let h264DecoderWorker = new Worker("/client/sirius-stream-client/h264DecoderWorker.js");
let speexDecoderWorker = new Worker("/client/sirius-stream-client/speexDecoderWorker.js");

h264DecoderWorker.onmessage = (event) =>{
    if(event.data.command == "image_ready") {
        let width = event.data.width;
        let height = event.data.height;
        let frameBuffer = event.data.data;

        let frame = {
            width: width,
            height: height,
            timestamp: event.data.timestamp,
            data: frameBuffer
        };

        videoBuffer.push(frame);
    }
};

speexDecoderWorker.onmessage = (event) =>{
    if(event.data.command == "audio_decoded") {

        // do not process audio that is behind video frame
        if(event.data.tslist[0] < videoTimeStamp) {
            console.log("Received audio is older than video timestamp");
            return;
        }

        samplingRate = event.data.samplingRate;
        frameSize = event.data.frameSize;

        Array.prototype.push.apply(audio_buffer, event.data.data);
        Array.prototype.push.apply(timestamp_cache, event.data.tslist);
    }
};

viewStreamId = prompt("Please enter stream ID", "");

if(viewStreamId.length == 0){
    alert("You need to specify streamer ID to start");
} else {
    const WS_URL = 'ws://localhost:3003';
    ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
        console.log(`Connected to ${WS_URL}`);

        //  connect to server
        const message = JSON.stringify({
            id : MESSAGE_ID_VIEWSTREAM,
            data : viewStreamId
        });

        ws.send(message);

        h264DecoderWorker.postMessage({command:"initialise"});
        speexDecoderWorker.postMessage({command:"initialise"});

        videoWorker.postMessage({
            command: "start",
            payload: 1000/VIDEO_FPS
        });
    }

    ws.onmessage = event => {
        // check message type
        let data = new Uint8Array(event.data);
        let messageType = data[0];
        switch (messageType) {
            case 1: // video
            {
                //deserialize message
                let frameType = data[1];
                let timestamp = GetUint64(data, 2);
                let buffer = data.slice(10);

                h264DecoderWorker.postMessage({
                    command: "decode",
                    buffer : buffer,
                    frametype : frameType,
                    timestamp : timestamp
                });

                break;
            }

            case 2: // audio
            {
                if (audioContext == null) {
                    return;
                }

                let timestamp = GetUint64(data, 1);
                let buffer = data.slice(9);

                speexDecoderWorker.postMessage({
                    command: "decode",
                    buffer : buffer,
                    timestamp : timestamp
                });

                break;
            }
        }
    }
}

/**
 * the current global play time of the video
 * */
let streamTime = BigInt(0);

/**
 * stores the current time captured, last processing frame time
 * */
let referenceTime = BigInt(0);


/**
 * Set the base point of playing the video, whether from first frame or audio time stamp
 * */
function setTimestamps(ts_from_audio) {
    streamTime = BigInt(ts_from_audio);
    referenceTime = HighResolutionClock_Now();
}

/**
 * process a decoded frame and checks whether the next frame is within the current stream time
 * drops if it goes beyond tolerance
 * */
function palViewerHeadless() {

    if(videoBuffer.length <=0) return;

    let frameTime = BigInt(0);
    let frame = videoBuffer[0];

    if(incomingTimeStamp == BigInt(0)) {
        incomingTimeStamp = frame.timestamp - HighResolutionClock_nanosec(250);
        setTimestamps(incomingTimeStamp);
    }else{
        incomingTimeStamp = frame.timestamp;
    }

    frameTime = videoBuffer[0].timestamp;
    let diffTime = streamTime - frameTime;
    let streamRate = HighResolutionClock_nanosec(1000) / 60n;
    while(videoBuffer.length != 0 && diffTime > streamRate) {

        let vf = videoBuffer.shift();

        if(videoBuffer.length != 0)
            frameTime = videoBuffer[0].timestamp;
        else
            frameTime = BigInt(0);

        diffTime = streamTime - frameTime;
    }

    let diff = frameTime - streamTime;
    let validDiff = (diff < streamRate && diff > -streamRate);

    if(videoBuffer.length != 0 /*&& validDiff*/) {

        let vf = videoBuffer.shift();

        canvas.width = vf.width;
        canvas.height = vf.height;

        let progRGB = yuv420ProgPlanarToRgb(vf.data, vf.width, vf.height);
        const imageData = ctx.createImageData(vf.width, vf.height)
        putRGBToRGBA(imageData.data, progRGB, vf.width, vf.height)
        ctx.putImageData(imageData, 0, 0)
        ctx.scale(-1, 1); // flip the image

        videoTimeStamp = vf.timestamp;
    }

    let now = HighResolutionClock_Now();
    streamTime += now - referenceTime;
    referenceTime = now;

}

/**
 * stores the list of Web API buffer source to keep track which stores are done playing
 * */
let sourceList = [];


/**
 * play an audio using web API based from number of samples needed
 * */
function playFront(count) {

    // we buffer/forced latency for half a second
    // 500 millisecond is deducted to timestamp passed by server because of audio clock time delay during audio start
    let bufferTime = 0.5;

    if (audio_buffer.length == 0 || count == 0 || audioContext == null) {
        console.log("audio buffer ran out of data...");

        if(audioContext.state === 'running') {
            audioContext.suspend();
            nextTime = 0;
        }

        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if(audioContext.state != "running")
        return;

    let audio_ts = timestamp_cache[0];
    if(sourceList.length > 0)
        audio_ts = sourceList[0].timestamp;

    let videoGap = (videoTimeStamp) - (audio_ts);
    let gap = HighResolutionClock_milliseconds(videoGap) / 1000;
    if(gap >= bufferTime) {
        let audio_tolerance = BigInt(0);
        let timestamp = videoTimeStamp - audio_tolerance;
        let index = -1;
        for (let i = 0; i < timestamp_cache.length; i++) {
            if (timestamp_cache[i] >= timestamp) {
                index = i;
                break;
            }
        }

        if(index != -1) {
            audio_buffer = audio_buffer.slice(index);
            timestamp_cache = timestamp_cache.slice(index);
        }
    }
    else if (gap < 0){
        setTimestamps(timestamp_cache[0]);
    }

    // HTML audio adds a click sound at the end of each audio if it does not reach sampling rate (samples per second)
    // producing a choppy sound.
    // main  cause is frontend single thread limitation, the video processing thread is eating the CPU time of the audio decoding and
    // filling up data when returning to main thread
    if(audio_buffer.length < samplingRate) {
        console.log("not enough sound audio buffer to play, length = " + audio_buffer.length +
            " expected = " + samplingRate);
    }

    let nowBuffering = audio_buffer.slice(0, count);
    audio_buffer = audio_buffer.slice(count);
    timestamp_cache = timestamp_cache.slice(count);

    var newBuffer = audioContext.createBuffer(1, nowBuffering.length, samplingRate);
    newBuffer.getChannelData(0).set(nowBuffering);

    var newSource = audioContext.createBufferSource();
    newSource.buffer = newBuffer;
    newSource.connect(audioContext.destination);

    if(nextTime == 0) {
        // we let the hardware audio clock run for some time before we start playing
        // video should also sync with this
        nextTime = audioContext.currentTime + bufferTime;
    }

    newSource.start(nextTime);

    sourceList.push({
        source: newSource,
        timestamp : audio_ts
    });

    newSource.onended = ()=>{
        for(let s = 0; s < sourceList.length; s++) {
            if(sourceList[s].source == newSource) {
                sourceList.splice(s,1);
                break;
            }
        }
    };
    nextTime += newSource.buffer.duration;
}

function allowAudio() {
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    audioContext = new AudioContext({sampleRate: 16000});

    lastTime = Date.now();

    audio_worker.postMessage({
        command: "start",
        payload: (frameSize/samplingRate) * 1000
    });
}
