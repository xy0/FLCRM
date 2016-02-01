var SITE_CONFIG = require('../config.js');
var mandrill = require('mandrill-api/mandrill');
var jade = require('jade');
var fs = require('fs');

var MANDRILL_KEY  = SITE_CONFIG.mandrillKey;
var FROM_ADDR = {
                  email: SITE_CONFIG.adminEmail,
                  name: 'The Mimi Team'
                };

var emailer = new mandrill.Mandrill(MANDRILL_KEY);

formatTo = function(to){
  return {
    email: to.email,
    name: to.name,
    type: 'to'
  };
}

var emailService = {
  send: function(to, subject, template, templateData, cb){
    var full_path = __dirname.slice(0,__dirname.lastIndexOf('/')+1) + "services/emailTemplates/";
    var templatePath = full_path + template + ".jade"; 

    var toArray = to.map(function(toObj){ 
      return formatTo(toObj); 
    });

    var message = {
      html: jade.renderFile(templatePath, templateData),
      subject: subject || "SUBJECT",
      from_email: FROM_ADDR.email,
      from_name: FROM_ADDR.name,
      to: toArray,
      headers: {
        'Reply-To': FROM_ADDR.email
      }
    };

    SITE_CONFIG.log.debug("Sending Email...");
    emailer.messages.send({message: message}, function(result){
      cb(null,result);
    },function(err){
      SITE_CONFIG.log.error("Error Sending Email")
      SITE_CONFIG.log.error('A mandrill error occurred: ' + err.name + ' - ' + err.message);
      cb(err,null);
    });
  }
};

module.exports = emailService;