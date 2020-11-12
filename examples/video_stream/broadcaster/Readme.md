
# Sample broadcaster application
The sample demonstrate broadcasting image and audio frame thru the Proximax's stream network. Data are captured, encoded
and sends thru the network using SDKs. WASM decoders for x264 and speex are used in web worker to perform encoding.

# Pre-requesite
Nodes should be running and config is set pointing to the nodes.

# To run the application
1. Run broadcaster/server/index.js as a nodejs expressjs app
2. Open browser and go to http://localhost:3000/client
3. Click on the Start streaming! An stream token address is then displayed on the frontend.
4. To enable audio broadcast, click "Stream Audio" button.

To confirm broadcast, open any Stream viewer application (see examples/viewer or C++ Backchannel console) and type in
the stream token address generated on step 3.

For more information, read the inline comments in the code.