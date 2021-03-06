angular.module("flcrm.mainServices", [])

 // Proper logging service, can be configured to dispatch errors and certain events
// replaces the need to console log everyehre
.factory('Log', function($rootScope, API, qdMsg, LOG_URLs) {
  var Log = function (level, event, result, detail) {

    detail = detail || '';

    var sendToAPIs = function(level, event, result, detail) {

      // if not disabled, send the events to the master logger qd
      if( $rootScope.Prefs.sendLogEvents == true) {

        // send msg to all apis listed
        for( var l = LOG_URLs.length - 1; l >= 0; l = l-1 ) {

          // format the message properly
          var msg = qdMsg.format (
            {
              type: 60,
              pri : 0 - level,
              msg : {
                    e: event,
                    r: result,
                    d: detail
              }
            }
          );

          // send message to server
          API.http(LOG_URLs[l], 'post', {"enc": msg})
          .then( function(res) {
            // console.log(res); // remove when not debuging
          });
        }
      }    
    }

    // if there was an error, style the output accordingly and consolelog it
    if( level == 0 ) {

      console.warn('WARN:', event, result);
      sendToAPIs( level, event, result );

    } else if( level < 0 ) {

      console.error('ERROR:', event, result);
      sendToAPIs( level, event, result );

    } else {

      console.log('> ', event, result);
      sendToAPIs( level, event, result );

    }
  }

  return Log;
})

.factory('Websocket', function (socketFactory) {
  var socket = socketFactory();
  socket.forward('broadcast');
  return socket;
})

.factory('SAPI', function (Websocket) {
  var functions = {
    emit: function(name, object) {
      Websocket.emit( name, object);
    },
    on: function(name, response) {
      Websocket.on(name, response);
    }
  };

  return functions;
})

.factory('qdMsg', function($rootScope, SAPI, $location) {

  function b64EncodeUnicode(str) {
    return btoa( unescape( encodeURIComponent( str ) ) );
  }

  function b64DecodeUnicode(str) {
    return decodeURIComponent( escape( atob( str ) ) );
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

  var qdEncode = function(s) {

    // return s;

    var string = JSON.stringify(s);
    var compressed = lzw_encode( string );
    var b64 = b64EncodeUnicode( compressed );
    return ( b64 );

  }

  var qdDecode = function(s) {
    return lzw_decode( b64DecodeUnicode(s) );
  }

  var qdMsg = {
    format: function(fields){

      var msg = {
           v:  0,
         key: false,
        type:  0,
        date: (new Date).getTime(),
         src: $location.absUrl().replace(/^(https?:|)\/\//, ''),
         dst: $location.absUrl().replace(/^(https?:|)\/\//, ''),
         pri:  0,
         usr: '',
         cb : false,
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
      });

      console.log("sending > ", msg);
      return {enc: qdEncode(msg)};
    },

    parse: function(qdMsg) {

      // if the request exists
      if(qdMsg) {

        // if enc object exists in request
        var payload = {};
        if( payload = qdMsg.enc ) {

          // if it is already an object
          if( typeof payload === "object" ) {

            return payload;

          } else {

            // decompress and format enc
            var decoded = qdDecode(payload);

            // if it is JSON
            var parsedRequest = tryParseJSON(decoded);
            if(parsedRequest) {
              return(parsedRequest);
            
            } else {

              return('EREQNOTJSON');
            }
          }
        } else {
          return('EREQNOTENC');
        }
      } else {

        return("EREQEMPTY");
      }

    },

    send: function(msg) {

      SAPI.emit( "qdMsgUp", qdMsg.format(msg) );

    },

    request: function(msg, cb) {

      SAPI.emit( "qdMsgUp", qdMsg.format(msg) );
      $rootScope.$on( msg.cb, function( name, data ) {
        cb(data);
      });
    },

    register: function(whip, cb) {

      $rootScope.$on( whip, function( name, data ) {
        cb(data);
      });

    },

    genRandID: function() {
      function makeid()
      {
          var text = "";
          var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

          for( var i=0; i < 5; i++ )
              text += possible.charAt(Math.floor(Math.random() * possible.length));

          return text;
      }

      return makeid();
    }
  }

  return qdMsg;
})

.filter('myLimitTo', function() {
  return function(input, limit, begin) {
    return input.slice(begin, begin + limit);
  }
})

.filter('words', function () {
  return function (input, words) {
    if (isNaN(words)) return input;
    if (words <= 0) return '';
    if (input) {
      var inputWords = input.split(/\s+/);
      if (inputWords.length > words) {
        input = inputWords.slice(0, words).join(' ') + '…';
      }
    }
    return input;
  }
})

.filter('tel', function () {
  return function (tel) {
    if (!tel) { return ''; }
    var value = tel.toString().replace(/[^a-z0-9]/gi,'');;
    var country, city, number;
    switch (value.length) {
      case 10:
        country = 1;
        city = value.slice(0, 3);
        number = value.slice(3);
        break;
      case 11:
        country = value[0];
        city = value.slice(1, 4);
        number = value.slice(4);
        break;
      case 12:
        country = value.slice(0, 3);
        city = value.slice(3, 5);
        number = value.slice(5);
        break;
      default:
        return tel;
    }
    if (country == 1) {
      country = "";
    }
    number = number.slice(0, 3) + '-' + number.slice(3);
    return (country + " (" + city + ") " + number).trim();
  }
})

// service to change the page
.factory('Page', function($rootScope, $state){
  var Page = {

    change: function(page){

      var pageIsDifferent = function() {

        // if the provided page is different than the current page
        if(!!page && page != $rootScope.Globals.page) {
          return true;
        } else {
          return false;
        }
      }

      var changePage = function() {

        // turn on loading symbol
        $rootScope.Globals.isDataLoaded = false;

        // change the page
        $rootScope.Globals.page = page;
        $state.go(page);

        return true;
      }
      
      if( pageIsDifferent() ) {
        changePage();

        // log the new page change
        $rootScope.log(0, 'pageChange', page);
      } else {

        // log the error
        $rootScope.log(-1, 'pageChange', 'page and destination are the same');
      }
    }
  }
  return Page;
})

.factory('API', function($http) {
  var promise = [];
  var functions = {
    http: function(url, method, params, promiseID) {
      method = method || "get";
      promiseID = promiseID || false;
      params = params || null;

      if(promiseID){
        if (!promise[promiseID] ) {
          promise[promiseID] = $http[method](url,params).then( function (response) {
            return response.data;
          })
        }
        return promise[promiseID];
      } else {
        promise = $http[method](url,params).then( function (response) {
          return response.data;
        }).catch(function(err){
          return err;
        })
        return promise;
      }
    },

    jsonp: function(url, promiseID) {
      promiseID = promiseID || false;

      if(promiseID){
        if ( !promise[promiseID] ) {
          promise[promiseID] = $http.jsonp(url + "&callback=JSON_CALLBACK")
          .success( function(res) {
            //
          })
          .error( function (res) {
            //
          })
        }
        return promise[promiseID];
      } else {
        promise = $http.jsonp(url + "&callback=JSON_CALLBACK")
        .success( function(res) {
          //
        })
        .error( function (res) {
          //
        })
        return promise;
      }
    }
  }
  return functions;
})

.factory('Feed', function(API, Log) {
  var promise = [];

  var functions = {
    get: function (URL) {

      promise = API.jsonp(URL, 'theFeedPromiseID').then( function (res) {
        return res.data;
      }).catch( function(err) {
        
        // only log if there is an error
        Log(-1, "getFeed", err);
        return err;
      })

      return promise;
    }
  }
  return functions;
})

.factory('Cookies', function(){
  var Cookie = {

    read: function (name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ')
          c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) 
          return JSON.parse(unescape(c.substring(nameEQ.length,c.length)).substring(2));
      }
      return null;
    },

    readB64: function (name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');

      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
          c = c.substring(1,c.length);
        }

        if (c.indexOf(nameEQ) == 0) {
          return JSON.parse(atob(c.substring(nameEQ.length,c.length)));
        }
      }
      return null;
    },

    check: function (name){
      return (document.cookie.indexOf(name) >= 0);
    },

    write: function (cookieName, cookieJSON) {

      var cookieData = btoa( JSON.stringify(cookieJSON) );

      var index = -1;
      if (document.cookie) {
        var index = document.cookie.indexOf(cookieName);
      }

      if (index == -1) {
        //Log(1, "writeCookie", cookieName+" created");
        document.cookie = cookieName +"="+cookieData+"; expires=Saturday, 11-Nov-2084 18:11:11 GMT";
      } else {
        //Log(1, "writeCookie", cookieName+" updated");
        var countbegin = (document.cookie.indexOf("=", index) + 1);
        var countend = document.cookie.indexOf(";", index);
        if (countend == -1) {
          countend = document.cookie.length;
        }
        //var count = eval( document.cookie.substring(countbegin, countend) ) + 1;
        document.cookie = cookieName +"="+cookieData+"; expires=Saturday, 11-Nov-2084 18:11:11 GMT";
      }
    }
  }
  return Cookie;
})


;