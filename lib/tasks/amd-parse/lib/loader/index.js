var path = require('path');

var contentLoader = require('./content');
var defaultLoader = require('./default');
var jsonLoader = require('./json');
var scriptLoader = require('./script');
var styleLoader = require('./style');

module.exports = function(context, depInfo, callback) {
  //创建并编译依赖的模块
  context.resolveModule(depInfo.id, function(err, module) {
    if (err) {
      return callback(err);
    }

    // 如果是第三方代码，不做处理
    if (module.extra.isThirdparty) {
      return callback(null, module.src);
    }

    var loader;
    if (depInfo.content) {
      loader = contentLoader;

    } else if (depInfo.url) {
      loader = defaultLoader;

    } else {
      loader  = {
        js: scriptLoader,
        css: styleLoader,
        json: jsonLoader,
        tpl: contentLoader
      }[path.extname(module.dest).replace(/^\./, '')] || defaultLoader;
    }

    // 根据类型不同, 调用不同的loader执行相关的后期处理
    loader(context, depInfo, module, callback);
  });
};