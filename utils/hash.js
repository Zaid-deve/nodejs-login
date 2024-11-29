const argon = require('argon2');

function encryptData(data){
    return new Promise((res, rej) => {
        argon.hash(data).then(res).catch(rej)
    })
}

function verifyHash(hash,compare){
    return new Promise((res, rej) => {
        argon.verify(hash,compare).then(res).catch(rej)
    })
}

module.exports = {encryptData, verifyHash};