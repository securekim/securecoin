const CryptoJS = require("crypto-js");

//Real Bit Coin is...
// 블록의 hash 를 hex 로 바꾸어서 앞에 0이 열 몇자리가 나와야 한다.
// 열 몇자리라는 것이 난이도이다.
// hash 값은 알다시피 index, previousHash, timestamp, data 등을 합쳐서 hash 한 값이다.
// 이것을 가능하게 하기 위해 nonce 를 임의로 주게 되어 있다.
// 궁금한점. 0 이 난이도 만큼 나올 수 있다는 것을 어떻게 증명하는가?

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

//console.log(blockChain);

const getNewestBlock = () => blockChain[blockChain.length -1];

const getTimeStamp = () => new Date().getTime() / 1000;

const getBlockChain = () => blockChain;

const createHash = (index, previousHash, timestamp, data) => 
    CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();


const createNewBlock = data => {
    const previousBlock = getNewestBlock();
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
    addBlockToChain(newBlock);
    require("./p2p").broadcastNewBlock();
    return newBlock;
};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isBlockValid = (candidateBlock, latestBlock) =>{
    if(!isBlockStructureValid(candidateBlock)){
        console.log("The candidate block structure is not valid");
        return false;
    }else if(latestBlock.index + 1 !== candidateBlock.index){
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

const isBlockStructureValid = block => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === "string" && 
        typeof block.previousHash === "string" && 
        typeof block.timestamp === "number" && 
        typeof block.data === "string"
    ) 
}

const isChainValid = (candidateChain) => {
    //Genesis 출신을 확인해야함
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if(!isGenesisValid(candidateChain[0])){
        console.log("The candidateChain's genesisBlock is not the same as our genesisBlock ");
        return false;
    }
    
    for (let i= 1; i < candidateChain.length; i++){ 
        // I don't want to validate genesis block - Genesis block doesn't have prev hash
        if(!isBlockValid(candidateChain[i], candidateChain[i-1])){
            return false;
        }
        return true;
    }
}

const replaceChain = candidateChain => {
    if(isChainValid(candidateChain) && candidateChain.length > getBlockChain().length){
        blockChain = candidateChain;
        return true;
    } else {
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if(isBlockValid(candidateBlock,getNewestBlock())){
        blockChain.push(candidateBlock);
        return true;
    } else {
        return false;
    }
}

module.exports = {
    getBlockChain,
    createNewBlock,
    getNewestBlock,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain
}