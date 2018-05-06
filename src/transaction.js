import { ECANCELED } from "constants";

const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic");

const ec = new EC("secp256k1");

class TxOut {
    constructor(address, amount){
        this.address = address;
        this.amount = amount;
    }
}


class TxIn {
    // uTxOutId
    // uTxOutIndex 
    // Signature



}

class Transaction {
    // ID
    // txIns[]
    // txOuts[] // combined txIns[]


}

class uTxOut{
    constructor(txOutId, txOutIndex, address, amount){
        this.txOutId = uTxOutId;
        this.txOutIndex = uTxOutIndex;
        this.address = address;
        this.amount = amount;

    }
}

let uTxOuts = [];

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
    return uTxOutList.find(uTxOut => uTxOut.txOutId === txOutId 
        && uTxOut.txOutIndex === txOutIndex)
}

const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;

    //정말로 너가 그 코인을 가지고 있는지 검증 필요
    // To Do : Find Tx
    const referencedUTxOut = findUtxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
    if(referencedUTxOut === null){
        // Don't have the coin
        return;
    }

    // To Do : Sign the txIn

}

