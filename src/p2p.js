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
    handleSocketError(socket);
    socket.on("message",(data) => {
        console.log(data);
    });
    setTimeout(()=>{
        socket.send("welcome");
    },5000);
}

const handleSocketError = ws =>{
    const closeSocketConnection = ws => {
        ws.close();
        //for dead socket
        sockets.splice(sockets.indexOf(ws),1); // WOW !!!!!! AWESOME
    };
    ws.on("close", ()=>closeSocketConnection(ws));
    ws.on("error", ()=>closeSocketConnection(ws));
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
