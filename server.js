var net = require('net');
var util = require('util');
var email = require("emailjs");
var Application = require('./application');

var LogServer = function (config, logger) {
  var that = this;
  this._logger = logger;
  this.config = config;
  this.emailServer = email.server.connect(this.config.email.server);
  this.applications = Object.keys(this.config.applications).reduce(function (pre, key) {
    pre[key] = new Application(that.config.applications[key], that._logger);
    pre[key].on('die', function (message) {
      that._logger.info('sending Email');
      that.emailServer.send({
        text: key + " die. Doooooooooo",
        from: that.config.email.from,
        to: that.config.email.to,
        subject: key + " die."
      }, function (err, message) {
        if (err) {
          that._logger.error(err);
        } else {
          that._logger.info('sending Email ok')
        }
      });
    });
    return pre;
  }, {});
};

LogServer.prototype.run = function () {
  var that = this;
  var server = net.createServer(function(socket) {
    that._logger.info('server connected');
    socket._buffer = '';
    socket.on('data', function (data) {
      that._receive(data, socket);
    });
    socket.on('error', function(err) {
      that._logger.error('server error:', err);
    });
    socket.on('end', function() {
      that._logger.info('server disconnected');
    });
  });
  server.listen(this.config.server.port, function() { //'listening' listener
    that._logger.info('server bound');
  });
};

LogServer.prototype._receive = function (data, socket) {
  var part = data.toString();
  this._logger.debug('Received TCP data:', part);
  socket._buffer += part;
  if (socket._buffer.indexOf(this.config.server.delimiter)) {
    this._flush(socket);
  }
};

LogServer.prototype._flush = function (socket) {
  socket.pause();
  var messages = socket._buffer.split(this.config.server.delimiter);
  socket._buffer = messages.pop();
  this._logger.debug(messages);
  socket.resume();
  messages.forEach(this._handle.bind(this));
};

LogServer.prototype._handle = function (message) {
  var args = message.split(this.config.server.spliter);
  var appName = args.shift();
  var method = args.shift();
  if (this.applications[appName] && this.applications[appName][method]) {
    this.applications[appName][method].apply(this.applications[appName], args);
  } else {
    this._logger.error('Invalid TCP message:', message);
  }
};

module.exports = LogServer;
