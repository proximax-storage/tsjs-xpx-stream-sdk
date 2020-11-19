/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

/**
 * Defined AuthMethod values.
 * */
export const AuthMethod = Object.freeze({
        RSASHA256TLSSecret : 1,
        AllowBypass        : 2
});

export const Command = Object.freeze({
        Create        : 2,
        Padding       : 1,
        Created       : 3,
        Destroy       : 4,
        Relay         : 5,
        Versions      : 128,
        AuthBypass    : 129,
        Certs         : 130,
        AuthChallenge : 131,
        Authenticate  : 132,
        StreamCreate  : 133,
        StreamRelay   : 134,
        StreamDestroy : 135,
        StreamCreated : 136
});

export const CertType = Object.freeze({
        Link     : 1,
        Identity : 2,
        Auth     : 3
});

/**
 *  MaxPayloadLength defines maximum fixed cell size.
 * */
export const MaxPayloadLength = 509

export function IsCommand(command : number) {
        let allowedCommands = new Map([
                [Command.Padding, true],
                [Command.Create, true],
                [Command.Created, true],
                [Command.Destroy, true],
                [Command.Relay, true],
                [Command.StreamCreate, true],
                [Command.StreamRelay, true],
                [Command.StreamDestroy, true],
                [Command.AuthBypass, true],
                [Command.Versions, true],
                [Command.Certs, true],
                [Command.AuthChallenge, true],
                [Command.Authenticate, true],
                [Command.StreamCreated, true],
        ]);

        if(!allowedCommands.has(command))
                return false;

        return allowedCommands.get(command);
}

export const Relay = Object.freeze({
        Extend                : 1,
        Extended              : 2,
        Escape                : 3,
        EstablishRendezvous   : 4,
        RendezvousEstablished : 5,
        JoinRendezvous        : 6,
        RendezvousJoined1     : 7,
        RendezvousJoined2     : 8
});

export const StreamError = Object.freeze({
        Unknown      : 0,
        Closed       : 1,
        Protocol     : 2,
        NotSupported : 3,
        Duplicate    : 4
});

/**
 * HandshakeType is the only supported handshake type for us
 * */
export const HandshakeTypeDefault = 1;

/**
 * All the supported relay commands
 * */
export const RelayCommandType = Object.freeze({
        RelayUserData               : 0,
        RelayExtend                 : 1,
        RelayExtended               : 2,
        RelayEscape                 : 3,
        RelayEstablishRendezvous    : 4,
        RelayRendezvousEstablished  : 5,
        RelayJoinRendezvous         : 6,
        RelayRendezvousJoined1      : 7,
        RelayRendezvousJoined2      : 8
});

/**
 * All the supported media streaming commands
 * */
export const MediaProtocol = Object.freeze({
        Register : 1,
        Join : 2
});
