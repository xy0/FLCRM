var SITE_CONFIG = require('../config.js');
var mongoose = require('mongoose');

// --------------------------------------------------------------------------
// SCHEMA
// --------------------------------------------------------------------------
var reviewSchema = mongoose.Schema({
  providerID: String,
  author: String,
  date: String,
  content: String
})
var Review = mongoose.model('review', reviewSchema);

// --------------------------------------------------------------------------
// METHODS
// --------------------------------------------------------------------------
var dbGateway = {
  create: function(id, date, obj, cb) {
    var processed = new Review(obj);
    processed.providerID = id;
    processed.date = date;
    processed.save(function(err, savedObj){
      if (err){ 
        SITE_CONFIG.log.error("CREATE ERROR", err); 
      }
      cb(err,savedObj)
    })
  },
  list: function(id, cb) {
    Review.find({ 'providerID': id}, function(err,theReviews){
      if (err){ 
        SITE_CONFIG.log.error("GET BY ID ERROR", err); 
      }
      cb(err,theReviews);
    })
  }
}
module.exports = dbGateway;