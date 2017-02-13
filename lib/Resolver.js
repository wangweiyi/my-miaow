var _ = require('lodash');
var async = require('async');
var path = require('path');
var realPath = require('real-path');
var resolve = require('resolve');

function Resolver(options) {
	// {
	//   moduleDirectory: ['common', '.remote', 'bower_components'],
	//   extensions: ['.js', '.es6'],
	//   extensionAlias: {
	//     '.css': ['.less'],
	//     '.js': ['.es6']
	//   }
	// }
	this.options = options;
}

Resolver.prototype.resolve = function(context, fileSrc, options, callback) {
	console.log('resolve file: ' + fileSrc);
	
	options = _.assign({basedir: context}, this.options, options || {});

	var fileSrcArr = [fileSrc];

	// 找出alias
	var ext = path.extname(fileSrc);
	var alias = options.extensionAlias[ext];
	if (alias) {
		alias = _.uniq(alias instanceof Array ? alias : [alias]);

		_.each(alias, function(aliasExt) {
			fileSrcArr.push(fileSrc.replace(new RegExp(ext + '$'), aliasExt));
		});
	}

	// 并行检测fileSrcArr中的文件存在与否，返回第一个存在文件路径(因为是并行检测,所以可能并不是数组中的第一个元素)
	var resultPath = '';
	var timer = 0; 
	var complete = _.once(function() {
		timer && clearTimeout(timer);
		if (!resultPath || realPath(resultPath) !== resultPath) {
			return callback(new Error(resultPath + '未被查找到！'));
		}
		callback(null, resultPath);
	})

	timer = setTimeout(complete, 3e3); //设置超时, 3s未找到则视为文件不存在

	// 解析出模块的绝对路径
	async.detect(fileSrcArr, function(fileSrc, callback) {
		resolve(fileSrc, options, function(err, fileAbsolutePath) {
			resultPath = fileAbsolutePath;
			callback(!!fileAbsolutePath);
		});
	}, complete);
};

module.exports = Resolver;