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
import {protocol} from "../../proto/out/channel";
import ChannelMessage = protocol.ChannelMessage;
import MessageType = protocol.MessageType;
import RawMessage = protocol.RawMessage;
import StringMessage = protocol.StringMessage;
import ConfirmChannelMessage = protocol.ConfirmChannelMessage;
import {RelayCommandType} from "../routing/Identifiers";
import DenyChannelMessage = protocol.DenyChannelMessage;

export class RendezvousCircuit {
    private circuit : Circuit;
    private circuitHandler : RvCircuitHandler;
    private moduleName : string;
    private usingRawData : boolean = false;

    /**
     * Callback handlers
     * no setters and getters and accessed directly
     * */
    public OnRawData : (data : Buffer) => void = null;
    public OnReceivedUserDataRaw : (data : Uint8Array) => void = null;
    public OnReceivedUserDataString : (data : string) => void = null;
    public OnConfirmedChannel : () => void = null;
    public OnDeniedChannel : () => void = null;

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

        if(this.usingRawData) {
            let relayData = r.relayData();

            // to convert to strings do:
            // let message = String.fromCharCode.apply(String, relayData);
            this.OnRawData(relayData);

        } else {
            let messageOpt = ChannelMessage.deserialize(r.extendPayload());
            this.handleUserData(messageOpt);
        }
    }

    handleUserData(message : ChannelMessage) {
        switch(message.messageType) {
            case MessageType.Raw:
                let rawMsg = RawMessage.deserialize(message.data);
                if(this.OnReceivedUserDataRaw)
                    this.OnReceivedUserDataRaw(rawMsg.data);
                break;

            case MessageType.String:
                let strMsg = StringMessage.deserialize(message.data);
                if(this.OnReceivedUserDataString)
                    this.OnReceivedUserDataString(strMsg.data);
                break;
            case MessageType.ConfirmChannel:
               // let confirm = ConfirmChannelMessage.deserialize(message.data);
                if(this.OnConfirmedChannel)
                    this.OnConfirmedChannel();
                break;
            case MessageType.DenyChannel:
                //let deny = DenyChannelMessage.deserialize(message.data);
                if(this.OnDeniedChannel)
                    this.OnDeniedChannel();
                break;
        }
    }

    /**
     * initiated channel can communicate thru initated channel by sending raw data and/or strings
     * */
    sendRawData(data) {
        if(this.circuit == null || this.circuitHandler == null)
            return;

        let reply = NewFixedCell(0, defines.Command.Relay);

        let extended = newRelayCell(0, Buffer.from(data));
        reply.setPayLoad(extended.getData());
        let payload = reply.payLoad();
        payload = this.circuitHandler.Send.encryptOrigin(payload);
        reply.setPayLoad(payload);

        if(!this.circuit.sendCellToRendezvousCircuit(reply)){
            Log("Unable to send cell towards the other side of RV circuit");
        }
    }

    sendRawDataString(msg : string) {
        let message = stringToAsciiByteArray(msg);
        this.sendRawData(message);
    }

    confirmChannel() {
        let message = new ConfirmChannelMessage();
        this.send(MessageType.ConfirmChannel, message);
    }

    denyChannel() {
        let message = new DenyChannelMessage();
        this.send(MessageType.DenyChannel, message);
    }

    sendUserDataRaw(data : Uint8Array) {
        let msg = new RawMessage();
        msg.data = data.slice();
        this.send(MessageType.Raw, msg);
    }

    sendUserDataString(message : string) {
        let msg = new StringMessage();
        msg.data = message;
        this.send(MessageType.String, msg);
    }

    send(messageType : MessageType, message : any) {
        let chanMsg = new ChannelMessage();
        chanMsg.messageType = messageType;
        chanMsg.data = message.serialize();
        let data = chanMsg.serialize();

        let cell = NewFixedCell(0, defines.Command.Relay);
        let extended = newRelayCell(RelayCommandType.RelayUserData, Buffer.from(data));
        cell.setPayLoad(extended.getData());
        let payload = cell.payLoad();
        payload = this.circuitHandler.Send.encryptOrigin(payload);
        cell.setPayLoad(payload);

        if(!this.circuit.sendCellToRendezvousCircuit(cell)){
            Log("Unable to send cell with userData towards the other side of RV circuit");
        }
    }

    set UsingRawData (flag : boolean) {
        this.usingRawData = flag;
    }
}