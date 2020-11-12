var Module = {
    onRuntimeInitialized: function () {
        nowInUnixEpoch = Module.cwrap("nowInUnixEpoch", null, ["number", "number"]);

        console.log("Highresolution clock webasam loaded");
    }
}

function uint32(input) {
    return (new Uint32Array([input]))[0];
}

function HighResolutionClock_Now() {
    if (!nowInUnixEpoch)
        return 0;

    var upper_ptr = Module._malloc(4);
    var lower_ptr = Module._malloc(4);
    nowInUnixEpoch(upper_ptr, lower_ptr);
    let upper = Module.getValue(upper_ptr, "i32");
    let lower = Module.getValue(lower_ptr, "i32");
    upper = uint32(upper);
    lower = uint32(lower);
    let unix = BigInt(BigInt(upper) << 32n) | BigInt(BigInt(lower) & 0xffffffffn);
    Module._free(upper_ptr);
    Module._free(lower_ptr);
    return unix;
}

function HighResolutionClock_nanosec(ms) {
    return BigInt(ms * 1000000);
}

function HighResolutionClock_milliseconds(ns) {
    return Math.round(Number(ns/1000000n));
}