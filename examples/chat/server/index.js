const path = require('path');
const SiriusStreamClient = require('tsjs-xpx-stream-sdk').SiriusStreamClient;

const express = require('express');
const app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);

// node server saved the authentication data during registration
// and provide a key to user to access, so on the next login,
// client can just use the cached/stored registration data and not
// re-register
let keyID = 0;
let registration_cache = [];

http.listen(3000, function () {
    console.log("listening in port 3000");
});

//listen on every connection
io.on('connection', (client) => {
    console.log('New user connected');

    //default username
    client.username = "Anonymous";

    let siriusStream = new SiriusStreamClient(getConfig());
    let circuit = null;

    client.on('initialize', (data) => {
        siriusStream.start();
        siriusStream.OnApplicationReady = () => {
            client.emit("application_ready","");
        };
    });

    client.on('register', (data) => {
        // register to the node/server
        // the returning info is saved on the server and return a key/id to client
        siriusStream.register((data)=>{
            let id = ++keyID;
            client.emit("registration_complete", {
                registration_id :  id
            });

            registration_cache.push( {
                registration_id : id,
                data: data,
                client : siriusStream
            });
        });
    });

    client.on('login', (data) => {
        // login using register data information
        // client uses id returned during register on login.
        // search provided from cache
        let cache = registration_cache.find((r)=> r.registration_id == data.registration_id );
        if(!cache) {
            client.emit("login_result", {
                status :  false,
                message: "Registration ID not found"
            });
        }

        cache.client.loginUser(cache.data,
            // login success
            (presenceKey)=>{
                client.emit("login_result", {
                    status :  true,
                    message: "Announced at :" + presenceKey
                });
            },

            // on invited event
            (circ, userId)=>{
                circuit = circ;
                client.emit("chat_invite", {
                   inviter : userId
                });

                circuit.OnMessageReceived = (message) => {
                    client.emit("message_received", {
                        message : message
                    });
                };
            });
    });

    client.on('connect_to_user', (data) => {
        siriusStream.createChannel(data.userID, null, (circ, userId)=>{
            circuit = circ;
            client.emit("channel_created", {
                userID : userId
            });

            circuit.OnMessageReceived = (message) => {
                client.emit("message_received", {
                    message : message
                });
            };
        });
    });

    client.on('message', (data) => {
       if(circuit == null)
           return;

        circuit.sendMessage(data.message);
    });
})


// HTTP stuff
app.get('/client', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

app.get('/client/index.js',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/index.js'));
});

app.get('/client/style.css',function(req,res){
    res.sendFile(path.resolve(__dirname, '../client/style.css'));
});

//middlewares
app.use(express.static('public'));

function getConfig() {
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

    return config;
}