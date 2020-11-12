/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell} from "./Cell"

export interface CellFactory {
    createCell(): Cell;
}
