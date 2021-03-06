
const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic");
    _ = require("lodash");
    utils = require("./utils");

const ec = new elliptic.ec("secp256k1");

const COINBASE_AMOUNT = 50; // bitcoin 은 절반씩 줄어든다. 일단 하드코딩.

class TxOut {
    constructor(address, amount){
        this.address = address;
        this.amount = amount;
    }
}


class TxIn {
    // txOutId
    // txOutIndex 
    // Signature
}

class Transaction {
    // ID
    // txIns[]
    // txOuts[] // combined txIns[]


}

class UTxOut{
    constructor(txOutId, txOutIndex, address, amount){
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;

    }
}



//transaction will be hashed -> This is ID

const getTxId = tx => {

    // 각 배열에 있는 값들을 Serialize 해서 String 으로 만듬.

    const txInContent = tx.txIns
        .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
        .reduce((a,b) => a + b, "" );
    
    const txOutContent = tx.txOuts
        .map(txOut => txOut.address + txOut.amount)
        .reduce((a,b) => a + b, "");
    

    return CryptoJS.SHA256(txInContent + txOutContent).toString(); 
}

const findUTxOut = (txOutId, txOutIndex, uTxOutList) =>{
    // 인풋 없는 트랜잭션은 없다
    // INPUT 은 사용하지 않은 OUTPUT 이다.
    return uTxOutList.find(
        uTxO => uTxO.txOutId === txOutId && uTxO.txOutIndex === txOutIndex)
}

const signTxIn = (tx, txInIndex, privateKey, uTxOutList) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;

    //정말로 너가 그 코인을 가지고 있는지 검증 필요
    // To Do : Find Tx
    const referencedUTxOut = findUtxOut(txIn.txOutId, tx.txOutIndex, uTxOutList);
    if(referencedUTxOut === null){
        // Don't have the coin
        console.log("Couldn't find the referenced uTxOut, not signing");
        return;
    }
    const referencedAddress = referencedUTxOut.address;
    if(getPublicKey(privateKey) !== referencedAddress) {
        return false;
    }
    // To Do : Sign the txIn
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = utils.toHexString(key.sign(dataToSign).toDER()); // DER is binary format
    return signature;
}

const getPublicKey = (privateKey) => {
    return ec.keyFromPrivate(privateKey, "hex").getPublic().encode("hex");
}

const updateUtxOuts = (newTxs, uTxOutList) => {

       //Generate New Transaction output
       // get transaction output, then, make unspent transaction outputs


    const newUTxOuts = newTxs
    .map(tx =>{ //loop all tx
        tx.txOuts.map( //loop all tx in txOuts
            (txOut, index) => {
                new UTxOut(tx.id, index, txOut.address, txOut.amount);
            }
        );
    }).reduce((a,b) => a.concat(b),[]);

        /*
        Unspent List
        [A(40), B(20)]

        newUtxOuts
        [ZZ(10), MM(30)]
        */

    // 쓸것들을 합쳐서 인풋에 넣어주고 비워준다.
    const spentTxOuts = newTxs.map(tx => tx.txIns)
        .reduce((a, b) => a.concat(b),[])
        .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0)); //EMPTY

        /*
        Unspent List
        [A(0), B(20)]

        A(0) ---> TRANSACTION   ---> ZZ(10)
                                ---> MM(30)
        */

    //unspent list 에서 삭제해준다. 쓸거니깐.
    const resultingUtxOuts = uTxOutList
        .filter(uTxO =>  findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
        .concat(newUTxOuts);

        /*
        [ B(20), ZZ(10), MM(30)]

        A(0) ---> TRANSACTION   ---> ZZ(10)
                                ---> MM(30)
        */
    
    return resultingUtxOuts; // [ B(20), ZZ(10), MM(30)]
}

const isTxInStructureValid = (txIn) =>{
    if(txIn === null){
        return false;
    } else if (typeof txIn.signature !=="string"){
        return false;
    } else if (typeof txIn.txOutId !== "string"){
        return false;
    } else if (typeof txIn.txOutIndex !== "number"){
        return false;
    } else {
        return true;
    }
}


const isAddressValid = (address) => {
    if(address.length !== 130){
        return false;
    } else if(address.match("^[a-fA-F0-9]+$")===null){
        return false;
    } else if (!address.startsWith("04")){
        return false;
    } else {
        return true;
    }
}

const isTxOutStructureValid =(txOut) =>{
    if(txOut === null){
        return false;

    } else if (typeof txOut.address !=="string"){
        return false;
    } else if (!isAddressValid(txOut.address)){
        return false;
    } else if(typeof txOut.amount !== "number"){
        return false;
    } else {
        return true;
    }
}

const isTxStructureValid = (tx) =>{
    if(typeof tx.id !== "string"){
        console.log("Tx ID is not string");
        return false;
    }else if (!(tx.txIns instanceof Array)){
        console.log("The txIns are not an array");
        return false;
    }else if (!tx.txIns.map(isTxInStructureValid).reduce((a,b)=> a && b, true)){ // map : 참 거짓 덩어리, reduce 로 서로를 && 해서 트루인지 확인 
        console.log("The structure of one of the txIn is not valid");
        return false;
    } else if (!(tx.txouts instanceof Array)){
        console.log("The txOuts are not an array");
        return false;        
    } else if (
        !tx.txOuts.map(isTxOutStructureValid).reduce((a,b) => a && b, true)
    ){
        console.log("The structure of one of the txOut is not valid");
        return false;
    } else {
        return true;
    }
}

const getAmountInTxIn = (txIn, uTxOutList) => findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount

const validateTx = (tx, uTxOutList) => {
    if (!isTxStructureValid(tx)){
        return false;
    }
    
    if (getTxId(tx) !== tx.id){
        return false;
    }

    const validateTxIn = (txIn, tx, uTxOutList) => {
        const wantedTxOut = uTxOutList.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
        if(wantedTxOut === null){
            return false;
        } else {
            const address = wantedTxOut.address;
            const key = ec.keyFromPublic(address, "hex");
            return key.verify(tx.id, txIn.signature);
        }
    }

    const hasValidTxIns = tx.txIns.map(txIn => validateTxIn(txIn, tx, uTxOuts));
        


    if (!hasValidTxIns) {
        return;
    }

    const amountInTxIns = tx.txIns.map(txIn => getAmountInTxIn(txIn, uTxOutList)).reduce((a,b) => a+b, 0);//todo
    
    const amountInTxOuts = tx.txOuts.map(txOut => txOut.amount).reduce((a,b) => a+b,0)//todo

    if (amountInTxIns !== amountInTxOuts){
        return false;
    } else {
        return true;
    }
}

const validateCoinbaseTx = (tx, blockIndex) => {
    if(getTxId(tx) !== tx.id){
        return false;
    } else if (tx.txIns.length !== 1) {
        return false;
    } else if (tx.txIns[0].txOutIndex !== blockIndex) {
        return false;
    } else if (tx.txOuts.length !== 1) { // Minor is 1 person.
        return false;
    } else if (tx.txOuts[0].amount !== COINBASE_AMOUNT) {
        return false;
    } else { 
        return true;
    }
}

const createCoinbaseTx = (address, blockIndex) => {
    const tx = new Transaction();
    const txIn = new TxIn();
    txIn.signature = "";
    txIn.txOutId = blockIndex;
    tx.txIns = [txIn]; 
    tx.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
    tx.id = getTxId(tx);
    return tx;
}

const hasDuplicates = (txIns) => {
    const groups = _.countBy(txIns, txIn => txIn.txOutId + txIn.txOutIndex); 
    // groups
    // 00001 : 1, 00002 : 1, 00003 : 1
    return _(groups).map(value => {
        if(value > 1) {
            //중복이 존재한다
            console.log("Found a duplicated txIn");
            return true;
        } else {
            return false;
        }
    }).includes(true); //하나라도 true 인지
    //txIn 
    //1231241241231
}

const validateBlockTxs = (txs, uTxOutList, blockIndex) => {
    const coinbaseTx = txs[0];
    if(!validateCoinbaseTx(coinbaseTx, blockIndex)){
        console.log("Coinbase Tx is invalid");
    }
    const txIns = _(txs).map(tx => tx.Ins).flatten().value();

    if(hasDuplicates(txIns)){
        console.log("Found duplicated txIns");
        return false;
    }
    const nonCoinbaseTxs = txs.slice(1);

    return nonCoinbaseTxs.map(tx => validateTx(tx, uTxOutList)).reduce((a, b) => a+b, true);
}

const processTxs = (txs, uTxOutList, blockIndex) => {
    if(!validateBlockTxs(txs, uTxOutList, blockIndex)){
        return null;
    }
    return updateUtxOuts(txs, uTxOutList);
}

module.exports = {
    getPublicKey,
    getTxId,
    signTxIn,
    TxIn,
    Transaction,
    TxOut,
    createCoinbaseTx,
    processTxs
}
