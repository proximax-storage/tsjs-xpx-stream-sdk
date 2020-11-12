var _this = this;

let createViewer = null;
let shutdown = null;
let processFirstH264Frame = null;
let processH264Frame = null;
let getH264Width = null;
let getH264Height = null;

let id = 0;
let firstH264FrameSent = false;

let jig = null;
let jig_ptr = null;
let intendedWidth = 0;
let intendedHeight = 0;
let decoderReady  = false;

H264LibModule = {
    onRuntimeInitialized: () => {

        createViewer = Module.cwrap("CreateViewer", "number", null);
        shutdown = H264LibModule.cwrap("Shutdown", null, null);
        processFirstH264Frame = H264LibModule.cwrap("ProcessFirstH264Frame", "number",
            ["number","number", "number","number","number","number","number","number"]);

        processH264Frame = H264LibModule.cwrap("ProcessH264Frame", "number",
            ["number","number", "number","number","number"]);

        getH264Width = H264LibModule.cwrap("GetH264Width", "number", ["number"]);
        getH264Height = H264LibModule.cwrap("GetH264Height", "number", ["number"]);

        decoderReady = true;
        console.log("H264 decoder loaded");

    }
};


_this.importScripts("./H264lib_opencore.js");

onmessage = function(e) {
    if(!decoderReady) return ;

    if(e.data.command == "initialize"){
       initialize();
    }else if(e.data.command == "deInirialize") {
        H264LibModule._free(jig_ptr);
        shutdown();
    }else if(e.data.command == "decode") {
        if(id == 0)
            initialize();

        makeFrame(e.data.buffer, e.data.timestamp, e.data.frametype);
    }
};

function initialize() {
    if(createViewer == null)
        return;

    id = createViewer();

    jig = new Uint8Array(1920 * 1080 * 3);
    jig_ptr = H264LibModule._malloc(jig.length * jig.BYTES_PER_ELEMENT);
}

function makeFrame(buf, timestamp, frameType) {
    let processingFrameType = 0;
    switch(frameType) {
        case 2 :    //FrameType.VIDEO_I:
            break;
        case 1:     //FrameType.VIDEO_IDR:
            processingFrameType = 0; // IDR Frame
            break;
        case 4:     //FrameType.VIDEO_B:
        case 3:     //FrameType.VIDEO_P:
            processingFrameType = 2; // intermediate frame
            break;
        default:
            processingFrameType = 3; // unknown Frame
            console.log("Problem with unknown frame type");
            return;
    }

    let ret = true;

    if(!firstH264FrameSent) {
        // Call this the first time with nullptr for the 3rd parameter.   This simply
        // inspects the packet for its size.  Then proceed to an actual decoded frame...
        // This fills in:  this.intendedWidth and this.intendedHeight properly...
        var width_ptr = H264LibModule._malloc(4);
        var height_ptr = H264LibModule._malloc(4);

        var buf_ptr = H264LibModule._malloc(buf.length * buf.BYTES_PER_ELEMENT);
        H264LibModule.HEAPU8.set(buf, buf_ptr);
        ret = processFirstH264Frame(id, buf_ptr, buf.length, null, 0, width_ptr, height_ptr, 1);

        // Could not read the SPS so could not get the dimensions of the IDR Frame.
        // Severe problem and requires a bugout.
        if (!ret) {
            return false;
        }

        // compute correct size
        intendedWidth = H264LibModule.getValue(width_ptr, "i32"); // extract the result from WASM memory
        intendedHeight = H264LibModule.getValue(height_ptr, "i32"); // extract the result from WASM memory

        ret = processFirstH264Frame(id, buf_ptr, buf.length, jig_ptr, 0, width_ptr, height_ptr, 1);

        H264LibModule._free(width_ptr);
        H264LibModule._free(height_ptr);
        H264LibModule._free(buf_ptr);

        if(ret) {
            firstH264FrameSent = true;
            let ShapeWidth = intendedWidth;
            let ShapeHeight = intendedHeight;

            //TODO:  on size changed trigger event to user side
        }
    }
    else {
        var buf_ptr = H264LibModule._malloc(buf.length * buf.BYTES_PER_ELEMENT);
        H264LibModule.HEAPU8.set(buf, buf_ptr);
        let ret = processH264Frame(id, buf_ptr, buf.length, jig_ptr, 1);
        H264LibModule._free(buf_ptr);

        if(ret && processingFrameType == 0 ) { // *IDR Frame
            let sw = getH264Width(id);
            let sh = getH264Height(id);
            // resolution change detection
            if (sw != intendedWidth || sh != intendedHeight)
            {
                intendedWidth = sw;
                intendedHeight = sh;

                // set this.firstH264FrameSent to false here and do recursive call
                // to reinit decoder with decoderMain->processFirstH264Frame
                firstH264FrameSent = false;

                return makeFrame(buffer, timestamp, frameType);
            }
        }
    }

    if(ret) {
        let imageSize = intendedWidth * intendedHeight * 3 / 2;
        let output = new Uint8Array(H264LibModule.HEAPU8.buffer, jig_ptr, imageSize);

        _this.postMessage({
            command : "image_ready",
            width : intendedWidth,
            height : intendedHeight,
            timestamp : timestamp,
            data : output
        });
    }

    return true;
}
