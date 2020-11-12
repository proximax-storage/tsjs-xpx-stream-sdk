/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

/**
 * checks if two array contents are the same
 * @param a - input 1
 * @param b - input 2
 */
export function isArraySame(a , b) : boolean{
    if( a.length != b.length) {
        return false;
    }

    for(let i = 0; i < a.length; i++) {
        if(a[i] != b[i]) {
            return false;
        }
    }

    return true;
}