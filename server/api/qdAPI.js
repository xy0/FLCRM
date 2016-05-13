var APP_CONFIG = require('../config.js');
var request = require('request');

var pg = require('pg');
var connectionString = APP_CONFIG.dbURL;

// post to external API handeler, like slack
var postExternalAPI = function(toSlack) {
  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url: APP_CONFIG.slackAPIURL,
    body: JSON.stringify({text: JSON.stringify(toSlack)})
  }, function(error, response, body){
    console.log(body);
  });
}

function b64EncodeUnicode(str) {
  return new Buffer(str).toString('base64');
}

function b64DecodeUnicode(str) {
  return new Buffer(str, 'base64').toString('utf8');
}

// LZW-compress a string
function lzw_encode(s) {
  var dict = {};
  var data = (s + "").split("");
  var out = [];
  var currChar;
  var phrase = data[0];
  var code = 256;
  for (var i=1; i<data.length; i++) {
    currChar=data[i];
    if (dict[phrase + currChar] != null) {
        phrase += currChar;
    } else {
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      dict[phrase + currChar] = code;
      code++;
      phrase=currChar;
    }
  }
  out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
  for (var i=0; i<out.length; i++) {
    out[i] = String.fromCharCode(out[i]);
  }
  return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
  var dict = {};
  var data = (s + "").split("");
  var currChar = data[0];
  var oldPhrase = currChar;
  var out = [currChar];
  var code = 256;
  var phrase;
  for (var i=1; i<data.length; i++) {
    var currCode = data[i].charCodeAt(0);
    if (currCode < 256) {
      phrase = data[i];
    } else {
      phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict[code] = oldPhrase + currChar;
    code++;
    oldPhrase = phrase;
  }
  return out.join("");
}

// currently available commands
var qdCommands = {

  // retrieves chat messages
  getchatmessages: function(args, msg, cb) {

    qdpb.read(10, function(data) {

      var destination = msg.dst || msg.src || "/";
      var result = {
        type: 3,
        pri : 0,
        dst : destination,
        cb  : msg.cb,
        msg : { "chatMessages": data }
      }

      cb(false, result);
    });

  },

  // retrieves current users
  getusers: function(args, msg, cb) {

    var destination = msg.dst || msg.src || "/";
    var result = {
      type: 3,
      pri : 0,
      dst : destination,
      cb  : msg.cb,
      msg : { "users": Users }
    }

    cb(false, result);
  }

}

var qd = {

  tryParseJSON: function (jsonString) {
    try {
      var o = JSON.parse(jsonString);

         // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, 
       // hence the type-checking,
      // but... JSON.parse(null) returns 'null', and typeof null === "object", 
      // so we must check for that, too.
      if (o && typeof o === "object" && o !== null) {
        return o;
      }
    }
    catch (e) { }

    return false;
  },

  encode: function(s) {

    var string = JSON.stringify(s);
    var compressed = lzw_encode( string );
    var b64 = b64EncodeUnicode( compressed );
    return ( b64 );
  },

  decode: function(s) {

    return lzw_decode( b64DecodeUnicode(s) );
  },

  msg: {

    // format an array of fields into a proper qdMsg
    format: function(fields){

      var msg = {
           v:  0,
         key: false,
        type:  1,
        date: (new Date).getTime(),
         src: 'server',
         dst: '/',
         pri:  0,
         usr: 'XY2',
         cb : false,
         msg: 'Ok'
      }

       // Visit non-inherited enumerable keys
      //update msg properties as they are provided
      Object.keys(msg).forEach(function(key) {
        if(msg.hasOwnProperty(key)) {
          Object.keys(fields).forEach(function(key) {
            if(fields.hasOwnProperty(key)) {
              msg[key] = fields[key];
            }
          });
        }
      });

      APP_CONFIG.log.debug("Reply", msg);
      return { enc: qd.encode(msg) };
    },
  },

  run: function(command, msg, cb) {

    // strip off the command character
    command = command.substr(1);

    var args = "";

    // strip off everything once there is a space character
    command = command.substring(0, command.indexOf(' '));

    // check to see if the command is in the list of available commands
    if ( qdCommands.hasOwnProperty(command) ) {

      // map to command function, then run it and see what comes back!
      qdCommands[command](args, msg, function(err, result) {
        if(err) APP_CONFIG.log(err);
        else if(result) {
          cb( false, result );
        }
      })
    } else {
      cb("ECMDNOTFOUND")
    }
  }
}

var qdpb = {
  write: function(fields) {

    var client = new pg.Client(connectionString);
    client.connect();

    client.query(`
      CREATE TABLE IF NOT EXISTS testfeed(
        v    smallint, 
        key  varchar(256),
        type integer,
        date bigint,
        src  varchar(256),
        dst  varchar(256),
        pri  smallint,
        usr  varchar(128),
        chk  varchar(256),
        msg  text
      )`);

    client.query(`
      INSERT INTO testfeed
        (v, key, type, date, src, dst, pri, usr, chk, msg) 
        values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          fields.v, 
          fields.key,
          fields.type,
          fields.date,
          fields.src,
          fields.dst,
          fields.pri,
          fields.usr,
          fields.chk,
          fields.msg
        ]
    );
    var query = client.query(`
      SELECT *
      FROM testfeed 
      ORDER BY date, chk
    `);

    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      client.end();
    });
  },

  read: function(limit, cb) {

    var client = new pg.Client(connectionString);
    client.connect();
    
    var query = client.query(`
      SELECT *
      FROM testfeed 
      WHERE type = ` + 0 + `
      ORDER BY date DESC
      LIMIT ` + limit + `
    `);

    query.on("row", function (row, result) {
      result.addRow(row);
    });
    query.on("end", function (result) {
      cb(result.rows);
      client.end();
    });

  }
}

var Req = {
  parse: function(request, cb) {

    // field defaults
    var fields = {
         v:  0,
       key: '',
      type:  0,
      date: (new Date).getTime(),
       src: '/',
       dst: '/',
       pri:  0,
       usr: '',
       chk: 'dd1e48d8cb7ae1d41bbbb71f03c6c540',
       cb : false,
       msg: ''
    }

    // if the request exists
    if(request) {

      // if enc object exists in request
      var payload = {};
      if( payload = request.enc ) {

        // if it is already an object
        if( typeof payload === "object" ) {

          // go straight to processing
          cb(false, payload);

        } else {

          // uncompress the message
          var decoded = qd.decode(payload);

          // if it is in JSON, pass it along
          var parsedRequest = qd.tryParseJSON(decoded);

          if(parsedRequest) {

            // iterate through the payload fields
            var fields = {};
            Object.keys(parsedRequest).forEach( function( key, index ) {
              fields[key] = parsedRequest[key];
            });

            cb(false, fields);
          
          } else {
            cb('EREQNOTJSON');
          }
        }
      } else {
        cb('EREQNOTENC');
      }
    } else {
      cb("EREQEMPTY");
    }
  },

  process: function(fields, err, cb) {
    var fieldKeys = Object.keys(fields);
    var totalFields = fieldKeys.length;

    APP_CONFIG.log.debug(fields);

    // add the new msg to the database
    qdpb.write(fields);

    // post the msg payload to an external API
    var msgContent = fields.msg;
    //postExternalAPI(msgContent);

    // if the msg type is an app log
    if(fields.type == 60) {
      
      // if the client wants a socket confirmation
      if(fields.msg.e == "socket") {

        var reply = {
          type: 3,
           src: 'server',
           dst: fields.src,
           usr: 'server',
           msg: 'socket established'
        };

        cb( false, { whip: "qdMsgSocket", encoded: qd.msg.format(reply) } );
      }
    }

    // if the message is a command and starts with the special Tilde character
    else if(typeof msgContent === "string" && msgContent.startsWith('~') ) {

      // map the command to a handler, and run it!
      qd.run(fields.msg, fields, function(err, result) {
        if (err) cb(err);
        else {

          cb( false, { 
            encoded: qd.msg.format(result),
            whip: result.dst
          });
        }
      });

    } else {

      // if the message is chat
      if(fields.type == 0) {
        cb( false, { 
            broadcast: true, 
            encoded: qd.msg.format( {
              msg: fields.msg, 
              usr: fields.usr,
              dst: fields.dst,
              cb : "newChatMessage"
            }),
            whip: fields.dst
          }
        );
      } else {
        cb( false, { 
          encoded: qd.msg.format( {} ),
          whip: fields.dst
        });
      }

    }
  },

  reply: function(res, reply, err, cb) {

    var status = reply.status || 200;

    res.status(status).send( reply.enc ).end();
    cb(false);
  },

  sReply: function(socket, reply, err, cb) {
    var whip = reply.whip || "qdMsgDown";
    var broadcast = reply.broadcast || false;

    APP_CONFIG.log.debug("whip: "+whip, "broadcast: "+broadcast);

    if(broadcast) {
      socket.broadcast.emit( whip, reply.encoded );
    } else {
      socket.emit( whip, reply.encoded );
    }
    cb(false);
  }
}

var Users = {};

var qdAPI = {

  // (query Q) a new incoming qdMsg
  new: function(req, res, next) {

    // check the formatting of the message
    Req.parse(msg, function(err, fields) {
      if(err) APP_CONFIG.log.error(err)
      else {

        // run the query
        Req.process(fields, err, function(err, reply) {
          if(err) APP_CONFIG.log.error(err)
          else {

            // send the reply msg
            Req.reply(res, reply, err, function(err) {
              if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
            })
          }
        })
      }
    })
  },

  connect: function(socket) {
    APP_CONFIG.log.debug("connect", socket.id);

    Users[socket.id] = {
      name: socket.id
    };

    var reply = { 
      broadcast: true,
      whip: "xy0.me/test",
      encoded: qd.msg.format( {
        msg: socket.id +" has joined", 
        dst: "xy0.me/test",
        cb : "newChatMessage"
      })
    };

    Req.sReply(socket, reply, false, function(err) {
      if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
    })
  },

  disconnect: function(socket) {
    APP_CONFIG.log.debug("disconnect", socket.id);

    var reply = { 
      broadcast: true,
      whip: "xy0.me/test",
      encoded: qd.msg.format( {
        msg: socket.id +" has quit", 
        dst: "xy0.me/test",
        cb : "newChatMessage"
      })
    };

    Req.sReply(socket, reply, false, function(err) {
      if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
    })

    if (Users[socket.id]) {
      delete Users[socket.id];
    }
  },

  // (display D) request some entries
  get: function (req, res, next) {
    var client = new pg.Client(connectionString);
    client.connect();
    
    var query = client.query(`
      SELECT *
      FROM testfeed 
      ORDER BY date DESC
      LIMIT 100
    `);

    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.status(200).send(result.rows, null, "    ").end();
        client.end();
    });

  },
  sGet: function(socket, msg) {

    // check the formatting of the message and uncompress it
    Req.parse(msg, function(err, fields) {
      if(err) APP_CONFIG.log.error(err)
      else {

        // run the query
        Req.process(fields, err, function(err, reply) {
          if(err) APP_CONFIG.log.error(err)
          else {

            // send the reply msg
            Req.sReply(socket, reply, err, function(err) {
              if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
            })
          }
        })
      }
    })
  }
  
}
module.exports = qdAPI;