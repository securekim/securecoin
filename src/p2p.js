const WebScokets = require("ws");

const sockets = [];

const getSockets = () => sockets;

const startP2PServer = server => {
    const wsServer = new WebScokets.Server({server});
    wsServer.on("connection", ws =>{
        console.log(`Hello Socket`);
    });
    console.log("Securecoin P2P Server Running");
};

const initSocketConnection = socket =>{
    sockets.push(socket);
}

const connectToPeers = newPeer => {
    const ws = new WebScokets(newPeer);
    ws.on("open", () => {
        initSocketConnection(ws);
    });
}


module.exports = {
    startP2PServer,
    connectToPeers
};
