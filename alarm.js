var LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
var split = require('split');
var through = require('through');
var email = require("emailjs");
var emailServer = email.server.connect({
  user: "",
  password: "",
  host: "",
  port: 25
});

process.stdin.pipe(split()).pipe(through(function (line) {
  var columns = line.replace(/\033\[[0-9;]*m/g,"").split(' ');
  if (LEVELS.indexOf(columns[2]) < 0) {

  } else {
    columns.splice(columns.indexOf('-'), 1);
    var log = {
      date: columns.shift(),
      time: columns.shift(),
      level: columns.shift(),
      program: columns.shift(),
      process: columns.shift(),
      message: columns.join(' ')
    };

    this.queue(log);
  }
})).pipe(through(function (log) {
  if (log.level === 'ERROR') {
    // TODO send email
    console.log('sending email');
    emailServer.send({
      subject: 'Log Center - ' + log.program + ':' + log.process,
      text: JSON.stringify(log),
      from: 'LogCenter@tradesparq.com',
      to: 'fhc023@qq.com'
    }, function (err, message) {
      if (err) {
        console.error(err);
      } else {
        console.log('sending Email ok')
      }
    });
  }

  this.queue(JSON.stringify(log) + '\n');
})).pipe(process.stdout);
