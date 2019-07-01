'use strict';

const Extension = require('./extension');

module.exports = function (server) {
	let _self = this;
	_self.instances = {};

	for (let n in server.services) {
		let service = server.services[n];

		if (service.extensions && service.extensions.mongoose) {
			_self.instances[service.key] = new Extension(service, service.extensions.mongoose);
		}
	}

	_self.start = function (service, settings) {
		return new Promise(function (resolve, reject) {
			let instance = _self.instances[service.key];
			if (instance) {
				instance.start().then(resolve).catch(reject);
			} else {
				resolve();
			}
		});
	}
};