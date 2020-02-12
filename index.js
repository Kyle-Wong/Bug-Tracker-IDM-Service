const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const store = require('./store')
const app = express();

const fs = require('fs');
const logger = require('./logger');
const ResponseBuilder = require('./response-builder');
const user = require('./user');


const config = require('config');
const dbConfig = config.get('dbConfig');
logger.log(dbConfig);
const serverConfig = config.get('serverConfig');
logger.log(serverConfig);
var mysql = require("mysql");


app.use(express.static('public'))
app.use(bodyParser.json())

var con = mysql.createConnection(dbConfig);
  
con.connect(function(err){
  if (err) throw err;
  logger.log("IDM database connected!");
});

app.get('/', function(req, res){
    responseBuilder = new ResponseBuilder(res);
    
})

var server = app.listen(serverConfig.port, function(){
  var host = server.address().address;
  var port = server.address().port;
  logger.log(`Server listening at ${host}:${port}`);
})


app.post('/registerUser', function(req,res){
  logger.log("Register User")
  body = req.body;
  logger.log(req.body);
  let resBuilder = new ResponseBuilder(res);
  user.register(con, resBuilder,body.email,body.username,body.password);
})

