const logger = require('./logger');
const security = require('./password')
const maxUsernameLength = 32;
const minPasswordLength = 6; //inclusive
const maxPasswordLength = 32; //inclusive
const maxEmailLength = 32;

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const INVALID_LENGTH = 401;
const REGEX_FAIL = 402;
const INVALID_TYPE = 403;
const USERNAME_ALREADY_EXISTS = 404;


exports.register = function(con, resBuilder, email, username, password){
    //basic checks
    var errorCode = validUsername(username);
    if(errorCode != 0){
        resBuilder.default(errorCode);
        return resBuilder;
    }
    errorCode = validEmail(email);
    if(errorCode != 0){
        resBuilder.default(errorCode);
        return resBuilder;
    }
    errorCode = validPassword(password);
    if(errorCode != 0){
        resBuilder.default(errorCode);
        return resBuilder;
    }

    //hash password
    let {salt, hash} = security.hashPassword(password);
    
    registerUser(con,resBuilder,username,email,hash,salt);
}

exports.login = function(con, resBuilder, username, password){


    return resBuilder;
}
function registerUser(con, resBuilder, username, email, hash, salt){
    //Check is username exists
    var result = {}
    var query = "SELECT username FROM users u WHERE u.username = ?;";
    var exists = false;
    con.query(query,[username],
        (err, rows) => {
            if(err) throw err;
            if(rows.length > 0){
                logger.log(`${username} already exists.`);
                resBuilder.default(USERNAME_ALREADY_EXISTS).end();
            } else {
                logger.log(`${username} is available.`);
                //Insert user if username is available
                insertUser(username, email, hash, salt);
            }
        }
    );
    

    function insertUser(username, email, hash, salt){
        logger.log(`Registering ${username} with email=${email}`)
        var query = 'INSERT INTO users VALUES(?,?,?,?,1)'
        con.query(query,[username,email,hash,salt],
            (err,rows) =>{
                if(err){
                    logger.log(err);
                } else {
                    logger.log(`${username} successfully registered.`)
                    resBuilder.success().end();
                }
            }    
        )
    }
}


function validUsername(username){
    if(typeof username != 'string')
        return INVALID_TYPE;
    if(username.length <= 0 || username.length > maxUsernameLength)
        return INVALID_LENGTH;
    
    return 0;
}
function validPassword(password){
    if(typeof password != 'string')
        return INVALID_TYPE;
    if(password.length < minPasswordLength || password.length > maxPasswordLength)
        return INVALID_LENGTH;
    
    return 0;
}

function validEmail(email){
    if(typeof email != 'string')
        return INVALID_TYPE;
    if(email.length <= 0 || email.length > maxEmailLength)
        return INVALID_LENGTH;

    if(!(emailRegex.test(email))){
        return REGEX_FAIL;
    }
    return 0;
}


