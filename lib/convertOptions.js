var _ = require('lodash');
var fs = require('graceful-fs');
var path = require('path');
var mconsole = require('miaow-util').console;
var processCWD = process.cwd();

//默认配置
var defaultOptions = {
	context: processCWD, // 工作目录
	exclude: [], // 排除的文件或目录，glob格式
	output: 'build', // 输出目录
	cache: 'cache', // 缓存目录
	hashLength: 10, // hash版本号的长度, 不需要时设为0即可
	hashConnector: '.', // hash版本号连接符
	domain: '', // 静态文件的域名
	debug: true, // 是否为调试模式
	plugins: [], // 插件
	modules: [], // 模块编译设置
	resolve: { // 寻路设置
		moudleDirectory: ['node_moudles', 'bower_components'],
		extensions: ['js'],
		extensionAlias: {
			'.css': ['.less']
		}
	}
};

// 获取配置文件路径
function getConfigPath(configPath, context) {
	var configPathList = []; //配置文件列表

	if (configPath) {
		configPathList.push(path.resolve(processCWD, configPath));
	}

	if (context) {
		configPathList.push(path.resolve(context, 'miaow.config.js'));
	}

	configPathList.push(path.resolve(processCWD, 'miaow.config.js'));

	return _.find(configPathList, fs.existsSync);
}

module.exports = function(options) {
	
	if (options.silent) {
		mconsole.log = mconsole.warn = _.noop; //错误信息依然是要输出的
	}

	//获取配置
	var config = {};
	var configPath = getConfigPath(options.configPath, options.context);
	
	if (configPath) {
		mconsole.log('使用配置: ' + configPath);

		config = require(configPath);

		if (_.isArray(config)) {
			if (options.environment) {
				config = _.find(config, {environment: options.environment});
				if (!config) {
					throw new Error('查不到运行环境为 ' + options.environment + '的配置信息');
				}
			} else {
				config = config[0];
			}
		}
	}
	
	config = _.assign({}, defaultOptions, config, options);

	// 模块编译设置
	config.modules = (config.modules.concat({test: '**/*'})).map(function(moudleConfig) {
		moudleConfig.tasks = (moudleConfig.tasks || []).map(function(task) {
			if (_.isFunction(task)) {
				task = {
					task: task,
					options: {}
				};
			}
			return task;
		});

		return _.assign(
			{},
			_.pick(config, ['hashLength', 'hashConnector', 'domain', 'debug']),
			moudleConfig,
			_.pick(config, ['context', 'output', 'environment'])
		);
	});
	// { 
	//  context: 'D:\\my\\my-miaow'
	// 	exclude: [],
	// 	output: 'build',
	// 	cache: 'cache',
	// 	hashLength: 10,
	// 	hashConnector: '.',
	// 	domain: '',
	// 	debug: true,
	// 	plugins: [],
	// 	modules: [ 
	// 		{ 
	// 			test: '**/*', 
	// 			tasks: [], 
	// 			environment: 'production' 
	// 		} 
	// 	],
	// 	resolve:
	// 	{ 
	// 		moudleDirectory: [ 'node_moudles', 'bower_components' ],
	// 		extensions: [ 'js' ],
	// 		extensionAlias: { '.css': [Object] } 
	// 	},
	// 	watch: false,
	// 	silent: false,
	// 	environment: 'production' 
	// }
	// 
	// modules: [
	// 	{
	// 		test: '*.ftl.js',
	// 		tasks: [
	// 			{
	// 				task: babelParse,
	// 				options: {
	// 					blacklist: ['strict'],
	// 					optional: ['es7.classProperties'],
	// 					modules: 'amd'
	// 				}
	// 			}, {
	// 				task: inlineParse,
	// 				options: {
	// 					blacklist: ['strict'],
	// 					optional: ['es7.classProperties'],
	// 					modules: 'amd'
	// 				}
	// 			},
	// 		],
	// 		hashLength: '',
	// 		hashConnector: '',
	// 		domain: '',
	// 		debug: '',
	// 		context: '',
	// 		output: '',
	// 		environment: ''
	// 	}, {
	// 		hashLength: '',
	// 		hashConnector: '',
	// 		domain: '',
	// 		debug: '',
	// 		context: '',
	// 		output: '',
	// 		environment: ''
	// 		test: '*.ftl.js',
	// 		tasks: [
	// 			{
	// 				task: babelParse,
	// 				options: {
	// 					blacklist: ['strict'],
	// 					optional: ['es7.classProperties'],
	// 					modules: 'amd'
	// 				}
	// 			}, {
	// 				task: inlineParse,
	// 				options: {
	// 					blacklist: ['strict'],
	// 					optional: ['es7.classProperties'],
	// 					modules: 'amd'
	// 				}
	// 			},
	// 		],
	// 	}
	// ],

	return config;
};