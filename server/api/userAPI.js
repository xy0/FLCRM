var SITE_CONFIG = require('../config.js');
var User = require('../models/userData.js');
var Provider = require('../models/providerData.js');

var userAPI = {
  getAll: function(req, res, next){
    User.getAll(function(err, theUsers){
      if (err){
        res.status(500).send({message:"Error fetching users"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, "GetAllUsers: Error:", err);
      }else{
        res.status(200).json(theUsers).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, "GetAllUsers: Success");
      }
    })
  },
  get: function(req, res, next){
    User.getByName(req.params.email, function(err, theUser){
      if (err){
        res.status(500).send({message:"Error getting user by email"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.email, "GetUserByEmail: Error:", err);
      }else{
        res.status(200).json(theUser).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.email, "GetUserByEmail: Success:");
      }
    })
  },
  update: function(req, res, next){
    var newObj = {  firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    address: req.body.address,
                    ageRange: req.body.ageRange,
                    budget: req.body.budget,
                    phoneNumber: req.body.phoneNumber,
                    careFor: req.body.careFor,
                    timelineToMove: req.body.timelineToMove
                  };
    if (req.user.role == 'admin' || req.user.role == 'provider'){
      newObj.role = req.body.role; 
    }
    User.updateUser(newObj, req.params.id, function(err, theUser){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, newObj, "UpdateUser: Error:", err);
        res.status(500).send({message:"Unable to update user"}).end();
      } else {
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "UpdateUser: Success:");;
        res.status(200).send({message:'Your profile has been updated'}).end();
      }
    })
  },
  delete: function(req, res, next){
    User.getByName(req.params.email, function(err, theUser){
      if (theUser === null || err){
        req.status(500).send({message:"User not found"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.email, "DeleteUser: Error: not found, or", err);
      }else{
        User.delete(req.params.email, function(err, user){
          if (err){
            res.status(500).send({message:"Unable to delete user"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.email, "DeleteUser: Error:", err);
          }else{
            res.status(200).send({message:'The user was deleted'}).end();
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.email, "DeleteUser: Success");
          }
        })
      }
    })
  },
  addFavorite: function(req, res, next){
    User.addFavorite(req.params.id, req.body.providerID, function(err){
      if(err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, req.body.providerID, "AddFavorite: Error:", err);
        res.status(500).send({message:"Unable to add favorite"}).end();
      } else {
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, req.body.providerID, "AddFavorite: Success");
        res.status(200).send({message:'Favorite added'}).end();
      }
    })
  },
  getFavorites: function(req, res, next){
    var query = {
      location: SITE_CONFIG.defaultLocation
    };
    User.getFavorites(req.params.id, function(err, favorites){
      if(err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "GetFavorites: Error:", err);
        res.status(500).send({message:"There was an error getting favorites"}).end();
      } else {
        Provider.getMultiple(query, favorites, function(err, theProviders){
          if(err){
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, query, "GetMultiProvider: Error:", err);
            res.status(500).send({message:"Could not fetch providers"}).end();
          } else {
            res.status(200).json(theProviders).end();
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "GetFavorites: Success");
          }
        })
      }
    })
  },
  removeFavorite: function(req, res, next){
    User.removeFavorite(req.params.userID, req.params.providerID, function(err){
      if(err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.userID, req.params.providerID, "RemoveFavorite: Error:", err);
        res.status(500).send({message:"Could not remove favorite"}).end();
      } else {
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.userID, req.params.providerID, "RemoveFavorite: Success");
        res.status(200).send({message:'The favorite has been removed'});
      }
    })
  }
}
module.exports = userAPI;