/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {NodePublicIdentity} from "../../client/Discovery";
const crypto = require('crypto');
import * as curve from "../../3rd-party/curve25519-js"
import {Curve25519KeySize, Curve25519SeedSize} from "../../defines/Crypto";
import {ClientCreateHandshakeData, CreateCell} from "../cell/CreateCell";
import * as identifiers from "../Identifiers";
import {BuildAndSend, Cell, NewFixedCell} from "../Cell";
import {CellSender} from "../CellSender";
import {Dispatcher} from "../Dispatcher";
import {CreatedCell} from "../cell/CreatedCell";
import {ClientHandshake, createHandshakeAuth, Public} from "../CreateHandshake";
import {OnionHop} from "./OnionHop";
import {buildCircuitKeys, circuitKeySize, newCircuitCryptoState} from "./CircuitCrypto";
import hkdf = require("futoin-hkdf");
import {bytesToHex, stringToAsciiByteArray} from "../../utils/Hex";
import {HandshakeExpand, HandshakeKey} from "../../defines/Onion";
import {extractHostAndIP} from "../../utils/AddressExtractor";
import {LinkSpec, LinkSpecType, newLinkSpecHostname, newLinkSpecIdentity} from "../LinkSpec";
import * as binary from "../../utils/Binary";
import {int16, int32} from "../../utils/typeCaster";
import {HandshakeTypeDefault, RelayCommandType} from "../Identifiers";
import {ExtendPayload} from "../Extend";
import {newRelayCell, newRelayCellFromBytes, RelayCell, RelayCommand} from "../cell/RelayCell";
import * as cmd from "../Command";
import * as defines from "../Identifiers";
import {Log} from "../../utils/Logger";
import {isArraySame} from "../../utils/CommonHelpers";
import {ApplicationMessageProcessor} from "../ApplicationMessage";
import {MessageId, unmarshal} from "../../utils/ProtoMapping";
import {Uint16} from "../../utils/Binary";

export type OnCircuitEvent = () => void;
export type OnEscapeEvent = (message) => void;
export type OnRelayCallbaack = (rc : RelayCell) => void;
export type OnEncodedData = (payload : Buffer) => void;

export class Circuit {
    private circuitId : number;
    private sender : CellSender;
    private dispatcher : Dispatcher;
    private hops : Array<OnionHop>;
    private onCircuitCreated : OnCircuitEvent;
    private onCircuitExtended : OnCircuitEvent;
    private messageProcessor : ApplicationMessageProcessor;

    // cached data : current state
    private endPoint : NodePublicIdentity;
    private clientKeyPair;

    private moduleName : string;
    private onEscapeMessage : Map <MessageId, OnEscapeEvent>;
    private onRelay : Map<RelayCommand, OnRelayCallbaack>;
    public OnEncodedData : OnEncodedData;

    constructor(id : number, sender : CellSender, dispatcher : Dispatcher) {
        this.sender = sender;
        this.dispatcher = dispatcher;
        this.circuitId = id;
        this.hops = new Array<OnionHop>();
        this.moduleName = "Circuit" + id;

        this.messageProcessor = new ApplicationMessageProcessor();
        this.onEscapeMessage = new Map<MessageId, OnEscapeEvent>();
        this.onRelay = new Map<RelayCommand, OnRelayCallbaack>();
    }

    create(firstEndpoint : NodePublicIdentity){

        const clientKeyPair = curve.generateKeyPair(crypto.randomBytes(Curve25519SeedSize));

        this.endPoint = firstEndpoint;
        this.clientKeyPair = clientKeyPair;

        let hData = new ClientCreateHandshakeData(firstEndpoint.Fingerprint,
            firstEndpoint.HandshakeKey, Buffer.from(clientKeyPair.public));

        let create = new CreateCell(this.circuitId, identifiers.HandshakeTypeDefault);
        create.HandshakeData = hData.Payload;

        BuildAndSend(this.sender, create);

        this.registerEvents();
    }

    registerEvents() {
        var context = this;
        this.dispatcher.addEventHandler(identifiers.Command.Created, (cc) =>{
            if(cc.error) {
                console.log("Error in Created Cell " + cc.error);
                return;
            }

            context.handleCreated(cc.cell as CreatedCell);
        }, this.moduleName);

        this.dispatcher.addEventHandler(identifiers.Command.Relay, (pr) =>{
            // cast to proper type
            var cell = pr.cell as Cell;

            //decrypt and rewind
            let payload = context.decryptAndRewind(cell.payLoad());

            // handle relay
            let rc = newRelayCellFromBytes(payload);

            if(rc.recognized()!= 0) {
                let lasthop = this.hops[this.hops.length-1];
                let digest = lasthop.backState.digest();
                if(digest != rc.getDigest()) {
                    if(this.OnEncodedData)
                        this.OnEncodedData(payload);
                }
            }
            if(rc)
                context.handleRelay(rc);

        }, this.moduleName);
    }

    set OnCircuitCreated (callback : OnCircuitEvent) {
        this.onCircuitCreated = callback;
    }

    set OnCircuitExtended(callback : OnCircuitEvent) {
        this.onCircuitExtended = callback;
    }

    handleCircuitBuildResponse(handshakeData : Buffer) {
        let KY = handshakeData.slice(0, Curve25519KeySize);

        let pub = new Public();
        pub.ID = this.endPoint.Fingerprint;
        pub.KX = this.clientKeyPair.public;
        pub.KY = KY;
        pub.KB = this.endPoint.HandshakeKey;

        let h = new ClientHandshake(pub, this.clientKeyPair.private);

        let auth = createHandshakeAuth(h);

        let temp = handshakeData.slice(Curve25519KeySize);

        if(!isArraySame(auth, temp))
            throw("auth response is not valid");

        var salt = stringToAsciiByteArray(HandshakeKey);
        var info = stringToAsciiByteArray(HandshakeExpand);
        var d = hkdf(Buffer.from(h.secretInput()), circuitKeySize,
            {salt:Buffer.from(salt), info: Buffer.from(info),hash: "SHA-256"});

        let hop = new OnionHop();
        hop.circuitKeys = buildCircuitKeys(d);
        hop.fwState = newCircuitCryptoState(hop.circuitKeys.Df, hop.circuitKeys.Kf);
        hop.backState = newCircuitCryptoState(hop.circuitKeys.Db, hop.circuitKeys.Kb);

        this.hops.push(hop);

    }

    handleCreated(cdCell : CreatedCell) {
        this.handleCircuitBuildResponse(cdCell.handshakeData);
        if(this.onCircuitCreated) {
            this.onCircuitCreated();
        }
    }

    extend(newEndPoint : NodePublicIdentity) {
        var host = extractHostAndIP(newEndPoint.OnionAddress[0]);
        let linkSpecs = new Array<LinkSpec>();
        linkSpecs.push(newLinkSpecHostname(host.host, host.port));

        this.extendLinkSpec(linkSpecs, newEndPoint);
    }

    extendLinkSpec(linkSpecs : Array<LinkSpec>, newEndPoint : NodePublicIdentity) {

        let naddr = newEndPoint.OnionAddress[0];
        Log("Extending circuit to the node " + naddr);

        if(this.hops.length == 0)
            throw("Missing First Hop, cannot Extend circuit");

        let lastHop = this.hops[this.hops.length-1];
        let lastHopNo = this.hops.length-1;

        // for debugging
        const clientKeyPair = curve.generateKeyPair(crypto.randomBytes(Curve25519SeedSize));
        let nData = new ClientCreateHandshakeData(newEndPoint.Fingerprint,
            newEndPoint.HandshakeKey, Buffer.from(clientKeyPair.public));

        // cache information
        this.endPoint = newEndPoint;
        this.clientKeyPair = clientKeyPair;

        let handShakeData = nData.Payload;
        let payload = Buffer.alloc(4 + handShakeData.length);
        binary.PutUint16(payload, int16(HandshakeTypeDefault));
        binary.PutUint16(payload, int16(handShakeData.length), 2);
        handShakeData.copy(payload, 4);

        let epay = new ExtendPayload();
        epay.HandshakeData = payload;
        epay.LinkSpecs = new Array<LinkSpec>();
        epay.LinkSpecs.push(newLinkSpecIdentity(LinkSpecType.identity, newEndPoint.Fingerprint));
        for(let i = 0; i < linkSpecs.length; i++)
            epay.LinkSpecs.push(linkSpecs[i]);

        let epl = epay.marshal();
        let cell = NewFixedCell(this.circuitId, identifiers.Command.Relay);
        let extended = newRelayCell(RelayCommandType.RelayExtend, epl);

        var offset = cmd.PayloadOffset(defines.Command.Relay);
        let cellPayload = cell.getData().slice(offset);
        extended.getData().copy(cellPayload);
        cellPayload = lastHop.fwState.encryptOrigin(cellPayload);
        cell.setPayLoad(cellPayload, identifiers.Command.Relay);

        if(lastHopNo > 0) {
            for(let idx = lastHopNo-1; idx >= 0 ; idx--) {
                cellPayload = this.hops[idx].fwState.encrypt(cellPayload);
                cell.setPayLoad(cellPayload, identifiers.Command.Relay);
            }
        }

        // next send cell
        this.sender.send(cell);
    }

    decryptForRendezvous(payload : Buffer) : Buffer {
        for (let idx = 0; idx < this.hops.length; idx++) {
            payload = this.hops[idx].backState.decrypt(payload);
            let r = newRelayCellFromBytes(payload);
            if(r.recognized() !=0 ) {
                this.hops[idx].backState.rewindDigest();
            }
        }

        return payload;
    }

    decryptAndRewind(payload : Buffer) : Buffer {
        let lastHopNo = this.hops.length-1;
        for(let idx = 0; idx < this.hops.length; idx++) {
            payload = this.hops[idx].backState.decrypt(payload);
            if (idx != lastHopNo) {
                this.hops[idx].backState.rewindDigest();
            }
        }
        return payload;
    }

    handleRelay(rc : RelayCell) {
        let relayCmd = rc.getRelayCommand();

        switch(relayCmd) {
            case identifiers.RelayCommandType.RelayExtended: {
                this.handleExtended(rc);
                break;
            }
            case identifiers.RelayCommandType.RelayEscape: {
                this.handleEscape(rc);
                break;
            }
            default:
                const callback = this.onRelay.get(relayCmd);
                if(callback) callback(rc);
                break;
        }
    }

    handleEscape(rc : RelayCell) {
        let payload = this.messageProcessor.receive(rc);
        if(payload == null || payload.length == 0) {
            Log("Escape message reply did not recieve a full message");
            return;
        }

        let msgId = Uint16(payload);
        let msg = unmarshal(payload);

        if (msg == null) {
            Log("Unable to deserialize escape message");
            return;
        }

        const callback = this.onEscapeMessage.get(msgId);
        if(callback) {
            callback(msg);
        }
    }

    handleExtended(rc : RelayCell) {
        if(rc == null)
            return;

        if(rc.recognized() != 0) {
            throw ("unable to recognize the cell");
        }

        let lastHop = this.hops[this.hops.length-1];
        let digest = lastHop.backState.digest();
        if(digest != rc.getDigest()) {
            throw ("unable to read the cell");
        }

        let createdPayload = rc.relayData();
        if(createdPayload == null) {
            throw ( "unable to parse relay cell");
        }

        let createdPayloadLen = createdPayload.length;
        if(createdPayloadLen < 2) {
            throw ("cell is too short");
        }

        let hlen = binary.Uint16(createdPayload);
        if (createdPayloadLen < int32(2+hlen)) {
            throw ("cell is too short");
        }

        let handshakeDataCreated = createdPayload.slice(2, 2+hlen);
        this.handleCircuitBuildResponse(handshakeDataCreated);

        Log("Extended Circuit to hop :" + bytesToHex(this.endPoint.Fingerprint));

        if(this.onCircuitExtended)
            this.onCircuitExtended();
    }

    cleanup() {
        this.dispatcher.removeHandlersById(this.moduleName);
    }

    escape(data : Buffer) {
        if(this.hops.length == 0) {
            throw("No Hops on a circuit");
        }

        let lastHop = this.hops[this.hops.length-1];
        let msgs = this.messageProcessor.buildSRelayOutput(data);

        for(let i = 0; i < msgs.length; i++) {
            var cell = msgs[i];
            cell.setCircID(this.circuitId);
            let payload = lastHop.fwState.encryptOrigin(cell.payLoad());
            cell.setPayLoad(payload);

            if(this.hops.length > 1) {
                for(let idx = this.hops.length -2; idx >= 0; idx--) {
                    payload = this.hops[idx].fwState.encrypt(payload);
                    cell.setPayLoad(payload);
                }
            }

            this.sender.send(cell);
        }
    }

    sendCell(cell : Cell) {
        let lastHop = this.hops[this.hops.length-1];
        cell.setCircID(this.circuitId);
        let payload = lastHop.fwState.encryptOrigin(cell.payLoad());
        cell.setPayLoad(payload);
        if(this.hops.length > 1) {
            for(let idx = this.hops.length -2; idx >= 0; idx--) {
                payload = this.hops[idx].fwState.encrypt(payload);
                cell.setPayLoad(payload);
            }
        }

        this.sender.send(cell);
    }

    sendCellToRendezvousCircuit(cell : Cell) : boolean {
        if(this.hops.length == 0) {
            Log("No hops on the circuit, unable to sendd");
            return false;
        }

        cell.setCircID(this.circuitId);
        let payload = cell.payLoad();
        for(let idx = this.hops.length - 1; idx >= 0; idx--) {
            payload = this.hops[idx].fwState.encrypt(payload);
            cell.setPayLoad(payload);
        }

        this.sender.send(cell);
        return true;
    }

    setEscapeEvent(msgId : MessageId, handler : OnEscapeEvent) {
        this.onEscapeMessage.set(msgId, handler);
    }

    setRelayEvent(cmd : RelayCommand, handler : OnRelayCallbaack) {
        this.onRelay.set(cmd, handler);
    }

    get Dispatcher() {
        return this.dispatcher;
    }

    get CircuitId() {
        return this.circuitId;
    }
}