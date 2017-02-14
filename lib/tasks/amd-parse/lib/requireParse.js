var _ = require('lodash');
var async = require('async');
var recast = require('recast');

var getDepInfo = require('./getDepInfo');
var loader = require('./loader');

function requireParse(context, options, ast, callback) {
  var types = recast.types;
  var namedTypes = types.namedTypes;
  var requireNodes = [];

  // _.find(collection, iteratee), 返回collection中第一个使iteratee返回true的元素
  // 返回代码中没有被任何块包裹的第一个require 语句，通常是文件第一行的requrie依赖声明
  var noBlockRequire = _.find(ast.program.body || [], function (child) {
    return namedTypes.ExpressionStatement.check(child) &&
      namedTypes.CallExpression.check(child.expression) &&
      namedTypes.Identifier.check(child.expression.callee) &&
      child.expression.callee.name === 'require' &&
      namedTypes.ArrayExpression.check(child.expression.arguments[0]);
  });

  // 获取noBlockRequire中声明的依赖
  var noBlockDependNodes = !noBlockRequire ? [] :
    noBlockRequire.expression.arguments[0].elements;

  //查出全部require节点, 包括noBlockRequire
  types.visit(ast, {
    visitCallExpression: function (path) {
      if (namedTypes.Identifier.check(path.node.callee)
        && path.node.callee.name === 'require') {
        requireNodes.push(path.node);
      }
      this.traverse(path);
    }
  });

  /** 
   * 查出全部require依赖的节点
      require('xxx') 的情况, dep的值为：
      {
        type: "Literal"
        value: "./user.json"
        raw: "'./user.json'"
      }
      -------------------------------------------
      require(['xxx', 'yyy']) 的情况, dep的值为：
      {
          type: "ArrayExpression"
          elements: [
            Literal {
              type: "Literal"
              value: "./user.json"
              raw: "'./user.json'"
            },
            Literal {
              type: "Literal"
              value: "./admin.json"
              raw: "'./admin.json'"
          }
        ]
    }
    ------------------------------------------------
    var admin = "./admin.json";
    require(['./user.json', admin])的情况, dep的值为：
    {
          type: "ArrayExpression"
          elements: [
            {
              type: "Literal"
              value: "./user.json"
              raw: "'./user.json'"
            },
            {
              type: "Identifier"
              name: "admin"
            }
          ]
    }
    注意此时数组中第二个元素的类型为Identifier!!
  */
  var depNodes = requireNodes.map(function (depNode) {
    var dep = depNode.arguments[0];

    if (namedTypes.Literal.check(dep)) {
      return dep;
    } else if (namedTypes.ArrayExpression.check(dep)) {
      return dep.elements;
    }
  });
  // Array.prototype.concat 将数组扁平化：[].concat([1, [2, 3]]) => [1, 2, 3]
  depNodes = [].concat(depNodes);

  // 串行遍历元素，全部遍历完后调用callback
  async.eachSeries(depNodes, function (depNode, callback) {
    // 不处理Identifier类型的依赖
    if (namedTypes.Identifier.check(depNode)) {
      return callback();
    }

    /*
      获取依赖的详情信息
    */
    var depInfo = getDepInfo(depNode.value);

    // 非debug模式下，不加载debug类型模块
    if (!context.debug && depInfo.debug) {
      // 通过修改语法树，来修改依赖的模块路径 
      depNode.value = ''; // require('xxx') => require('')
      return callback();
    }

    // 不处理系统级或第三方依赖 ??
    if (depInfo.ignore || ['require', 'module', 'exporst'].indexOf(depInfo.id) !== -1) {
      return callback();
    }

    // 调用loader处理不同类型的依赖
    loader(context, depInfo, function (err, module) {
      if (err) {
        callback(err);
      }
      
      if (_.isString(module)) {
        // 通过修改语法树，来修改依赖的模块路径
        depNode.value = depInfo.id;

      } else {
        // 通过修改语法树，来修改依赖的模块路径
        depNode.value = module.url; //模块的引用路径，是绝对路径

        if (noBlockDependNodes.indexOf(depNode) !== -1) {
          context.extra.AMDDepencies.push(module.src); //模块的源码路径，为相对路径
        }
      } 
      callback();
    });

  }, callback);
}

module.exports = requireParse;