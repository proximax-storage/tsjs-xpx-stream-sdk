export const RETRY_MAX_ATTEMPT = 10;

export function connectAttempt(client, callback) {
    let retry = 0;
    client.start();
    client.OnApplicationReady = () => {
        // we retry connection since sometimes discovery returns 0 nodes due to nodes
        // performing voting or still booting up, or still connection issue
        if (client.Discovery.NodeList.length <= 0 && retry++ < RETRY_MAX_ATTEMPT) {
            client.start();
            return;
        }

        callback();
    };
}