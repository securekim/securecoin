const WebScokets = require("ws");
    BlockChain = require("./blockchain")
const { getLastBlock } = BlockChain;

const sockets = [];

// Message Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
    return {
        type: GET_LATEST,
        data: null
    }
}

const getAll = () =>{
    return {
        type: GET_ALL,
        data: null
    }
}

const blockchainResponse = (data) =>{
    return{
        type: BLOCKCHAIN_RESPONSE,
        data
    }
}

const getSockets = () => sockets;

const startP2PServer = server => {
    const wsServer = new WebScokets.Server({server});
    wsServer.on("connection", ws =>{
        initSocketConnection(ws);
        console.log(`Hello Socket`);
    });
    console.log("Securecoin P2P Server Running");
};

const initSocketConnection = ws =>{
    sockets.push(ws);
    handleSocketMessages(ws);
    handleSocketError(ws); //wow !! spliced socket events 
    sendMessage(ws, getLatest());
    // socket.on("message",(data) => {
    //     console.log(data);
    // });
    // setTimeout(()=>{
    //     socket.send("welcome");
    // },5000);
}

const parseData = data =>{
    try{
        return JSON.parse(data);
    }catch(e){
        console.log(e);
        return null;
    }
}

const handleSocketMessages = (ws) => {
    ws.on("message",data =>{
        const message = parseData(data);
        if(message == null){
            return;
        }
        console.log(message);
        switch(message.type){
            case GET_LATEST:
                sendMessage(ws, getLastBlock());
                break;
        }
    });
}

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

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
