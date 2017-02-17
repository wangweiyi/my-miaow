var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var glob = require('glob');
var mutil = require('miaow-util');
var path = require('path');

function getPackConfig(compilation, callback) {
  glob('**/package.json', {
    cwd: compilation.context,
    exclude: compilation.exclude,
    nodir: true
  }, function(err, pkgFiles) {
    if (err) return callback(err);

    async.map(pkgFiles, _.partial(readConfig, compliation.context), function(err, packConfigList) {
      // packConfigList是一个数组，数组元素为各pkg文件的pack配置信息(也是一个数组),
      // 故packConfigList是一个二维数组，可能包含一些[]元素（当某个pkgFile没有配置pack项时，返回的是[]）
      // 返回前将其转为一维数组，同时去除空数组
      callback(err, _.flatten(packConfigList));
    })
  });
}

function readConfig(context, pkgFile, callback) {
  pkgFile = mutil.relative('', pkgFile);

  fs.readFile(path.resolve(context, pkgFile), {encodeing: 'utf-8'}, function(err, pkgFileContent) {
    if (err) return callback(err);

    // 一个 package.json ，可以配置多个入口文件的打包方案：
    // "pack": [{
    //   "name": "index.js"
    // }, {
    //   "name": "foo.js"
    // }]
    var packConfig = [];
    try {
      var pack = JSON.parse(pkgFileContent).pack;
      pack = _.isArray(pack) ? pack : [];

      packConfig = _.map(pack, function(packItem) {
        return {
          name: mutil.relative('', path.join(path.dirname(pkgFile), packItem.name)),
          include: packItem.include || [],
          exclude: packItem.exclude || [],
          pkg: pkgFile
        };
      });

    } catch(e) {
      return callback(new Error('解析包信息出错: ' + pkgFile))
    }

    // 返回当前pkg文件的pack配置信息
    callback(null, packConfig);
  });
}

module.exports = getPackConfig;