const config = require("config");
const logger = require("./logger");
const errors = require("./errors");
const pool = require("./database");
const sessionConfig = config.get("sessionConfig");
const moment = require("moment");
var crypto = require("crypto");
const sessionBytes = 16;

exports.verifySession = async function(resBuilder, username, sessionID) {
  /*
        Verify if session exists and is active.

        If session exists and is active, update the last_used_time and expiry_time.
        If session exists but has timed out, mark session as inactive
        If session doesn't exist, return failure.
    */
  var errorCode = errors.validUsername(username);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  errorCode = errors.validToken(sessionID);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  //get active session
  const sess = await exports.retrieveActiveSession(username);

  //return fail if session isn't found
  if (sess == null || sess.sessionID != sessionID)
    return resBuilder.default(errors.SESSION_NOT_FOUND).end();

  if (moment(Date.now()).isAfter(sess.expiryTime)) {
    //timeout
    exports.revokeSession(username, sessionID);
    return resBuilder.default(errors.SESSION_IS_CLOSED).end();
  } else {
    //valid session, update lastUsedTime
    sess.lastUsedTime = moment().format("YYYY-MM-DD HH:mm:ss");
    sess.expiryTime = moment(Date.now())
      .add(sessionConfig.timeout, "ms")
      .format("YYYY-MM-DD HH:mm:ss");
    exports.updateSession(sess);
    return resBuilder.default(errors.DONE).end();
  }
};
exports.generateSession = function(username) {
  var session = {};
  session.username = username;
  session.sessionID = crypto.randomBytes(sessionBytes).toString("hex");
  session.createTime = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
  session.lastUsedTime = session.createTime;
  session.expiryTime = moment(Date.now())
    .add(sessionConfig.timeout, "ms")
    .format("YYYY-MM-DD HH:mm:ss");
  session.isActive = 1;

  return session;
};
exports.updateSession = async function(sess) {
  var query = `UPDATE sessions SET last_used_time = ?, expiry_time = ?, is_active = ?
                    WHERE username = ? AND session_id = ?`;
  try {
    await pool.query(query, [
      sess.lastUsedTime,
      sess.expiryTime,
      sess.isActive,
      sess.username,
      sess.sessionID
    ]);
  } catch (err) {
    throw err;
  }
};

exports.insertSession = async function(sess) {
  var query = `INSERT INTO sessions VALUES(?,?,?,?,?,1)`;
  await pool.query(query, [
    sess.username,
    sess.sessionID,
    sess.createTime,
    sess.lastUsedTime,
    sess.expiryTime,
    sess.isActive
  ]);
  return;
};
exports.retrieveActiveSession = async function(username) {
  var query = `SELECT * FROM sessions WHERE username = ? AND is_active = 1`;
  try {
    const rows = await pool.query(query, [username]);
    if (rows.length > 0) {
      logger.log(rows[0]);
      return {
        username: rows[0].username,
        sessionID: rows[0].session_id,
        createTime: rows[0].create_time,
        lastUsedTime: rows[0].last_used_time,
        expiryTime: rows[0].expiry_time,
        isActive: rows[0].is_active
      };
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};
exports.revokeSession = function(username, sessionID) {
  var query = `UPDATE sessions SET is_active = 0 WHERE username = ? AND session_id = ?`;
  try {
    pool.query(query, [username, sessionID]);
  } catch (e) {}
  return;
};
exports.logout = async function(resBuilder, username) {
  const sess = await exports.retrieveActiveSession(username);

  //session/user not found, but whatever
  if (sess == null) return resBuilder.success().end();

  exports.revokeSession(username, sess.sessionID);
  resBuilder.success().end();
};
