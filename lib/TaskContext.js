var _ = require('lodash');
var mutil = require('miaow-util');
var path = require('path');
var pathIsAbsolute = require('path-is-absolute');

function TaskContext(compilation, module) {
	_.assign(
		this, 
		_.pick(module, [
			'context', 'output', 'src', 'srcDir', 'srcHash', 'destDir', 'ext', 'charset',
    		'hashLength', 'hashConnector', 'domain', 'contents', 'url', 'debug', 'environment'
		]), 
		_.pick(compilation, ['startTime', 'emitFile']), 
		{
			extra: {},
			hooks: [],
			dependencies: [],
			emitModules: [],
			emitFiles: [],
			__cacheable__: true,
			__compilation__: compilation
		}
	);
}

TaskContext.prototype.emitModule = function(file, contents, callback) {
	this.__compilation__.emitModule(file, contents, function(err, module) {
		if (!err && this.emitModules.indexOf(module.src) === -1) {
			this.emitModules.push(module.src);
		}
		
		callback(err, module);
	}.bind(this));
};

TaskContext.prototype.resolveModule = function(modulePath, options, callback) {
	if(_.isFunction(options)) {
		callback = options;
		options = {};
	}

	var context = path.resolve(this.context, this.srcDir);
	this.__compilation__.resolveModule(context, modulePath, options, function(err, module) {
		!err && this.addDependency(module.src);
		callback(err, module);
	}.bind(this));
};

TaskContext.prototype.addDependency = function(moduleSrc) {
	// 转换成相对源码目录的路径
	moduleSrc = mutil.relative(pathIsAbsolute(moduleSrc) ? this.context: '', moduleSrc);
  
	// 添加到依赖表
	this.dependencies.indexOf(moduleSrc) === -1 && this.dependencies.push(moduleSrc);
};

TaskContext.prototype.addHook = function(hook) {
	this.hooks.push(hook);
};

module.exports = TaskContext;