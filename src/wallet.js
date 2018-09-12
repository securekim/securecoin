const elliptic = require("elliptic"),
path = require("path"),    
  fs = require("fs");
  _  = require("lodash");
  Transactions = require("./transactions");

const { getPublicKey, getTxId, signTxIn, TxIn, Transaction } = Transactions

const ec = new elliptic.ec("secp256k1");

const privateKeyLocation = path.join(__dirname, "privateKey");

const generatePrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
}

const getPrivateFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyLocation, "utf-8");
    buffer.toString();
};

const getPublicFromWallet = () => {
    const privateKey = getPrivateFromWallet();
    const key = ec.keyFromPrivate(privateKey,"hex");
    return key.getPublic().encode("hex");
}

const getBalance = (address,uTxOuts) => {
    return _(uTxOuts)
    .filter(uTxO => uTxO.address === address)
    .map(uTxO => uTxO.amount)
    .sum(); // reduce 해도 되는데 lodash 가 더 짧다.
}

const initWallet = () => {
    if (fs.existsSync(privateKeyLocation)){
        console.log("Wallet is Already Exist.");
        return;
    }
    const newPrivateKey = generatePrivateKey();
    fs.writeFileSync(privateKeyLocation, newPrivateKey);
};

const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
    let currentAmount = 0;
    const includedUTxOuts = [];
    for(const myUTxOut of myUTxOuts){
        includedUTxOuts.push(myUTxOut);
        currentAmount = currentAmount = myUTxOut.amount;
        if(currentAmount >= amountNeeded){
            const leftOverAmount = currentAmount - amountNeeded;
            return { includedUTxOuts, leftOverAmount };
        }
    }
    console.log("Not enough founds");
    return false;
}

const createTx = (receiverADdress, amount, privateKey, uTxOutList) => {
    const myAddress = getPublicKey(privateKey);
    const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);
    const { includedUTxOuts, leftOverAmount } = findAmountInUTxOuts(
        amount,
        myUTxOuts
    );
    const toUnsignedTxIn = uTxOut => {
        const txIn = new TxIn();
        txIn.txOutId = uTxOut.txOutId;
        tx.txOutIndex = uTxOut.txOutIndex;
    }

    const unsignedTxIns = includedUTxOuts.map(toUnsignedTxIn);

    const tx = new Transaction();

    tx.txIns  = unsignedTxIns;
    tx.txOuts = 
    
}

module.exports = {
    initWallet
}
