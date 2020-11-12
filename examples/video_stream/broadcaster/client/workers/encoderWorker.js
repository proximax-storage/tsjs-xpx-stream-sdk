
var _this = this;

let id = 0;
let width = 640;
let height = 360;
let bitrate = 600;

// Iframe controls
let IFrameInterval = 60;

// Every "IDR_Interval"th Iframe will contain the picture def data
let IDR_Interval = 1;

let CreateEncoder  = null;
let InitializeEncoder  = null;
let EncoderProcessFrame  = null;
let DestroyEncoder  = null;
let Shutdown  = null;
let GetFrameNumber  = null;
let SetFrameNumber  = null;
let SetDimsFromBitmapSize  = null;
let InitEncoder  = null;
let EncoderProcessFrameRGB  = null;

let SetHighBandwidthRateControls  = null;
let SetMotionEstimatorHighQuality  = null;
let SetFrameRate  = null;
let SetIFrameInterval  = null;
let SetIDR_Interval  = null;
let ForceIDRFrame  = null;
let SetKeyQuant  = null;

Module = {
    onRuntimeInitialized: () => {
        CreateEncoder = Module.cwrap("CreateEncoder", "number", null);

        InitializeEncoder =  Module.cwrap("InitializeEncoder", "number",
            ["number", "number", "number", "number", "number"]);

        EncoderProcessFrame = Module.cwrap("EncoderProcessFrame", "number",
            ["number", "number", "number", "number"]);

        DestroyEncoder = Module.cwrap("DestroyEncoder", null, ["number"]);

        Shutdown = Module.cwrap("Shutdown", null, null);

        GetFrameNumber = Module.cwrap("GetFrameNumber", "number", ["number"]);

        SetFrameNumber = Module.cwrap("SetFrameNumber", null, ["number", "number"]);

        SetDimsFromBitmapSize = Module.cwrap("SetDimsFromBitmapSize", null, ["number", "number", "number"]);

        InitEncoder = Module.cwrap("InitEncoder", "number", ["number"]);

        EncoderProcessFrameRGB = Module.cwrap("EncoderProcessFrameRGB", "number",
            ["number", "number", "number", "number"]);

        SetHighBandwidthRateControls = Module.cwrap("SetHighBandwidthRateControls", null, ["number", "number"]);

        SetMotionEstimatorHighQuality = Module.cwrap("SetMotionEstimatorHighQuality",  null, ["number", "number"]);

        SetFrameRate = Module.cwrap("SetFrameRate", null, ["number", "number"]);

        SetIFrameInterval = Module.cwrap("SetIFrameInterval", null, ["number", "number"]);

        SetIDR_Interval = Module.cwrap("SetIDR_Interval", null, ["number", "number"]);

        ForceIDRFrame = Module.cwrap("ForceIDRFrame", null, ["number"]);

        SetKeyQuant = Module.cwrap("SetKeyQuant", null, ["number", "number"]);

        console.log("x264 assembly loaded");

    }
};

_this.importScripts("./libx264_webasm.js");
_this.importScripts("./serializer.js");

onmessage = function(e) {
    if(e.data.command == "initialize") {
        id = CreateEncoder();

        SetDimsFromBitmapSize(id, width, height);
        SetFrameRate(id, 30);
        SetHighBandwidthRateControls(id, 1);
        SetMotionEstimatorHighQuality(id, 1);
        SetKeyQuant(id, 16)
        SetIFrameInterval(id, IFrameInterval);
        SetIDR_Interval(id, IDR_Interval);

        InitializeEncoder(id, width, height, bitrate, 30);

    }
    else if(e.data.command == "encode" && id != 0) {
        let yuv420p = rgba2yuv420p(e.data.image, e.data.width, e.data.height);
        let result = processFrame(id, yuv420p);

        let length = 1 + 1 + 8;
        let cmd = new Uint8Array(length);
        cmd[0] = 1;   // type 1: video
        cmd[1] = result.type;
        PutUint64(cmd, e.data.ts, 2);

        let b = new Uint8Array(cmd.length + result.out.length);
        b.set(cmd);
        b.set(result.out, cmd.length);

        _this.postMessage({
            buffer : b
        });
    }
};

function rgba2yuv420p(rgba, width, height) {
    let i = 0;
    let numpixels = width * height;
    let ui = numpixels;
    let vi = numpixels + numpixels / 4;
    let s = 0;
    let colors = 4;

    let yuv420p = new Uint8Array(numpixels * 3 / 2);

    for (let j = 0; j < height; j++) {
        for (let k = 0; k < width; k++) {
            let R = rgba[s + 0];
            let G = rgba[s + 1];
            let B = rgba[s + 2];

            // formula here https://stackoverflow.com/questions/14018666/converting-rgb-image-to-yuv-using-c-programming
            // also used in C++ sdk
            let Y = (((66*R + 129*G + 25*B + 128) >> 8) + 16) & 0xFF;
            let U = (( (-38*R - 74*G + 112*B + 128) >> 8) + 128) & 0xFF;
            let V =  (( (112*R - 94*G - 18*B + 128) >> 8) + 128) & 0xFF;

            yuv420p[i] = Y;

            if (0 == j % 2 && 0 == k % 2) {
                yuv420p[ui++] = U;
                yuv420p[vi++] = V;
            }
            i++;
            s += colors;
        }
    }

    return yuv420p;
}

function processFrame(id, rgbImage) {

    var type_ptr = Module._malloc(4);
    var buf_ptr = Module._malloc(rgbImage.length * rgbImage.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(rgbImage, buf_ptr);

    let out = new Uint8Array(500000);
    var out_ptr = Module._malloc(out.length * out.BYTES_PER_ELEMENT);

    let sizeReturn  = EncoderProcessFrame(id, buf_ptr, out_ptr, type_ptr);
    var output_array = new Uint8Array(Module.HEAPU8.buffer, out_ptr, sizeReturn);
    let result = output_array.slice(0);

    // get the type
    var type = Module.getValue(type_ptr, "i32");

    Module._free(type_ptr);
    Module._free(out_ptr);
    Module._free(buf_ptr);

    return {
        out : result,
        type : type
    };
}
