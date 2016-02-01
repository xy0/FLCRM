var Review = require('../models/reviewData.js');

function getDateTime() {
  var date = new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;
  return 	month+"/"+day+"/"+year;
};

var reviewAPI = {
  create: function(req, res, next){
  	var date = getDateTime(); 
  	Review.create(req.params.id, date, req.body, function(err, review){
  		if(err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "CreateReview: Error:", err);
        res.status(500).send({message:"Could not create review"}).end();
      } else {
  		  res.status(200).send({message:"Review Created"}).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "CreateReview: Success");
      }
  	});
  },
  list: function(req, res, next){
  	Review.list(req.params.id, function(err, theReviews){
  		res.json(theReviews).end();
  	});
  },
  edit: function(req, res, next){
  },
  delete: function(req, res, next){
  }
};
module.exports = reviewAPI;