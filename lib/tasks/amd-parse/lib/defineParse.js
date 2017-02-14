var _ = require('lodash');
var async = require('async');
var recast = require('recast');

var getDepInfo = require('./getDepInfo');
var loader = require('./loader');

function defineParse(context, options, ast, callback) {
  var types = recast.types;
  var namedTypes = types.namedTypes;

  //在ast中查找第一个define语句
  var defineNode = null;
  types.visit(ast, {
    visitCallExpression: function (path) {
      if (namedTypes.Identifier.check(path.node.callee) && path.node.callee.name === 'define') {
        defineNode = path.node;
        // 停止后续对CallExpression的解析
        this.abort();
      }

      // 继续子路径的解析
      this.traverse(path);
    }
  });

  // 若没有找到define语句，则返回
  if (!defineNode) {
    return callback();
  }

  // 解析define模块的id 和 依赖
  var idNode = null;
  var depNodes = { elements: [] };
  var defineArgs = defineNode.arguments;

  // 1) define(function($, Core){}) 
  // ------------------------------------------------
  // 2) var core = 'core'; define(['jquery', core], function($, Core){})
  // ------------------------------------------------
  // 3) define(['jquery', 'core'], function($, Core){})
  if (defineArgs.length > 1) { // 2 或 3
    if (namedTypes.Literal.check(defineArgs[0])) { // 2
      idNode = defineArgs[0];

    } else if (namedTypes.ArrayExpression.check(defineArgs[0])) { // 3
      depNodes = defineArgs[0];
    }
  }

  // 解析依赖
  function parseDep(depNode, callback) {
    // 如果是变量，跳过
    if (namedTypes.Identifier.check(depNode)) {
      return callback();
    }

    var depInfo = getDepInfo(depNode.value);
    depNode.value = depInfo.id; //修改ast节点

    // 非调试模式下不处理调式模块
    if (!context.debug && depInfo.debug) {
      depNode.value = ''; //修改ast节点
      return callback();
    }

    // 不处理屏蔽的关键字
    if (depInfo.ignore || ['require', 'module', 'exports'].indexOf(depInfo.id) !== -1) {
      return callback();
    }

    // 编译依赖模块，并根据模块类型调用不同的loader执行后续处理
    loader(context, depInfo, function (err, module) {
      if (err) {
        return callback(err);
      }

      if (_.isString(module)) { //什么时候是这种情况？
        // 这个在上面第60行不是执行过了么？depInfo.id 在laoder中应该不会被修改啊
        depNode.value = depInfo.id; 

      } else {
        depNode.value = module.url; //引用路径，绝对路径
        context.extra.AMDDependencies.push(module.src); //记录依赖模块的源码路径
      }

      callback();
    });
  }

  // 设置模块id
  function setModuleId(err) {
    if (err) {
      return callback(err);
    }

    var id = context.src + '\'s id hodler';
    if (!idNode) {
      // 生成id节点
      // define(function(){}) => define(id, function(){})
      // define(['dep1', 'dep2'], function(){}) => define(id, ['dep1', 'dep2'], function(){})
      idNode = types.builders.literal(id);
      defineNode.arguments.unshift(idNode);

    } else {
      // defind('a.js', function(){}) => defind(id, function(){})
      idNode.value = id;
    }

    // 添加ID回写钩子
    // 在模块编译完成(所有tasks都跑完了)后执行
    context.addHook(function(context, callback) {
      context.contents = new Buffer(context.contents.toString().replace(id, context.url));
      callback();
    });

    callback();
  }

  async.eachSeries(depNodes.elements, parseDep, setModuleId);
}

module.exports = defineParse;