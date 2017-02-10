var _ = require('lodash');
var async = require('async');
var Promise = require('promise');
var MiaowError = require('./MiaowError');

function Module() {}



Module.prototype.doBuild = function(taskContext) {
	var module = this;

	// 一个模块会被编译多次么? 第二次编译时和第一次是同一个Module对象? 
	// promise只能被解决一次, 第二次编译时返回一个已经被解决了的promise?
	if (module.__buildPromise__) {
		return module.__buildPromise__;
	}

	function runTask(task, callback) {
		// 超时计时器
		var timeoutTimer = null;

		// 任务结束回调
		var taskFinished = _.once(function(err) {
			timeoutTimer && clearTimeout(timeoutTimer);

			if(err) {
				err = err instanceof MiaowError ? err : new MiaowError(taskContext.src, err);
				return callback(err);
			}
			console.log('+++++++++one task done+++++++++++++++')
			callback();
		});

		//开始计时
		timeoutTimer = setTimeout(function() {
			taskFinished(new Error(task.task.toString() + ' 任务执行超时'));
		}, 60e3); 

		//执行任务
		try {
			task.task.call(taskContext, task.options, taskFinished);
		} catch(err) {
			taskFinished(err);
		}
	}
	
	module.__buildPromise__ = new Promise(function(resolve, reject) {
		async.eachSeries(module.tasks, runTask, function(err) {
			err ? reject(err) : resolve();
		});

	}).then(function() {
		_.assign(
			module, 
			_.pick(taskContext, ['url', 'contents', 'dest', 'destHash', 'dependencies', 'emitModules', 'emitFiles', 'cacheable', 'extra'])
		);
	});

	return module.__buildPromise__;
};

module.exports = Module;