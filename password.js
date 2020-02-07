var crypto = require('crypto');

const hashLength = 64;
const saltIterations = 1000;
const saltLength = 16


exports.hashPassword = function(password){
    this.salt = crypto.randomBytes(saltLength).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, saltIterations, hashLength, 'sha512').toString('hex');
    return {salt:this.salt,hash:this.hash};
}

exports.validatePassword = function(password, salt, validHash){
    this.hash = crypto.pbkdf2Sync(password, salt, saltIterations, hashLength, 'sha512').toString('hex');
    return this.hash === validHash;
}