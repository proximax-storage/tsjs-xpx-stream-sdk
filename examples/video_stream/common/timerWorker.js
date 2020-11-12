// this worker is an attemp to produce a more consistent timer compare to the default setInterval() functio
// as workers run as a real thread in the OS
// setInterval is truly a single thread on javascript event queue and caused timing issues.
// created by ruellm@yahoo.com
var _this = this;
let timer = null;

_this.onmessage = function(e) {
    if(e.data.command == "start") {
        timer = setInterval(function () {
            _this.postMessage(0);
        }, e.data.payload);
    }else if(e.data.command == "stop") {
        clearInterval(timer);
    }
};



