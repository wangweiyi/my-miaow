var _ = require('lodash');
var serialize = require('serialize-javascript'); //将对象序列化为string

var convertOptions = require('./convertOptions');
var Compiler = require('./Compiler');
var Cache = require('./plugins/Cache');
var Clean = require('./plugins/Clean');
var LiveReload = require('./plugins/LiveReload');
var Log = require('./plugins/Log');

module.exports = function(options, callback) {
	options = convertOptions(options);

	var compiler = new Compiler(options);
	// var plugins = options.plugins || [];

	// options.cache && plugins.unshift(
	// 	new Cache(
	// 		serialize(_.pick(options, ['output', 'cache', 'hashLength', 'hashConnector', 'domain', 'plugins', 'modules', 'resolve'])),
	// 		options.cache,
	// 		options.context,
	// 		options.output
	// 	)
	// );
	// plugins.push(new Clean());
	// plugins.push(new Log(options.output));
	// options.watch && plugins.push(new LiveReload());

	//注册插件
	// plugins.forEach(function(plugin) {
	// 	compiler.apply(plugin);
	// });

	//开始编译
	_.isFunction(callback) && compiler[options.watch ? 'watch' : 'run'](callback);
	
	return compiler;
};