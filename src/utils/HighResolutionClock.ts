/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import Module = require("../3rd-party/cpp_high_resolution_clock/cpp_high_resolution_clock");
import {uint32} from "../utils/typeCaster";

/**
 * Adapter to C++ high resolution clock
 * loadedd as webasm
 */
export namespace high_resolution_clock {

    let nowInUnixEpoch : any = null;
    export const MIN_VALUE : bigint = BigInt(0);
    export type TimePoint = bigint;

    Module['onRuntimeInitialized'] = function () {
        nowInUnixEpoch = Module.cwrap("nowInUnixEpoch", null, ["number", "number"]);
    };

    export function now() : bigint {
        if(!nowInUnixEpoch)
            return MIN_VALUE;

        var upper_ptr = Module._malloc(4);
        var lower_ptr = Module._malloc(4);

        nowInUnixEpoch(upper_ptr, lower_ptr);

        let upper : number = Module.getValue(upper_ptr, "i32");
        let lower : number= Module.getValue(lower_ptr, "i32");

        upper = uint32(upper);
        lower = uint32(lower);

        let unix =  BigInt(BigInt(upper) << 32n) | BigInt(BigInt(lower) & 0xffffffffn);

        Module._free(upper_ptr);
        Module._free(lower_ptr);

        return unix;
    }

    export function nanosec( ms : number) : bigint {
        return BigInt(ms * 1000000);
    }

    export function milliseconds(ns : TimePoint) : number {
        return Math.round(Number(ns/1000000n));
    }
}