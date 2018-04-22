const CryptoJS = require("crypto-js");

class Block {
    constructor(index, hash, previousHash, timestamp, data){
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data =data
    }
}

//HASH ( index + timestamp + data )
const genesisBlock = new Block(
    0, // index
    'A15E75180752B2CB22AB7965C30564AA5559F1013EF98A7018BD866C7C8E1152',  // hash
    null, //previousHash
    1523495527274, //timestamp
    "The First Securecoin block" //data
)

let blockChain = [genesisBlock];

console.log(blockChain);

const getLastBlock = () => blockChain[blockChain.length -1];

const getTimeStamp = () => new Date().getTime() / 1000;

const createHash = (index, previousHash, timestamp, data) => 
    CryptoJS.SHA256(index + previousHash + timestamp + data).toString();


const creatNewBlock = data => {
    const previousBlock = getLastBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimeStamp();
    const newHash = createHash(newBlockIndex,previousBlock.hash,newTimestamp,data);
    const newBlock = new Block(
        newBlockIndex,
        newHash,
        previousBlock.hash,
        newTimestamp,
        data
    );
    return newBlock;
};

console.log(creatNewBlock());


