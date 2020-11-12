/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {NodePublicIdentity} from "./Discovery";
import {ExtractNodes, ExtractRandomNodesWithType, validateNodeIdentity} from "../utils/NodeExtractor";
import * as names from "../defines/Names";
import {CircuitBuilder} from "../routing/circuit/CircuitBuilder";
import {Circuit} from "../routing/circuit/Circuit";
import * as client from "../../proto/out/client";
import * as proto from"../utils/ProtoMapping";
import {ErrorLog, Log} from "../utils/Logger";
import {Identity, newIdentity} from "../pki/Identity";
import {unmarshalSignedMessage} from "../cert/Mesage";
import {RSAPayload} from "../cert/RSAPayload";
import {FingerprintSize} from "../defines/Crypto";
import {bytesToHex} from "../utils/Hex";
import {isArraySame} from "../utils/CommonHelpers";
import * as c from "crypto";
import {OnChannelCreated, Rendezvous} from "./Rendezvous";
import {SignedEd25519KeyPair} from "../cert/KeyPair";

/**
 * a record of a user presence node
 */
export class PresenceRecord {
    public Identity : Identity;
    public Fingerprint : Buffer;
    public HandshakeKey : Buffer;
    public Address : Array<string>;
}

/**
 * Looks up for a certain user in the network by looking up the presence where the user is in
 */
export class LookUpPresenceManager {
    private circuitBuilder : CircuitBuilder;
    private targetUserId : string;
    private nodes : Array<NodePublicIdentity>;
    private rvKey : Buffer;
    private target : PresenceRecord;
    private identity : Identity;
    private signature : SignedEd25519KeyPair;
    private onChannelCreateSuccess : OnChannelCreated;

    private readonly config : any = null;

    constructor(config : any) {
        this.config = config;
    }

    set Signature (signature : SignedEd25519KeyPair) {
        this.signature = signature;
    }

    set OnChannelCreateSuccess (callback : OnChannelCreated) {
        this.onChannelCreateSuccess = callback;
    }

    do(userId : string, nodes : Array<NodePublicIdentity>) {
        if(!this.config)
            throw("Config not set in LookupPresenceManager");

        let routes = ExtractRandomNodesWithType(nodes, names.TypeOnionNode,this.config.hops.lookupPresence);

        var context = this;
        this.circuitBuilder = new CircuitBuilder();
        this.circuitBuilder.build(routes);
        this.circuitBuilder.OnCircuitReady = (circuit : Circuit) => {
            context.lookupPresence(circuit);
        };

        this.targetUserId = userId;
        this.nodes = nodes;
    }

    lookupPresence(circuit : Circuit){
        let lookupPresence = new client.protocol.LookupPresence({identity: this.targetUserId});
        let msg = proto.marshal(lookupPresence);
        if(msg == null)
            return;

        var context = this;
        circuit.escape(msg);
        circuit.setEscapeEvent(proto.LookupResultMessage, (msg)=>{
            context.onLookupResult(msg);
        });
    }

    onLookupResult(msg : client.protocol.LookupResult) {
        if( msg.result != undefined && msg.result != client.protocol.LookupResult.resultType.success) {
            ErrorLog("Lookup presence failure with result" + msg.result);
            return;
        }

        Log("Found presence information for "+msg.identity+" with "+
            msg.announcements.length+" announcements");

        var target = null;
        let expiration : bigint  = BigInt(0);
        let key : Buffer;

        var validator = (identiy)=>{
            return validateNodeIdentity(this.nodes, identiy);
        };

        for(let i = 0; i < msg.announcements.length; i++) {
            let sm = unmarshalSignedMessage(Buffer.from(msg.announcements[i]), validator);

            if( sm == null) {
                ErrorLog("Unable to unmarshal the announcement");
                continue;
            }

            let fingerprintInPayload : Buffer = null;

            if(sm.Certificate.Payload) {
                let payload = new RSAPayload();
                if(sm.Certificate.readPayLoad(payload)) {
                    let fpr = payload.payload();
                    if( fpr != null) {
                        if(fpr.length == FingerprintSize) {
                            fingerprintInPayload = fpr.slice();
                        }
                    }
                }
            }

            if(fingerprintInPayload != null) {
                let fps = bytesToHex(fingerprintInPayload);
                Log("Unmarshalled the announcement from node " +sm.Certificate.PKIAccountID.Id+
                    " with fingerprint " + fps);

                let smi = unmarshalSignedMessage(sm.Message, validator);

                if(smi == null){
                    ErrorLog("Unable to unmarshal underlying message");
                    return;
                }

                Log("Unmarshalled underlying announcement with identity: " + smi.Certificate.PKIAccountID.Id);

                let announcement = client.protocol.AnnouncementMessage.deserialize(smi.Message);
                if(announcement.expires > expiration) {
                    if(announcement.nodeIdentity == sm.Certificate.PKIAccountID.Id &&
                        isArraySame(fingerprintInPayload, announcement.fingerprint)) {
                        target = new PresenceRecord();
                        target.Identity = sm.Certificate.PKIAccountID;
                        target.Address = announcement.address;
                        target.FingerPrint = Buffer.from(announcement.fingerprint);
                        target.HandshakeKey = Buffer.from(announcement.handshake);
                        key = Buffer.from(announcement.key);
                    }else{
                        ErrorLog("Information inside the announcement does not match the certificate");
                    }
                }
            }
            else {
                ErrorLog("Announncement node certificate is not payloaded correctly");
            }

            if(target != null) {
                // start Rendezvous Client here
                this.rvKey = key;
                this.target = target;
                this.identity = newIdentity(msg.identity);

                // either initialize and call rendezvous or return callback to caller
                // and caller initialize rendezvous
                let random = c.randomBytes(32); // HSHashSize
                let cookie = c.createHash('sha256').update(random).digest();

                let targetFP = new NodePublicIdentity();
                targetFP.Fingerprint = target.FingerPrint;
                targetFP.HandshakeKey = target.HandshakeKey;
                targetFP.OnionAddress = target.Address;
                targetFP.Identity = target.Identity.Id;

                // create rendezvous circuit here
                // circuit handler not set as it is created in rendezvous
                let rvCircuit = new Rendezvous(this.config);
                rvCircuit.Payload = cookie;
                rvCircuit.Establish = true;
                rvCircuit.RvKey = key;
                rvCircuit.Identity = this.Identity;
                rvCircuit.Signature = this.signature;
                rvCircuit.TargetForwardPresence = targetFP;
                rvCircuit.OtherUser = this.targetUserId;
                rvCircuit.OnChannelCreateSucces = this.onChannelCreateSuccess;
                rvCircuit.go(this.nodes);
            }
        }
    }

    get RvKey() {
        return this.rvKey;
    }

    get Target() {
        return this.target;
    }

    get Identity() {
        return this.identity;
    }
}