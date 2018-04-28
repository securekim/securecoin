const WebScokets = require("ws");

const sockets = [];

const getSockets = () => sockets;

const startP2PServer = server => {
    const wsServer = new WebScokets.Server({server});
    wsServer.on("connection", ws =>{
        initSocketConnection(ws);
        console.log(`Hello Socket`);
    });
    console.log("Securecoin P2P Server Running");
};

const initSocketConnection = socket =>{
    sockets.push(socket);
    socket.on("message",(data) => {
        console.log(data);
    });
    setTimeout(()=>{
        socket.send("welcome");
    },5000);
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
