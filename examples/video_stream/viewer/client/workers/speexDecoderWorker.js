var _this = this;

let create = null;
let compress = null;
let decompress = null;
let getSamplingRate = null;
let getFrameSize = null;
let destroy = null;

let id = 0;
let samplingRate = 0;
let frameSize = 0;

let decoderReady = false;
let buf_ptr = null;
const FRAME_SIZE = 320;

SpeexModule = {
    onRuntimeInitialized: () => {
        create = SpeexModule.cwrap("create", "number", ["number"]);
        compress = SpeexModule.cwrap("compress", "number", ["number", "number", "number"]);
        decompress = SpeexModule.cwrap("decompress", "number", ["number", "number", "number"]);
        getSamplingRate = SpeexModule.cwrap("getSamplingRate", "number", ["number"]);
        getFrameSize = SpeexModule.cwrap("getFrameSize", "number", ["number", "number"]);
        destroy = SpeexModule.cwrap("destroy", null, ["number"]);

        decoderReady = true;

        console.log("speex decoder loaded");
    }
};

_this.importScripts("./libspeex.js");

onmessage = function(e) {
    if(e.data.command == "initialize") {
        initialize();

    }else if(e.data.command == "deInitialize") {
        deInitialize();
    }else if(e.data.command == "decode") {
      //  cacheData.push(e.data);
       let samples = decode(e.data.buffer);

        var frameCount = samples.length / 2;
        let nowBuffering = new Array(frameCount);
        let timestampList = new Array(frameCount);
        for (var i = 0; i < frameCount; i++) {
            // audio needs to be in [-1.0; 1.0]
            // for this reason I also tried to divide it by 32767
            // as my pcm sample is in 16-Bit. It plays still the
            // same creepy sound less noisy.
            var word = (samples[i * 2] & 0xff) + ((samples[i * 2 + 1] & 0xff) << 8);
            nowBuffering[i] = ((word + 32768) % 65536 - 32768) / 32768.0;

            timestampList[i] = e.data.timestamp;
        }

        _this.postMessage({
            command : "audio_decoded",
            data : nowBuffering,
            tslist : timestampList,
            samplingRate : samplingRate,
            frameSize : frameSize
        })
    }
};

function initialize() {

    if(!decoderReady)
        return;

    let quality = 2;
    id = create(quality);

    samplingRate = getSamplingRate(quality);
    frameSize = getFrameSize(id, quality);

    buf_ptr = SpeexModule._malloc(FRAME_SIZE * 2);
}

function deInitialize() {
    destroy(id);
    SpeexModule._free(buf_ptr);
}

function decode(buffer) {
    if(id == 0) {
        initialize();
    }

    SpeexModule.HEAPU8.set(buffer, buf_ptr);

    let size = decompress(id, buffer.length, buf_ptr);
    return new Uint8Array(SpeexModule.HEAPU8.buffer, buf_ptr, size * 2);
}