const config = require('config');
const logger = require('./logger');
const errors = require('./errors');
const sessionConfig = config.get('sessionConfig');
const moment = require('moment');
var crypto = require('crypto');
const sessionBytes = 16;

exports.verifySession = async function(pool, resBuilder, username, sessionID){
    /*
        Verify if session exists and is active.

        If session exists and is active, update the last_used_time and expiry_time.
        If session exists but has timed out, mark session as inactive
        If session doesn't exist, return failure.
    */
    var errorCode = errors.validUsername(username);
    if(errorCode != 0){
        return resBuilder.default(errorCode).end();
    }
    errorCode = errors.validToken(sessionID);
    if(errorCode != 0){
        return resBuilder.default(errorCode).end();
    }
    //get active session
    const sess = await exports.retrieveActiveSession(pool,username);

    //return fail if session isn't found
    if(sess == null || sess.session_id != sessionID)
        return resBuilder.default(errors.SESSION_NOT_FOUND).end();
    
    if(moment(sess.lastUsedTime).isAfter(sess.expiryTime)){
        //timeout
        exports.revokeSession(pool,username,sessionID)
        return resBuilder.default(errors.SESSION_IS_CLOSED).end();
    } else {
        //valid session, update lastUsedTime
        sess.lastUsedTime = moment().format('YYYY-MM-DD HH:mm:ss');
        sess.expiryTime = moment(Date.now()).add(sessionConfig.timeout,'ms').format('YYYY-MM-DD HH:mm:ss');
        exports.updateSession(pool,sess);
        return resBuilder.default(errors.DONE).end();
    }



}
exports.generateSession = function(username){
    var session = {}
    session.username = username;
    session.sessionID = crypto.randomBytes(sessionBytes).toString('hex');
    session.createTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    session.lastUsedTime = session.createTime;
    session.expiryTime = moment(Date.now()).add(sessionConfig.timeout,'ms').format('YYYY-MM-DD HH:mm:ss');
    session.isActive = 1;

    return session;
}
exports.updateSession = async function(pool, sess){
    var query = `UPDATE sessions SET last_used_time = ?, expiry_time = ?, is_active = ?
                    WHERE username = ? AND session_id = ?`;
    try{
        await pool.query(query,[sess.lastUsedTime,sess.expiryTime,
            sess.isActive,sess.username,sess.sessionID]);
    } catch(err){
        throw err;
    }
    
}

exports.insertSession = async function(pool, sess){
    
    var query = `INSERT INTO sessions VALUES(?,?,?,?,?,1)`;
    await pool.query(query,
        [sess.username,sess.sessionID,sess.createTime,sess.lastUsedTime,sess.expiryTime,sess.isActive]
    );
    return;
    
}
exports.retrieveActiveSession = async function(pool, username){
    var query = `SELECT * FROM sessions WHERE username = ? AND is_active = 1`;
    try{
        const rows = await pool.query(query,[username]);
        if(rows.length > 0){
            return rows[0];
        } else {
            return null;
        }
    } catch(err){
        throw err;
    }
}
exports.revokeSession = function(pool, username, sessionID){
    var query = `UPDATE sessions SET is_active = 0 WHERE username = ? AND session_id = ?`;
    pool.query(query,[username,sessionID]);
    return;
}