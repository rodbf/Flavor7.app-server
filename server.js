const express = require('express');
const server = express();
const body_parser = require('body-parser');
var http = require('http');
var https = require('https');

server.use(body_parser.json());

const routes = require('./api/routes/routes');
routes(server);

var fs = require('fs');
var privateKey  = fs.readFileSync('./sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(server);
var httpsServer = https.createServer(credentials, server);

httpServer.listen(4000);
httpsServer.listen(4100);

console.log("Listening at ports 4000(http) and 4100(https)");