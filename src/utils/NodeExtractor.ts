/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

import {NodePublicIdentity} from "../client/Discovery";
import * as names from "../defines/Names";

export function ExtractNodes (source : Array<NodePublicIdentity>, types : number) : Array<NodePublicIdentity> {
    let result = new Array<NodePublicIdentity>();

    for(let i = 0; i < source.length; i++) {
        let mask = 1;
        for(let n = 0; n < 5; n++) {
            if( (types & mask) && (source[i].Mode & mask)) {
                result.push(source[i]);
            }
            mask <<= 1;
        }
    }

    return result;
}

export function ExtractRandomNodes(source : Array<NodePublicIdentity>, count : number): Array<NodePublicIdentity> {
    let result = new Array<NodePublicIdentity>();
    while( result.length < count) {
        var item = source[Math.floor(Math.random()*source.length)];
        let v = result.find((node)=>{
            return node.Fingerprint.compare(item.Fingerprint);
        });

        if(!v)
            result.push(item);
    }
    return result;
}

export function ExtractRandomNodesWithType(source : Array<NodePublicIdentity>, types : number, count : number): Array<NodePublicIdentity> {
    let newsrc = ExtractNodes(source, types);
    let result = new Array<NodePublicIdentity>();

    while( result.length < count) {
        var item = newsrc[Math.floor(Math.random()*newsrc.length)];
        let v = result.find((node)=>{
            if( item.Fingerprint.length != node.Fingerprint.length)
                return undefined;
            for(let i = 0; i < node.Fingerprint.length; i++) {
                if(node.Fingerprint[i] != item.Fingerprint[i])
                    return undefined;
            }

            return node;
        });

        if(!v)
            result.push(item);
    }
    return result;
}

export function RandomFromNodeType(source : Array<NodePublicIdentity>, types: number) : NodePublicIdentity {
    let result = ExtractNodes(source, types);
    return result[Math.floor(Math.random()*result.length)];
}

export function validateNodeIdentity(nodes, identity) : boolean {
    let authNodes = ExtractNodes(nodes, names.TypeAuthorityNode);
    let v = authNodes.find((node)=>{
        if( identity != node.Identity)
            return undefined;

        return node;
    });

    return (v != undefined);
}