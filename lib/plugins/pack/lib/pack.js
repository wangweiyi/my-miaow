var _ = require('lodash');
var async = require('async');
var path = require('path');

module.exports = function(compilation, packCallback) {
  var modules = compilation.modules;

  // 获取所有require依赖
  function getAmdDeps(src) {
    var module = modules[src];
    var deps = module.extra.AMDDependiencies || [];
    return [deps, deps.map(getAmdDeps), src];
  }

  async.each(_.filter(modules, function(moduel) {
    return module.extra.pack;
  }), function(module, callback) {
    var packConfig = module.extra.pack;
    var resolveModule = compilation.resolveModule.bind(compilation, path.resolve(module.context, module.srcDir));

    async.map(packConfig.exclude, resolveModule, function(err, excludes) {
      if (err) return callback(err);
    });
    
  }, packCallback);
};