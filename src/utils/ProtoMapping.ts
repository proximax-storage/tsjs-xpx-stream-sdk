/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as proto from "google-protobuf";
import {PutUint16, Uint16} from "./Binary";
import * as caster from "./typeCaster";
import * as discovery from "../../proto/out/discovery";
import {Log} from "../utils/Logger";
import * as auth from "../../proto/out/auth";
import * as client from "../../proto/out/client";

// ID defines the type for packet id
export type MessageId = number;

// Various message types
export const AnnouncePresenceMessage           :   MessageId = 1;
export const AnnouncementResultMessage         :   MessageId = 2;
export const LookupPresenceMessage             :   MessageId = 3;
export const LookupResultMessage               :   MessageId = 4;
export const ForwardPresenceRequestMessage     :   MessageId = 5;
export const ForwardPresenceRequestResultMessage :  MessageId = 6;
export const AuthRequestCertificateMessage       : MessageId = 1000;
export const AuthRequestCertificateResultMessage : MessageId = 1001;
export const DiscoveryPullMessage                : MessageId = 2001;
export const DiscoveryDirectoryMessage           : MessageId = 2002;
export const DiscoveryPublishMessage             : MessageId = 2003;
export const DiscoveryRaftPacketMessage          : MessageId = 2004;
export const DiscoveryRequestConsensusVoteMessage : MessageId = 2005;
export const DiscoveryConsensusVoteMessage       : MessageId = 2006;
export const DiscoveryFinalConsensusMessage      : MessageId = 2007;
export const PublishToDiscoveryForwardedMessage  : MessageId = 2008;

export function marshal(msg : proto.Message)  {
    var id : MessageId;
    switch(msg.constructor.name) {
        case "PullDiscovery" :
            id = DiscoveryPullMessage;
            break;
        case "AuthRequestCertificate":
            id = AuthRequestCertificateMessage;
            break;
        case "AnnouncePresence":
            id = AnnouncePresenceMessage;
            break;
        case "LookupPresence":
            id = LookupPresenceMessage;
            break;
        case "ForwardPresenceRequest":
            id = ForwardPresenceRequestMessage;
            break;
        default:
            throw("marshal: Unknown message payload");
    }

    var data = msg.serialize();
    let idb = Buffer.alloc(2);
    PutUint16(idb, caster.int16(id));
    return Buffer.concat([idb, data]);
}

export function unmarshal(data : Buffer) : proto.Message {
    if(data.length < 2) {
        Log("Unmarshal data is invalid");
        return null;
    }

    let id = Uint16(data);
    let msg : proto.Message;
    let newData = data.slice(2);

    switch(id) {
        case DiscoveryDirectoryMessage:
            msg = discovery.protocol.DiscoveryDirectory.deserialize(newData);
            break;
        case AuthRequestCertificateResultMessage:
            msg = auth.protocol.AuthRequestCertificateResult.deserialize(newData);
            break;
        case AnnouncementResultMessage:
            msg = client.protocol.AnnouncementResult.deserialize(newData);
            break;
        case LookupResultMessage:
            msg = client.protocol.LookupResult.deserialize(newData);
            break;
        case ForwardPresenceRequestResultMessage:
            msg = client.protocol.ForwardPresenceRequestResult.deserialize(newData);
            break;
        case ForwardPresenceRequestMessage:
            msg = client.protocol.ForwardPresenceRequest.deserialize(newData);
            break;
        default:
            throw("marshal: Unknown message payload");
    }

    return msg;
}