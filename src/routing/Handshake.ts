/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import * as version from "../routing/cell/VersionCell";
import {CellSender} from "./CellSender";
import {CellReceiver} from "./CellReceiver";
import {BuildAndSend} from "./Cell";
import * as defines from "./Identifiers";
import {CertificateCell, fingerPrint256} from "./cell/CertificateCell";
import * as tls from "tls";
import {CertType} from "./Identifiers";
import {AuthChallengeCell, AuthBypassCell} from "./cell/AuthChallengeCell";
import {ParserResult} from "./CellParser";
import {VersionCell} from "../routing/cell/VersionCell";
import {Log} from "../utils/Logger";

export type OnHandshakeComplete = () => void;

export class Handshake {
    private readonly cellSender : CellSender;
    private cellReceiver : CellReceiver;
    private tlsConn : tls.TLSSocket;
    private peerFullyAuthenticated : boolean;
    private peerFingerPrint : string;
    private onHandshakeComplete : OnHandshakeComplete;
    private moduleName : string;

    constructor(tlsConn : tls.TLSSocket, sender : CellSender, cellReceiver : CellReceiver, onHandshakeComplete : OnHandshakeComplete) {
        this.cellSender = sender;
        this.cellReceiver = cellReceiver;
        this.tlsConn = tlsConn;
        this.peerFullyAuthenticated = false;
        this.onHandshakeComplete = onHandshakeComplete;
        this.moduleName = "Handshake";

        let object = this;
        this.cellReceiver.getDispatcher().addEventHandler(defines.Command.Versions, vc => {
            object.establishVersion(vc);
        }, this.moduleName);

        this.cellReceiver.getDispatcher().addEventHandler(defines.Command.Certs, cc => {
            object.handlePeerCertificates(cc);
        }, this.moduleName);

        this.cellReceiver.getDispatcher().addEventHandler(defines.Command.AuthChallenge, acc=>{
            object.handleAuthChallenge(acc);
        }, this.moduleName);
    }

    connect() {
        this.sendVersions(version.SupportedVersion);
    }

    sendVersions(v : Uint16Array) {
        BuildAndSend(this.cellSender, new version.VersionCell(v));
    }

    establishVersion(p: ParserResult){
        if( p.error != null) {
            Log(p.error);
            return;
        }

        let vc = p.cell as VersionCell;
        let supportedByA = new Map <number, boolean>();
        for(let i = 0; i < vc.supportedVersions.length; i++) {
            supportedByA.set(vc.supportedVersions[i], true)
        }

        let max = 0;
        for(let i = 0; i < version.SupportedVersion.length; i++) {

            if(!supportedByA.has(version.SupportedVersion[i]))
                continue;

            if(supportedByA.get(version.SupportedVersion[i]) && version.SupportedVersion[i] > max)
                max = version.SupportedVersion[i];
        }

        if (max == 0) {
            Log("Error in establishVersion: no common version found");
            return
        }

        Log("Version stablished at " + max);
        return max;
    }

    handlePeerCertificates(p: ParserResult) {
        if( p.error != null) {
            Log(p.error);
            return;
        }

        let certCell = p.cell as CertificateCell;
        var cert = this.tlsConn.getPeerCertificate();
        if(!certCell.validateResponderRSAOnly(cert)) {
            Log("certs cell failed validation ");
            return;
        }

        this.peerFullyAuthenticated = true;

        let serverIDCertDER = certCell.search(CertType.Identity)
        if (serverIDCertDER == null) {
            return;
        }

        this.peerFingerPrint = fingerPrint256(serverIDCertDER);
    }

    handleAuthChallenge(p: ParserResult) {
        if( p.error != null) {
            Log(p.error);
            return;
        }

        let auth = p.cell as AuthChallengeCell;
        if(!auth.supportsMethod(defines.AuthMethod.AllowBypass)) {
            Log("server does not support auth method");
            return;
        }

        BuildAndSend(this.cellSender, new AuthBypassCell());

        this.cellReceiver.getDispatcher().removeHandlersById(this.moduleName);

        if(this.peerFullyAuthenticated) {
            this.onHandshakeComplete();
        }
    }

    getFingerPrint() : string {
        return this.peerFingerPrint;
    }
}