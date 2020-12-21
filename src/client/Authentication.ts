/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {NodePublicIdentity} from "./Discovery";
import {
    ExtractNodes,
    ExtractRandomNodesWithType,
    RandomFromNodeType,
    validateNodeIdentity
} from "../utils/NodeExtractor";
import * as names from "../defines/Names";
import {CircuitBuilder} from "../routing/circuit/CircuitBuilder";
import * as forge from "node-forge";
import {addSignature, newFlatCertificate} from "../cert/FlatCertificate";
import {certificateLifetime} from "../defines/Certificate";
import {Ed25519KeyPair, SignedEd25519KeyPair} from "../cert/KeyPair";
import {newSignedMessage} from "../cert/Mesage";
import {stringToAsciiByteArray} from "../utils/Hex";
import {AuthRequestCertificateResultMessage, marshal} from "../utils/ProtoMapping";
import {protocol} from "../../proto/out/auth";
import AuthRequestCertificate = protocol.AuthRequestCertificate;
import {ErrorLog, Log} from "../utils/Logger";
import {Circuit} from "../routing/circuit/Circuit";
import {buildIdentity, IdentityType} from "../pki/Identity";
import * as auth from "../../proto/out/auth";

export type OnRegistrationComplete = (SignedEd25519KeyPair) => void;

/**
 * Class for authentication (register) of a client to the network
 */
export class Authentication {
    private nodes : Array<NodePublicIdentity>;

    private CachedCertificate : SignedEd25519KeyPair;
    private onRegistrationComplete : Array<OnRegistrationComplete>;

    private circuitCache : Circuit;
    private circuitBuilder : CircuitBuilder;
    private context : any = null;

    private readonly config : any = null;

    constructor(conf : any) {
        this.onRegistrationComplete = new Array<OnRegistrationComplete>();
        this.CachedCertificate = null;

        this.config = conf;
        this.context = this;
    }

    set Nodes (nodes : Array<NodePublicIdentity>) {
        this.nodes = nodes;
    }

    registerUser() {

        if(!this.config)
            throw("Config not set in Authentiacation routine");

        var context = this;

        // build 3 nodes with authority at the endpoint
        let endPoint : NodePublicIdentity;
        let redo = false;
        do {
            redo = false;
            endPoint = RandomFromNodeType(this.nodes, names.TypeAuthorityNode);
            if (this.CachedCertificate != null) {
                for (let i = 0; i < this.CachedCertificate.Certificate.Signatures.length; i++) {
                    if (this.CachedCertificate.Certificate.Signatures[i].Certificate.PKIAccountID.Id == endPoint.Identity) {
                        redo = true;
                        break;
                    }
                }
            }

        } while(redo);

        let nodes = ExtractRandomNodesWithType(this.nodes, names.TypeOnionNode,this.config.hops.authenication );
        nodes.push(endPoint);

        if(this.circuitBuilder)
            this.circuitBuilder.shutdown();

        this.circuitBuilder = new CircuitBuilder();
        this.circuitBuilder.build(nodes);
        this.circuitBuilder.OnCircuitReady = (circuit : Circuit) => {
            context.renewCertificate(circuit);
        };
    }

    shutdown() {
        if(this.context.circuitBuilder)
            this.context.circuitBuilder.shutdown();
    }

    renewCertificate(circuit : Circuit) {

        let ed25519 = forge.pki.ed25519;

        if(this.CachedCertificate == null) {
            let masterKey = ed25519.generateKeyPair();
            let signingKey = ed25519.generateKeyPair();

            // @ts-ignore
            let pkiIdentity = buildIdentity("sirius", "client", IdentityType.Account, masterKey.publicKey);

            // @ts-ignore
            let stub = newFlatCertificate(signingKey.publicKey, pkiIdentity, certificateLifetime, masterKey.privateKey);

            let kp = new SignedEd25519KeyPair(
                // @ts-ignore
                new Ed25519KeyPair(signingKey.publicKey, signingKey.privateKey),
                stub);

            // cached the signed certificate and signing key for used in result
            this.CachedCertificate = kp;
        }

        let msgb = Buffer.from(stringToAsciiByteArray("xpx-auth-1.0"));
        let sm = newSignedMessage(msgb, this.CachedCertificate);
        let authMsg = new AuthRequestCertificate();
        authMsg.certificateStub = sm.marshal();

        let msg = marshal(authMsg);
        circuit.escape(msg);

        let context = this;
        circuit.setEscapeEvent(AuthRequestCertificateResultMessage, (msg)=>{
            context.onAuthRequestCertificationResult(msg as auth.protocol.AuthRequestCertificateResult);
        });

        this.circuitCache = circuit;

        Log("Requesting new certificate invocation for " +  this.CachedCertificate.Certificate.PKIAccountID.Id);
    }

    onAuthRequestCertificationResult(msg : auth.protocol.AuthRequestCertificateResult) {
        // in typescript generated protobuf, msg.result is undefined for success unlike other language like Go and C++.
        // But this is an issue in generation rather than deserialization, In other language, the value is initialize to 0
        // in the generatedd files, but its not re-set during deserialization and remain 0.
        // Generated protobuf file (auth.ts) was modified to fix/set default value similar to other language.
        if( msg.result != undefined && msg.result != auth.protocol.AuthRequestCertificateResult.requestResult.success) {
            ErrorLog("Request Authentication of Certificate failed with result " + msg.result);
            return;
        }

        addSignature(this.CachedCertificate.Certificate, Buffer.from(msg.signature), true);

        var context = this;
        if(!this.CachedCertificate.Certificate.validate((identiy)=>{
            return validateNodeIdentity(this.nodes, identiy);
            })) {
            context.registerUser();
            return;
        }

        for (let c of this.onRegistrationComplete) {
            c(this.CachedCertificate);
        }

        this.circuitCache.cleanup();
        this.circuitBuilder.close();

    }

    addOnRegistrationComplete( callback : OnRegistrationComplete) {
        this.onRegistrationComplete.push(callback);
    }

}