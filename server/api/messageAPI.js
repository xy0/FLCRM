var SITE_CONFIG = require('../config.js');
var Message = require('../models/messageData.js');
var Provider = require('../models/providerData.js');
var User = require('../models/userData.js');
var emailService = require('../services/emailService.js');

var messageAPI = {
  fetch: function(req, res, next){
    var appendedMessages = [];
    Message.getByRecipient(req.params.userID, function(err, theMessages){
      theMessages.map(function(message){
        if (message && message.provider){
          if(message.provider && message.provider.ProviderName)
            message.providerName = message.provider.ProviderName;
          if(message.provider.Representative && message.provider.Representative.Name)
            message.repName = message.provider.Representative.Name;
          if(message.provider.Photos && message.provider.Photos.rep && message.provider.Photos.rep.url && message.provider.Photos.rep.names && message.provider.Photos.rep.names[0])
            message.repImage = message.provider.Photos.rep.url+message.provider.Photos.rep.names[0];
          if(message.provider.Representative && message.provider.Representative.Title)
            message.repTitle = message.provider.Representative.Title;
          if(message.provider.Representative && message.provider.Representative.PhoneNumber)
            message.repNumber = message.provider.Representative.PhoneNumber;
        }
        if (message && message.user){
          if(message.user.lastName && message.user.firstName)
            message.userName = message.user.firstName+" "+message.user.lastName;
          if(message.user.careFor)
            message.userCareFor = message.user.careFor;
          if(message.user.ageRange)
            message.userAgeRange = message.user.ageRange;
          if(message.user.timelineToMove)
            message.userTimelineToMove = message.user.timelineToMove;
          if(message.user.budget)
            message.userBudget = message.user.budget;
        }
        if(req.user.email == message.userID){
          message.status = message.senderStatus;
        } else {
          message.status = message.recieverStatus;
        }
        message.provider = null;
        message.user = null;
        appendedMessages.push(message);
      });
      res.status(200).json(appendedMessages).end();
      SITE_CONFIG.log.info(req.connection.remoteAddress, req.user.email, "GetMessages");
    });
  },
  fetchAll: function(req, res, next){
    var appendedMessages = [];
    Message.getAll( function(err, theMessages){
      theMessages.map(function(message){
        if (message && message.provider){
          if(message.provider && message.provider.ProviderName)
            message.providerName = message.provider.ProviderName;
          if(message.provider.Representative && message.provider.Representative.Name)
            message.repName = message.provider.Representative.Name;
          if(message.provider.Photos && message.provider.Photos.rep && message.provider.Photos.rep.url && message.provider.Photos.rep.names && message.provider.Photos.rep.names[0])
            message.repImage = message.provider.Photos.rep.url+message.provider.Photos.rep.names[0];
        }
        message.provider = null;
        message.user = null;
        appendedMessages.push(message);
      });
      res.status(200).json(appendedMessages).end();
      SITE_CONFIG.log.info(req.connection.remoteAddress, req.user.email, "GetAllMessages");
    });
  },
  submit: function(req, res, next){
    var newMessage = {};
    newMessage.content = req.body.content;
    newMessage.providerID = req.body.providerID;
    newMessage.userID = req.params.userID;
    newMessage.date = Math.round((new Date()).getTime());
    newMessage.recieverStatus = "new";
    newMessage.senderStatus = "sent";
    if(!!req.body.type){
      newMessage.type = req.body.type;
    } else {
      newMessage.type = 'message';
    }
    if(!!req.body.subject){
      newMessage.subject = req.body.subject;
    }
    if(!!req.body.tourContent && !!req.body.tourContent.confirmed){
      newMessage.tourContent = req.body.tourContent;
    }
    Provider.getProviderById(req.body.providerID, function(err, theProvider){
      User.getByName(req.params.userID, function(err, theUser){
        if (err || !theUser){
          res.status(500).send({message:"Error getting user by email"}).end();
          SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.userID, "GetUserByEmail: Error:", err);
        }else{
          newMessage.user = theUser._id;
          newMessage.provider = theProvider._id;
          if(!!req.body.replyTo){
            newMessage.recipientID = req.body.replyTo;
          } else {
            newMessage.recipientID = theProvider.Representative.UserID;
          }
          if(req.user.email == newMessage.userID){
            newMessage.senderStatus = newMessage.status;
          } else {
            newMessage.reciverStatus = newMessage.status;
          }
          Message.create(newMessage, function(err, theMessage){
            if (err){
              SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.userID, "MessageSubmit: Error:", err);
              res.status(500).send({message: "There was an error submitting the message"}).end();
            } else {
              SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.userID, "MessageSubmit: Success");
              var to = [{
                  email: newMessage.recipientID,
                  name: theProvider.Representative.Name
              }];
              var subject = "New Message";
              var template = "newMessage";
              var templateData = {
                subject:req.body.subject,
                message:req.body.content,
                user: req.user
              };
              emailService.send(to, subject, template, templateData, function(err, result){
                if(err){
                  SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.providerID, "SendEmail: Error:", err);
                } else {
                  SITE_CONFIG.log.info(req.connection.remoteAddress, req.body.providerID, "SendEmail:", result);
                }
              })
              theMessage.status = 'read';
              res.status(200).send({message: "Message submitted", theMessage: theMessage}).end();
            }
          })
        }
      })
    })
  },
  changeStatus: function(req, res, next){
    Message.getByID(req.params.messageID, function(err, theMessages){
      if(req.user.email == theMessages[0].userID){
        Message.changeStatus(req.params.messageID, 'sender', req.body.status, function(err, theMessage){
          if (err){
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.messageID, "MessageMarked: Error:", err);
            res.status(500).send({message: "There was an error changing the message state"}).end();
          }else{
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.messageID, "MessageMarked",req.body.status);
            res.status(200).send({message: "Message updated"}).end();
          }
        })
      } else {
        Message.changeStatus(req.params.messageID, 'receiver', req.body.status, function(err, theMessage){
          if (err){
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.messageID, "MessageMarked: Error:", err);
            res.status(500).send({message: "There was an error changing the message state"}).end();
          }else{
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.messageID, "MessageMarked",req.body.status);
            res.status(200).send({message: "Message updated"}).end();
          }
        })
      }
    })
  },
  delete: function(req, res, next){
    Message.getByID(req.params.messageID, function(err, theMessage){
      if (theMessage === null || err){
        req.status(500).send({message:"Message not found"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.messageID, "DeleteMessage: Error: not found, or", err);
      }else{
        Message.delete(req.params.messageID, function(err, theMessage){
          if (err){
            res.status(500).send({message:"Unable to delete message"}).end();
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.messageID, "DeleteMessage: Error:", err);
          }else{
            res.status(200).send({message:'The message was deleted'}).end();
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.messageID, "DeleteMessage: Success");
          }
        })
      }
    })
  },
  getStarted: function(req, res, next){
    var newMessage = req.body;
    newMessage.userID = "anonomous";
    newMessage.date = Math.round((new Date()).getTime());
    newMessage.status = "new";
    Message.create(newMessage, function(err){
      if (err){
        SITE_CONFIG.log.error(req.connection.remoteAddress, "GetStarted: Error:", err);
        res.status(500).send({message: "There was an error submitting the message"}).end();
      } else {
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.body.providerName, "new provider request");
        var to = [{
            email: SITE_CONFIG.adminEmail,
             name: 'admin'
        }];
        var subject = "New Message";
        var template = "getStarted";
        var templateData = {
          message:req.body,
        };
        emailService.send(to, subject, template, templateData, function(err, result){
          if(err){
            SITE_CONFIG.log.error(req.connection.remoteAddress, req.body.providerName, "SendEmail: Error:", err);
          } else {
            SITE_CONFIG.log.info(req.connection.remoteAddress, req.body.providerName, "SendEmail:", result);
          }
        })
        res.status(200).send({message: "Request submitted"}).end();
      }
    })
  },
  scheduleTour: function(req, res, next){
    var newMessage = {};
    if(req.user){
      newMessage.userID = req.user.email;
    } else {
      newMessage.userID = "anonomous";
    }
    newMessage.content = req.body.content;
    newMessage.providerID = req.body.providerID;
    newMessage.subject = 'New Tour Request';
    newMessage.date = Math.round((new Date()).getTime());
    newMessage.recieverStatus = "newtour";
    newMessage.senderStatus = "sent";
    newMessage.type = "tour";
    newMessage.tourContent = {};
    newMessage.confirmed = false;
    newMessage.tourContent.date = req.body.date;
    newMessage.tourContent.time = req.body.time;
    newMessage.tourContent.reschedule = false;
    Provider.getProviderById(req.body.providerID, function(err, theProvider){
      User.getByName(req.user.email, function(err, theUser){
        if (err || !theUser){
          res.status(500).send({message:"Error getting user by email"}).end();
          SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.userID, "GetUserByEmail: Error:", err);
        }else{
          newMessage.user = theUser._id;
          newMessage.provider = theProvider._id;
          if(!!req.body.replyTo){
            newMessage.recipientID = req.body.replyTo;
            newMessage.tourContent.reschedule = true;
          } else {
            newMessage.recipientID = theProvider.Representative.UserID;
          }
          if(req.user.email == newMessage.userID){
            newMessage.senderStatus = newMessage.status;
          } else {
            newMessage.reciverStatus = newMessage.status;
          }
          Message.create(newMessage, function(err){
            if(err){
              SITE_CONFIG.log.error(req.connection.remoteAddress, newMessage.userID, "ScheduleTour: Error:", err);
              res.status(500).send({message: "There was an error requesting the tour"}).end();
            } else {
              SITE_CONFIG.log.info(req.connection.remoteAddress, newMessage.userID, "ScheduleTour: Success:", err);
              var to = [{
                  email: SITE_CONFIG.adminEmail,
                   name: 'admin'
              }];
              var subject = "Tour Request";
              var template = "newTour";
              var templateData = {
                message:req.body,
              };
              emailService.send(to, subject, template, templateData, function(err, result){
                if(err){
                  SITE_CONFIG.log.error(req.connection.remoteAddress, SITE_CONFIG.adminEmail, "SendEmail: Error:", err);
                } else {
                  SITE_CONFIG.log.info(req.connection.remoteAddress, SITE_CONFIG.adminEmail, "SendEmail:", result);
                }
              });
              res.status(200).send({message: "Tour scheduled"}).end();
            }
          })
        }
      })
    })
  }
};
module.exports = messageAPI;