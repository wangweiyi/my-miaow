var _ = require('lodash');
var async = require('async');
var path = require('path');
var realPath = require('real-path');
var resolve = require('resolve');

function Resolver(options) {
	this.options = options;
}

Resolver.prototype.resolve = function(context, request, options, callback) {
	options = _.assign({basedir: context}, this.options, options || {});

	var requests = [request];

	_.each(requests, function(request) {

	});
};

module.exports = Resolver;