/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

type LogCallback = (message : string) => void;

let extraLogger : LogCallback= null;
let onError :  LogCallback=  null;

/**
 * adds additional receiver for log
 * @param callback
 */
export function setLogCallback(callback : LogCallback) {
    extraLogger = callback;
}

/**
 * sets the error callback from client side
 * @param callback
 */
export function setGlobalErrorHandler(callback : LogCallback) {
    onError = callback;
}

/**
 * global log function
 * @param msg
 */
export function Log(msg) {
    var today = new Date();
    var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    let logMsg = "[" + date + " " + time + "]: " + msg;

    console.log(logMsg);

    if(extraLogger)
        extraLogger(logMsg);
}

/**
 * error loger
 * @param msg
 */
export function ErrorLog(msg) {
    Log(msg);
    if(onError)
        onError(msg);
}