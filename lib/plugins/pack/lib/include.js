var _ = require('lodash');
var async = require('async');
var fs = require('fs');

var pkg = require('../package.json');

function getModuleSrc(module) {
  return module.src;
}

module.exports = function(options, nextTask) {
  var context = this;
  var packConfig = options.packConfig;

  aysnc.mapSeries(packConfig.include, context.resolveModule.bind(context), function(err, includes) {
    if (err) return callback(err);

    // 记录依赖
    includes.forEach(function(module) {
      context.addDependency(module.src);
    });

    // 记录依赖的配置文件 干啥用??
    context.addDependency(packConfig.pkg);

    // 记录打包配置
    context.extra.pack = {
      include: includes.map(getSrc), //是否等于 packConfig.include ?
      exclude: packConfig.exclude
    };

    // 将include项指定的所有文件的文件内容，依次追加到当前文件内容之前
    if (includes.length) {
        // 获取所有内容源
        // 这里context充当的是当前模块，因为通过它可以访问到当前模块的contents
        // 注意当前模块的内容是最后一个输出的
        var contentSources = includes.concat(context);
        
        // 拼接文件内容
        context.contents = Buffer.concat(contentSources.map(function(module) {
          return Buffer.concat(module.contents, new Buffer('\n'));
        }));
    }

    nextTask();
  });
};

module.exports.toString = function() {
  return [pkg.name + '/include', pkg.version].join('@');
}