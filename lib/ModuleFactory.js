var _ = require('lodash');
var fs = require('graceful-fs');
var minimatch = require('minimatch');
var mutil = require('miaow-util');
var path = require('path');

var Module = require('./Module');
var destTask = require('./tasks/dest');

function ModuleFactory(options) {
	this.options = options;
}

ModuleFactory.prototype.create = function(src, contents, callback) {
	if (_.isFunction(contents)) {
		callback = contents;
		contents = null;
	}

	var module = new Module();
	module.src = src;
	module.srcDir = path.dirname(src);

	// 获取当前模块(文件)对应的编译配置
	var moduleCompileConfig = _.find(this.options, function(item) {
		return minimatch(src, item.test, {matchBase: true, dot: true});
	});

	// 设置模块的编译任务
	module.tasks = moduleCompileConfig.tasks.concat({
		// 追加输出任务
		task: destTask,
		options: {}
	});

	// 添加一些属性
	_.assign(module, _.pick(moduleCompileConfig, ['context', 'output', 'domain', 'hashLength', 'hashConnector', 'ext', 'charset', 'debug', 'environment']));

	// 设置模块的输出目录
	module.destDir = (moduleCompileConfig.release || '$0').replace('$0', module.srcDir);

	// 设置URL, 此为在其它模块中require时引用的路径
	module.url = (moduleCompileConfig.url || '$0').replace('$0', module.srcDir);

	// 其它设置
	module.extra = {};
	
	//设置模块内容及hash值
	if (contents) {
		setContents(null, contents);
	} else {
		fs.readFile(path.resolve(moduleCompileConfig.context, src), setContents);
	}

	function setContents(err, contents) {
		if (err) {
			return callback(err);
		}

		module.srcContents = module.contents = contents;
		module.srcHash = mutil.hash(contents);

		callback(null, module);
	}
};

module.exports = ModuleFactory;