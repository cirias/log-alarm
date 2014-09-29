var winston = require('winston');
var Server = require('./server');
var config = require('./config');

server = new Server(config);
server.run();
