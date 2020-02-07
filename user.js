const maxUsernameLength = 32;
const minPasswordLength = 6; //inclusive
const maxPasswordLength = 32; //inclusive
const maxEmailLength = 32;

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


exports.register = function(resBuilder, username, password){
    

    return resBuilder;
}

exports.login = function(resBuilder, username, password){


    return resBuilder;
}

function validUsername(username){
    if(typeof username != 'string')
        return false;
    if(username.length <= 0 || username.length > maxUsernameLength)
        return false;
    
    return true;
}
function validPassword(password){
    if(typeof password != 'string')
        return false;
    if(password.length < minPasswordLength || password.length > maxPasswordLength)
        return false;
    
    return true;
}

function validEmail(email){
    if(typeof email != 'string')
        return false;
    if(email.length <= 0 || email.length > maxEmailLength)
        return false;

    if(!(emailRegex.test(email))){
        return false;
    }
    return true;
}


