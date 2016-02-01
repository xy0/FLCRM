var SITE_CONFIG = require('../config.js');
var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  Stream = require('stream').Stream,
  ncp = require('ncp').ncp;
ncp.limit = 200;

module.exports = flow = function(uploadsFolder, trashFolder, baseURL) {
  var $ = this;
  $.uploadsFolder = uploadsFolder;
  $.trashFolder = trashFolder;
  $.baseURL = baseURL;
  $.maxFileSize = null;
  $.fileParameterName = 'file';

  try {
    fs.mkdirSync($.uploadsFolder);
  } catch (e) {}
  try {
    fs.mkdirSync($.trashFolder);
  } catch (e) {}

  function cleanIdentifier(identifier) {
    return identifier.replace(/[^0-9A-Za-z_-]/g, '');
  }

  function getChunkFilename(chunkNumber, identifier) {
    identifier = cleanIdentifier(identifier);
    return path.resolve($.uploadsFolder, './flow-' + identifier + '.' + chunkNumber);
  }

  function validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, fileSize) {
    identifier = cleanIdentifier(identifier);

    if (chunkNumber == 0 || chunkSize == 0 || totalSize == 0 || identifier.length == 0 || filename.length == 0) {
      return 'non_flow_request';
    }
    var numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1);
    if (chunkNumber > numberOfChunks) {
      return 'invalid_flow_request1';
    }

    if ($.maxFileSize && totalSize > $.maxFileSize) {
      return 'invalid_flow_request2';
    }

    if (typeof(fileSize) != 'undefined') {
      if (chunkNumber < numberOfChunks && fileSize != chunkSize) {
        return 'invalid_flow_request3';
      }
      if (numberOfChunks > 1 && chunkNumber == numberOfChunks && fileSize != ((totalSize % chunkSize) + parseInt(chunkSize))) {
        return 'invalid_flow_request4';
      }
      if (numberOfChunks == 1 && fileSize != totalSize) {
        return 'invalid_flow_request5';
      }
    }

    return 'valid';
  }

  $.list = function(id, callback) {
    var baseURL2 = baseURL + "/img/";
    var imageTypes = ["icon", "main", "rep", "gallery", "logo"];
    var imageList = {},
      imageGroup = {};
    var path = uploadsFolder + "/" + id;
    var err = "";
    try {
      if (fs.lstatSync(path).isDirectory()) {
        for (var i = 0, len = imageTypes.length; i < len; i++) {
          imageList[imageTypes[i]] = {
            names: [],
            url: baseURL2 + id + "/" + imageTypes[i] + "/"
          };
          try {
            if (fs.lstatSync(path + "/" + imageTypes[i]).isDirectory()) {
              imageGroup = {
                names: fs.readdirSync(path + "/" + imageTypes[i]),
                url: baseURL2 + id + "/" + imageTypes[i] + "/"
              };
              imageList[imageTypes[i]] = imageGroup;
            }
          } catch (e) {
            err = e;
          }
        }
      }
    } catch (e) {
      err = e;
      for (var i = 0, len = imageTypes.length; i < len; i++) {
        imageList[imageTypes[i]] = {
          names: [],
          url: baseURL2 + id + "/" + imageTypes[i] + "/"
        };
      }
    }
    callback(err, imageList);
  };

  $.delete = function(id, type, name, callback) {
    var filePath = uploadsFolder + "/" + id + "/" + type + "/" + name;
    var deletedPath = trashFolder + "/" + id + "-" + type + "-" + name;
    fs.exists(filePath, function(exists) {
      if (exists) {
        var source = fs.createReadStream(filePath);
        var dest = fs.createWriteStream(deletedPath);
        source.pipe(dest);
        source.on('end', function() {
          fs.unlink(filePath, function(err) {
            if (err) {
              callback(err);
            } else {
              callback(false); // no error
            }
          });
        });
        source.on('error', function(err) {
          callback(err);
        });
      } else {
        callback("FILE NOT FOUND: " + filePath);
      }
    });
  };

  $.moveFromNew = function(id, cb) {
    var filePath = uploadsFolder + "/new/";
    var newPath = uploadsFolder + "/" + id;
    var deletedPath = trashFolder + "/" + id;
    var rmDir = function(dirPath) {
      try {
        var files = fs.readdirSync(dirPath);
      } catch (e) {
        cb(e);
      }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath2 = dirPath + '/' + files[i];
          if (fs.statSync(filePath2).isFile())
            fs.unlinkSync(filePath2);
          else
            rmDir(filePath2);
        }
      fs.rmdirSync(dirPath);
    }
    fs.exists(filePath, function(exists) {
      if (exists) {
        ncp(filePath, newPath, function(err) {
          if (err) {
            cb(err, newPath);
          }
          SITE_CONFIG.log.debug('moved files from new to', newPath);
          rmDir(filePath);
        });
      } else {
        cb("NEW FILES NOT FOUND: ", filePath);
      }
    });
  }


  $.get = function(req, callback) {
    var chunkNumber = req.param('flowChunkNumber', 0);
    var chunkSize = req.param('flowChunkSize', 0);
    var totalSize = req.param('flowTotalSize', 0);
    var identifier = req.param('flowIdentifier', "");
    var filename = req.param('flowFilename', "");

    if (validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename) == 'valid') {
      var chunkFilename = getChunkFilename(chunkNumber, identifier);
      fs.exists(chunkFilename, function(exists) {
        if (exists) {
          callback('found', chunkFilename, filename, identifier);
        } else {
          callback('not_found', null, null, null);
        }
      });
    } else {
      callback('not_found', null, null, null);
    }
  };

  $.post = function(req, callback) {

    var fields = req.body;
    var files = req.files;

    var chunkNumber = fields['flowChunkNumber'];
    var chunkSize = fields['flowChunkSize'];
    var totalSize = fields['flowTotalSize'];
    var identifier = cleanIdentifier(fields['flowIdentifier']);
    var filename = fields['flowFilename'];

    if (!files[$.fileParameterName] || !files[$.fileParameterName].size) {
      callback('invalid_flow_request', null, null, null);
      return;
    }

    var original_filename = files[$.fileParameterName]['originalFilename'];
    var validation = validateRequest(chunkNumber, chunkSize, totalSize, identifier, filename, files[$.fileParameterName].size);
    if (validation == 'valid') {
      var chunkFilename = getChunkFilename(chunkNumber, identifier);

      fs.rename(files[$.fileParameterName].path, chunkFilename, function() {

        var currentTestChunk = 1;
        var numberOfChunks = Math.max(Math.floor(totalSize / (chunkSize * 1.0)), 1);
        var testChunkExists = function() {
          fs.exists(getChunkFilename(currentTestChunk, identifier), function(exists) {
            if (exists) {
              currentTestChunk++;
              if (currentTestChunk > numberOfChunks) {

                callback('done', filename, original_filename, identifier, currentTestChunk, numberOfChunks);
              } else {
                testChunkExists();
              }
            } else {

              callback('partly_done', filename, original_filename, identifier, currentTestChunk, numberOfChunks);
            }
          });
        }
        testChunkExists();
      });
    } else {
      callback(validation, filename, original_filename, identifier);
    }
  };

  $.write = function(identifier, writableStream, options) {
    options = options || {};
    options.end = (typeof options['end'] == 'undefined' ? true : options['end']);

    var pipeChunk = function(number) {

      var chunkFilename = getChunkFilename(number, identifier);
      fs.exists(chunkFilename, function(exists) {

        if (exists) {
          var sourceStream = fs.createReadStream(chunkFilename);
          sourceStream.pipe(writableStream, {
            end: false
          });
          sourceStream.on('end', function() {
            pipeChunk(number + 1);
          });
        } else {
          if (options.end) {
            writableStream.end();
          }
          if (options.onDone) {
            options.onDone(identifier);
          }
        }
      });
    };
    pipeChunk(1);
  };

  $.clean = function(identifier, options) {
    options = options || {};
    var pipeChunkRm = function(number) {
      var chunkFilename = getChunkFilename(number, identifier);
      fs.exists(chunkFilename, function(exists) {
        if (exists) {
          fs.unlink(chunkFilename, function(err) {
            if (err && options.onError) options.onError(err);
          });
          pipeChunkRm(number + 1);
        } else {
          if (options.onDone) options.onDone();
        }
      });
    };
    pipeChunkRm(1);
  };
  return $;
};