/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Cell} from "./Cell";
import {Command} from "./Identifiers";
import * as cellParsers from "../routing/CellParser"
import {ParserResult} from "../routing/CellParser";

type CellEventHandler = (detail : ParserResult) => void;
type CellParser = (cell : Cell) => ParserResult;

class EventHandler {
    public Id : string;
    public Handler : CellEventHandler;

    constructor(id : string, handler : CellEventHandler){
        this.Id = id;
        this.Handler = handler;
    }
}

export class Dispatcher {
    private eventHandler : Map <number, Array<EventHandler>>;
    private parser : Map <number, CellParser>;

    constructor() {
        this.eventHandler = new Map<number, Array<EventHandler>>();

        this.parser = new Map<number, CellParser>();
        this.parser.set(Command.Versions, cellParsers.parseVersion);
        this.parser.set(Command.Certs, cellParsers.parseCertsCell);
        this.parser.set(Command.AuthChallenge, cellParsers.parseAuthChallengeCell);
        this.parser.set(Command.AuthBypass, cellParsers.parseAuthBypassCell);
        this.parser.set(Command.StreamRelay, cellParsers.parseStreamRelayCell);
        this.parser.set(Command.Created, cellParsers.parseCreatedCell);
        this.parser.set(Command.Relay, cellParsers.parseRelayCell);
        this.parser.set(Command.StreamCreated, cellParsers.parseStreamCreated);
    }

    addEventHandler(eventId : number, callback : CellEventHandler, id : string = "Anonymous") {
        if( !this.eventHandler.has(eventId)) {
            this.eventHandler.set(eventId, new Array<EventHandler>());
        }

        this.eventHandler.get(eventId).push(new EventHandler(id, callback));
    }

    dispatch(cell : Cell) {
        if(!this.parser.has(cell.command()))
            return;

       var parserResult =  this.parser.get(cell.command())(cell);
       this.propagate(parserResult, cell.command());
    }

    propagate(result, command) {
        const callbacks = this.eventHandler.get(command);
        if(callbacks) {
            for (let c of callbacks) {
                c.Handler(result);
            }
        }
    }

    removeHandlersById(id : string) {
        for (let [key, value] of this.eventHandler) {
            let i = 0;
            while (i < value.length) {
                if (value[i].Id === id) {
                    value.splice(i, 1);
                } else {
                    ++i;
                }
            }
        }
    }
}