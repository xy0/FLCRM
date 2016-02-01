var SITE_CONFIG = require('../config.js');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var fs = require('fs');
var mkdirp = require('mkdirp');
var upload = require('../models/uploadData.js')('img', 'trash', SITE_CONFIG.siteURL+'/data');
var ACCESS_CONTROLL_ALLOW_ORIGIN = false; // for cross domain uploads

var uploadAPI = {
  listImages: function(req, res, next){
    upload.list(req.params.id, function(err, imageList){
      if(err){
        res.json(imageList).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.id, "ListImages: Error:", err);
      } else {
        res.json(imageList).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, "ListImages");
      }
    })
  },
  imageUploadStatus: function(req, res, next){
    upload.get(req, function(status, filename, original_filename, identifier) {
      if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
        res.header("Access-Control-Allow-Origin", "*");
      }
      if (status == 'found') {
        status = 200;
      } else {
        status = 204;
      }
      res.status(status).send();
    })
  },
  imageUpload: function(req, res, next){
    upload.post(req, function(status, filename, original_filename, identifier, currentTestChunk, numberOfChunks) {
      res.sendStatus(200);
      if (status === 'done' && currentTestChunk > numberOfChunks) {
        mkdirp('./img/' + req.params.id + "/" + req.params.type, function(err){
          if (err) console.error(err);
          var stream = fs.createWriteStream('./img/' + req.params.id + "/" + req.params.type + "/" + filename.replace(/[^a-z0-9\.]/gi,''));
          upload.write(identifier, stream, { onDone: upload.clean });
        })
      }
    })
    SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.type, req.params.id, "UploadImage");
  },
  imageDelete: function(req, res, next){
    upload.delete(req.params.id, req.params.type, req.params.name, function(err){
      if(err){
        res.status(500).send({message:"There was an error deleting the image"}).end();
        SITE_CONFIG.log.error(req.connection.remoteAddress, req.params.type, req.params.id, req.params.name, "DeleteImage: Error:", err);
      }else{
        res.status(200).send({message:"The image has been deleted"}).end();
        SITE_CONFIG.log.info(req.connection.remoteAddress, req.params.id, req.params.type, req.params.name, "DeleteImage: Success");  
      }
    })
  }
}
 module.exports = uploadAPI;