const path = require('path');
const SiriusStreamClient = require('tsjs-xpx-stream-sdk').SiriusStreamClient;
const getConfig = require("../../../config/test-config");

const express = require('express');
const app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);


/**
 * node server saved the authentication data during registration
 * and provide a key to user to access, so on the next login,
 * client can just use the cached/stored registration data and not
 * re-register
 * */
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
            /**
             * On login success
             * */
            (presenceKey)=>{
                client.emit("login_result", {
                    status :  true,
                    message: "Announced at :    " + presenceKey
                });
            },

            /**
             * On Invited event
             * */
            (circ, userId)=>{
                circuit = circ;
                circuit.UsingRawData = false;

                client.emit("chat_invite", {
                   inviter : userId
                });

                /**
                 * On creation of channel, user can already communicate by sending raw data, therefore we also
                 * setup path ways for communiation so it can be displayed in frontend
                 * */
                setUpRawCommunication(circuit, client);
            });
    });

    client.on('connect_to_user', (data) => {
        siriusStream.createChannel(data.userID, null, (circ, userId)=>{
            circuit = circ;
            circuit.UsingRawData = false;
            client.emit("channel_created", {
                userID : userId
            });

            /**
             * open raw channel communication to frontend as well
             * */
            setUpRawCommunication(circuit, client);

            /**
             * Since user sent the invite, we listen to event if user approved or denied the request
             * */
            circuit.OnConfirmedChannel = ()=> {
                client.emit("channel_invite_result", {
                    userID : userId,
                    result : true
                });

                setUpCircuit(circuit, client);
            };

            circuit.OnDeniedChannel = ()=> {
                client.emit("channel_invite_result", {
                    userID : userId,
                    result : false
                });
            };
        });
    });

    client.on('raw_message', (data) => {
        if(circuit == null)
           return;

        circuit.sendRawDataString(data.message);
    });

    client.on('user_message_str', (data) => {
        if(circuit == null)
            return;

        circuit.sendUserDataString(data.message);
    });

    client.on('confirm_channel',(response)=>{
        if(circuit == null)
            return;

        if(response) {
            circuit.confirmChannel();

            setUpCircuit(circuit, client);
        }
        else {
            circuit.denyChannel();
        }
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


function setUpCircuit(circuit, client) {
    circuit.OnReceivedUserDataString = (message)=>{
        client.emit("on_user_msg_str", {
            message : message
        });
    }

    circuit.OnReceivedUserDataRaw = (data) =>{
        // blank
    };
}

function setUpRawCommunication(circuit, client) {
    circuit.OnRawData = (data) =>{
        client.emit("on_raw_data", {
            data : data
        });
    };
}
