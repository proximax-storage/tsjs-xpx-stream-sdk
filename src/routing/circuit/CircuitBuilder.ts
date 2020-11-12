/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {NodePublicIdentity} from "../../client/Discovery";
import {OnionClientConnection} from "../../client/OnionClientConnection";
import {extractHostAndIP} from "../../utils/AddressExtractor";
import {bytesToHex} from "../../utils/Hex";
import {Circuit, OnCircuitEvent} from "./Circuit";
import {generateCircId} from "../../routing/circuit/CircuitCrypto";
import {Log} from "../../utils/Logger";
import {LinkSpec} from "../LinkSpec";

export class CircuitBuilder {
    private nodes : Array<NodePublicIdentity>
    private connection : OnionClientConnection;
    private currIndex : number;
    private circuit : Circuit;
    private linkSpecs : Array<LinkSpec>;
    private onCircuitReady : (circuit : Circuit) => void;

    constructor() {}

    build(nodes : Array<NodePublicIdentity>, linkSpecs? : Array<LinkSpec>) {
        var context = this;
        this.nodes = nodes;
        this.currIndex = 0;
        this.linkSpecs = (linkSpecs)? linkSpecs : null;

        var entry = nodes[this.currIndex];
        var host = extractHostAndIP(entry.OnionAddress[0]);
        var fingerprint = bytesToHex(entry.Fingerprint);

        this.connection = new OnionClientConnection();
        this.connection.connect(host.host, host.port, fingerprint,()=>{
            context.createCircuit();
        });
    }

    createCircuit() {
        var context = this;
        this.circuit = new Circuit(generateCircId(1),
            this.connection.Sender, this.connection.Dispatcher);

        this.circuit.create(this.nodes[0]);
        this.circuit.OnCircuitCreated = () => {
            context.completeOrExtend();
        };

        this.circuit.OnCircuitExtended = () => {
            context.completeOrExtend();
        }
    }

    completeOrExtend() {
        const nextNodeIndex = ++this.currIndex;
        const nodesSize = this.nodes.length;
        if( nextNodeIndex >= nodesSize) {
            Log("Circuit Ready");

            if( this.onCircuitReady)
                this.onCircuitReady(this.circuit);

            return;
        }

        const isLastHop : boolean = ((nextNodeIndex + 1) == nodesSize);

        const newEndPoint = this.nodes[nextNodeIndex];
        // If we have linkspecs provided and this is the last hop, make use of
        // them to extend the circuit
        if (isLastHop && (this.linkSpecs && this.linkSpecs.length > 0))
            this.circuit.extendLinkSpec(this.linkSpecs, newEndPoint);
        else
            this.circuit.extend(newEndPoint);
    }

    set OnCircuitReady(callback : (circuit : Circuit) => void) {
        this.onCircuitReady = callback;
    }

    close() {
        this.connection.cleanup();
    }
}