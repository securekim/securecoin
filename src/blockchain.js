//YARN ADD
//nodemon ws crypto-js hex-to-binary express morgan body-parser


const CryptoJS = require("crypto-js");
    Wallet = require("./wallet");
    Transactions = require("./transactions");
    hexToBinary = require("hex-to-binary");

const { getBalance, getPublicFromWallet } = Wallet;
const { createCoinbaseTx, processTxs } = Transactions;

//Real Bit Coin is...
// 블록의 hash 를 hex 로 바꾸어서 앞에 0이 열 몇자리가 나와야 한다.
// 열 몇자리라는 것이 난이도이다.
// hash 값은 알다시피 index, previousHash, timestamp, data 등을 합쳐서 hash 한 값이다.
// 이것을 가능하게 하기 위해 nonce 를 임의로 주게 되어 있다.
// 궁금한점. 0 이 난이도 만큼 나올 수 있다는 것을 어떻게 증명하는가?

// 2016 개의 블록마다 난이도 조절이 들어간다. 10분 내외로.

const BLOCK_GENERATION_INTERVAL = 10; //sec
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; //blocks


class Block {
    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

//HASH ( index + timestamp + data )
const genesisBlock = new Block(
    0, // index
    'A15E75180752B2CB22AB7965C30564AA5559F1013EF98A7018BD866C7C8E1152',  // hash
    null, //previousHash
    1525539370, //timestamp
    "The First Securecoin block", //data
    0,
    0
)

let uTxOuts = [];

let blockChain = [genesisBlock];

//console.log(blockChain);

const getNewestBlock = () => blockChain[blockChain.length - 1];

const getTimeStamp = () => Math.round(new Date().getTime() / 1000);

const getBlockChain = () => blockChain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    CryptoJS.SHA256(
        index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
    ).toString();

const createNewBlock = () => {
    const coinbaseTx = createCoinbaseTx(getPublicFromWallet(), getNewestBlock().index + 1);
    const blockData = [coinbaseTx];
    return createNewRawBlock(blockData);
}

const createNewRawBlock = data => {
    const previousBlock = getNewestBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimeStamp();
    const difficulty = findDifficulty();
    const newBlock = findBlock(
        newBlockIndex,
        previousBlock.hash,
        newTimestamp,
        data,
        difficulty,
    );
    addBlockToChain(newBlock);
    require("./p2p").broadcastNewBlock();
    return newBlock;
};

const findDifficulty = () => {
    const newestBlock = getNewestBlock();
    if (newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
        newestBlock.index !== 0) { // not genesis block.
        //calculate new difficulty
        return calculateNewDifficulty(newestBlock, getBlockChain());
    } else {
        return newestBlock.difficulty;
    }
}

const calculateNewDifficulty = (newestBlock, blockChain) => {
    const lastCalculatedBlock = blockChain[blockChain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;

    // 2배라면 줄인다.
    if (timeTaken < timeExpected / 2) {
        return lastCalculatedBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
        return lastCalculatedBlock.difficulty - 1;
    } else {
        return lastCalculatedBlock.difficulty;
    }

}

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        console.log("Current Nonce : ", nonce);
        const hash = createHash(index, previousHash, timestamp, data, difficulty, nonce);
        //to do : check amount of zeros
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
        } else {
            nonce++;
        }
    }
}

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty);
    console.log("Trying difficulty : ", difficulty, " with hash : ", hashInBinary);
    return hashInBinary.startsWith(requiredZeros);
}

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const isTimeStampValid = (newBlock, oldBlock) => {
    return (
        oldBlock.timestamp - 60 < newBlock.timestamp
        && newBlock.timestamp - 60 < getTimeStamp()
    );
}

const isBlockValid = (candidateBlock, latestBlock) => {
    if (!isBlockStructureValid(candidateBlock)) {
        console.log("The candidate block structure is not valid");
        console.log(candidateBlock);
        return false;
    } else if (latestBlock.index + 1 !== candidateBlock.index) {
        console.log("The candidate block doesn't have a valid index");
        return false;
    } else if (latestBlock.hash !== candidateBlock.previousHash) {
        console.log("The previousHash of the candidate block is not the hash of the latest block");
        return false;
    } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
        console.log("The hash of this block is invalid");
        return false;
    } else if (!isTimeStampValid(candidateBlock, latestBlock)) {
        console.log("The timestamp of this block is doggy");
        return false;
    }
    return true;
}

const isBlockStructureValid = block => {
    return (
        typeof block.index === 'number' &&
        typeof block.hash === "string" &&
        typeof block.previousHash === "string" &&
        typeof block.timestamp === "number" 
        //&& typeof block.data === "string"
    )
}

const isChainValid = (candidateChain) => {
    //Genesis 출신을 확인해야함
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if (!isGenesisValid(candidateChain[0])) {
        console.log("The candidateChain's genesisBlock is not the same as our genesisBlock ");
        return false;
    }

    for (let i = 1; i < candidateChain.length; i++) {
        // I don't want to validate genesis block - Genesis block doesn't have prev hash
        if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
            return false;
        }
        return true;
    }
}

//Only Add if more difficult than us.

const sumDifficulty = anyBlockchain => 
    anyBlockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);

const replaceChain = candidateChain => {
    if (isChainValid(candidateChain) 
        && sumDifficulty(candidateChain) > sumDifficulty(getBlockChain())){ // check difficulty, not length.
        blockChain = candidateChain;
        return true;
    } else {
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if (isBlockValid(candidateBlock, getNewestBlock())) {
        const processedTxs = processTxs(candidateBlock.data, uTxOuts, candidateBlock.index);
        if(processedTxs === null){
            console.log("Couldn't process txs");
            return false;
        } else {
            blockChain.push(candidateBlock);
            uTxOuts = processedTxs;
            return true;
        }
    } else {
        return false;
    }
}

const getAccountBalance = () => 
getBalance(getPublicFromWallet(), uTxOuts);

module.exports = {
    getBlockChain,
    createNewRawBlock,
    createNewBlock,
    getNewestBlock,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain,
    getAccountBalance
}