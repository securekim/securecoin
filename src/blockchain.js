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
    CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();


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

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) =>{
    if(latestBlock.index + 1 !== candidateBlock.index){
        console.log("The candidate block doesn't have a valid index");
        return false;
    } else if(latestBlock.hash !== candidateBlock.previousHash){
        console.log("The previousHash of the candidate block is not the hash of the latest block");
        return false;
    } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash){
        console.log("The hash of this block is invalid");
        return false;
    }
    return true;
}

const isNewStructureValid = (block) => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === "string" && 
        typeof block.previousHash === "string" && 
        typeof block.timestamp === "number" && 
        typeof block.data === "string"
    ) 
}

