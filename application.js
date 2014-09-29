var util = require('util');
var events = require('events');

var Application = function (options, logger) {
  events.EventEmitter.call(this);
  var that = this;
  this._logger = logger;
  this.options = options;
  this.alive = false;
  this.lifeChecker = setInterval(function checkAlive() {
    that._logger.debug(that.alive);
    if (!that.alive) {
      that.emit('die');
    }

    that.alive = false;
  }, this.options.heartbeatGap);
};

util.inherits(Application, events.EventEmitter);

Application.prototype.heartbeat = function (message) {
  this.alive = true;
};

Application.prototype.error = function (message) {
  var that = this;
  this.errorNum ++;
  if (this.errorNum >= this.options.maxErrorNum) {
    this.emit('sick');
  }

  if (this.unhealthy) {
    clearTimeout(this.selfHealing);
  }
  this.selfHealing = setTimeout(function () {
    that.unhealthy = false;
    that.errorNum = 0;
  }, this.options.selfHealingGap);

  this.unhealthy = true;
};

module.exports = Application;
