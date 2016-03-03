var APP_CONFIG = require('./config.js');

// ------------------------------  FYN  -------------------------------------
// DB                     \_|\ FLCRM 2016 xy0~C
// --------------------------------------------------------------------------
/*
var mongoose = require('mongoose');
mongoose.connect(APP_CONFIG.dbURL, {
  user: APP_CONFIG.dbName,
  pass: APP_CONFIG.dbPass
});
*/
// --------------------------------------------------------------------------
// APP
// --------------------------------------------------------------------------

var express                       = require('express');
var app                           = express();
var server                        = require('http').Server(app);
var io                            = require('socket.io')(server); // websockets

var fs                            = require('fs'),
    bodyParser                    = require('body-parser'),
    cookieParser                  = require('cookie-parser'),
    session                       = require('express-session'),
    passport                      = require('passport'),
    auth                          = require('./security/passportConfig.js'),
    multipart                     = require('connect-multiparty'), // flow file uploads
    multipartMiddleware           = multipart(), // flow file uploads
    ACCESS_CONTROLL_ALLOW_ORIGIN  = false; // for cross-domain uploads


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));
//app.use(app.router);

app.use(express.static('../client'));
// app.use('/data/img', express.static('../server/img'));
//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: APP_CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize()) // Passport base
app.use(passport.session()); // Passport session management
/*
app.use(require('prerender-node')
   .set('prerenderToken', APP_CONFIG.prerenderToken));
*/


APP_CONFIG.log.info("Application Starting");

// --------------------------------------------------------------------------
// API
// --------------------------------------------------------------------------
var qdAPI = require ('./api/qdAPI.js');

app.post('/qd', qdAPI.new) // log client application events


// if no route is specified, send the request to angular's index (for html5 states)
app.get('*', function (req, res) {

   // send the request to the root index file, defineing the current working directory
  //  and and replacing the last part of the path with the client directory 
  res.sendFile('index.html', { root: __dirname.replace( __dirname.split(/[\\/]/).pop(),'client') });  
});


// --------------------------------------------------------------------------
// SERVER
// --------------------------------------------------------------------------

// catch any uncaught errors
process.on('uncaughtException', function(err, data) {
  APP_CONFIG.log.fatal("Application Error", err, data, err.stack);
});


// Socket.io Communication
//io.on('connection', function(){ /* … */ });

// start a http server
// var server = app.listen(APP_CONFIG.serverPort, function (){
//   var host = server.address().address;
//   var port = server.address().port;
//   console.log('API available at http://%s:%s HTTP', host, port);
// });

server.listen(APP_CONFIG.serverPort, function (){
  var host = server.address().address;
  var port = server.address().port;
  console.log('API available at http://%s:%s HTTP', host, port);
});

// if forceHTTPS is enabled, the app will redirect all insecure connections to HTTPS
if(!!APP_CONFIG.forceHTTPS) {
  app.use(function(req, res, next){
    if(req.secure) {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url)
    }
  });

  // start a https server
  app.use(enforce.HTTPS());
  https.createServer(options, app).listen(443, function(){
    console.log('API available at http://%s:%s HTTPS');
  })
}