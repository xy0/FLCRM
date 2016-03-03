var APP_CONFIG = require('../config.js');
var request = require('request');

var pg = require('pg');
var connectionString = 'pg://postgrestest:h0Qili@localhost/test';

var postAPI = function(toSlack) {

  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     'https://hooks.slack.com/services/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',
    body: JSON.stringify({text: JSON.stringify(toSlack)})
  }, function(error, response, body){
    console.log(body);
  });

}

var qdMsg = {
  format: function(fields){

    var msg = {
         v:  0,
       key: false,
      type:  0,
      date: (new Date).getTime(),
       src: '',
       dst: '',
       pri:  0,
       usr: '',
       msg: ''
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
    })

    return qdEncode(msg);
  },

  parse: function() {
    //
  }
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
        }
        else {
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
        }
        else {
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

var qdEncode = function(s) {

  var string = JSON.stringify(s);
  var compressed = lzw_encode( string );
  var b64 = b64EncodeUnicode( compressed );
  return ( b64 );
}

var qdDecode = function(s) {

  return lzw_decode( b64DecodeUnicode(s) );
}

function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns 'null', and typeof null === "object", 
        // so we must check for that, too.
        if (o && typeof o === "object" && o !== null) {
            return o;
        }
    }
    catch (e) { }

    return false;
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
  }
}

var Req = {
  check: function(request, cb) {

    // if the request exists
    if(request) {

      // if enc object exists in request
      var payload = {};
      if( payload = request.enc ) {

        // if it is already an object
        if( typeof payload === "object" ) {

          cb(false, payload);

        } else {

          var decoded = qdDecode(payload);

          // if it is JSON
          var parsedRequest = tryParseJSON(decoded);
          if(parsedRequest) {
            cb(false, parsedRequest);
          
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

  parse: function(parsedRequest, err, cb) {

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
       msg: ''
    }

    // iterate through the payload fields
    Object.keys(parsedRequest).forEach(function(key,index) {
      fields[key] = parsedRequest[key];
    });

    cb(false, fields);

  },

  process: function(fields, err, cb) {
    var fieldKeys = Object.keys(fields);
    var totalFields = fieldKeys.length;

    fieldKeys.forEach(function(key,index) {
      totalFields = totalFields -1;

      //console.log(key, fields[key]);
    });

    console.log(fields);

    qdpb.write(fields);

    var msgContent = fields['msg'];

    postAPI(msgContent);

    var replyMsg = {
      type: fields.type + 1,
      pri : 0,
      msg : {
              s: 200,
              m: 'Ok'
            }
    }

    var replyEnc = qdMsg.format(replyMsg);

    cb( false, {res: replyMsg.msg, enc:replyEnc} );

  },

  reply: function(res, reply, err, cb) {
    res.status(reply.res.s).send(reply).end();
    cb(false);

  }
}


var qdAPI = {

  new: function(req, res, next) {
    Req.check(req.body, function(err, request) {
      if(err) APP_CONFIG.log.error(err)
      else {
        Req.parse(request, err, function(err, fields) {
          Req.process(fields, err, function(err, reply) {
            Req.reply(res, reply, err, function(err) {
              if(err) APP_CONFIG.log.error(arguments.callee.toString(), err);
            })
          })
        })
      }
    })
  },

  get: function (req, res, next) {
    var client = new pg.Client(connectionString);
    client.connect();
    
    var query = client.query(`
      SELECT *
      FROM testfeed 
      ORDER BY date DESC
      LIMIT 10
    `);

    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.status(200).send(result.rows, null, "    ").end();
        client.end();
    });

  }
  
}
module.exports = qdAPI;