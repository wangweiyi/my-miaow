var path = require('path');

// var amdParse = require('miaow-amd-parse');
var amdParse = require('./lib/tasks/amd-parse');
var babelParse = require('miaow-babel-parse');
var ftlParse = require('miaow-ftl-parse');
var inlineParse = require('./lib/tasks/inline-parse');
var lessParse = require('miaow-less-parse');
var liveReload = require('miaow-livereload');
var replace = require('miaow-replace');
var urlParse = require('./lib/tasks/url-parse');
var vueParse = require('miaow-vue-parse');

var ThirdPartyPlugin = require('miaow-thirdparty-plugin');
var PackPlugin = require('miaow-pack-plugin');

var autoprefixer = {
	task: require('miaow-css-autoprefixer'),
	options: {
		browsers: ['> 1%', 'last 2 versions', 'iOS >= 6', 'Android >= 2.1', 'Explorer >= 7', 'Firefox >= 38', 'Chrome >= 30']
	}
};

var cssUrlParse = {
	task: urlParse,
	options: {
		regexp: /url\s*\(\s*['"]?([^\/'"][\w_\/\.\-]*)(?:[?#].*?)?['"]?\)/g
	}
};

var inlineContentParse = {
	task: inlineParse,
	options: {
		regexp: /((?:\/\*|<!--)\s*inline\s+['"]([\w\_\/\.\-]+)['"]\s*(?:\*\/|-->))/g,
		type: 'content'
	}
};

var contentReplace = {
	task: replace,
	options: {
		replace: [
			{test: /__environment__/g, value: '<%= environment %>'},
			{test: /__debug__/g, value: '<%= debug %>'},
			{test: /__cdn__/g, value: '<%= domain %>'}
		]
	}
};

// 默认配置
var config = {
	// 工作目录
	context: path.resolve('./src'),

	// 输出目录
	output: path.resolve('./build'),

	// 缓存目录
	cache: path.resolve('./cache'),

	environment: 'default',

	// 排除目录
	exclude: [
		'build/**/*',
		'cache/**/*',
		'release/**/*',
		'old/**/*',
		'**/bower_components/**/*',
		'**/node_modules/**/*',
		'**/*.md',
		'**/bower.json',
		'**/gulpfile.js',
		'**/miaow.config.js',
		'**/miaow.local.js',
		'**/webpack.config.js'
	],

	// hash长度
	hashLength: 5,

	// hash值连接符
	hashConcat: '.',

	// 静态资源域名
	domain: 'http://127.0.0.1/static/',

	// 调试模式
	debug: false,

	plugins: [
		new ThirdPartyPlugin({test: '*.+(js|es6)', tasks: []}),
		new PackPlugin()
	],

	// 模块任务
	modules: [
		{
			test: '*.ftl.js',
			tasks: [
				inlineParse,
				urlParse,
				inlineContentParse
			]
		},

		{
			test: '*.js',
			tasks: [
				contentReplace,
				inlineParse,
				urlParse,
				amdParse,
				inlineContentParse
			]
		},

		{
			test: '*.es6',
			ext: '.js',
			tasks: [
				contentReplace,
				inlineParse,
				urlParse,
				{
					task: babelParse,
					options: {
						blacklist: ['strict'],
						optional: ['es7.classProperties'],
						modules: 'amd'
					}
				},
				amdParse,
				inlineContentParse
			]
		},

		{
			test: '*.vue',
			ext: '.vue.js',
			tasks: [
				contentReplace,
				inlineParse,
				urlParse,
				vueParse,
				amdParse,
				inlineContentParse
			]
		},

		{
			test: '*.css',
			tasks: [
				inlineParse,
				urlParse,
				cssUrlParse,
				autoprefixer,
				inlineContentParse
			]
		},

		{
			test: '*.less',
			ext: '.css',
			tasks: [
				inlineParse,
				urlParse,
				lessParse,
				cssUrlParse,
				autoprefixer,
				inlineContentParse
			]
		},

		{
			test: '*.ftl',
			domain: '',
			hashLength: 0,
			tasks: [
				inlineParse,
				urlParse,
				contentReplace,
				{
					task: ftlParse,
					options: {
						macroNameList: ['static', 'docHead', 'docFoot', 'jsFile', 'cssFile'],
						macroArgList: ['js', 'css', 'file', 'mockjax']
					}
				},
				{
					task: liveReload,
					options: {
						placeholder: '<#-- livereload -->'
					}
				},
				inlineContentParse
			]
		},

		{
			test: '*.+(htm|html|tpl)',
			tasks: [
				inlineParse,
				urlParse,
				contentReplace,
				{
					task: liveReload,
					options: {
						placeholder: '<!-- livereload -->'
					}
				},
				inlineContentParse
			]
		}
	],

	// 模块寻路路径
	resolve: {
		moduleDirectory: ['common', '.remote', 'bower_components'],
		extensions: ['.js', '.es6'],
		extensionAlias: {
			'.css': ['.less'],
			'.js': ['.es6']
		}
	}
};

module.exports = config;
