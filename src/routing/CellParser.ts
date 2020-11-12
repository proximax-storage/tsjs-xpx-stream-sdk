/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell} from "./Cell";
import * as cmd from "./Command";
import * as defines from "./Identifiers";
import * as binary from "../utils/Binary";
import * as caster from "../utils/typeCaster"

import {CertificateCell, IsCertType} from "./cell/CertificateCell";
import {VersionCell} from "./cell/VersionCell";
import {AuthBypassCell, AuthChallengeCell} from "./cell/AuthChallengeCell"
import {StreamCreatedCell} from "./cell/StreamCreateCell";
import * as onion from "../defines/Onion";
import {StreamRelayCell} from "./cell/StreamRelayCell";
import {CreatedCell} from "./cell/CreatedCell";

export class  ParserResult {
    public cell;
    public error;
    constructor( cell, error ) {
        this.cell = cell;
        this.error = error;
    }
}

export function parseVersion(cell : Cell) : ParserResult {
    var payloadOffset = cmd.PayloadOffset(defines.Command.Versions);
    var n = cell.getData().length-payloadOffset;

    if ((n % 2) != 0) {
        return new ParserResult(null, "versions cell with odd length");
    }

    let v = new Uint16Array(n/2);
    for (let i = 0; i < n; i += 2) {
        v[i/2] = (binary.Uint16(cell.getData(), payloadOffset+i));
    }

    return new ParserResult(new VersionCell(v), null);
}

export function parseCertsCell(cell : Cell) : ParserResult {

    var p = cell.payLoad(defines.Command.Certs);
    if(p.length < 1) {
        return new ParserResult(null, "cell payload too short");
    }

    let N = p[0];
    p = p.slice(1);

    let certCell = new CertificateCell();

    for(let i = 0; i < N; i++) {

        if( p.length < 3) {
            return new ParserResult(null, "cell payload too short");
        }

        let t = p[0];
        if(!IsCertType(caster.byte(t))) {
            return new ParserResult(null, "unrecognized cert type");
        }

        let clen = binary.Uint16(p,  1);
        p = p.slice(3);

        if(p.length < caster.int32(clen)) {
            return new ParserResult(null, "cell payload too short");
        }

        var der = p.slice(0, clen);
        certCell.addCertsDER(t, der);

        p = p.slice(clen);
    }

    return new ParserResult(certCell, null);
}

export function parseAuthChallengeCell(cell : Cell) {
    var p = cell.payLoad(defines.Command.AuthChallenge);
    if(p.length < 32+2) {
        return new ParserResult(null, "Auth Challenge: cell payload too short");
    }

    let ac = new AuthChallengeCell();
    ac.setChallenge(p.slice(0));

    var N = caster.int32(binary.Uint16(p, 32));
    p = p.slice(34);

    if(p.length < 2 *N) {
        return new ParserResult(null, "Auth Challenge: cell payload too short");
    }

    for(let i=0; i < N; i++) {
        var m = caster.int16(binary.Uint16(p));
        ac.getMethods()[i] = m;
        p = p.slice(2);
    }

    return new ParserResult(ac, null);
}

export function parseAuthBypassCell(cell : Cell) {
    return new ParserResult(new AuthBypassCell(), null);
}

export function parseStreamCreated(cell : Cell) {
    return new ParserResult(new StreamCreatedCell(), null);
}

export function parseStreamRelayCell(cell : Cell) {
    var p = cell.payLoad(defines.Command.StreamRelay);
    if(p.length < 1 || p.length > onion.MaxVariableRelayDataLength) {
        return new ParserResult(null, "Stream Relay cell payload too short");
    }

    var payload = p.slice(0, p.length);

    return new ParserResult(new StreamRelayCell(cell.getCircID(), payload), null);
}

export function parseCreatedCell(cell : Cell) {
    var p = cell.payLoad(defines.Command.Created);
    let n = p.length;

    if(n < 2) {
        return new ParserResult(null, "Auth Challenge: cell payload too short");
    }

    let hlen = binary.Uint16(p);
    if( n < caster.int32(2+hlen)) {
        return new ParserResult(null, "Auth Challenge: cell payload too short");
    }

    let pp = p.slice(2, 2+hlen);
    return new ParserResult(new CreatedCell(cell.getCircID(), pp ), null);
}

export function parseRelayCell(cell : Cell) {
    return new ParserResult(cell,  null);
}