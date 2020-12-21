/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {ErrorLog, Log} from "../../utils/Logger";
import {bytesToHex, hexToBytes} from "../../utils/Hex";
import {EntryNode, NodePublicIdentity} from "../../client/Discovery";
import {extractHostAndIP} from "../../utils/AddressExtractor";
import {StreamManager} from "../StreamManager";
import {StreamNamespaceId} from "../../defines/SiriusStream";
import {StreamRelayCell} from "../cell/StreamRelayCell";
import {FanoutMessage, FanoutPayload, FanoutReport, FanoutViewersChange, readFanoutPayload} from "../FanoutPayload";
import * as protobuf from "../../../proto/out/video";
import {initializeRatchet, Ratchet} from "../../enc/Megolm";
import {Uint32} from "../../utils/Binary";
import {MediaProtocol} from "../Identifiers";
import {deserializedFrame, Frame, FrameType, serializeFrame} from "../../media/Frame";
import * as c from "crypto";
import {RandomFromNodeType} from "../../utils/NodeExtractor";
import * as names from "../../defines/Names";
import {maxVariableRelayDataLength} from "../ApplicationMessage";
import {Cell} from "../Cell";

/**
 * Object to keep track frame index with date
 */
export class Indexes {
    public Idx : number;
    public Time : Date;
}

/**
 * Parameters of a video image frame
 */
export class VideoStreamParameters {
    public version : number = 1;
    public isCamEnabled : boolean = false;
    public isMicEnabled : boolean = false;
    public width : number = 0;
    public height : number = 0;
    public codecs : Array<string>;

    constructor() {
        this.codecs = new Array<string>();
    }
}

/**
 * constants and size definitions (as defined in C++ SDK)
 */
const maxFanoutSplit = 5;

const minViewersToBroadcast = 1;

const maxFanoutPayloadCellSize =
    maxVariableRelayDataLength - 1/*sizeof(fanout::FanoutMessageType)*/ - 4/*sizeof(uint32_t)*/ -
    1/*sizeof(uint8_t)*/;

const maxDataSize = maxFanoutPayloadCellSize * maxFanoutSplit;

/**
 * callback type definitions
 */
export type OnFrameReceivedCallback = (frame : Frame) => void;
export type OnViewerChangeCallback = (count : number) => void;
export type OnCreateBroadCastSuccess = (token : string) => void;

/**
 * Main object for processing video and audio stream
 */
export class VideoStream {
    private streamManager : StreamManager;
    private broadcaster : boolean;
    private ratchet : Ratchet;

    // for bitrate computation
    private viewerReceived : number;
    private viewerLastKey : Date;
    private lastKeyIndex : Array<Indexes>;

    private numRemainingParts : number;
    private partialPayload : Buffer;
    private receivedKeyVideo : boolean;

    private onVideoFrameReceived : OnFrameReceivedCallback;
    private onAudioFrameReceived : OnFrameReceivedCallback;
    private onViewStreamSuccess : () => void = null;

    private onViewerChange : OnViewerChangeCallback;

    // for streamer/broad casters
    private nodes : Array<NodePublicIdentity>;
    private numViewers : number = 0;
    private videoStreamID : string;
    private params : VideoStreamParameters;

    constructor() {
        this.numRemainingParts = 0;
        this.receivedKeyVideo = false;
    }

    set OnVideoFrameReceived(callback : OnFrameReceivedCallback) {
        this.onVideoFrameReceived = callback;
    }

    set OnAudioFrameReceived(callback : OnFrameReceivedCallback) {
        this.onAudioFrameReceived = callback;
    }

    set OnViewerCountChange(callback : OnViewerChangeCallback) {
        this.onViewerChange = callback;
    }

    set OnViewStreamSuccess(callback : () => void) {
        this.onViewStreamSuccess = callback;
    }

    set Nodes (nodes : Array<NodePublicIdentity>) {
        this.nodes = nodes;
    }

    /**
     * creates and set this object as a viewer of a stream as described by the token input
     * tokens are parsed into address and streamer identification
     */
    createViewer(token : string) {
        this.broadcaster = false;

        let params = token.split("/");
        if(params.length != 4) {
            ErrorLog("stream token is invalid");
            return;
        }

        let cookie = hexToBytes(params[3]);
        if(params[2].length != 64 || cookie.length != 32) {
            ErrorLog("token content is invalid");
            return;
        }

        let hostIP =  extractHostAndIP(params[1]);
        let entry = new EntryNode(hostIP.host, hostIP.port, params[2]);

        const context = this;
        this.streamManager = new StreamManager();
        this.streamManager.connect(entry, StreamNamespaceId.MediaStreamingProtocol, Buffer.from(cookie), MediaProtocol.Join);
        this.streamManager.OnRelayResult = (rc : StreamRelayCell) => context.onStreamRelay(rc);
        this.streamManager.OnStreamCreated = () => {
            context.setup();

            if(context.onViewStreamSuccess)
                context.onViewStreamSuccess();
        };
    }

    /**
     * creates and set this object as a streamer
     * register a cookie and finger print to nodes thru stream channel
     */
    createBroadcastStream(params : VideoStreamParameters, onSuccess : OnCreateBroadCastSuccess) {
        this.broadcaster = true;

        this.params = params;
        let random = c.randomBytes(32); // Sha256::digestLength
        let cookie = c.createHash('sha256').update(random).digest();

        if(this.nodes.length == 0){
            ErrorLog("Unable to create broadcast stream, nodes list is not set");
            return;
        }

        let node = RandomFromNodeType(this.nodes, names.TypeOnionNode);
        var hostIP = extractHostAndIP(node.OnionAddress[0]);

        let fingerPrint = bytesToHex(node.Fingerprint);
        let entry = new EntryNode(hostIP.host, hostIP.port, fingerPrint);

        const context = this;
        this.streamManager = new StreamManager();
        this.streamManager.connect(entry, StreamNamespaceId.MediaStreamingProtocol, Buffer.from(cookie), MediaProtocol.Register);
        this.streamManager.OnRelayResult = (rc : StreamRelayCell) => context.onStreamRelay(rc);
        this.streamManager.OnStreamCreated = () => {
            context.videoStreamID = "token/"+node.OnionAddress[0] + "/" +
                fingerPrint + "/" + bytesToHex(cookie);

            Log("Started broadcasting to " + context.videoStreamID);

            context.setup();

            context.updateVideoParameters(true, context.params);

            if(onSuccess)
                onSuccess(context.videoStreamID);
        };
    }

    shutdown() {
        if(this.streamManager)
            this.streamManager.shutdown();
    }

    /**
     * setup initial and common parameters
     */
    setup() {
        this.lastKeyIndex = new Array<Indexes>();
        this.viewerLastKey = new Date();
        this.viewerReceived = 0;
    }

    /**
     * sends updated video parameters to nodes for viewers to sync
     */
    updateVideoParameters(isFirstCall : boolean, params : VideoStreamParameters) {
        let sequenceID = 0;

        if(isFirstCall) {
            this.ratchet = new Ratchet();
        }
        else {
            this.ratchet.advance();
            sequenceID = this.ratchet.Counter;
        }

        let protoPararms = new protobuf.protocol.VideoStreamParameters();
        protoPararms.version = params.version;
        protoPararms.isCamEnabled = params.isCamEnabled;
        protoPararms.isMicEnabled = params.isMicEnabled;
        protoPararms.width = params.width;
        protoPararms.height = params.height;

        for(let i = 0; i < params.codecs.length; i++) {
            protoPararms.codecs.push(params.codecs[i]);
        }

        protoPararms.ratchet = new Uint8Array(this.ratchet.data());
        let protoBuf = protoPararms.serialize();

        let fanout = new FanoutPayload();
        fanout.MessageType = FanoutMessage.StreamParameters;
        fanout.SequenceID = sequenceID;
        fanout.RemainingParts = 0;
        fanout.Data = Buffer.from(protoBuf);
        let fanoutbuf = fanout.serialize();

        let src = new StreamRelayCell(this.streamManager.StreamID, fanoutbuf);
        this.streamManager.send(src.createCell());
    }

    /**
     * callback result when stream relay message is available to stream channel
     * this is the main entry point for stream data processing.
     */
    onStreamRelay(rc : StreamRelayCell) {

        const fanout = readFanoutPayload(rc);

        switch(fanout.MessageType) {
            case FanoutMessage.StreamParameters:
                if(this.broadcaster)
                    return;

                let msg = protobuf.protocol.VideoStreamParameters.deserialize(fanout.Data);
                if(msg == null) {
                    Log("Unable to deserialized Fanout Payload Stream Parameters");
                    return;
                }

                this.ratchet = initializeRatchet(Buffer.from(msg.ratchet));
                if( this.ratchet == null)
                    Log("Unable to parse incoming ratchet parameters");

                break;

            case FanoutMessage.Report:
                if(!this.broadcaster)
                    return;

                if( fanout.Data.length != 8) {
                    Log("invalid payload in FanoutMessage report");
                    return;
                }

                let report = new FanoutReport();
                report.LastKnownSequenceID = Uint32(fanout.Data);
                report.BytesReceived = Uint32(fanout.Data.slice(4));

               this.onReport(report);

            case FanoutMessage.KeyVideo:
                this.onKeyVideo(fanout);
                break;

            case FanoutMessage.IntermediateVideo:
                this.onIntermediateVideo(fanout);
                break;

            case FanoutMessage.ViewersChanged:
                if(!this.broadcaster)
                    return;

                if( fanout.Data.length != 4) {
                    Log("invalid payload in FanoutMessage.ViewersChanged");
                    return;
                }

                let fanoutView = new FanoutViewersChange();
                fanoutView.Viewers = Uint32(fanout.Data);
                this.numViewers = fanoutView.Viewers;

                if(this.onViewerChange)
                    this.onViewerChange(this.numViewers);

                Log("We have "+ fanoutView.Viewers + " viewers now");

                break;
            case FanoutMessage.Audio:
                this.onAudio(fanout);
                break;
        }
    }

    /**
     * append partial buffer to a cached payload, used when payload are large
     */
    appendToPartialPayload( data : Buffer) {
        if(this.partialPayload == null)
            this.partialPayload = data.slice(0);
        else
            this.partialPayload = Buffer.concat([this.partialPayload, data]);
    }

    /**
     * key video data is available
     */
    onKeyVideo(fanout : FanoutPayload) {

        if( this.broadcaster)
            return;

        let decrypted = this.ratchet.decrypt(fanout.SequenceID,
            fanout.Data.slice(0, 8), fanout.Data.slice(8));

        if(!decrypted) return;

        decrypted.copy(fanout.Data,8);

        if(fanout.RemainingParts >= maxFanoutSplit) {
            throw("Message has too many parts to split");
        }

        else if(fanout.RemainingParts == 0) {
            if(this.numRemainingParts != 0) {
                this.numRemainingParts = 0;
                throw("Message contains wrong number of segments.");
            }

            let videoFrame = new Frame();
            if(this.partialPayload == null) {
                videoFrame = deserializedFrame(decrypted)
            }
            else{
                this.appendToPartialPayload(decrypted);
                videoFrame = deserializedFrame(this.partialPayload);
            }

            if( this.onVideoFrameReceived)
                this.onVideoFrameReceived(videoFrame);

            this.partialPayload = null;
            this.receivedKeyVideo = true;
        }
        else {
            if(fanout.IsFirst) {
                // first payload of split fanout, save number of chunks we expect
                this.numRemainingParts = fanout.RemainingParts;
            }
            else if(fanout.RemainingParts != this.numRemainingParts) {
               // Reset
                this.numRemainingParts = 0;
                throw("Message contains an invalid segment. Remaining Parts "
                    + fanout.RemainingParts + " Expected " + this.numRemainingParts);
            }

            this.appendToPartialPayload(decrypted);

            // Prepare for next chunk
            this.numRemainingParts -= 1;
        }
    }

    /**
     * intermediate video data is available
     */
    onIntermediateVideo(fanout : FanoutPayload) {
        if( this.broadcaster)
            return;

        if(this.receivedKeyVideo) {
            let decrypted = this.ratchet.decrypt(fanout.SequenceID,
                fanout.Data.slice(0, 8), fanout.Data.slice(8));

            if(!decrypted) return;

            decrypted.copy(fanout.Data,8);

            if(fanout.RemainingParts >= maxFanoutSplit) {
                throw("Message has too many parts to split in intermediate video ");
            }

            else if(fanout.RemainingParts == 0) {
                if(this.numRemainingParts != 0) {
                    this.numRemainingParts = 0;
                    throw("Message contains wrong number of segments.");
                }

                let videoFrame = new Frame();
                if(this.partialPayload == null) {
                    videoFrame = deserializedFrame(decrypted)
                }
                else{
                    this.appendToPartialPayload(decrypted);
                    videoFrame = deserializedFrame(this.partialPayload);
                }

                if( this.onVideoFrameReceived)
                    this.onVideoFrameReceived(videoFrame);

                this.partialPayload = null;
            }
            else {
                if(fanout.IsFirst) {
                    // first payload of split fanout, save number of chunks we expect
                    this.numRemainingParts = fanout.RemainingParts;
                }
                else if(fanout.RemainingParts != this.numRemainingParts) {
                    // Reset
                    this.numRemainingParts = 0;
                    throw("Message contains an invalid segment. Remaining Parts "
                        + fanout.RemainingParts + " Expected " + this.numRemainingParts);
                }

                this.appendToPartialPayload(decrypted);
            }
        }
    }

    /**
     * nodes reporting information of video and audio stats sent
     */
    onReport(report : FanoutReport) {
        let id = new Indexes();
        let found = false;
        while(this.lastKeyIndex.length != 0) {

            id = this.lastKeyIndex[0];
            this.lastKeyIndex = this.lastKeyIndex.slice(1);
            if(id.Idx == report.LastKnownSequenceID) {
                found = true;
                break;
            }
        }

        if(!found)
            Log("Server reporting back received "+report.BytesReceived+" bytes, last key ID " + report.LastKnownSequenceID);
        else {
            let now = Date();
            let time = (Date.now() - id.Time.getTime());
            Log("Server reporting back received " + report.BytesReceived + " bytes,round-trip latency is %" +time+" msec ");
        }
    }

    /**
     * audio data is available
     */
    onAudio(fanout : FanoutPayload) {
        if(this.broadcaster)
            return;

        let decrypted = this.ratchet.decrypt(fanout.SequenceID,
            fanout.Data.slice(0, 8), fanout.Data.slice(8));

        if(!decrypted) return;

        decrypted.copy(fanout.Data,8);

        if(fanout.RemainingParts >= maxFanoutSplit) {
            throw("Message has too many parts to split");
        }
        else if(fanout.RemainingParts == 0) {
            if(this.numRemainingParts != 0) {
                this.numRemainingParts = 0;
                throw("Message contains wrong number of segments.");
            }

            let audioFrame = new Frame();
            if(this.partialPayload == null) {
                audioFrame = deserializedFrame(decrypted)
            }
            else{
                this.appendToPartialPayload(decrypted);
                audioFrame = deserializedFrame(this.partialPayload);
            }

            if( this.onAudioFrameReceived)
                this.onAudioFrameReceived(audioFrame);

        }
        else {
            if(fanout.IsFirst) {
                // first payload of split fanout, save number of chunks we expect
                this.numRemainingParts = fanout.RemainingParts;
            }
            else if(fanout.RemainingParts != this.numRemainingParts) {
                // Reset
                this.numRemainingParts = 0;
                throw("Message contains an invalid segment. Remaining Parts "
                    + fanout.RemainingParts + " Expected " + this.numRemainingParts);
            }

            this.appendToPartialPayload(decrypted);

        }
    }

    /**
     * sends an encoded video frame to stream channel
     */
    sendVideoFrame(frame : Frame) {
        if(this.numViewers < minViewersToBroadcast) {
            Log("No viewers on this broadcast, not sending frame");
            return;
        }

        this.ratchet.advance();
        let sequenceID = this.ratchet.Counter;

        let data = serializeFrame(frame);
        let messageType = FanoutMessage.IntermediateVideo;

        if(frame.FrameType == FrameType.VIDEO_IDR) {
            // Send key frame
            messageType = FanoutMessage.KeyVideo;
        }

        let fpCells = this.createFanoutPayloadCells(messageType, sequenceID, data);
        this.streamManager.sendList(fpCells);

    }

    /**
     * sends an encoded audio frame to stream channel
     */
    sendAudioFrame(frame : Frame) {
        if(this.numViewers < minViewersToBroadcast) {
            Log("No viewers on this broadcast, not sending audio frame");
            return;
        }

        this.ratchet.advance();
        let sequenceID = this.ratchet.Counter;

        let data = serializeFrame(frame);
        let messageType = FanoutMessage.Audio;

        let fpCells = this.createFanoutPayloadCells(messageType, sequenceID, data);
        this.streamManager.sendList(fpCells);
    }

    /**
     * breaks down frame to multiple payload cells for sending
     */
    createFanoutPayloadCells(messageType : number, sequenceID : number, data : Uint8Array) : Array<Cell>{
        if(data.length > maxDataSize) {
            throw("Message too large to be split across multiple cells. Size "+ data.length + " Max size "+ maxDataSize);
        }

        let ciphertext = data.slice(0);
        let encrypted = this.ratchet.encrypt(ciphertext);

        let hmacRaw = encrypted.hmac;
        ciphertext = encrypted.encrypted;

        let hmac = hmacRaw.slice(0, 8);
        let ciphertextWithHmac = new Uint8Array(hmac.length + ciphertext.length);

        ciphertextWithHmac.set(hmac);
        ciphertextWithHmac.set(ciphertext, hmac.length);

        let payload = ciphertextWithHmac.slice(0);

        let fpCells = new Array<Cell>();
        if(payload.length > 0) {
            let numParts = Math.floor(1 + (payload.length -1) / maxFanoutPayloadCellSize);

            if(numParts > maxFanoutSplit) {
                Log("Message too large to be split across multiple cells");
            }

            for(let index = 0; index < numParts; ++index) {
                let startIndex = maxFanoutPayloadCellSize  * index;
                let endIndex = (payload.length) - startIndex;
                let min = (maxFanoutPayloadCellSize > endIndex) ? endIndex : maxFanoutPayloadCellSize;

                let fpPayLoadData = payload.slice(startIndex, min);
                let numPartsRemaining = numParts - index - 1;
                if( (index == 0) && numPartsRemaining > 0) {
                    numPartsRemaining |= 0x80;
                }

                let fanOutPayload = new FanoutPayload();

                fanOutPayload.SequenceID = sequenceID;
                fanOutPayload.RemainingParts = numPartsRemaining;
                fanOutPayload.Data = Buffer.from(fpPayLoadData);
                fanOutPayload.MessageType = messageType;

                let buffer = fanOutPayload.serialize();
                let src = new StreamRelayCell(this.streamManager.StreamID, buffer);
                fpCells.push(src.createCell());
            }
        }

        return fpCells;
    }
}