var APP_CONFIG = require('../config.js');
var request = require('request');

var Req = {
  check: function(request, cb) {

    if(request) {

      cb(false, request);
    } else {

      cb("EREQEMPTY")
    }
  },

  parse: function(request, err, cb) {
    var fields = {};

    // iterate through the msg fields
    Object.keys(request).forEach(function(key,index) {
      fields[key] = request[key];
    });

    if(fields.length == request.length) {
      
      cb(false, fields);
    }
  },

  process: function(fields, err, cb) {
    var fieldKeys = Object.keys(fields);
    var totalFields = fieldKeys.length;

    fieldKeys.forEach(function(key,index) {
      totalFields = totalFields -1;
    });

    if(totalFields < 1) {

      var reply = {
        status: 200,
        message: "All Done"
      }

      var postReadable = fields['msg'];

      postAPI(postReadable);

      cb(false, reply);
    }
  },

  reply: function(res, reply, err, cb) {

    res.status(reply.status).send(reply.message).end();
    cb(false);

  }
}

var postAPI = function(toSlack) {

  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     'https://hooks.slack.com/services/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',
    body: JSON.stringify({text: JSON.stringify(toSlack)})
  }, function(error, response, body){
    console.log(body);
  });

}

var qdAPI = {

  new: function(req, res, next){
    console.log(req.body);
    Req.check(req.body, function(err, request) {
      Req.parse(request, err, function(err, fields) {
        Req.process(fields, err, function(err, reply) {
          Req.reply(res, reply, err, function(err) {
            if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
          })
        })
      })
    })
  }

  
}
module.exports = qdAPI;