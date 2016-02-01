var SITE_CONFIG = require('../config.js');
var Provider = require('../models/providerData.js');
var upload = require('../models/uploadData.js')('img', 'trash', SITE_CONFIG.siteURL+'/data');
var User = require('../models/userData.js');

var getCoords = function(address1, city, state, postalCode, cb){
  var request = require("request");
  var GOOGLE_API_KEY = SITE_CONFIG.geocodeAPIKey;
  var geocodeApiUrl  = "https://maps.googleapis.com/maps/api/geocode/json?address="
                      +address1+", "+city+", "+state+", "
                      +postalCode+"&GOOGLE_API_KEYey="+GOOGLE_API_KEY;
  request(geocodeApiUrl, function(err, response, body) {
    if(body && JSON.parse(body).results[0] && JSON.parse(body).results[0].geometry && JSON.parse(body).results[0].geometry.location){
      coords = JSON.parse(body).results[0].geometry.location;
    }else{
      coords = {
        lat: null,
        lng: null
      }
    }
    cb(err, coords);
  })
}

var providerAPI = {
  getAll: function(req, res, next){
    Provider.getAllproviders(function(err, theProviders){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, "GetAllProviders: Error:", err);
        res.status(500).send({message: "There was an error getting providers"}).end();
      }else{
        res.status(200).json(theProviders).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, "GetAllProviders: Success");
      }
    })
  },
  search: function(req, res, next){
    Provider.getProviders(req.query, function(err, theProviders){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, "GetProviders: Error:", err);
        res.status(500).send({message: "There was an error getting providers"}).end();
      }else{
        res.status(200).json(theProviders).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, "GetProviders: Success");
      }
    })
  },
  get: function(req, res, next){
    Provider.getProviderById(req.params.id, function(err, theProvider){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "GetProvider: Error:", err);
        res.status(500).send({message: "There was an error getting the provider"}).end();
      }else{
        res.status(200).json(theProvider).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, "GetProviderByID:", req.params.id, " Success");
      }
    })
  },
  create: function(req, res, next){
    if(!!req.body.Representative.UserID && req.body.Representative.UserID != "None"){
      User.getByName(req.body.Representative.UserID, function(err, theUser){
        if(!err){
          theUser.role = "provider";
          theUser.selfImage = req.body.Photos.rep.url+req.body.Photos.rep.names[0];
          User.updateUser(theUser, req.body.Representative.UserID, function(err){
            if(err){
              SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Unable to update role of user", req.body.Representative.UserID, err);
            }
          })
        } else {
          SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Unable to update role of user", req.body.Representative.UserID, err);
        }
      })
    }
    getCoords(req.body.Address1, req.body.City, req.body.State, req.body.PostalCode, function(err, coords){
      if (coords.lat != null){
        // geolocation successful
        req.body.Latitude = coords.lat;
        req.body.Longitude = coords.lng;
        Provider.createProvider(req.body, function(err, savedObj){
          if (err){
            res.status(500).send( {message:"There was an error creating provider"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.id, "CreateProvider: Error:", err);
          }else{
            res.status(200).send( {message:'Provider was created'}).end();
            upload.moveFromNew(req.body.id, function(err){
              if(err){
                SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.id, "MoveImages: Error:", err);
              }
            })
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.body.id, "CreateProvider: Success");
          }
        })
      }else{
        // geolocation failed
        Provider.createProvider(req.body, function(err, savedObj){
          if (err){
            res.status(500).send( {message:"There was an error creating provider"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.id, "CreateProvider: Coords not found: Error:", err);
          }else{
            res.status(200).send( {message:'Provider was created, but address was not found'}).end();
            SITE_CONFIG.log.warn(req.connection.remoteAddress, req.body.id, "CreateProvider: Coords not found");
          }
        })
      }
    })
  },
  put: function(req, res, next){
    Provider.getProviderById(req.params.id, function(err, theProvider){
      if (theProvider === null || err){
        res.status(404).send( {message:"Provider not found"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Not Found or", err);
      }else{
        if(!!req.body.Representative.UserID && req.body.Representative.UserID != "None"){
          User.getByName(req.body.Representative.UserID, function(err, theUser){
            if(!err){
              theUser.role = "provider";
              theUser.selfImage = req.body.Photos.rep.url+req.body.Photos.rep.names[0];
              User.updateUser(theUser, req.body.Representative.UserID, function(err){
                if(err){
                  SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Unable to update role of user", req.body.Representative.UserID, err);
                }
              })
            } else {
              SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Unable to update role of user", req.body.Representative.UserID, err);
            }
          })
        }
        getCoords(req.body.Address1, req.body.City, req.body.State, req.body.PostalCode, function(err, coords){
          if (coords.lat != null){
            // geolocation successful
            req.body.Latitude = coords.lat;
            req.body.Longitude = coords.lng;
            Provider.updateProvider(req.params.id, req.body, function(err, provider){
              if (err){
                res.status(500).send( {message:"There was an error updating the provider"}).end();
                SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Error:", err);
              }else{
                res.status(200).send( {message:"Provider has been updated"}).end();
                SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "UpdateProvider: Success");
              }
            })
          }else{
            // geolocation failed
            Provider.updateProvider(req.params.id, req.body, function(err, provider){
              if (err){
                res.status(500).send( {message:"There was an error updating the provider, and the address was not found"}).end();
                SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "UpdateProvider: Coords not found: Error:", err);
              }else{
                res.status(200).send( {message:"The provider was updated, but the address was not found"}).end();
                SITE_CONFIG.log.warn(req.connection.remoteAddress, req.params.id, "UpdateProvider: Coords not Found: Success");
              }
            })
          }
        })
      }
    })
  },
  delete: function(req, res, next){
    Provider.getProviderById(req.params.id, function(err, theProvider){
      if (theProvider === null){
        res.status(404).send( {message:"Unable to delete provider, not found"}).end();
        SITE_CONFIG.log.warn(req.connection.remoteAddress, req.params.id, "DeleteProvider: Provider not found");
      }else{
        Provider.deleteProvider(req.params.id, function(err, provider){
          if (err){
            res.status(500).send( {message:"Error deleting provider"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "DeleteProvider: Error:", err);
          }else{
            res.status(200).send( {message:"Provider deleted"}).end();
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "DeleteProvider: Success:");
          }
        })
      }
    })
  }
}
module.exports = providerAPI;