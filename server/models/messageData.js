var SITE_CONFIG = require('../config.js');
var mongoose = require('mongoose');

// --------------------------------------------------------------------------
// SCHEMA
// --------------------------------------------------------------------------
var ObjectID = mongoose.Schema.Types.ObjectId;
var messageSchema = mongoose.Schema({
	userID: String,
  recipientID: String,
	date: String,
  type: String,
	recieverStatus: String,
  senderStatus: String,
  providerID: String,
  subject: String,
	content: String,
  tourContent: Object,
  provider: {
    type: ObjectID,
    ref: "provider"
  },
  user: {
    type:ObjectID,
    ref: "user"
  }
})
var Message = mongoose.model('message', messageSchema);

// --------------------------------------------------------------------------
// METHODS
// --------------------------------------------------------------------------
var dbGateway = {
  getAll: function(cb){
    Message.find({}).lean().populate("provider user").sort({'date': -1}).exec(function(err,theMessages){
      if (err){ 
        SITE_CONFIG.log.error("FIND ERROR", err); 
      }
      cb(err,theMessages);
    })
  },
  getByID: function(messageID, cb){
    Message.find({_id:messageID}).lean().populate("provider user").exec(function(err,theMessages){
      if (err){
        SITE_CONFIG.log.error("FIND ERROR", err); 
      }
      cb(err,theMessages);
    })
  },
  getByRecipient: function(recipientID, cb){
    Message.find({recipientID:recipientID}).lean().populate("provider user").exec(function(err,theMessages1){
      if (err){ 
        SITE_CONFIG.log.error("FIND ERROR", err); 
      }
      Message.find({userID:recipientID}).lean().populate("provider user").exec(function(err,theMessages2){
        if (err){ 
          SITE_CONFIG.log.error("FIND ERROR", err); 
        }
        var theMessages3 = theMessages1.concat(theMessages2);
        var uniqueIDs = [];
        var theMessages4 = [];
        for(var l=theMessages3.length - 1; l>=0; l=l-1){
          if(uniqueIDs.indexOf(theMessages3[l]._id.toString()) === -1){
            uniqueIDs.push(theMessages3[l]._id.toString());
            theMessages4.push(theMessages3[l]);
          }
          if(l == 0){
            cb(err, theMessages4.sort(function(a, b){
              return b.date-a.date;
            }));
          }
        }
      })
    })
  },
  create: function(obj, cb){
    var processed = new Message(obj);
    processed.save(function(err, savedObj){
      if (err){ 
        SITE_CONFIG.log.error("CREATE ERROR", err); 
      }
      cb(err,savedObj)
    })
  },
  changeStatus: function(msgID, type, status, cb){
    if(type == 'sender'){
      Message.findOneAndUpdate(
        { "_id": msgID },
        { "$set": {"senderStatus": status }},
        function(err,theMessage) {
          if (err){ 
            SITE_CONFIG.log.error("UPDATE STATUS ERROR", err); 
          }
          cb(err, theMessage)
        }
      );
    } else {
      Message.findOneAndUpdate(
        { "_id": msgID },
        { "$set": {"recieverStatus": status }},
        function(err,theMessage) {
          if (err){ 
            SITE_CONFIG.log.error("UPDATE STATUS ERROR", err); 
          }
          cb(err, theMessage)
        }
      );
    }
  },
  delete: function(messageID, cb){
    Message.findOne({_id: messageID}, function(err,theMessage){
      if (err){ 
        cb(err, theMessage);
      }else{
        Message.remove({_id:theMessage._id}, function(err){
          if (err){ 
            SITE_CONFIG.log.error("DELETE MESSAGE ERROR", err);
          }
          cb(err);
        })
      }
    })
  }
}

module.exports = dbGateway;