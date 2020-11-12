
# Sample viewer application
The sample demonstrate receiving data from SDK thru nodejs and decodes the data for display and audio playing.
The sample uses H264 decoder imported as WASM for decoding video frames while uses Speex decoders for audio.

# Pre-requesite
Make sure nodes are running and available and streamer/broadcaster are accesible on the same network.

# To run the application
1. Run viewer/server/index.js as a nodejs expressjs app
2. Open browser and go to http://localhost:3002/client
3. In the pop-up window, specify the token stream to view. Token stream string looks like the following bellow
4. Wait for Video frames to display.
5. To enable audio receive, click "Allow Audio" button. Web API and HTML speicifcation policy does not allow 
automatic audio play.

For more information, read the inline comments.

# Known Issue
HTML Web API speicification generate a popping sound if the an audio is lacking and does not match the sampling rate set.
This demo has the issue when audio data to play is not enough. It is also due to single thread nature of Javascript, even if we have
multiple threads running for decoding, they will converge into the main thread for rendering/audio playing, which is single threaded
and will wait for its turn to be executed therefore starving the audio data and causing the clicking sound.
Worker thread event callback when triggeres is executed on the main thread.

# TODO
Lacking support for non-direct stream viewer, wherein instead of viewing the stream directly, a permission is asked to the streamer
whether to allow the viewer or not. This is not yet supported in the SDK, therefore not yet in the examples.