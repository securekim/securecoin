const WebScokets = require("ws");

const sockets = [];

const startP2PServer = server => {
    const wsServer = new WebScokets.Server({server});
    wsServer.on("connection", ws =>{
        console.log(`Hello ${ws}`);
    });
    console.log("Securecoin P2P Server Running");
};

module.exports = {
    startP2PServer
};
