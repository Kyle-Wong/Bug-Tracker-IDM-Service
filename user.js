const logger = require("./logger");
const security = require("./password");
const errors = require("./errors");
const session = require("./session");
const pool = require("./database");

const http = require("http");
const https = require("https");
const DEFAULT_ACCOUNT_TYPE = 5;

const USERNAME_ALREADY_EXISTS = 404;
const USERNAME_NOT_FOUND = 405;
const INSUFFICIENT_PRIVILEGE = 406;
const INCORRECT_LOGIN_CREDENTIALS = 407;

const config = require("config");
const projectServerConfig = config.get("projectServerConfig");

exports.register = async function(resBuilder, email, username, password) {
  //basic checks
  var errorCode = errors.validUsername(username);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  errorCode = errors.validEmail(email);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  errorCode = errors.validPassword(password);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }

  //hash password
  let { salt, hash } = security.hashPassword(password);

  //check if username exists
  try {
    const usernameAvailable = await isUsernameAvailable(username);
    if (usernameAvailable) {
      //insert user record is username is available
      logger.log("available");
      await insertUser(username, email, hash, salt);
      //add user to the projects server
      addUserToProjectsServer(username, email, 1, DEFAULT_ACCOUNT_TYPE);
    } else {
      logger.log("not available");
      return resBuilder.default(USERNAME_ALREADY_EXISTS).end();
    }
  } catch (err) {
    logger.log(err);
    return resBuilder.error(err).end();
  }

  try {
  } catch (err) {
    logger.log(err);
  }

  return resBuilder.success().end();
};

exports.login = async function(resBuilder, username, password) {
  //basic checks
  var errorCode = errors.validUsername(username);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  errorCode = errors.validPassword(password);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }

  //check is password is correct
  try {
    const loginSuccess = await passwordMatch(username, password);
    if (loginSuccess) {
      logger.log("Credential match for " + username);
      //get current active session if it exists
      const activeSession = await session.retrieveActiveSession(username);
      if (activeSession != null) {
        //revoke active session if it exists
        session.revokeSession(username, activeSession.session_id);
      }
      //Generate a new session
      const newSession = session.generateSession(username);
      await session.insertSession(newSession);
      resBuilder.json["Session"] = newSession;
      return resBuilder.success().end();
    } else {
      return resBuilder.default(INCORRECT_LOGIN_CREDENTIALS).end();
    }
  } catch (err) {
    logger.log("ERR:" + err.stack);
    return resBuilder.error(err).end();
  }
};
exports.verifyPrivilege = async function(
  resBuilder,
  username,
  required_privilege
) {
  var errorCode = errors.validUsername(username);
  if (errorCode != 0) {
    return resBuilder.default(errorCode).end();
  }
  const code = await exports.comparePrivilege(username, required_privilege);
  resBuilder.default(code).end();
};
exports.comparePrivilege = async function(username, required_privilege) {
  var query = `SELECT account_type FROM users WHERE username = ?`;
  try {
    const rows = await pool.query(query, [username]);
    if (rows.length == 0) {
      //user not found
      return USERNAME_NOT_FOUND;
    }
    if (rows[0].account_type <= required_privilege) {
      //user has sufficient privilege
      return 0;
    } else {
      //user does not have sufficient privilege
      return INSUFFICIENT_PRIVILEGE;
    }
  } catch (err) {
    logger.log(err.stack);
    return 400;
  }
};

async function insertUser(username, email, hash, salt) {
  logger.log(`Registering ${username} with email=${email}`);
  var query = `INSERT INTO users VALUES(?,?,?,?,1,${DEFAULT_ACCOUNT_TYPE})`;
  try {
    await pool.query(query, [username, email, hash, salt]);
    return;
  } catch (err) {
    throw err;
  }
}
async function isUsernameAvailable(username) {
  var query = "SELECT username FROM users u WHERE u.username = ?;";
  try {
    const rows = await pool.query(query, [username]);
    console.log(rows);
    if (rows.length > 0) {
      logger.log(`${username} already exists.`);
      return false;
    } else {
      logger.log(`${username} is available.`);
      return true;
    }
  } catch (err) {
    throw err;
  }
}
async function passwordMatch(username, password) {
  var query =
    "SELECT salt, hash FROM users WHERE username = ? AND is_active = 1";
  try {
    const rows = await pool.query(query, [username]);
    if (rows.length == 0) {
      return false;
    }
    logger.log(rows[0]);
    return security.validatePassword(password, rows[0].salt, rows[0].hash);
  } catch (err) {
    throw err;
  }
}

function addUserToProjectsServer(username, email, isActive, accountType) {
  logger.log("Sending addUser request to Projects server");
  const jsonBody = {
    username: username,
    email: email,
    is_active: isActive,
    account_type: accountType
  };
  const options = {
    host: projectServerConfig.host,
    port: projectServerConfig.port,
    path: "/prjt/user/add",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };
  logger.log(options);
  //use https library if using port 443
  const port = options.port == 443 ? https : http;

  const req = http.request(options, res => {});
  req.on("error", err => {
    logger.log(`Error adding ${user} to project server`);
  });
  req.write(JSON.stringify(jsonBody));
  req.end();
}
