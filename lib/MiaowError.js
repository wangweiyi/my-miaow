var _ = require('lodash');

function MiaowError(file, error) {
	Error.call(this);
	Error.captureStackTrace(this, MiaowError);

	_.assign(this, {
		name: 'MiaowError',
		file: file, 
		error: error, 
		message: error.message,
		details: error.stack
	});
}

MiaowError.prototype = Object.create(Error.prototype);

module.exports = MiaowError;