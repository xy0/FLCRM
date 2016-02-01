var SITE_CONFIG = require('../config.js');
var mongoose = require('mongoose');
var passport = require('passport');
var bcrypt = require('bcrypt'); // For passwords

// --------------------------------------------------------------------------
// SCHEMA
// --------------------------------------------------------------------------
var userSchema = mongoose.Schema({
  // Credentials
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  firstName: String,
  lastName: String,
  ageRange: String,
  budget: String,
  phoneNumber: String,
  address: String,
  careFor: String,
  timelineToMove: String,
  favorites: Array,
  passwordResetToken: {
    type: String,
    required: false,
    select: false
  },
  tokenUsed: {
    type: Boolean,
    required: false,
    default: false
  },
  confirmed: Boolean,
  role: String
})

// Password encryption
userSchema.pre('save', function(next){
  var theUser = this;
  if(!theUser.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, theSalt){
    if(err) return next(err);
    bcrypt.hash(theUser.password, theSalt, function(err, hash){
      if(err) return next(err);
      theUser.password = hash;
      return next();
    })
  })
})

// Password checking
userSchema.methods.checkAuth = function(allegedPassword, next){
  bcrypt.compare(allegedPassword, this.password, function(err, isMatch){
    if(err) return next(err);
    return next(null, isMatch);
  })
}

var User = mongoose.model('user', userSchema);

User.getByName = function(allegedUsername, cb){
  User.findOne({email: allegedUsername}, "+password", function(err, theUser){
    cb(err, theUser);
  })
}
User.getAll = function(cb){
  User.find({}).sort('email').exec(function(err,theUsers){
    if (err){ 
      SITE_CONFIG.log.error("FIND ERROR", err); 
    }
    cb(err,theUsers);
  })
}
User.getUserByID = function(userID, cb){
  User.findById(userID, function(err, theUser) { 
    cb(err, theUser);
  })
}
User.create = function(obj, cb){
  var processed = new User(obj);
  processed.save(function(err, savedObj){
    if (err){ 
      SITE_CONFIG.log.error("CREATE ERROR", err); 
    }
    cb(err,savedObj)
  })
}
User.updateUser = function(obj, email, cb){
  User.findOne({"email": email}, function(err,theUser){
    if (err){ 
      cb(err, theUser);
    }else{
      theUser.update(obj, function(err){
        if (err){ 
          SITE_CONFIG.log.error("UPDATE ERROR", err); 
        }
        cb(err);
      })
    }
  })
}
User.passwordUpdate = function(obj, email, cb){
  User.findOne({"email": email}, function(err,theUser){
    if (err){ 
      cb(err, theUser);
    }else{
      theUser.password = obj.password;
      theUser.save(function(err, savedObj){
        if (err){ 
          SITE_CONFIG.log.error("UPDATE ERROR", err); 
        }
        cb(err);
      })
    }
  })
},
User.getFavorites = function(userID, cb){
  User.findOne({email: userID}, function(err, theUser) {
    if(!err){
      cb(false, theUser.favorites);
    } else {
      cb(err);
    }
  })
}
User.addFavorite = function(userID, providerID, cb){
  User.update({email: userID},{$push: {favorites:providerID}},{upsert:true},function(err){
    if(err){
      SITE_CONFIG.log.error(err);
      cb(err);
    }else{
      cb(false);
    }
  })
}
User.removeFavorite = function(userID, providerID, cb){
  User.update({email: userID},{$pull: {favorites:providerID}},function(err){
    if(err){
      SITE_CONFIG.log.error(err);
      cb(err);
    }else{
      cb(false);
    }
  })
}
User.makePasswordResetToken = function(userID, cb){
  User.findOne({email: userID}, "+password", function(err, theUser){
    var preHash = theUser.email+theUser.password;
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(preHash, salt, function(err, hash) {
        var token = new Buffer(hash).toString('base64');
        User.update({email: userID},{passwordResetToken:token},function(err){
          if(!err){
            cb(false, token);
          } else {
            cb(err, token);
          }
        })
      })
    })
  })
}
User.validatePasswordResetToken = function(userID, token, cb){
  User.findOne({email: userID}, "+passwordResetToken", function(err, theUser){
    if(theUser.passwordResetToken == token){
      User.update({email: userID},{passwordResetToken:true, tokenUsed:true, confirmed:true},function(err){
        if(!err){
          cb(err, theUser);
        }
      })
    }else{
      cb(err, false);
    }
  })
}
User.clearPasswordResetToken = function(userID, cb){
  User.findOne({email: userID}, "+passwordResetToken", function(err, theUser){
    User.update({email: userID},{tokenUsed:false},function(err){
      if(!err){
        cb(err, theUser);
      }
    })
  })
}
User.delete = function(email, cb){
  User.findOne({"email": email}, function(err,theUser){
    if (err){ 
      cb(err, theUser);
    }else{
      User.remove({_id:theUser._id}, function(err){
        if (err){ 
          SITE_CONFIG.log.error("DELETE ERROR", err);
        }
        cb(err);
      })
    }
  })
}
module.exports = User;