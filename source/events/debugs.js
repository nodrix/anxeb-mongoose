'use strict';

module.exports = function () {
	return {
		data_server_connecting : {
			message : 'Connecting to data server [0:C].',
			type    : 'debug_log'
		},
		data_server_connected  : {
			message : 'Successfully connected to data server.',
			type    : 'debug_log'
		}
	}
};