// Also known as forward present handler, can be merged with Announce Presence to becoma
// presence manager. to be cleaned up later.
import * as client from "../../proto/out/client";
import {NodePublicIdentity} from "./Discovery";
import {CircuitBuilder} from "../routing/circuit/CircuitBuilder";
import {Circuit} from "../routing/circuit/Circuit";
import {ExtractRandomNodesWithType} from "../utils/NodeExtractor";
import * as names from "../defines/Names";
import {AnnouncementResultMessage, ForwardPresenceRequestResultMessage, marshal} from "../utils/ProtoMapping";
import {Log} from "../utils/Logger";

export class ForwardPresence {
    private request : client.protocol.ForwardPresenceRequest;

    private readonly config : any = null;

    constructor(config : any) {
        this.config = config;
    }

    do(req : client.protocol.ForwardPresenceRequest, nodes : Array<NodePublicIdentity>, target : NodePublicIdentity = null) {

        if(!this.config)
            throw("Config not set Forward Presence");

        let routes = ExtractRandomNodesWithType(nodes, names.TypeOnionNode, this.config.hops.forwardPresence);
        routes.push(target);

        var context = this;
        let circuitBuilder = new CircuitBuilder();
        circuitBuilder.build(routes);
        circuitBuilder.OnCircuitReady = (circuit : Circuit) => {
            context.onCircuitCreated(circuit);
        };

        this.request = req;
    }

    onCircuitCreated(circuit : Circuit) {
        let msg = marshal(this.request);
        circuit.escape(msg);

        var context = this;
        circuit.setEscapeEvent(ForwardPresenceRequestResultMessage, (msg) => {
            context.onForwardPresenceResult(msg);
        });
    }

    onForwardPresenceResult( msg : client.protocol.ForwardPresenceRequestResult) {
        if(msg.result != undefined && msg.result != client.protocol.ForwardPresenceRequestResult.resultType.success) {
            Log("Error in forward presence request with error type " + msg.result);
            return;
        }

        Log("Forwarded presence request successfully, waiting for the other side to reach our rendezvous circuit");
    }
}

