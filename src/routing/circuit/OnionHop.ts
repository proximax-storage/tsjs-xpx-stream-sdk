/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {CircuitCryptoState, CircuitKeys} from "./CircuitCrypto";

export class OnionHop {
    public circuitKeys : CircuitKeys;
    public fwState : CircuitCryptoState;
    public backState : CircuitCryptoState;

    constructor() {
    }
}