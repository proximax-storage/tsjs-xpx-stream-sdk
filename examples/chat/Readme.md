
# Sample broadcaster application
The sample demonstrate private chat feature of Sirius stream using the TS/JS SDK.

# Pre-requesite
Nodes should be running and accessible in the network.

# To run the application
1. Run chat/server/index.js as a nodejs expressjs app
2. Open browser and go to http://localhost:3000/client
3. Click on "Initialize" button and wait for application to get ready.
4. If this is the first run, click on "Register" button and wait for confirmation. The server will provide a registration ID 
to be used for logging in. 
If this is a succeeding run. Click on "Login" button instead and provide the registration ID provided by the the server previously.
5. Click on "Login" button, a popup will be displayed asking for a registration ID. Enter ID provided during registration. 
After a successful login, a presence key token will be provided, that will be your identity in the network.
6. If you are ready to chat and you know the presence key of the other party, click on "Chat with User" and provided the presence key.
Wait until a channel is successfully created.
   
   6.1 When invited by a user, click on accept.

7. Sends a message.

You can confirm the private chat established by running two instance of the application and communicate between them.

For more information, read the inline comments in the code.
