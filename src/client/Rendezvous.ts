import {NodePublicIdentity} from "./Discovery";
import {ExtractRandomNodesWithType} from "../utils/NodeExtractor";
import * as names from "../defines/Names";
import {CircuitBuilder} from "../routing/circuit/CircuitBuilder";
import {Circuit} from "../routing/circuit/Circuit";
import {PresenceRecord} from "./LookupPresenceManager";
import {newRelayCell, RelayCell, RelayCommand} from "../routing/cell/RelayCell";
import {Command, RelayCommandType} from "../routing/Identifiers";
import {NewFixedCell} from "../routing/Cell";
import {Log} from "../utils/Logger";
import {bytesToHex} from "../utils/Hex";
import {RVCircuitInitiator} from "./RVCircuitInitiator";
import {Identity} from "../pki/Identity";
import {EncryptedInfoPayload} from "./RvEncryptedInfo";
import {extractHostAndIP} from "../utils/AddressExtractor";
import {LinkSpec, newLinkSpecHostname} from "../routing/LinkSpec";
import {newSignedMessage} from "../cert/Mesage";
import {SignedEd25519KeyPair} from "../cert/KeyPair";
import * as client from "../../proto/out/client";
import {protocol} from "../../proto/out/client";
import ForwardPresenceRequest = protocol.ForwardPresenceRequest;
import {ForwardPresence} from "./ForwardPresence";
import {HSHashSize} from "./RvHandshake";
import {isArraySame} from "../utils/CommonHelpers";
import {RvCircuitHandler} from "./RvCircuitHandler";
import {RendezvousCircuit} from "./RendezvousCircuit";

export type OnChannelCreated = (circuit : RendezvousCircuit, userId : string) => void;

export class Rendezvous {

    private rvKey : Buffer;
    private routes : Array<NodePublicIdentity>;
    private identity : Identity;

    private signature : SignedEd25519KeyPair;
    private nodes : Array<NodePublicIdentity>;

    private establish : boolean;
    private payload : Buffer;
    private cookie : Buffer;
    private targetForwardPresence : NodePublicIdentity;
    private circuit : Circuit;

    private onChannelCreateSuccess : OnChannelCreated;
    private onInvitedChannelSuccess : OnChannelCreated;
    private otherUser : string;
    private circuitHandler : RvCircuitHandler;

    private readonly config : any = null;

    constructor(config : any) {
        this.config = config;
    }

    set RvKey(key : Buffer) {
        this.rvKey = key;
    }

    set Identity (identity : Identity) {
        this.identity = identity;
    }

    set Signature (signature : SignedEd25519KeyPair){
        this.signature = signature;
    }

    set Payload(payload : Buffer) {
        this.payload = payload;
    }

    set Establish(establish : boolean) {
        this.establish = establish;
    }

    set TargetForwardPresence(node : NodePublicIdentity) {
        this.targetForwardPresence = node;
    }

    set OnInvitedChannelSuccess(callback : OnChannelCreated){
        this.onInvitedChannelSuccess = callback;
    }

    set OnChannelCreateSucces(callback : OnChannelCreated){
        this.onChannelCreateSuccess = callback;
    }

    set OtherUser (userId : string) {
        this.otherUser = userId;
    }

    set CircuitHandler (handler : RvCircuitHandler) {
        this.circuitHandler = handler;
    }

    go(nodes : Array<NodePublicIdentity>, target? : EncryptedInfoPayload) {
        this.nodes = nodes;
        let count = (target)? 2 : 3;
        this.routes = ExtractRandomNodesWithType(this.nodes, names.TypeOnionNode, count);

        if(target) {
            let endNode = new NodePublicIdentity();
            endNode.HandshakeKey = target.Handshake;
            endNode.Fingerprint = target.Fingerprint;
            this.routes.push(endNode);
        }

        var context = this;
        let circuitBuilder = new CircuitBuilder();
        circuitBuilder.build(this.routes, (target)? target.linkSpecs : null);
        circuitBuilder.OnCircuitReady = (circuit : Circuit) => {
            context.onCircuitCreated(circuit);
        };
    }

    onCircuitCreated(circuit : Circuit) {
        if(this.payload == null)
            throw("Rendezvous payload is emptyy");

        var cmd : RelayCommand;
        cmd = (this.establish)? RelayCommandType.RelayEstablishRendezvous
            : RelayCommandType.RelayJoinRendezvous;

        let cell = NewFixedCell(0, Command.Relay);
        let extended = newRelayCell(cmd, this.payload);

        cell.setPayLoad(extended.getData());

        this.registerEvents(circuit);

        circuit.sendCell(cell);

        this.circuit = circuit;
    }

    registerEvents(circuit : Circuit) {
        var context = this;
        circuit.setRelayEvent(RelayCommandType.RelayRendezvousEstablished,(rc) =>{
            Log("Successfully established the rendezvous node");

            // trigger callback
            context.onRendezvousEstablished();
        });

        circuit.setRelayEvent(RelayCommandType.RelayRendezvousJoined1,(rc) =>{
            // this is if invited to rendezvous by other users
            Log("Successfully joined the rendezvous node");

            let rvCircuit = new RendezvousCircuit(circuit, this.circuitHandler);
            if(this.onInvitedChannelSuccess) {
                this.onInvitedChannelSuccess(rvCircuit, this.otherUser);
            }
        });

        circuit.setRelayEvent(RelayCommandType.RelayRendezvousJoined2,(rc) =>{
            // this triggers when succesfuly inviting(create chanel) a user
            Log("Another party has joined the rendezvous node, performing final authentication");
            context.onUserJoined(rc);
        });
    }

    onUserJoined(rc : RelayCell) {
        let payload = rc.relayData();
        if(payload.length < HSHashSize) {
            Log("Payload is invalid");
            return;
        }

        let cookie = Buffer.alloc(HSHashSize);
        payload.copy(cookie);
        if(!isArraySame(cookie,  this.cookie )) {
            Log("Wrong rendezvous cookie in reply packet");
            return;
        }

        let initiator = this.circuitHandler as RVCircuitInitiator;
        let ret = initiator.acceptRVAuth(payload.slice(HSHashSize));
        if(!ret) {
            Log("Unable to process authorization");
            return;
        }

        let rvCircuit = new RendezvousCircuit(this.circuit, this.circuitHandler);
        if(this.onChannelCreateSuccess)
            this.onChannelCreateSuccess(rvCircuit, this.otherUser);

        Log("Successfully authorized rendezvous client from the other side");
    }

    onRendezvousEstablished() {
        // need the rvkey
        if(this.rvKey == null || this.identity == null || this.signature == null)
            throw("one or all parameters not set on Rendezvou manager");

        const lastNode = this.targetForwardPresence;
        let fp = bytesToHex(lastNode.Fingerprint);
        Log("Building path towards node "+lastNode.Identity+"/" + fp);

        let presenceKey = this.rvKey.slice();
        let initiator = new RVCircuitInitiator(this.identity, presenceKey);
        this.circuitHandler = initiator;

        let epayload = new EncryptedInfoPayload();
        epayload.Cookie = this.payload;
        epayload.Fingerprint = this.routes[2].Fingerprint;
        epayload.Handshake = this.routes[2].HandshakeKey;
        this.cookie = this.payload;

        // HEY HEY please note that building linkspecs from hostname is purely temporary solution
        // both here and in client.go and C++ code too. First of all discovery may list multiple addresses
        // and not only one for the node (so it will create multiple linkspecs) and second it may be better
        // to resolve the DNS name before sending it towards node for both this payload and EXTEND cell
        // thus retire the hostname linkspec entirely. Remember - hostname linkspec is non-standard
        // and we introduced it ONLY because we needed it for Docker local setup to work
        var host = extractHostAndIP(lastNode.OnionAddress[0]);
        epayload.linkSpecs = new Array<LinkSpec>(1);
        epayload.linkSpecs[0] = newLinkSpecHostname(host.host, host.port);

        let ep = epayload.marshal();
        if(ep == null) {
            Log("Unable to create a seed payload");
            return;
        }

        let req = newSignedMessage(ep, this.signature);
        if(req == null) {
            Log("Unable to sign the request");
            return;
        }

        let request = initiator.generateIntroduceRequest(req.marshal());
        let fpr = new client.protocol.ForwardPresenceRequest({request: request});

        let forwarder = new ForwardPresence(this.config);
        forwarder.do(fpr, this.nodes, lastNode);
    }
}