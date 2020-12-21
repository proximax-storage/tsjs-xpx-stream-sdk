const CONFIG_ENVIRONMENT_LOCAL = 0;
const CONFIG_ENVIRONMENT_STAGING = 1;

function getConfig(env = CONFIG_ENVIRONMENT_LOCAL) {
    switch(env) {
        case CONFIG_ENVIRONMENT_LOCAL:
            return getConfigLocal();
        case CONFIG_ENVIRONMENT_STAGING:
            return getConfigStaging();
    }
}

function getConfigLocal() {
    var config = {
        "bootstrap" : [
            {
                "address": "discovery1",
                "port": 6001,
                "identity": "xpx.discovery.node.6r7hhn9em5jT7FMX1XUdT3rmzvLR9anrfeCPwDy9CNnfvgUrR",
                "fingerprint": "39F55A3B00FB4E372553ABCB9763680EEF7A85CF49A12335B740C86D95CE7DBA",
            },
            {
                "address": "discovery2",
                "port": 6002,
                "identity": "xpx.discovery.node.291oKY42Xn1Dd25fRpDxcRxD6tQMHKWt2yU44pCGsGLTQ3tmyC",
                "fingerprint": "6C689A29F62AD016D51FF309063585176E90BEE09DB5C9D0C35BB3AF3879F573",
            },
            {
                "address": "discovery3",
                "port": 6003,
                "identity": "xpx.discovery.node.iuZ7kVgWd95TwrkduBFaZMtteLV6pHLKD7W5cZToaFznWkBpY",
                "fingerprint": "F40759E4417825C6253AAD676A5DDEEF04A569F2EADB6CAC13FA7C7163E0038E",
            },
            {
                "address": "discovery4",
                "port": 6004,
                "identity": "xpx.discovery.node.BknYLk69thJEC5a4duZBnR4DM1PuQjiSd3xh1ub7uE9c5gnWd",
                "fingerprint": "2C99C27F38958A8809545EFD52B87B7D094884A4A6BBC7C68F7ABCBDC7AE1C33",
            },
            {
                "address": "discovery5",
                "port": 6005,
                "identity": "xpx.discovery.node.9H8hXQ31pM9YWRBgi2ahn3X2hdSuVrWR78iJ2eo1SwWhktjgt",
                "fingerprint": "5AD8CEBB10D0521274FFC202A3D356DFD86453C0A12E2F02C2BE087A842CCD53",
            }
        ],
        "hops" : {
            "authentication" : 2,
            "announcePresence" : 3,
            "lookupPresence" : 3,
            "forwardPresence": 2
        }
    };

    return config;
}

function getConfigStaging() {
    var config = {
        "bootstrap" : [
            {
                "address": "stream-testnet-1.xpxsirius.io",
                "port": 6001,
                "identity": "xpx.discovery.node.6r7hhn9em5jT7FMX1XUdT3rmzvLR9anrfeCPwDy9CNnfvgUrR",
                "fingerprint": "39F55A3B00FB4E372553ABCB9763680EEF7A85CF49A12335B740C86D95CE7DBA",
            },
            {
                "address": "stream-testnet-1.xpxsirius.io",
                "port": 6002,
                "identity": "xpx.discovery.node.291oKY42Xn1Dd25fRpDxcRxD6tQMHKWt2yU44pCGsGLTQ3tmyC",
                "fingerprint": "6C689A29F62AD016D51FF309063585176E90BEE09DB5C9D0C35BB3AF3879F573",
            },
            {
                "address": "stream-testnet-1.xpxsirius.io",
                "port": 6003,
                "identity": "xpx.discovery.node.iuZ7kVgWd95TwrkduBFaZMtteLV6pHLKD7W5cZToaFznWkBpY",
                "fingerprint": "F40759E4417825C6253AAD676A5DDEEF04A569F2EADB6CAC13FA7C7163E0038E",
            },
            {
                "address": "stream-testnet-1.xpxsirius.io",
                "port": 6004,
                "identity": "xpx.discovery.node.BknYLk69thJEC5a4duZBnR4DM1PuQjiSd3xh1ub7uE9c5gnWd",
                "fingerprint": "2C99C27F38958A8809545EFD52B87B7D094884A4A6BBC7C68F7ABCBDC7AE1C33",
            },
            {
                "address": "stream-testnet-1.xpxsirius.io",
                "port": 6005,
                "identity": "xpx.discovery.node.9H8hXQ31pM9YWRBgi2ahn3X2hdSuVrWR78iJ2eo1SwWhktjgt",
                "fingerprint": "5AD8CEBB10D0521274FFC202A3D356DFD86453C0A12E2F02C2BE087A842CCD53",
            }
        ],
        "hops" : {
            "authentication" : 2,
            "announcePresence" : 3,
            "lookupPresence" : 3,
            "forwardPresence": 2
        }
    };

    return config;
}

module.exports = {getConfig, CONFIG_ENVIRONMENT_LOCAL, CONFIG_ENVIRONMENT_STAGING};