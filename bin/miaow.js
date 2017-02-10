var _ = require('lodash');
var path = require('path');
var mconsole = require('miaow-util').console;
// 获取命令行参数
var argv = 
	require('yargs')
		.options({
			w: {
				alias: 'watch',
				describe: '监听文件变化并实时编译',
				type: 'boolean'
			},

			s: {
				alias: 'silent',
				describe: '是否输出提示和警告信息',
				type: 'boolean'
			},

			e: {
				alias: 'environment',
				describe: '启用哪个环境配置',
				type: 'string'
			},

			c: {
				alias: 'configPath',
				describe: '配置文件路径',
				type: 'string'
			},

			ca: {
				alias: 'cache',
				describe: '缓存目录',
				type: 'string'
			}
		})
		.help('help')
		.argv;

// 获取转换后的参数
var options = _.pick(argv, ['watch', 'silent', 'environment', 'configPath', 'cache']);
if (argv._[0]) {
	options.context = path.resolve(process.cwd(), argv._[0]);
}
if (argv._[1]) {
	options.output = path.resolve(process.cwd(), argv._[1]);
}

// 执行编译
require('..')(options, complete);

function complete(err) {
	if (err) {
		(_.isArray(err) ? err : [err]).forEach(showError);

		if (!options.watch) {
			process.on('exit', function() {
				process.exit(1); // 1表示非正常退出么?
			});
		}
	}
}

function showError(err) {
	var text = ['错误信息：'];

	if (_.isString(err)) {
		err = {
			message: err
		};
	}

	if (err.file) {
		text.push('文件：' + err.file);
	}

	if (err.message) {
		text.push('消息：' + err.message);
	}

	if (err.details) {
		text.push('细节：' + err.details);
	}

	mconsole.error(text.join('\n'));
}

//test async
// var async = require('async');
// async.map(['file1','file2','file3'], function(item, callback) {
// 	item = item + item.slice(-1);
// 	callback(null, item);

// }, function(err, results) {
//     // results is now an array of stats for each file
//     console.log(results);
// });
// async.each(function() {
// 	console.log(1)
// }, function() {
// 	console.log(2)
// }, function() {
// 	console.log(3)
// });
// async.eachSeries(function() {
// 	console.log(1)
// }, function() {
// 	console.log(2)
// }, function() {
// 	console.log(3)
// });

//test tapable
// var Tapable = require("tapable");

// function MyClass() {
//     Tapable.call(this);
// }
// MyClass.prototype = Object.create(Tapable.prototype);

// var mc = new MyClass();

// mc.plugin('init', function(arg1) {
// 	console.log(arg1);
// });
// mc.plugin('init', function(arg1, arg2) {
// 	console.log(arg2);
// });
// mc.plugin('init', function(arg1, arg2, arg3) {
// 	console.log(arg3);
// });
// mc.applyPlugins('init', 1, 2, 3);
/*
1
2
3
*/

// mc.plugin('init', function(init, arg1, arg2) {
// 	console.log(init, arg1, arg2);
// 	return 'first';
// });
// mc.plugin('init', function(ret, arg1, arg2) {
// 	console.log(ret, arg1, arg2);
// 	return 'second';
// });
// mc.plugin('init', function(ret, arg1, arg2) {
// 	console.log(ret, arg1, arg2);
// 	return 'third';
// });
// var ret = mc.applyPluginsWaterfall('init', 1, 2, 3);
// console.log(ret);
/*
	1 2 3
	first 2 3
	second 2 3
	third
*/

// mc.plugin('init', function(arg1, arg2) {
// 	console.log(arg1, arg2);
// });
// mc.plugin('init', function(arg1, arg2) {
// 	console.log(arg1, arg2);
// });
// mc.plugin('init', function(arg1, arg2) {
// 	console.log(arg1, arg2);
// });
// mc.applyPluginsAsync('init', 1, 2, function(err) {
// 	console.log(err, 'all done!')
// });
