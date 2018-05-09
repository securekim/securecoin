
const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic");
    utils = require("utils");

const ec = new elliptic.ec("secp256k1");

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

class UTxOut{
    constructor(txOutId, txOutIndex, address, amount){
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
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
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = utils.toHexString(key.sign(dataToSign).toDER()); // DER is binary format
    return signature;
}

const updateUtxOuts = (newTxs, uTxOutList) => {

       //Generate New Transaction output
       // get transaction output, then, make unspent transaction outputs


    const newUTxOuts = newTxs.map(tx =>{ //loop all tx
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

