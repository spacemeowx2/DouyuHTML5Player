var ports = [];
onconnect = function(event) {
    var port = event.ports[0];
    ports.push(port);
    port.start();
    port.onmessage = function(event) {
        for (var i = 0; i < ports.length; ++i) {
            if (ports[i] != port) {
                ports[i].postMessage(event.data);
            }
        }
    };
};