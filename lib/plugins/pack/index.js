var _ = require('lodash');
var mutil = require('miaow-util');
var console = mutil.console;

var getPackConfig = require('./lib/getPackConfig');
var include = require('./lib/include');
var pack = require('./lib/pack');

function Pack() {}

Pack.prototype.apply = function(compiler) {
  compiler.plugin('compile', function(compilation, nextCompilePlugin) {
    // 获取项目源码中所有package.json文件中打包配置
    getPackConfig(compilation, function(err, packConfigList) {
      if (err) {
        // 终止后续的compile监听
        return nextCompilePlugin(err);
      }

      // 在模块编译前，向tasks中插入include任务
      compilation.plugin('build-module', function(module, taskContext, nextBuildModulePlugin) {
        // 查的当前模块的pack配置
        var packConfig = _.find(packConfigList, { name: module.src });
        
        // 在dest任务前插入include任务
        if (packConfig && !module.cached) {
          module.tasks.splice(-1, 0, {
            task: include, 
            options: {
              packConfig: packConfig
            }
          });
        }

        nextBuildModulePlugin();
      });

      // 打包操作
      !compilation.debug && compiler.plugin('compile-success', function(compilation, nextCompileSuccessPlugin) {
        console.log('合并模块');
        pack(compilation, function(err) {
          if (err) {
            console.error('合并模块失败');
          }
          nextCompileSuccessPlugin(err);
        })
      });

      nextCompilePlugin();
    });
  });
};