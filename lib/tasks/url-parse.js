// url解析
var async = require('async');

module.exports = function (options, nextTask) {
  var context = this;
  var contents = context.contents.toString();
  var reg;

  if (options.reg) {
    reg = option.reg; //这个选项其实很鸡肋，因为fragmentRegStr的格式是固定的

  } else {
    // 触发解析的关键字
    var keyword = options.keyword || 'url';
    // 正则中需要转义的字符：* . ? + $ ^ [ ] ( ) { } | \ /
    // 片段正则，例如 ./xx.ext#keyword
    var fragmentRegStr = '\\s*(([\\w\\.\\/_-]+)#' + keyword + ')\\s*';
    var fragmentReg = new RegExp(fragmentRegStr);
    // 匹配边界：单双引号或小括号
    reg = new RegExp('(?:([\'"])' + fragmentRegStr + '\\1)|(?:\\(' + fragmentRegStr + '\\))', 'gi');
  }

  // 解析所有片段
  async.eachSeries(contents.match(reg) || [], function (fragment, next) {
    // 重置reg指针，从索引0的位置进行匹配
    fragmentReg.lastIndex = 0;

    // 获取分组匹配 
    // [' ./xx.ext#keyword ', './xx.ext#keyword', './xx.ext']
    var groups = fragmentReg.exec(fragment);

    // 解析模块: './xx.ext'
    context.resolveModule(groups[2], function (err, module) {
      if (err) {
        // 有错，终止后续遍历
        return next(err);
      }

      // 将原文件内容的./xx.ext#keyword替换为绝对路径
      // 例如 ./img/logo.png#url 将被替换为 http://pimg1.126.net/caipiao/index/logo.png
      contents = contents.replace(groups[1], module.url);

      // 继续处理fragments中的下一个元素
      next();
    });

  }, function (err) {
    if (err) {
      // 有错，终止后续任务
      return nextTask(err);
    }

    context.contents = new Buffer(contents);

    // 继续执行后续任务，如amdParse等
    nextTask();
  });
};

module.exports.toString = function () {
  return 'url-parse@1.0.0';
};