const {parentPort} = require('worker_threads');
const VideoStream = require('tsjs-xpx-stream-sdk').VideoStream;
const BinaryHelper = require('tsjs-xpx-stream-sdk').BinaryHelper;
const SoundBuff = require('tsjs-xpx-stream-sdk').SoundBuf;

let videoStream = null;
let LayerCount = 3;   //defined but not exposed in Frame.tss

parentPort.onmessage = function(e) {
    if(e.data.command == "initialize") {
        videoStream = new VideoStream();
        videoStream.createViewer(e.data.clientID);
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
            parentPort.postMessage({
                command: "video_ready",
                data : msg
            })
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
            parentPort.postMessage({
                command: "audio_ready",
                data : msg
            })
        };
    }
};
