import {SiriusStreamClient} from "../../src/client/SiriusStreamClient";

describe('Sirius Stream Client test', () => {
    it('can register user', () => {
        var config = {
            "bootstrap" : [{
                "fingerprint" : "15BD35F29D087DC1E33F5E4B2A0C7551C8212A506CBB1E946D299F7CFE892578",
                "address" : "discovery1",
                "port" : 6001,
                "identity" : "psp.discovery.node.2h2CF1JrVkbYFn2ynq5atK4FV6kRLepHEZFMLmAxRAjQzm9AJX"
                },
                {
                "fingerprint" : "BCB322D1626F75C06AA1BD31536EEA84CDAC7232F1CC7851A31AED57713BDF6B",
                "address" : "discovery5",
                "port" : 6005,
                "identity" : "psp.discovery.node.2Hz7aA5MJ3BXHM3UFYvZZjuZJgzcapApqAkLHcq6VSzHLRGiM5"
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
         //  var userId = "peerstream.client.account.MVtLwMU3E7JydgTZnKrfmrMM146nKS32cYcmjtqN5zTxkqfGr";
         //  client.createChannel(userId, null);
       };
    })
});