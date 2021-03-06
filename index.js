const express = require("express");
const util = require("util");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

const fs = require("fs");
const logger = require("./logger");
const ResponseBuilder = require("./response-builder");
const user = require("./user");
const session = require("./session");

const config = require("config");
const dbConfig = config.get("dbConfig");
logger.log(dbConfig);
const serverConfig = config.get("serverConfig");
logger.log(serverConfig);
var mysql = require("mysql");

app.use(express.static("public"));
app.use(bodyParser.json());

/*
const con = mysql.createConnection(dbConfig);
const query = util.promisify(con.query).bind(con);

con.connect(function(err){
  if (err) throw err;
  logger.log("IDM database connected!");
});
*/
const pool = require("./database");

app.get("/", function(req, res) {
  responseBuilder = new ResponseBuilder(res);
});

var server = app.listen(serverConfig.port, function() {
  var host = server.address().address;
  var port = server.address().port;
  logger.log(`Server listening at ${host}:${port}`);
});

app.post("/idm/user/register", function(req, res) {
  logger.log("Register User");
  body = req.body;
  logger.log(req.body);
  user.register(
    new ResponseBuilder(res),
    body.email,
    body.username,
    body.password
  );
});
app.post("/idm/user/login", (req, res) => {
  logger.log("Login User");
  body = req.body;
  logger.log(req.body);
  user.login(new ResponseBuilder(res), body.username, body.password);
});
app.post("/idm/user/logout", (req, res) => {
  logger.log("Logout User");
  body = req.body;
  logger.log(req.body);
  session.logout(new ResponseBuilder(res), body.username);
});
app.post("/idm/verifySession", function(req, res) {
  logger.log("Verify Session");
  body = req.body;
  logger.log(body);
  session.verifySession(new ResponseBuilder(res), body.username, body.session);
});

app.post("/idm/verifyPrivilege", function(req, res) {
  logger.log("Verify Privilege");
  body = req.body;
  logger.log(body);
  user.verifyPrivilege(
    new ResponseBuilder(res),
    body.username,
    body.requiredPrivilege
  );
});
