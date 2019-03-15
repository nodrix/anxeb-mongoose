'use strict';

module.exports = function () {
	return {
		data_server_connection_failed : {
			message : 'Connection to data server [0] failed.',
			code    : 8001,
			type    : 'data_exception'
		},
		data_server_offline           : {
			message : 'Data server offline.',
			code    : 8002,
			type    : 'data_exception'
		},
		data_server_disconnected      : {
			message : 'Data server [0] disconnected unexpectedly.',
			code    : 8003,
			type    : 'data_exception'
		},
		data_exception                : {
			message : 'Data exception. [inner]',
			code    : 8004,
			type    : 'data_exception'
		},
		data_validation_exception     : {
			message : 'One or more fields are required',
			code    : 8005,
			type    : 'data_exception'
		},
		missing_fields                : {
			message : 'Required fields: [0]',
			code    : 8006,
			type    : 'data_exception'
		},
		record_not_found              : {
			message : '[0] "[1]" not found.',
			code    : 8007,
			type    : 'data_exception'
		}
	}
};
