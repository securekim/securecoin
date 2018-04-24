//import { start } from "repl";

const express = require("express"),
    bodyParser = require ("body-parser"),
    morgan = require ("morgan"),
    Blockchain = require("./blockchain");
    P2P = require("./p2p");

const {getBlockChain, createNewBlock} = Blockchain;
const {startP2PServer} = P2P;

const PORT = process.env.HTTP_PORT || 3000; // if doesn't find in environment

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));

app.get("/blocks", (req,res)=>{
    res.send(getBlockChain());
})

app.post("/blocks", (req,res)=>{
    const {body: {data}} = req;
    const newBlock = createNewBlock(data);
    res.send(newBlock);
});



const server = app.listen(PORT, () => console.log(`secureCoin Server running on ${PORT}`));

startP2PServer(server);
