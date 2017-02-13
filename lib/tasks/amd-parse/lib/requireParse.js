var _ = require('lodash');
var async = require('async');
var recast = require('recast');

var getIdInfo = require('./getIdInfo');
var loader = require('./loader');

function requireParse(context, options, ast, callback) {
  var types = recast.types;
  var namedTypes = types.namedTypes;
  var requireNodes = [];

  // _.find(collection, iteratee), 返回collection中第一个使iteratee返回true的元素
  // 返回代码中没有被任何块包裹的第一个 require 语句，通常是文件第一行的requrie依赖声明
  var noBlockRequire = _.find(ast.program.body || [], function(child) {
    return namedTypes.ExpressionStatement.check(child) &&
      namedTypes.CallExpression.check(child.expression) &&
      namedTypes.Identifier.check(child.expression.callee) &&
      child.expression.callee.name === 'require' && 
      namedTypes.ArrayExpression.check(child.expression.arguments[0]);
  });

   // 程序中第一个require([],...)语句声明的依赖
  var noBlockDependNodes = !noBlockRequire ? [] : 
                                  noBlockRequire.expression.arguments[0].elements;

  //查出全部require节点, 包括noBlockRequire
  types.visit(ast, {
    visitCallExpression: function(path) {
      if ( namedTypes.Identifier.check(path.node.callee) 
            && path.node.callee.name === 'require') {
        requireNodes.push(path.node);
      }
      this.traverse(path);
    }
  });

  // 获取所有依赖的节点
  var depNodes = requireNodes.map(function(node) {
      // require('jquery') 中的 'jquery'
      // 或 require(['jquery', 'core']) 中的 ['jquery', 'core']
      var dep = node.arguments[0]; 

      if (namedTypes.Literal.check(dep)) { // 'jquery'的情况
        return dep;

      } else if (namedTypes.ArrayExpression.check(dep)) { // ['jquery', 'core']
        return dep.elements; // dep.elements为数组
      }
  });
  // Array.prototype.concat 可以把数组扁平化
  // 即[].concat([1, [2, 3]]) => [1, 2, 3]
  depNodes = [].concat(depNodes);

  // 串行遍历depNodes中的元素，全部遍历完后调用callback
  async.eachSeries(depNodes, function(depNode, callback) {
     // 依赖为'jquery'或'./tool/StringTool'类型的字面量, 直接跳过, 继续处理depNodes中的下一个元素
     if (namedTypes.Literal.check(dep)) { 
        return callback();
     }

    /* 
      依赖是一个节点，需要从中解析出'jquery'或'./tool/StringTool'类型的字面量路径:
        {
            type: "Literal"
            start: 490
            end: 498
            value: "jquery"
            raw: "'jquery'"
        }
    */

    // 获取依赖的详情信息
    var depInfo = getIdInfo(depNode.value);

    // 未开启debug模式时，所有debug模块都不加载
    if (depInfo.debug && !context.debug) {
      node.value = ''; //清空依赖值
      return callback();
    }

    // 忽略特殊的依赖
    if (depInfo.ignore || ['require', 'module', 'exporst'].indexOf(depInfo.id) !== -1) {
      return callback();
    }

    // 修改依赖路径
    loader(context, depInfo, function(err, module) {
      if (err) {
        callback(err);
      }

      if (_.isString(module)) {
        node.value = depInfo.id;

      } else {
        node.value = module.url; //模块的引用路径，是一个绝对路径

        if (noBlockDependNodes.indexOf(node) !== -1) {
          context.extra.AMDDepencies.push(module.src); //模块的源码路径，为相对路径
        }
      }
    });

  }, callback);
}