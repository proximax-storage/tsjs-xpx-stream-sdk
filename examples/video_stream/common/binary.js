 function GetUint16(b , startIndex) {
    let temp = b[startIndex + 1];        // bounds check hint to compiler;
    return (b[startIndex + 1] & 0xFFFF)  | (b[startIndex] & 0xFFFF)<< 8;
}

function GetUint32(b, startIndex) {
    let temp = b[startIndex + 3];        // bounds check hint to compiler;
    return (b[startIndex+3]) | (b[startIndex+2])<<8 | (b[startIndex+1])<<16 | (b[startIndex])<<24;
}

function PutUint64(b, v, startIndex) {
     var _ = b[7] // early bounds check to guarantee safety of writes below
     b[startIndex] = (Number(v >> 56n));
     b[startIndex+1] = (Number(v >> 48n));
     b[startIndex+2] = (Number(v >> 40n));
     b[startIndex+3] = (Number(v >> 32n));
     b[startIndex+4] = (Number(v >> 24n));
     b[startIndex+5] = (Number(v >> 16n));
     b[startIndex+6] = (Number(v >> 8n));
     b[startIndex+7] = (Number(v));
}

function PutUint64LE(b, v, startIndex) {
    b[startIndex+0] = Number(v);
    b[startIndex+1] = Number(v >> 8n);
    b[startIndex+2] = Number(v >> 16n);
    b[startIndex+3] = Number(v >> 24n);
    b[startIndex+4] = Number(v >> 32n);
    b[startIndex+5] = Number(v >> 40n);
    b[startIndex+6] = Number(v >> 48n);
    b[startIndex+7] = Number(v >> 56n);
}

function GetUint64(b, startIndex) {
 var _ = b[startIndex+7] // bounds check hint to compiler; see golang.org/issue/14808
 return BigInt(b[startIndex+7]) | BigInt(b[startIndex+6])<<8n | BigInt(b[startIndex+5])<<16n | BigInt(b[startIndex+4])<<24n |
     BigInt(b[startIndex+3])<<32n | BigInt(b[startIndex+2])<<40n | BigInt(b[startIndex+1])<<48n | BigInt(b[startIndex+0])<<56n;
}