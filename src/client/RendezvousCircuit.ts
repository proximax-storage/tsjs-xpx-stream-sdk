/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Circuit} from "../routing/circuit/Circuit";
import {RvCircuitHandler} from "./RvCircuitHandler";
import {NewFixedCell} from "../routing/Cell";
import {newRelayCell, newRelayCellFromBytes} from "../routing/cell/RelayCell";
import {Log} from "../utils/Logger";
import * as defines from "../routing/Identifiers";
import {stringToAsciiByteArray} from "../utils/Hex";

export class RendezvousCircuit {
    private circuit : Circuit;
    private circuitHandler : RvCircuitHandler;
    private moduleName : string;
    private onMessageReceived : (message : string) => void = null;

    constructor(circuit : Circuit, circuitHandler : RvCircuitHandler) {
        this.circuit = circuit;
        this.circuitHandler = circuitHandler;
        this.moduleName = "RendezvousCircuit" + circuit.CircuitId;

        var context = this;
        this.circuit.OnEncodedData = (payload : Buffer) => {
            context.onDataReceived(payload);
        };
    }

    onDataReceived(payload : Buffer) {
        if(this.circuit == null || this.circuitHandler == null)
            return;

        payload = this.circuitHandler.Recieve.decrypt(payload);
        let r = newRelayCellFromBytes(payload);
        if(r == null) {
            Log("[0] Unable to receive Encoded relayed cell");
            return;
        }

        if( r.recognized() != 0) {
            Log("[1] Unable to receive Encoded relayed cell");
            return;
        }

        let digest = this.circuitHandler.Recieve.digest();
        if( digest != r.getDigest()) {
            Log("[2] Unable to receive Encoded relayed cell");
            return;
        }

        let relayData = r.relayData();
        let message = String.fromCharCode.apply(String, relayData);
        Log("Data Received : " + message);

        if(this.onMessageReceived) {
            this.onMessageReceived(message);
        }
    }

    sendMessage(msg : string) {
        if(this.circuit == null || this.circuitHandler == null)
            return;

        let reply = NewFixedCell(0, defines.Command.Relay);
        let message = stringToAsciiByteArray(msg);
        let extended = newRelayCell(0, Buffer.from(message));
        reply.setPayLoad(extended.getData());
        let payload = reply.payLoad();
        payload = this.circuitHandler.Send.encryptOrigin(payload);
        reply.setPayLoad(payload);

        if(!this.circuit.sendCellToRendezvousCircuit(reply)){
            Log("Unable to send cell towards the other side of RV circuit");
        }
    }

    set OnMessageReceived(callback : (message : string) => void) {
        this.onMessageReceived = callback;
    }
}