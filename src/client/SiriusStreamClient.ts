/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/
import {Discovery, EntryNode} from "./Discovery";
import {Authentication} from "./Authentication";
import {Log, setGlobalErrorHandler, setLogCallback} from "../utils/Logger";
import {SignedEd25519KeyPair} from "../cert/KeyPair";
import {AnnouncePresence} from "./AnnouncePresence";
import {LookUpPresenceManager} from "./LookupPresenceManager";
import {OnChannelCreated} from "./Rendezvous";

/**
 * Callback types definition
 * OnSiriusStreamCallback : generic callback where any types can be passed
 * OnRegisterSucceed : user registration data is confirmed by nodes
 */
export type OnSiriusStreamCallback = (any?) => void;
export type OnRegisterSucceed = (data) => void;

/**
 * The main entry point for the SDK as a client to the nodes
 */
export class SiriusStreamClient {

    /**
     * objects to manage Discovery, authentication (register) and announce presence(login)
     */
    private discovery : Discovery = null;
    private authentication : Authentication = null;
    private annuncePresence: AnnouncePresence = null;
    private lookup: LookUpPresenceManager = null;
    /**
     * Callback event triggered from SDK
     */
    private onApplicationReady : OnSiriusStreamCallback;
    private onLoginSucess : OnSiriusStreamCallback;
    private onRegisterSucceed : OnRegisterSucceed;
    private onChannelCreated : OnChannelCreated;
    private onChannelInvited : OnChannelCreated;

    /**
     * Stores the certificates after registration and the current data used by this object
     */
    private readonly certificateCached : Array<SignedEd25519KeyPair>;
    private currentLoginData : SignedEd25519KeyPair;

    /**
     * config file that contains bootstrap nodes, hop info, etc. used by the SDK.
     */
    private readonly config : any = null;

    /**
     * Create the sirius stream client object
     * @param conf - config JSON object
     */
    constructor(conf : any) {
        this.certificateCached = new Array<SignedEd25519KeyPair>();
        this.config = conf;
    }

    /**
     * Starts the discovery process, thus starting the app
     * @param onReady - callback when application is ready
     */
    start(onReady? : OnSiriusStreamCallback) {

        if(!this.config)
            throw("Config not set");

        var context = this;
        let bootstrap = this.config.bootstrap[Math.floor(Math.random()*this.config.bootstrap.length)];

        if(onReady)
            this.onApplicationReady = onReady;

        this.discovery = new Discovery();
        this.discovery.requestDiscovery(new EntryNode(bootstrap.address, bootstrap.port, bootstrap.fingerprint));
        this.discovery.OnDiscoveryChanged = () =>{
            Log("Application ready");
            if(context.onApplicationReady)
                context.onApplicationReady();
        };
    }

    /**
     * set the current login data (explicitly)
     * @param data - authentication data
     */
    set CurrentLoggedinData(data : SignedEd25519KeyPair) {
        // @ts-ignore
        this.currentLoginData = data;
    }

    /**
     * start authentication and registration process,
     * once registered nodes provide certificate data
     * @param callback
     */
    register(callback? : OnRegisterSucceed) {
        var context = this;
        if(this.discovery.NodeList.length == 0)
            throw ("There are no nodes available to connect, perform start() firsst");

        if(callback)
            this.onRegisterSucceed = callback;

        this.authentication = new Authentication(this.config);
        this.authentication.Nodes = this.discovery.NodeList;
        this.authentication.registerUser();
        this.authentication.addOnRegistrationComplete((data) => {
            context.certificateCached.push(data);
            if(context.onRegisterSucceed)
                context.onRegisterSucceed(data);
        })
    }

    /**
     * login user, announce presensence
     * @param userData - certificate data provided during registration
     * @param onSuccess - callback when login succeed, for fail use the global error callback
     * @param onInvited - callback when another user invite to create channel
     */
    loginUser(userData : SignedEd25519KeyPair, onSuccess? : OnSiriusStreamCallback, onInvited? : OnChannelCreated) {
        if(onSuccess)
            this.onLoginSucess = onSuccess;

        if(onInvited)
            this.onChannelInvited = onInvited;

        var context = this;
        this.annuncePresence = new AnnouncePresence(this.config);
        this.annuncePresence.Nodes = this.discovery.NodeList;
        this.annuncePresence.OnInvitedToChannel = this.onChannelInvited;
        this.annuncePresence.OnAnnouncePresenceSucess = (pressenceKey)=> {
            context.CurrentLoggedinData = userData;
            if(context.onLoginSucess)
                context.onLoginSucess(pressenceKey);
        };

        this.annuncePresence.loginUser(userData);
    }

    /**
     * create a channel with another user, a channle is needed to communicate thru the nodes
     * @param userId - user identity of user to invite.
     * @param userData - user current registration certificate
     * @param onSuccess - callback when channel is created succesfully
     */
    createChannel(userId : string, userData : SignedEd25519KeyPair = null, onSuccess? : OnChannelCreated) {

        if(onSuccess)
            this.onChannelCreated = onSuccess;

        this.lookup = new LookUpPresenceManager(this.config);

        // @ts-ignore
        this.lookup.Signature = (userData)? userData : this.currentLoginData;
        this.lookup.OnChannelCreateSuccess = this.onChannelCreated;
        this.lookup.do(userId, this.discovery.NodeList);
    }


    /**
     * Closes and disconnects
     */
    shutdown() {
        if(this.discovery)
            this.discovery.shutdown();
        if(this.authentication)
            this.authentication.shutdown();
        if(this.annuncePresence)
            this.annuncePresence.shutdown();
        if(this.lookup)
            this.lookup.shutdown();

        this.discovery = null;
        this.authentication = null;
        this.annuncePresence = null;
        this.lookup = null;
    }
    /**
     * Event when SDK is ready after discovery where pulled from nodes
     */
    set OnApplicationReady(callback : OnSiriusStreamCallback) {
        this.onApplicationReady = callback;
    }

    /**
     * Event when authetication/registration completes without error
     * the callback passes a authentication data that user application must
     * store (in memoery, file), the data will be used for login
     */
    set OnRegistrationComplete(callback : OnRegisterSucceed) {
        this.onRegisterSucceed = callback;
    }

    /**
     * Event when login succeed
     */
    set OnLoginSucees(callback : OnSiriusStreamCallback) {
        this.onLoginSucess = callback;
    }

    /**
     * Event triggered when a channel was established to a user
     * event triggered by createChannel, when an invite to another user
     * was established succesfuly
     */
    set OnChannelCreated(callback : OnChannelCreated) {
        this.onChannelCreated = callback;
    }

    /**
     * Event triggered when a channel was established from a different user
     */
    set OnChannelInvited (callback : OnChannelCreated) {
        this.onChannelInvited = callback;

        if(this.annuncePresence)
            this.annuncePresence.OnInvitedToChannel = callback;
    }

    /**
     * Event triggered when there is a general error in the SDK
     */
    set OnError(callback : (message : string) => void) {
        setGlobalErrorHandler(callback)
    }

    set OnLog(callback: (message:string) => void) {
        setLogCallback(callback);
    }

    /**
     * Retrieves the cached registered data
     */
    get CertificateCached() {
        return this.certificateCached;
    }

    /**
     * Retrieves the discovery node, primarily used for retrieving nodes
     */
    get Discovery() : Discovery {
        return this.discovery;
    }
}