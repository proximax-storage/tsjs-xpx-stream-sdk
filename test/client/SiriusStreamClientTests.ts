import {SiriusStreamClient} from "../../src/client/SiriusStreamClient";
import {expect} from "chai";
import {RETRY_MAX_ATTEMPT, connectAttempt} from "../common/common";

const {getConfig, CONFIG_ENVIRONMENT_LOCAL, CONFIG_ENVIRONMENT_STAGING} = require("../../config/test-config");
let env = CONFIG_ENVIRONMENT_STAGING;

function loginAttempt(client, data, callback) {
    let retry = 0;

    let login = (client, data) => {
        client.loginUser(data, (presenceKey)=>{
            console.log("[Test] Announce Presence Key at "+ presenceKey);
            callback(true, presenceKey);
        })
    };

    client.OnError = (error) =>{
        if(error.indexOf('Announcement presence failur') != -1 && retry++ < RETRY_MAX_ATTEMPT) {
           login(client, data);
        }else{
            client.shutdown();
            callback(false, null);
        }
    };

   login(client, data);
}

function createChannelAttempt(client, partnerId, callback) {
    let retry = 0;

    let createChannel = (client, partnerId) => {
        client.createChannel(partnerId, null, (circuit, userId) => {
            callback(circuit, userId);
        });
    };

    client.OnError = (error) => {
        if (error.indexOf('Lookup presence failure') != -1 && retry++ < RETRY_MAX_ATTEMPT) {
            createChannel(client, partnerId);
        } else {
            client.shutdown();
            callback(null, null);
        }
    };

    createChannel(client, partnerId);
}

describe('Sirius Stream Client test', () => {
    it('can discover nodes', function(done) {
        this.timeout(20 * 1000);

        let client = new SiriusStreamClient(getConfig(env));
        connectAttempt(client, ()=>{
            expect(client.Discovery.NodeList.length).greaterThan(0);
            client.shutdown();
            done();
        });
    })

    it('can register user', function(done) {
        this.timeout(20 * 1000);

        let client = new SiriusStreamClient(getConfig(env));
        connectAttempt(client, ()=>{
            expect(client.Discovery.NodeList.length).greaterThan(0);

           client.register((data)=>{
               expect(data).not.equal(null);
               client.shutdown();
               done();
           })
        });
    })

    it('can announce presence user', function(done) {
        this.timeout(20 * 1000);

        let client = new SiriusStreamClient(getConfig(env));
        connectAttempt(client, ()=>{
            expect(client.Discovery.NodeList.length).greaterThan(0);

            client.register((data)=>{
                expect(data).not.equal(null);
                loginAttempt(client, data, (result, presenceKey) =>{
                    expect(result).equal(true);
                    client.shutdown();
                    done();
                });
            });
        });
    })

    it('can create Channel between users', async function() {
        this.timeout(60 * 1000);

        let client1 = new SiriusStreamClient(getConfig(env));
        let client2 = new SiriusStreamClient(getConfig(env));
        let client1Presence = '';
        let client2Presence = '';
        let circuit1 = null;
        let circuit2 = null;

        let login = (client, resolve, callback) => {
            connectAttempt(client, ()=>{
                expect(client.Discovery.NodeList.length).greaterThan(0);
                client.register((data)=>{
                    expect(data).not.equal(null);
                    loginAttempt(client, data, (result, presenceKey) =>{
                        expect(result).equal(true);
                        callback(presenceKey);
                        resolve();
                    });
                });
            });
        };

        let c1Promise = new Promise(function (resolve, reject){
            login(client1, resolve, (presence) =>{
                client1Presence = presence;
                console.log("[Test] Announce Presence Key success for client1");
            });
        });

        await c1Promise;

        // set channel invite callback in advance so it is set during login
        let channel2Promise = new Promise(function (resolve, reject){
            client2.OnChannelInvited = (circuit, userId)=>{
                expect(userId, client1Presence);
                circuit2 = circuit;
                resolve();
            }
        });

        let c2Promise = new Promise(function (resolve, reject){
            login(client2, resolve, (presence) =>{
                client2Presence = presence;
                console.log("[Test] Announce Presence Key success for client2");
            });
        });

        await c2Promise;

        expect(client1Presence.length).greaterThan(0);
        expect(client2Presence.length).greaterThan(0);

        let channel1Promise = new Promise(function (resolve, reject){
            // create channel from client 1 to client 2
            createChannelAttempt(client1, client2Presence, (circuit, id)=>{
                expect(id, client2Presence);
                circuit1 = circuit;
                resolve();
            });
        });

        await channel1Promise;
        await channel2Promise;

        // we are ready to send messages
        const message = "Hello Streaming";
        const reply = "Howdy mate";

        circuit1.sendUserDataString(message);

        let circuitMessagePromise = new Promise(function (resolve, reject){
            circuit2.OnReceivedUserDataString = (msg)=>{
               expect(msg).equal(message);
                circuit2.sendUserDataString(reply);
               resolve();
            }
        });

        let replyMessagePromise = new Promise(function (resolve, reject){
            circuit1.OnReceivedUserDataString = (msg)=>{
                expect(msg).equal(reply);
                resolve();
            }
        });

        await replyMessagePromise;
        await circuitMessagePromise;

        client1.shutdown();
        client2.shutdown();
    })
});