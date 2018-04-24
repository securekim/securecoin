const express = require("express"),
    bodyParser = require ("body-parser"),
    morgan = require ("morgan"),
    Blockchain = require("./blockchain");

const {getBlockchain, createNewBlock} = Blockchain;

const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));
app.listen(PORT, () => console.log(`secureCoin Server running on ${PORT}`));