var _ = require('lodash');
var async = require('async');
var mutil = require('miaow-util');
var path = require('path');
var url = require('url');

var pkg = require('../../package.json');

module.exports = function(options, callback) {
	
	var context = this;
	var destHash = context.destHash = mutil.hash(context.contents); //此时的contents为处理完的最终结果
	var filename = path.basename(context.src).replace(/\.[^\.]+$/, context.ext || path.extname(context.src));
	var filenameWithHash = !context.hashLength ? filename :
						filename.replace(/\.[^\.]+$/, context.hashConnector + destHash.slice(0, context.hashLength) + path.extname(filename));
	//输出的文件路径
	var dest = mutil.relative('', path.join(context.destDir, filename)); 
	//输出的文件路径, hash版
	var destWtihHash = context.dest = mutil.relative('', path.join(context.destDir, filenameWithHash)); 
	
	//记录输出的文件，当hashLength为0时两个文件名相同，故去重，只输出一个
	context.emitFiles = _.uniq([dest, destWtihHash]);

	//设置模块的绝对url路径，用于被其它模块require
	context.url = url.resolve(
					(context.domain || '').replace(), //强制转成以'/'结尾的形式
					[context.url.replace(/^\/|\/$/, ''), filenameWithHash].join('/') //首先去除context.url的开头或结尾处的'/'
				  );	
	
	console.log('++dest: ' +context.dest);

	// hooks 存放了在生成目标文件之前需要执行的任务
	// 目前只有 amd-parser 使用了 hook，其他基本上都没有使用。
	/* 
		amd-parser 使用 hook，主要是为了生成模块标识的:
	   	define(['jquery'], function () {});
		==>
		define('这个模块标识是在 hook 里面设置的', ['jquery'], function () {});
	*/
	function runHook(callback) {
		// async.each：并列遍历集合元素，处理函数会接收两个参数：item 和 callback
		async.each(context.hooks, function(hook, callback) {
			hook(context, callback);
		}, callback);
	}

	//输出文件
	function emitFile(callback) {
		async.each(
			context.emitFiles,
			_.partial(context.emitFile, _, context.contents, context.charset || 'utf-8'),
			callback
		);
	}
	
	// 依次执行输出前任务 及 输出任务
	async.series([runHook, emitFile], callback);
};

module.exports.toString = function() {
	return ['dest', pkg.version].join('@');
};