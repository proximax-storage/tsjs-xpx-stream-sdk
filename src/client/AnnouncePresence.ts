/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {NodePublicIdentity} from "./Discovery";
import {SignedEd25519KeyPair} from "../cert/KeyPair";
import {CircuitBuilder} from "../routing/circuit/CircuitBuilder";
import {ExtractRandomNodesWithType} from "../utils/NodeExtractor";
import * as names from "../defines/Names";
import {Circuit} from "../routing/circuit/Circuit";
import * as client from "../../proto/out/client";
import {Curve25519SeedSize} from "../defines/Crypto";
import * as curve from "../3rd-party/curve25519-js";
import {AnnouncementResultMessage, ForwardPresenceRequestMessage, marshal} from "../utils/ProtoMapping";
import {newSignedMessage, unmarshalSignedMessage} from "../cert/Mesage";
import {ErrorLog, Log} from "../utils/Logger";
import {NewRvCircuitPresence, RvCircuitPresence} from "./RvCircuitPresence";
import {Curve25519KeyPair} from "../enc/Curve25519";
import {newEncryptedInfoPayload} from "./RvEncryptedInfo";
import {OnChannelCreated, Rendezvous} from "./Rendezvous";
import {HSHashSize} from "./RvHandshake";
const crypto = require('crypto');

/**
 * Callback types definition
 * OnAnnouncePresenceCallback : callback when presence succesfully announced passing user's token
 */
type OnAnnouncePresenceCallback = (string) => void;

/**
 * Class for announcing presence the the network (login)
 */
export class AnnouncePresence {
    private circuitBuilder : CircuitBuilder;
    private nodes : Array<NodePublicIdentity>;
    private userData : SignedEd25519KeyPair;
    private routes : Array<NodePublicIdentity>;
    private onAnnouncePresenceSucceed : OnAnnouncePresenceCallback;
    private presenceKey : Curve25519KeyPair;

    private parser : RvCircuitPresence;
    private circuit : Circuit;
    public updating : boolean;

    private userIdentity : string;

    private onInvitedToChannel : OnChannelCreated;
    private readonly config : any = null;
    private rvCircuit : Rendezvous = null;
    private context : any = null;
    private updatePinger : any = null;
    private announced : boolean = false;

    constructor(config : any) {
        this.updating = false;
        this.config = config;
        this.context = this;
    }

    set OnInvitedToChannel(callback : OnChannelCreated) {
        this.onInvitedToChannel  = callback;
    }

    loginUser(userData : SignedEd25519KeyPair) {
        if (!this.config)
            throw("Config not set in Announce Presence");

        var context = this;

        // build random random nodes from hop count in config
        this.routes = ExtractRandomNodesWithType(this.nodes, names.TypeOnionNode, this.config.hops.announcePresence);

        let presenceKey = curve.generateKeyPair(crypto.randomBytes(Curve25519SeedSize));
        this.presenceKey = new Curve25519KeyPair(Buffer.from(presenceKey.private),
            Buffer.from(presenceKey.public));

        if(this.circuitBuilder)
            this.circuitBuilder.shutdown();

        this.circuitBuilder = new CircuitBuilder();
        this.circuitBuilder.build(this.routes);
        this.circuitBuilder.OnCircuitReady = (circuit: Circuit) => {
            context.circuit = circuit;
            context.announce();
        };

        this.userData = userData;

        this.updater();
    }

    shutdown() {
        if(this.circuitBuilder)
            this.circuitBuilder.shutdown();
        if(this.rvCircuit)
            this.rvCircuit.shutdown();
        if(this.circuit)
            this.circuit.cleanup();

        this.circuitBuilder = null;
        this.rvCircuit = null;
        this.circuit = null;

        clearInterval(this.context.updatePinger);
    }

    announce() {
        let req = new client.protocol.AnnouncementMessage();
        req.identity = this.userData.Certificate.PKIAccountID.Id;
        req.nodeIdentity = this.routes[2].Identity;

        var temp = new Uint8Array(this.routes[2].Fingerprint);
        req.fingerprint = temp.slice();

        temp = new Uint8Array(this.routes[2].HandshakeKey);
        req.handshake = temp.slice();
        var addreses = new Array<string>();
        for(let i=0; i < this.routes[2].OnionAddress.length;i ++)
            addreses.push(this.routes[2].OnionAddress[i]);

        req.key = new Uint8Array(this.presenceKey.PublicKey);
        req.address = addreses;

        let now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        req.expires = Math.round(now.getTime() / 1000);

        let reqBytes = req.serialize();
        let reqsigned = newSignedMessage(Buffer.from(reqBytes), this.userData);

        let requestData = new Uint8Array(reqsigned.marshal());
        let amessage = new client.protocol.AnnouncePresence({request: requestData});
        amessage.key = req.key.slice();

        let packet = marshal(amessage);
        if(packet == null)
            throw("Cannot proto deserialize Announce Presence");

        this.userIdentity = req.identity;

        if(!this.updating)
            Log("Announcing Presence for "+req.identity +"...");
        else
            Log("Updating Announcing Presence for "+req.identity +"...");

        this.circuit.escape(packet);

        if(!this.updating) {
            let context = this;
            this.circuit.setEscapeEvent(AnnouncementResultMessage, (msg) => {
                context.onAnnouncePresenceResult(msg)
            });
            this.circuit.setEscapeEvent(ForwardPresenceRequestMessage, (msg) => {
                context.onForwardPresenceRequest(msg);
            });
        }
    }

    onAnnouncePresenceResult(msg : client.protocol.AnnouncementResult) {
        if( msg.result != undefined && msg.result != client.protocol.AnnouncementResult.resultType.success) {
            this.shutdown();

            ErrorLog("Announcement presence failure " + msg.result);

            return;
        }

        if(!this.updating) {
            if(this.onAnnouncePresenceSucceed)
                this.onAnnouncePresenceSucceed(this.userIdentity);

            this.announced = true;

            Log("Announcing Presence success!");

        } else {
            Log("Updating Presence success!");
        }
    }

    updater() {
        var object = this;
        this.updatePinger = setInterval(function () {
            if (!object.announced)
                return;

            if(object.circuit == null) {
                clearInterval(object.updatePinger);
                return;
            }

            object.updating = true;
            object.announce();

        }, 30 * 1000);
    }

    onForwardPresenceRequest(msg : client.protocol.ForwardPresenceRequest) {
        let parser = NewRvCircuitPresence(this.userData.Certificate.PKIAccountID,
            this.presenceKey, Buffer.from(msg.request));

        if(parser == null) {
            Log("Received invalid forward presence request, dropping it");
            return;
        }

        let sm = unmarshalSignedMessage(parser.PayLoad, null);
        if( sm == null ) {
            Log("Unable to validate the signature for the incoming forward presence request");
            return;
        }

        let payload = newEncryptedInfoPayload(sm.Message);
        if(payload == null) {
            Log("Invalid payload in forward presence request");
            return;
        }

        Log("Extending rendezvous request from user " + sm.Certificate.PKIAccountID.Id);
        parser.Sender = sm.Certificate.PKIAccountID;

        this.parser = parser;

        let auth = parser.createRVAuth();
        let p = Buffer.alloc(HSHashSize + auth.length);
        payload.Cookie.copy(p);
        auth.copy(p, HSHashSize);

        this.rvCircuit = new Rendezvous(this.config);
        this.rvCircuit.Payload = p;
        this.rvCircuit.Establish = false;
        this.rvCircuit.go(this.nodes, payload);
        this.rvCircuit.OtherUser = sm.Certificate.PKIAccountID.Id;
        this.rvCircuit.CircuitHandler = parser;
        this.rvCircuit.OnInvitedChannelSuccess = this.onInvitedToChannel;
    }

    set Nodes (nodes : Array<NodePublicIdentity>) {
        this.nodes = nodes;
    }

    set OnAnnouncePresenceSucess(callback : OnAnnouncePresenceCallback) {
        this.onAnnouncePresenceSucceed = callback;
    }

}