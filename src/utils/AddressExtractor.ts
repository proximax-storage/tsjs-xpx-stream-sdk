/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

/**
 * extract host and port from a string
 * @param address - host address with port
 */
export function  extractHostAndIP(address : string) {
    var r = address.split(':');
    return {
        host: r[0],
        port: parseInt(r[1])
    };
}