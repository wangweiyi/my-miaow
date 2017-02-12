var async = require('async');
var mutil = require('miaow-util');
var path = require('path');

module.exports = function(options, callback) {
  var context = this;

  var keyword = options.keyword || 'inline';
  var reg = options.regexp || new RegExp('[\'"\\(](([\\w\\_\\/\\.\\-]*)\\#' + keyword + ')[\'\"\\)]', 'gi');
  var type = options.type || 'data-uri';
  var contents = context.contents.toString();
  var inlineMap = {};

  async.eachSeries(
    contents.match(reg) || [],
    function(relative, callback) {
      reg.lastIndex = 0;
      var result = reg.exec(relative);
      context.resolveModule(result[2], function(err, relativeModule) {
        if (err) {
          return callback(err);
        }

        if (type === 'data-uri') {
          inlineMap[result[1]] = mutil.getDataURI(path.resolve(context.output, relativeModule.dest));
        } else if (type === 'content') {
          inlineMap[result[1]] = relativeModule.contents.toString();
        }

        callback();
      });
    },

    function(err) {
      if (err) {
        return callback(err);
      }

      contents = contents.replace(reg, function(str, key) {
        return str.replace(key, function() {
          return inlineMap[key];
        });
      });

      context.contents = new Buffer(contents);

      callback();
    });
};

module.exports.toString = function() {
  return 'inline-parse@1.0'
};
