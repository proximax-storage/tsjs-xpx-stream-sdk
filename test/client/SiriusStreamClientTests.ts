import {SiriusStreamClient} from "../../src/client/SiriusStreamClient";

describe('Sirius Stream Client test', () => {
    it('can register user', () => {
        var config = {
            "bootstrap" : [{
                "fingerprint" : "39F55A3B00FB4E372553ABCB9763680EEF7A85CF49A12335B740C86D95CE7DBA",
                "address" : "discovery1",
                "port" : 6001,
                "identity" : "xpx.discovery.node.6r7hhn9em5jT7FMX1XUdT3rmzvLR9anrfeCPwDy9CNnfvgUrR"
                },
                {
                "fingerprint" : "5AD8CEBB10D0521274FFC202A3D356DFD86453C0A12E2F02C2BE087A842CCD53",
                "address" : "discovery5",
                "port" : 6005,
                "identity" : "xpx.discovery.node.9H8hXQ31pM9YWRBgi2ahn3X2hdSuVrWR78iJ2eo1SwWhktjgt"
                }
                ],
            "hops" : {
                "authentication" : 2,
                "announcePresence" : 3,
                "lookupPresence" : 3,
                "forwardPresence": 2
            }
        };

      let client = new SiriusStreamClient(config);
      let userdata = null

       client.start();
       client.OnApplicationReady = () => {
           client.register((data)=>{
               userdata = data;     //demonstrate that users of sdk needs to store it at app level
               client.loginUser(data);
           });
       };

       client.OnLoginSucees =(presenceKey)=>{
         //  var userId = "sirius.client.account.MVtLwMU3E7JydgTZnKrfmrMM146nKS32cYcmjtqN5zTxkqfGr";
         //  client.createChannel(userId, null);
       };
    })
});