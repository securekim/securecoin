//import { start } from "repl";

const express = require("express"),
    bodyParser = require ("body-parser"),
    morgan = require ("morgan"),
    Blockchain = require("./blockchain");
    P2P = require("./p2p"),
    Wallet = require("./wallet");

const {getBlockChain, createNewBlock, getAccountBalance} = Blockchain;
const {startP2PServer, connectToPeers} = P2P;
const { initWallet } = Wallet;

const PORT = process.env.HTTP_PORT || 3000; // if doesn't find in environment

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));

app.route("/blocks")
    .get((req,res)=>{
        res.send(getBlockChain());
    })
    .post((req,res)=>{
        const {body: {data}} = req;
        const newBlock = createNewBlock();
        res.send(newBlock);
    });

app.post("/peers", (req,res)=> {
    const { body : { peer }} = req;
    connectToPeers(peer);
    res.send();
});

app.get("/me/balance", (req,res) => {
    const balance = getAccountBalance();
    res.send({ balance });
});

const server = app.listen(PORT, () => console.log(`secureCoin Server running on ${PORT}`));

initWallet();
startP2PServer(server);
