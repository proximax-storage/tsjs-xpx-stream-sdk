/**
 * ported with slight modifications from https://github.com/islishude/bs58js
 * */
const table = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const zero = 0n;
const base = 58n;

export const encode = (hex: string) => {
    let x =
        hex.length === 0
            ? zero
            : hex.startsWith("0x") || hex.startsWith("0X")
            ? BigInt(hex)
            : BigInt("0x" + hex);

    let res = "";

    while (x > zero) {
        res = table[Number(x % base)] + res;
        x = x / base;
    }

    for (let i = 0; i < hex.length; i += 2) {
        if (hex[i] === "0" && hex[i + 1] === "0") {
            res = "1" + res;
        } else {
            break;
        }
    }
    return res;
};

export const decode = (raw: string): string => {
    let leader = "";
    let bn = 0n;
    let isBreak = false;

    for (let i = 0; i < raw.length; i++) {
        const curChar = raw.charAt(i);
        const weight = table.indexOf(curChar);
        if (weight === -1) {
            throw new Error("Invalid param");
        }

        bn = bn * base + BigInt(weight);

        if (!isBreak) {
            if (i - 1 > 0 && raw[i - 1] !== "1") {
                isBreak = true;
                continue;
            }
            if (curChar === "1") {
                leader += "00";
            }
        }
    }

    if (bn === zero) {
        return leader;
    }

    let res = leader + bn.toString(16);
    if (res.length % 2 !== 0) {
        res = "0" + res;
    }
    return res;
};

export default { decode, encode };