var SITE_CONFIG = require('../config.js');
var mongoose = require('mongoose');

// --------------------------------------------------------------------------
// SCHEMA
// --------------------------------------------------------------------------
var providerSchema = mongoose.Schema({
  id: {type: String, unique: true, required: true},
  Type: {type: String, required: false},
  ProviderName: {type: String, required: true},
  Address1: {type: String, required: true},
  Address2: String,
  City: {type: String, required: true},
  State: {type: String, required: true},
  PricePoint: {type: String, required: true},
  PostalCode: {type: String},
  County: String,
  Phone: String,
  Email: String,
  WebsiteUrl: String,
  FacebookUrl: String,
  TwitterUrl: String,
  Latitude: Number,   // calculated in providerAPI
  Longitude: Number,  // calculated in providerAPI
  Photos: Object,
  MapIconUrl: String,
  Ratings: {
    BBB: String,
    OneDayResponse: Number,
    Recommended: Number,
    AverageUser: {
      Rating: Number,
      Total: Number
    },
    Staff:{
      Rating: Number
    },
    Facilities: {
      Rating: Number
    },
    Rooms: {
      Rating: Number
    },
    Activities: {
      Rating: Number
    }
  },
  Availability: String,
  Costs:{
    Min: Number,
    Adv: Number
  },
  PaymentInfo: Array,
  ProviderType: String,
  Representative: {
    Name: String,
    PhoneNumber: String,
    Title: String,
    Profile: String,
    UserID: String
  },
  CareTypes: Array,
  Description: String,
  Features: {
    PropertyInfo: {
      EmergencyServices: Array,
      Shopping: Array,
      Recreation: Array,
      ResidentCapacity: String,
      NumberUnits: Number,
      PetPolicy: String,
      Other: Array
    },
    RoomFeatures: Array,
    Activities: Array,
    Amenities: {
      SpecialMeals: Array,
      Other: Array
    },
    HealthServices: {
      OnSiteMedical: Array,
      Other: Array
    },
    Neighborhood: {
      NearHospital: String,
      NearGrocery: String,
      NearBusStop: String
    }
  },
  CustomURL: String,
  YoutubeURL: String
})
var Provider = mongoose.model('provider', providerSchema);

// --------------------------------------------------------------------------
// METHODS
// --------------------------------------------------------------------------
var dbGateway = {

  getAllproviders: function(cb){
    Provider.find({}).sort('ProviderName').exec(function(err,theProviders){
      if (err){ 
        SITE_CONFIG.log.error("FIND ERROR", err); 
      }
      cb(err,theProviders);
    })
  },
  getProviders: function(query, cb){
    Provider.find({}).sort('ProviderName').exec(function(err,theProviders){
      var filteredProviders = [];
      if (err){
        SITE_CONFIG.log.error("SEARCH ERROR", err); 
      }
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }
      function calcDistance(location, target){
        var lat2 = target.lat; 
        var lon2 = target.lon; 
        var lat1 = location.lat; 
        var lon1 = location.lon; 
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        var distance = d / 1.60934; // km to mile conversion
        return distance;
      }
      function getCharsBefore(str, chr) {
        var index = str.indexOf(chr);
        if (index != -1) {
          return(str.substring(0, index));
        }
        return("");
      }
      for(var i=0,length=theProviders.length;i<length;i++){
        location = {};
        location.lat = getCharsBefore(query.location,",");
        location.lon = query.location.substr(query.location.indexOf(",") + 1);
        distance = 
          calcDistance({
            lat: location.lat,
            lon: location.lon
          },{
            lat: theProviders[i].Latitude ,
            lon: theProviders[i].Longitude
          })
        if(distance < query.radius){
          filteredProviders.push({
            DistanceFromSearchInMiles: distance,
            Provider: theProviders[i]
          })
        }
      }
      cb(err,filteredProviders);
    })
  },
  getProviderById: function(id, cb){
    Provider.findOne({ 'id': id}, function(err,theProvider){
      if (err){ 
        SITE_CONFIG.log.error("GET BY ID ERROR", err); 
      }
      cb(err,theProvider);
    })
  },
  getMultiple: function(query, ids, cb){
    Provider.find({id:{$in:ids}}, function(err, theProviders){
      var filteredProviders = [];
      if (err){
        SITE_CONFIG.log.error("SEARCH ERROR", err); 
      }
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }
      function calcDistance(location, target){
        var lat2 = target.lat; 
        var lon2 = target.lon; 
        var lat1 = location.lat; 
        var lon1 = location.lon; 
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        var distance = d / 1.60934; // km to mile conversion
        return distance;
      }
      function getCharsBefore(str, chr) {
        var index = str.indexOf(chr);
        if (index != -1) {
          return(str.substring(0, index));
        }
        return("");
      }
      for(var i=0,length=theProviders.length;i<length;i++){
        location = {};
        location.lat = getCharsBefore(query.location,",");
        location.lon = query.location.substr(query.location.indexOf(",") + 1);
        distance = 
          calcDistance({
            lat: location.lat,
            lon: location.lon
          },{
            lat: theProviders[i].Latitude ,
            lon: theProviders[i].Longitude
          })
        filteredProviders.push({
          DistanceFromSearchInMiles: distance,
          Provider: theProviders[i]
        })
      }
      if(err){
        SITE_CONFIG.log.error("FIND MULTIPLE ERROR", err);
        cb(err);
      } else {
        cb(false, filteredProviders);
      }
    })
  },
  createProvider: function(obj, cb){
    var processed = new Provider(obj);
    processed.save(function(err, savedObj){
      if (err){ 
        SITE_CONFIG.log.error("CREATE ERROR", err); 
      }
      cb(err,savedObj)
    })
  },
  updateProvider: function(id, obj, cb){
    Provider.findOne({"id": id}, function(err,theProvider){
      if (err){ 
        cb(err, theProvider);
      }else{
        Provider.remove({_id:theProvider._id}, function(err){
          if (err){ 
           SITE_CONFIG.log.error("DELETE ERROR", err);
          }
          var processed = new Provider(obj);
          processed.save(function(err, savedObj){
            if (err){ 
              SITE_CONFIG.log.error("CREATE ERROR", err); 
            }
            cb(err)
          })
        })
        // theProvider.update(obj, function(err){
        //   if (err){ 
        //     SITE_CONFIG.log.error("UPDATE ERROR", err); 
        //   }
        //   cb(err);
        // })
      }
    })
  },
  deleteProvider: function(id, cb){
    Provider.findOne({"id": id}, function(err,theProvider){
      if (err){ 
        cb(err, theProvider);
      }else{
        Provider.remove({_id:theProvider._id}, function(err){
          if (err){ 
            SITE_CONFIG.log.error("DELETE ERROR", err);
          }
          cb(err);
        })
      }
    })
  }
}

module.exports = dbGateway;