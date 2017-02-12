var _ = require('lodash');
var async = require('async');
var path = require('path');
var realPath = require('real-path');
var resolve = require('resolve');

function Resolver(options) {
	this.options = options;
	// {
	//   moduleDirectory: ['common', '.remote', 'bower_components'],
	//   extensions: ['.js', '.es6'],
	//   extensionAlias: {
	//     '.css': ['.less'],
	//     '.js': ['.es6']
	//   }
	// }
}

Resolver.prototype.resolve = function(context, requirePath, options, callback) {
	options = _.assign({basedir: context}, this.options, options || {});

	var requirePaths = [requirePath];

	// 找出alias
	var ext = path.extname(requirePath);
	var alias = options.extensionAlias[ext];
	if (alias) {
		alias = _.uniq(alias instanceof Array ? alias : [alias]);

		_.each(alias, function(aliasExt) {
			requirePaths.push(requirePath.replace(new RegExp(ext + '$'), aliasExt));
		});
	}

	// 检测文件存在与否， 返回存在的文件路径
	var resultPath = '';
	var timer = 0; 
	var complete = _.once(function() {
		timer && clearTimeout(timer);

		if (!resultPath || realPath(resultPath) !== resultPath) {
			return callback(new Error(requirPath + '未被查找到！'));
		}

		callback(null, resultPath);
	})

	timer = setTimeout(complete, 30e3);

	async.detect(requirePaths, function(requirePath, callback) {
		resolve(requirePath, options, function(err, firstPathFound) {
			resultPath = firstPathFound;
		});
	}, complete);	
};

module.exports = Resolver;