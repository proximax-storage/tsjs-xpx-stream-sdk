
var _this = this;

let id = 0;
let samplingRate = 0;
let frameSize = 0;
const FIX_FRAME_SIZE = 320;

let create  = null;
let compress  = null;
let decompress = null;
let getSamplingRate = null;
let getFrameSize = null;
let destroy = null;

let samples = [];
let timestamps = [];

SpeexModule = {
    onRuntimeInitialized: () => {
        create = SpeexModule.cwrap("create", "number", ["number"]);
        compress = SpeexModule.cwrap("compress", "number", ["number", "number", "number"]);
        decompress = SpeexModule.cwrap("decompress", "number", ["number", "number", "number"]);
        getSamplingRate = SpeexModule.cwrap("getSamplingRate", "number", ["number"]);
        getFrameSize = SpeexModule.cwrap("getFrameSize", "number", ["number", "number"]);
        destroy = SpeexModule.cwrap("destroy", null, ["number"]);

        console.log("Speex assembly loaded");
    }
};

_this.importScripts("./libspeex.js");
_this.importScripts("../serializer.js");

onmessage = function(e) {
    if(e.data.command == "initialize") {
        let quality = 2;
        id = create(quality);
        samplingRate = getSamplingRate(quality);
        frameSize = getFrameSize(id, quality);

        setInterval(process, 20/*msec*/);
    }
    else if(e.data.command == "destroy") {
        destroy(id);
    }
    else if(e.data.command == "encode" && id != 0) {
        Array.prototype.push.apply(samples, e.data.buffer);
        for(let i = 0; i < e.data.buffer.length;i++) {
            timestamps.push(e.data.ts);
        }
    }
};

function process(){
    var toProcess = samples.splice(0, FIX_FRAME_SIZE);
    var tsarr = timestamps.slice(0, FIX_FRAME_SIZE);
    let ts = BigInt(0);

    if(tsarr.length > 0)
        ts = tsarr[0];

    var datalen = toProcess.length;
    var shorts = new Int16Array(datalen);
    for(var i = 0; i < datalen; i++) {
        let s = Math.max(-1, Math.min(1, toProcess[i]));
        shorts[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    //convert to bytes
    let buffer = new Uint8Array(shorts.buffer);

    if (toProcess.length > 0 && ts > 0) {
       var encoded = encode(buffer);
        var data = serialize(encoded, ts);
        _this.postMessage({
            command: 'encoded',
            data: data
        });
    }
}

function serialize(data, ts) {
    let length = 1 + 8;
    let header = new Uint8Array(length);
    header[0] = 2;   // type 2: audio

    PutUint64(header, ts, 1);

    let b = new Uint8Array(header.length + data.length);
    b.set(header);
    b.set(data, header.length);

    return b;
}

function encode(buffer) {
    let buf_ptr = SpeexModule._malloc(buffer.length * buffer.BYTES_PER_ELEMENT);
    SpeexModule.HEAPU8.set(buffer, buf_ptr);

    let size = compress(id, buffer.length/2, buf_ptr);         //library expect length as based on sample length and not buffer
    let result = new Uint8Array(SpeexModule.HEAPU8.buffer, buf_ptr, size);
    return result;
}
