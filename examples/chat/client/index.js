
let socket = io.connect('http://localhost:3000/');
let logged_in = false;
let chat_mate = null;

function appendToMessage(message) {
    var node = document.createElement("p");
    var textnode = document.createTextNode(message);
    node.appendChild(textnode);

    let chatroom = document.getElementById("chatroom");
    chatroom.appendChild(node);
}
socket.on('application_ready', (data) => {
    appendToMessage("Application ready ...");
});

socket.on('registration_complete', (data) => {
    appendToMessage("Registration complete with Registration ID "+ data.registration_id+" ...");
});

socket.on('login_result', (data) => {
    logged_in = (data.status);
    let status = (logged_in)? "Success" : "Fail";
    appendToMessage("Login status : "+ status + ": " + data.message+"...");
});

socket.on('channel_created', (data) => {
    chat_mate = data.userID;
    appendToMessage("Channel created with user "+ chat_mate +"...");
});

socket.on('chat_invite', (data) => {
    appendToMessage("chat invited by "+ data.inviter +"...");
});

socket.on('message_received', (data) =>{
    appendToMessage(chat_mate + " : " + data.message);
});

function initialize() {
    socket.emit('initialize', "");
}

function register() {
    socket.emit('register', "");
}

function login() {
    let regID = prompt("Please enter registration ID", "");
    if(regID.length == 0){
        alert("You need to specify the ID provided by the server during registration");
        return;
    }

    socket.emit('login', {
        registration_id : regID
    });
}

function chat() {

    if(!logged_in)
        return;

    // popup a window asking for key ID
    let userID = prompt("Please enter user ID to invite", "");
    if(userID.length == 0){
        return;
    }

    socket.emit('connect_to_user', {
       userID : userID
    });
}

function sendMessage() {

    let input = document.getElementById("message");
    let message = input.value;

    appendToMessage("me : "+ message);

    socket.emit('message', {
        message: message
    });

    input.value = '';
}