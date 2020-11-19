/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Log} from "../utils/Logger";
import {PutUint16, Uint16} from "../utils/Binary";
import {int16} from "../utils/typeCaster";
import {stringToAsciiByteArray} from "../utils/Hex";
import {FingerprintSize} from "../defines/Crypto";

/**
 * LinkSpecType describes how to connect to the next node in a circuit.
 * */
export const LinkSpecType = Object.freeze({
    tlsTcpIpv4 : 0,
    tlsTcpIpv6 : 1,
    identity : 2,
    hostName : 3
});

/**
 * LinkSpec types for EXTEND cell
 *
 * */
export class LinkSpec {
    public Type : number;
    public Spec : Buffer;

    constructor(type : number){
        this.Type = type;
    }

    hostName() {
        if(this.Type != LinkSpecType.hostName) {
            Log("Wrong Spec Type");
            return null;
        }

        if(this.Spec.length <= 2) {
            Log("Bad Spec length");
            return null;
        }

        let port = Uint16(this.Spec);
        let hostBytes = this.Spec.slice(2);
        let hostsName = String.fromCharCode.apply(String, hostBytes);
        return hostsName + ":" + port;
    }
}

export function newLinkSpecHostname(hostname : string, port: number) : LinkSpec {
    if(hostname.length > 253) {
        Log("too lonf hostnaame");
        return null;
    }

    let s = new LinkSpec(LinkSpecType.hostName);
    let portBytes = Buffer.alloc(2);
    PutUint16(portBytes, int16(port));

    let hostnameBytes = stringToAsciiByteArray(hostname);
    s.Spec = Buffer.concat([portBytes, Buffer.from(hostnameBytes)]);
    return s;
}

export function newLinkSpecIdentity(ltype : number, id : Buffer) : LinkSpec {
    let s = new LinkSpec(ltype);
    s.Spec = id.slice();

    if(id.length != FingerprintSize && ltype == LinkSpecType.identity) {
        throw("Unable to create identity link spec: invalid size");
    }

    return s;
}

// IsLinkSpecType returns if LinkSpec is supported
export function IsLinkSpecType(ltype : number) : boolean {
    return ltype >= LinkSpecType.tlsTcpIpv4 && ltype <= LinkSpecType.hostName;
}