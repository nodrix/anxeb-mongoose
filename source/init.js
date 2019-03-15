'use strict';

const Extension = require('./extension');

module.exports = function (server) {
	let _self = this;
	_self.instances = {};

	for (var n in server.services) {
		var service = server.services[n];

		if (service.extensions && service.extensions.mongoose) {
			_self.instances[service.key] = new Extension(service, service.extensions.mongoose);
		}
	}

	_self.start = function (service, settings) {
		return new Promise(function (resolve, reject) {
			var instance = _self.instances[service.key];
			if (instance) {
				instance.start().then(resolve).catch(reject);
			} else {
				resolve();
			}
		});
	}
};