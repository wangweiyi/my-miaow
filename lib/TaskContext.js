var _ = require('lodash');
var mutil = require('miaow-util');
var path = require('path');
var pathIsAbsolute = require('path-is-absolute');

function TaskContext(compilation, module) {
	_.assign(
		this, 
		_.pick(module, [
			'context', 'output', 'src', 'srcDir', 'srcHash', 'destDir', 'ext', 'charset',
    		'hashLength', 'hashConnector', 'domain', 'contents', 'url', 'debug', 'environment'
		]), 
		_.pick(compilation, ['startTime', 'emitFile']), 
		{
			extra: {},
			hooks: [],
			dependencies: [],
			emitModules: [],
			emitFiles: [],
			__cacheable__: true,
			__compilation__: compilation
		}
	);

	console.log('-------------task context------------');
	console.log(this);
}

TaskContext.prototype.emitModule = function(file, contents, callback) {
	this.__compilation__.emitModule(file, contents, function(err, module) {
		if (!err && this.emitModules.indexOf(module.src) === -1) {
			this.emitModules.push(module.src);
		}
		
		callback(err, module);
	}.bind(this));
};

module.exports = TaskContext;