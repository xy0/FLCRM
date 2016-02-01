var SITE_CONFIG = require('../config.js');
var passport = require('passport');
var User = require('../models/userData.js');

// SERIALIZATION:
passport.serializeUser(function(user, done){
  done(null, user.id);
});

// DESERIALIZATION:
passport.deserializeUser(function(id, done){
  User.getUserByID(id, function(err, theUser){
    done(err, theUser);
  });
});

// STRATEGY
var LocalStrategy = require('passport-local').Strategy;
var localStrategy = new LocalStrategy(function(allegedUsername, allegedPassword, done){
  SITE_CONFIG.log.info(allegedUsername, "logging in..." );
  User.getByName(allegedUsername, function(err, theUser){
    if (err){ 
      return done(err);
    }
    if (!theUser) {
      SITE_CONFIG.log.warn(allegedUsername, "not found" );
      return done(null, false);
    }
    theUser.checkAuth(allegedPassword, function(err, isAuth){
      if (err){ return done(err); }
      if (isAuth){
        return done(err, theUser);
      }
      else{
        return done(null, false);
      }
    });
  });
});
passport.use(localStrategy);

// --------------------------------------------------------------------------
// EXPORT MODULES
// --------------------------------------------------------------------------
module.exports = {
  ensureAuth: function(req, res, next){
    if (req.isAuthenticated()){
      SITE_CONFIG.log.info(req.connection.remoteAddress,req.path, "(User) Authenticated" );
      return next();
    }
    SITE_CONFIG.log.warn(req.connection.remoteAddress,req.path, "(User) Restricted" );
    res.status(403).send({message:"Not authorized"}).end();
  }
};