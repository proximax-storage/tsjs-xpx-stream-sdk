/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell, DetailedCell, NewVariableCell} from "../Cell";
import {CellFactory} from "../CellFactory";
import * as defines from "../Identifiers";
import * as cmd from "../Command";
import {PutUint16} from "../../utils/Binary";
import * as caster from "../../utils/typeCaster"

export class AuthChallengeCell extends DetailedCell implements CellFactory {
    private challenge : Buffer;
    private methods : Uint16Array;
    constructor() {
        super(defines.Command.AuthChallenge);
        this.methods = new Uint16Array(32);
    }

    setChallenge(challenge) {
        this.challenge = challenge;
    }

    getMethods() {
        return this.methods;
    }

    createCell() : Cell {
        var m = this.methods.length;
        var n = 32 + 2 + 2*m;

        var c = NewVariableCell(0, defines.Command.AuthChallenge, caster.int16(n));
        var offset = cmd.PayloadOffset(defines.Command.AuthChallenge);
        var data = c.getData();

        var methodBuffer = new Buffer(this.methods);
        methodBuffer.copy(data, offset);
        PutUint16(data, caster.int16(m), 32);

        let ptr = 34;
        for(let i = 0; i < this.methods.length; i++) {
            PutUint16(data, caster.int16(this.methods[i]), ptr);
            ptr += 2;
        }

        return c;
    }

    supportsMethod(m) : boolean {
        for(let i = 0; i < this.methods.length; i++) {
            if(this.methods[i] == m)
                return true;
        }

        return false;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

// AuthBypassCell represents AUTH_BYPASS cell
export class AuthBypassCell extends DetailedCell implements CellFactory {
    constructor() {
        super(defines.Command.AuthBypass);
    }

    createCell() : Cell {
        var c = NewVariableCell(0, defines.Command.AuthBypass, 0);
        return c;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
