var SITE_CONFIG = require('../config.js');
var passport = require('passport');
var User = require('../models/userData.js');
var emailService = require('../services/emailService.js');

var authAPI = {
  login: function(req, res, next){
    var userID = req.body.email;
    var pass  = req.body.password;
    if (!userID || !pass){
      res.status(400).send({message:"Bad request, not enough arguements"}).end();
      SITE_CONFIG.log.warn(req.connection.remoteAddress, "Login: not enough arguements");
    }else{
      req.body.username = req.body.email;
      var authFunction = passport.authenticate('local', function(err, user, info){
        if (err){
          res.status(500).send({message:"There was an error logging in"}).end();
          SITE_CONFIG.log.error(req.connection.remoteAddress, "Login: Error:", err);
        }else if (!user){ 
          res.status(401).send({message:"User not found, or bad password"}).end();
          SITE_CONFIG.log.warn(req.connection.remoteAddress, req.body.email, "Login: no user or bad pass");
        }else{
          req.login(user, function(err){
            if (err){ return next(err); }
            SITE_CONFIG.log.info(req.connection.remoteAddress, userID, "Logged In");
            var userCookie = {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              address: user.address,
              ageRange: user.ageRange,
              budget: user.budget,
              phoneNumber: user.phoneNumber,
              careFor: user.careFor,
              timelineToMove: user.timelineToMove,
              role: user.role,
              favorites: user.favorites,
              loggedIn: true
            };
            res.cookie('User', userCookie, {expires: new Date() + 86400000, maxAge: 86400000}).send({authenticated:true});
          })
        }
      })
      authFunction(req, res, next);
    }
  },
  checkLogin: function(req, res, next){
    if(req.user){
      var userCookie = {
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        address: req.user.address,
        ageRange: req.user.ageRange,
        budget: req.user.budget,
        phoneNumber: req.user.phoneNumber,
        careFor: req.user.careFor,
        timelineToMove: req.user.timelineToMove,
        role: req.user.role,
        favorites: req.user.favorites,
        loggedIn: true
      };
      res.cookie('User', userCookie, {expires: new Date() + 86400000, maxAge: 86400000}).send({authenticated:true});
    }else{
      res.send({authenticated:false});
    }
  },
  logout: function(req, res, next){
    res.cookie('User', false, {expires: new Date(), maxAge: 0}).send({authenticated:false});
    SITE_CONFIG.log.info(req.connection.remoteAddress, "has logged out");
    req.logout();
  },
  register: function(req, res, next){
    var obj = req.body;
    obj.role = "user";
    User.create(obj, function(err,theUser){
      if (err){
        res.status(500).send({message:"There was an error creating a new user"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress,req.body.email, "CreateUser: Error:", err);
      }
      else { 
        User.makePasswordResetToken(theUser.email, function(err, token){
          if(!err){
            var to = [{
              email: theUser.email,
              name: theUser.firstName+" "+theUser.lastName
            }];
            var subject = "Thanks for registering with Mimi";
            var template = "register";
            var resetLink = SITE_CONFIG.siteURL+"/resetPassword/"+theUser.email+"/"+token;
            var templateData = {resetLink: resetLink};
            emailService.send(to, subject, template, templateData, function(err, result){
              if(err){
                SITE_CONFIG.log.error(req.connection.remoteAddress, theUser.email, "SendEmail: Error:", err);
              } else {
                SITE_CONFIG.log.info(req.connection.remoteAddress, "SendEmail:", result);
              }
            });
            res.status(200).send({message:"User has been created"}).end();
            SITE_CONFIG.log.info(req.connection.remoteAddress,req.body.email, "has just signed up");
          } else {
            res.status(500).send({message:"Error creating new user"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress,req.body.email, "CreateToken: Error", err);
          }
        })
      }
    })
  },
  resetPassword: function(req, res, next){
    var email = req.body.email;
    User.getByName(email, function(err, theUser){
      if(theUser){
        res.status(200).send({userFound:true,message:"Password reset link has been sent"}).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, email, "has requested a password reset email");
        User.makePasswordResetToken(theUser.email, function(err, token){
          if(!err){
            var to = [{
                email: theUser.email,
                 name: theUser.email
            }];
            var subject = "Reset Your Password on Mimi";
            var template = "resetPassword";
            var resetLink = SITE_CONFIG.siteURL+"/resetPassword/"+theUser.email+"/"+token;
            var templateData = {resetLink:resetLink};
            emailService.send(to, subject, template, templateData, function(err, result){
              if(err){
                SITE_CONFIG.log.error(req.connection.remoteAddress, theUser.email, "SendEmail: Error:", err);
              } else {
                SITE_CONFIG.log.info(req.connection.remoteAddress, "SendEmail:", result);
              }
            })
          }
        })
      } else {
        res.status(404).send({userFound:false, message:"No matching email found"}).end();
        SITE_CONFIG.log.warn(req.connection.remoteAddress, email, "PasswordReset: Email not found");
      }
    })
  },
  validatePasswordReset: function(req, res, next){
    User.validatePasswordResetToken(req.params.userID, req.params.token, function(err, theUser){
      if (theUser){
        req.login(theUser, function(err){
          if (err){ return next(err); }
          SITE_CONFIG.log.info(req.connection.remoteAddress, theUser.email, "logged in via token");
          var userCookie = {
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            address: req.user.address,
            ageRange: req.user.ageRange,
            budget: req.user.budget,
            phoneNumber: req.user.phoneNumber,
            careFor: req.user.careFor,
            timelineToMove: req.user.timelineToMove,
            role: req.user.role,
            loggedIn: 'token'
          };
          res.cookie('User', userCookie, {expires: new Date() + 86400000, maxAge: 86400000}).redirect("/#!/dashboard/account");
        })
      }else{
        //res.redirect("/");
        res.status(498).send({message:"Token is either invalid or expired"}).end();
        SITE_CONFIG.log.warn(req.connection.remoteAddress, "ValidateToken: Failed", err);
      }
    })
  },
  checkAdmin: function(req, res, next){
    if(req.user.role == "admin" || req.user.role == "provider"){
      SITE_CONFIG.log.info(req.connection.remoteAddress,req.path, "(Admin) Authenticated" );
      next();
    }else{
      SITE_CONFIG.log.warn(req.connection.remoteAddress,req.path, "(Admin) Restricted" );
      res.status(403).send({message:"You are not allowed to view this item"}).end();
    }
  },
  passwordUpdate: function(req, res, next){
    req.body.username = req.body.email;
    var checkPass = passport.authenticate('local', function(err, user, info){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdatePassword: Error:", err);
        res.status(500).send({message:"There was an error updating your password"}).end();
        return next(err);
      }else if(!user){ 
        SITE_CONFIG.log.warn(req.connection.remoteAddress, req.params.id, "UpdatePassword: bad existing password");
        res.status(401).send({message:'Existing password is incorrect'}).end();
      }else{
        req.body.password = req.body.newPassword;
        User.passwordUpdate(req.body, req.params.id, function(result){
          SITE_CONFIG.log.info(req.connection.remoteAddress, user.email, "UpdatePassword: Success");
          res.status(200).send({message:'Password updated'}).end();
        })
      }
    });
    if(req.user.tokenUsed == true){
      req.body.password = req.body.newPassword;
      User.passwordUpdate(req.body, req.params.id, function(result){
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.body.email, "UpdatePassword: Success: Token Used");
        res.status(200).send({message:'Password updated after reset'}).end();
        User.clearPasswordResetToken(req.body.email, function(err){
          if(err){
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.email, "ClearPasswordToken: Error:", err);
          }
        })
      })
    } else {
      checkPass(req, res, next);  
    }
  }
}
module.exports = authAPI;