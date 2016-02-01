var APP_CONFIG = require('./config.js');

// ------------------------------Devetry-------------------------------------
// DB                      \_|\ mimi 2015 ~cs
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
var fs                            = require('fs'); // flow file uploads
var bodyParser                    = require('body-parser');
var cookieParser                  = require('cookie-parser');
var session                       = require('express-session');
var passport                      = require('passport');
var auth                          = require('./security/passportConfig.js'); // Passport authentication configuration
var multipart                     = require('connect-multiparty'); // flow file uploads
var multipartMiddleware           = multipart(); // flow file uploads
var ACCESS_CONTROLL_ALLOW_ORIGIN  = false; // for cross-domain uploads

/*
app.use(require('prerender-node')
   .set('prerenderToken', APP_CONFIG.prerenderToken));
*/
app.use(express.static('../client'));
// app.use('/data/img', express.static('../server/img'));
// app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());// Static content
app.use(cookieParser());
app.use(session({
  secret: APP_CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize()) // Passport base
app.use(passport.session()); // Passport session management

APP_CONFIG.log.info("Application Starting");

// --------------------------------------------------------------------------
// API
// --------------------------------------------------------------------------


// if no route is specified, send the request to angular's index (for html5 states)
app.get('*', function (req, res) {

     // send the request to the root index file, defineing the current working directory
    //  and and replacing the last part of the path with the client directory 
    res.sendFile('index.html', { root: __dirname.replace( __dirname.split(/[\\/]/).pop(), 'client') });  
});


// --------------------------------------------------------------------------
// SERVER
// --------------------------------------------------------------------------

// catch any uncaught errors
process.on('uncaughtException', function(err, data) {
  APP_CONFIG.log.fatal("Application Error", err, data, err.stack);
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

// start a http server
var server = app.listen(APP_CONFIG.nodePort, function (){
  var host = server.address().address;
  var port = server.address().port;
  console.log('API available at http://%s:%s HTTP', host, port);
});
