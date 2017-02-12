var _ = require('lodash');
var async = require('async');
var fs = require('graceful-fs');
var path = require('path');
var glob = require('glob');
var iconv = require('iconv-lite');
var mkdirp = require('mkdirp');
var mutil = require('path');
var Tapable = require('tapable');

var TaskContext = require('./TaskContext');

function Compilation() {
	Tapable.call(this);
	_.bindAll(this, ['getFiles', 'createModules', 'createModule', 'buildModules', 'buildModule', 
		'resolveFile', 'resolveModule', 'emitFile', 'emitModule', 'seal']);

	this.modules = {};
	this.emitModules = {}; //创建的模块
}

Compilation.prototype = Object.create(Tapable.prototype);
Compilation.prototype.constructor = Compilation;

Compilation.prototype.getFiles = function(callback) {
	glob('**/*', {
		cwd: this.context,
		ignore: this.exclude.concat(['**/miaow.config.js']),
		nodir: true

	}, function(err, files) {
		// 将文件路径转换为相对于当前目录的相对路径
		files  = (files || []).map(function(file) {
        console.log(file, mutil.relative('', file));
			return mutil.relative('', file); // 第一个参数为''表示相对于当前目录
		});

		callback(err, files);
	});
};

Compilation.prototype.createModules = function(files, callback) {
	console.log('------------files--------------');
	console.log(files);
	async.map(files, this.createModule, callback);
};

Compilation.prototype.createModule = function(file, contents, callback) {
	if (_.isFunction(contents)) {
		callback = contents;
		contents = null;
	}

	this.factory.create(file, contents, function(err, module) {
		if (!err) {
			this.modules[module.src] = module;
		}

		callback(err, module);
	}.bind(this));
};

Compilation.prototype.buildModules = function(modules, callback) {
	//modules是一个数组，而this.modules是一个对象
	this.applyPluginsAsyncSeries('build-modules', this.modules, function(err) {
		if (err) {
			return callback(err);
		}

		async.eachSeries(this.modules, this.buildModule, callback);
	}.bind(this));
};

Compilation.prototype.buildModule = function(module, callback) {
	console.log('------------Module------------')
	console.log(module)
	console.log('------------Module Task------------')
	_.each(module.tasks, function(task, callback) {
		console.log(task.task.toString());
	});

	var taskContext = new TaskContext(this, module);

	this.applyPluginsAsyncSeries('build-module', module, taskContext, function(err) {
		if (err) {
			return callback(err);
		}

		module.doBuild(taskContext).then(function() {
			console.log('---------Done-----------')
			callback(null, module);
		}, callback);
	});
};

Compilation.prototype.resolveFile = function(context, request, options, callback) {
	if (_.isFunction(options)) {
		callback = options;
		options = {};
	}

	this.resolver.resolve(context, request, options, callback);
};

Compilation.prototype.resolveModule = function(context, requirePath, options, callback) {
	if (_.isFunction(options)) {
		callback = options;
		options = {};
	}

	// module://src 格式的路径解析
	var moduleSchemaRegexp = /^module:\/\//; //什么地方会用到这种格式？
	if (moduleSchemaRegexp.test(requirePath)) {
		var module = this.modules[requirePath.replace(moduleSchemaRegexp, '')];
		return callback(module ? null : new Error(requirePath + '未被查找到!'), module);
	}

	this.resolver.resolve(context, requirePath, options, function(err, fileAbsolutePath) {
		if (err) {
			return callback(err);
		}

		//转成相对于源码目录的相对路径
		var src = mutil.relative(this.context, fileAbsolutePath);
		
		var module = this.modules[src];

		if (module) {
			this.buildModule(module, callback); //为啥要再编译一次？

		} else {
			async.waterfall([
				this.createModule.bind(this, src),
				this.buildModule
			], callback);
		}
	}.bind(this));
};

Compilation.prototype.emitFile = function(dest, contents, charset, callback) {
	if (!/utf[\-]?8/.test(charset)) {
		contents = iconv.encode(contents.toString(), charset);
	}

	var abspath = path.resolve(this.output, dest);
	console.log(abspath, '{{{}}}}}}}')

	async.series([
		_.partial(mkdirp, path.dirname(abspath)),
		fs.writeFile.bind(fs, abspath, contents)
	], callback);
};

Compilation.prototype.emitModule = function(src, contents, callback) {
	src = mutil.relative('', src);

	var module = this.modules[src];

	if (module) {
		this.buildModule(module, callback);

	} else {
		async.waterfall([
			this.createModule.bind(this, src, contents),
			
			function(module, callback) {
				this.emitModules[src] = module;
				callback(null, module);
			}.bind(this),

			this.buildModule
		], callback);
	}
};

// 编译
Compilation.prototype.seal = function(callback) {
	async.waterfall([
		this.getFiles,
		this.createModules, 
		this.buildModules
	], callback);
};

module.exports = Compilation;