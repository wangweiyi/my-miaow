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