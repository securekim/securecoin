const WebScokets = require("ws");
    BlockChain = require("./blockchain")
const { isBlockStructureValid, addBlockToChain, getNewestBlock, replaceChain, getBlockChain} = BlockChain;

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
                sendMessage(ws, responseLatest());
                break;
            case GET_ALL:
                sendMessage(ws, responseAll());
                break;
            case BLOCKCHAIN_RESPONSE:
                const receivedBlocks = message.data;
                if(receivedBlocks === null){
                    break;
                } 
                handleBlockChainResponse(receivedBlocks);
                break;
        }
    });
}

const handleBlockChainResponse = receivedBlocks => {
    if(receivedBlocks.length === 0){
        console.log("Received blocks have a length of 0");
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if(!isBlockStructureValid(latestBlockReceived)){
        console.log("The block structure of the block received is not valid");
        return;
    }
    const newestBlock = getNewestBlock();
    if(latestBlockReceived.index > newestBlock.index){
        if(newestBlock.hash === latestBlockReceived.previousHash){
            //오로지 하나만 앞서 있을떄 그걸 추가하면 됨.
            if(addBlockToChain(latestBlockReceived)){
                broadcastNewBlock();
            }
        }else if(receivedBlocks.length === 1){
            // to do, get all the blocks, we are way behind
            sendMessageToAll(getAll());
        } else {
            //
            replaceChain(receivedBlocks);
        }
    }
}

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const sendMessageToAll = message => sockets.forEach(ws=>sendMessage(ws,message));

const responseLatest = () => blockchainResponse([getNewestBlock()])

const responseAll = () => blockchainResponse(getBlockChain());

const broadcastNewBlock = () => sendMessageToAll(responseLatest());

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
    connectToPeers,
    broadcastNewBlock
};
