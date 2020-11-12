/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as proto from "google-protobuf";
import * as schema from "../../proto/out/discovery"
import * as s from "../defines/SiriusStream";
import * as protomap from "../utils/ProtoMapping";
import {ApplicationMessageProcessor} from "../routing/ApplicationMessage";
import {protocol} from "../../proto/out/discovery";
import {hexToBytes} from "../utils/Hex";
import {convertMode} from "../defines/Names";
import {Log} from "../utils/Logger";
import {StreamManager} from "../routing/StreamManager";
import {StreamNamespaceId} from "../defines/SiriusStream";

/**
 * Represents a bootstrap node in a nework
 */
export class EntryNode {
    public Address : string;
    public Port : number;
    public FingerPrint : string;

    constructor(address : string, port : number, fingerprint : string) {
        this.Address = address;
        this.Port = port;
        this.FingerPrint = fingerprint;
    }
}

/**
 * NodePublicIdentity defines information about the node available from the discovery service
 */
export const NodeTypeHost = 0;
export const NodeTypeLinkSpec = 1;

export class NodePublicIdentity {
    public Fingerprint : Buffer;
    public HandshakeKey : Buffer;
    public Identity : string;
    public Mode : number;
    public OnionAddress : Array<string>;
    public NodeType : number;

    constructor() {
        this.NodeType = NodeTypeHost;
    }
}

type OnDiscoveryChanged = () => void;

/**
 * Takes care of discovery of nodes in the network by connecting to an entry/bootstrap nodes and pull information
 */
export class Discovery {
    private streamManager : StreamManager;
    private cachedList : Array<NodePublicIdentity>;
    private onDiscoveryChanged : OnDiscoveryChanged;

    constructor() {
    }

    requestDiscovery(entry : EntryNode) {
        var context = this;

        this.streamManager = new StreamManager();
        this.streamManager.AppMessageProcessor = new ApplicationMessageProcessor();
        this.streamManager.connect(entry, StreamNamespaceId.DiscoveryProtocolNamespace);
        this.streamManager.OnStreamCreated = () =>{
            context.requestPullDiscovery();
        };
    }

    requestPullDiscovery() {

        let msg = new schema.protocol.PullDiscovery();
        msg.version = s.DiscoveryRequestProtocolNum;

        let m = protomap.marshal(msg);
        this.streamManager.sendToStream(m);

        var context = this;
        this.streamManager.OnStreamResult = (data) => {
            context.pullDiscovery(data);
        };
    }

    pullDiscovery(data : Buffer) {
        var rcvd : proto.Message;
        rcvd = protomap.unmarshal(data);

        var finalList = new Array<NodePublicIdentity>();

        if(rcvd == null) {
            Log("Unable to deserialized in pullDiscovery");
            return;
        }

        let dir = protocol.DiscoveryListing.deserialize(rcvd.directory);
        if(dir == null) {
            Log("Unable to deserialized in directory");
            return;
        }

        if(dir.version != s.DiscoveryRequestProtocolNum){
            Log("unknown discovery listing version");
            return;
        }

        for(let i = 0; i < dir.items.length; i++) {
            let sub = protocol.DiscoveryItem.deserialize(dir.items[i]);
            if(sub == null) {
                Log("Unable to unmarshal subitem");
                return;
            }

            var node = new NodePublicIdentity();
            node.Identity = sub.identity;

            var bytes = hexToBytes(sub.fingerprint);
            node.Fingerprint = Buffer.from(bytes);

            bytes = hexToBytes(sub.handshake);
            node.HandshakeKey = Buffer.from(bytes);
            node.OnionAddress = sub.address;
            node.Mode = convertMode(sub.mode);

            finalList.push(node);
        }

        this.streamManager.cleanup();
        this.cachedList = finalList;

        Log("Successfully pulled discovery catalog with "+finalList.length+" known nodes");

        if(this.onDiscoveryChanged)
            this.onDiscoveryChanged();
    }

    set OnDiscoveryChanged(onDiscoveryChanged : OnDiscoveryChanged){
        this.onDiscoveryChanged = onDiscoveryChanged;
    }

    get NodeList () {
        return this.cachedList;
    }
}