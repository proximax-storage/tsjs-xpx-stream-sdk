/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {LinkSpec} from "./LinkSpec";
import {int8} from "../utils/typeCaster";

export class ExtendPayload{
    public LinkSpecs : Array<LinkSpec>;
    public HandshakeData : Buffer;

    constructor(){
    }

    marshal() {
        if(this.LinkSpecs.length == 0 || this.HandshakeData.length == 0) {
            throw ("Unable to marshal Extended Payload");
        }

        let result = Buffer.alloc(1);
        result[0] = int8(this.LinkSpecs.length);

        let tmp = Buffer.alloc(1);
        for(let i = 0; i < this.LinkSpecs.length; i++) {
            let lspec = this.LinkSpecs[i];
            tmp[0] = int8(lspec.Type);
            result = Buffer.concat([result, tmp]);

            tmp[0] = int8(lspec.Spec.length);
            result = Buffer.concat([result, tmp]);

            result = Buffer.concat([result, lspec.Spec]);
        }

        result = Buffer.concat([result, this.HandshakeData]);
        return result;
    }
}