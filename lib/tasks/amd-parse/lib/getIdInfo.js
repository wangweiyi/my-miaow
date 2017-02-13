/*
  // Running on Linux
  pathIsAbsolute('/home/foo');
  //=> true
  pathIsAbsolute('C:/Users/foo');
  //=> false

  isUrl('http://todomvc.com');
  //=> true

  isUrl('//todomvc.com');
  //=> true

  isUrl('unicorn');
  //=> false
*/
var isUrl = require('is-url-superb');
var pathIsAbsolute = require('path-is-absolute');

module.exporst = function(depPath) {
  //module://src格式的路径支持
  var isModuleSchema = /^module:\/\//.test(depPath);

  if (!isModuleSchema && (isUrl(depPath) || pathIsAbsolute(depPath))) {
    return {
      id: str,
      ignore: true
    };
  }

  // 'core/mobile' | 'mockjax#debug' | 'logo.png#inline=content&debug' 
  var matched = depPath.match(/(.*?)(#.*)?$/); //.是无法匹配的，怎么处理的？
  var info = {
    id: matched[1] //'core/mobile' | 'mockjax' | 'logo.png'
  };
  if (matched[2]) { // 处理 #xxx
    matched[2]
      .replace(/#/g, '')
      .split('&') // ['inline=content', 'debug']
      .forEach(function(param) {
        var pair = param.split('='); // ['inline', 'content'], ['debug']
        info[pair[0]] = param[1] || true; //info.inline = true; info.debug = true;
      });
  }

};