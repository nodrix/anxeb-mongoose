'use strict';

let mongoose = require("mongoose");
let bluebird = require('bluebird');

module.exports = function (service, settings) {
	let _self = this;
	let _service = service;
	let _settings = settings;


	_settings.options = _settings.options || {};
	_settings.options.useNewUrlParser = true;
	_settings.options.useCreateIndex = true;

	mongoose.Promise = bluebird;
	_self.context = mongoose.createConnection();
	_self.connected = false;

	_self.newId = function () {
		return mongoose.Types.ObjectId();
	};

	_self.context.on('open', function (ref) {
		_self.connected = true;
	});

	_self.context.on('connecting', function () {
		_service.log.debug.data_server_connecting.args(_settings.key).print();
	});

	_self.context.on('connected', function () {
		_service.log.debug.data_server_connected.args(_settings.key).print();
		_self.connected = true;
	});

	_self.context.on('disconnected', function () {
		if (_self.connected === true) {
			_self.connected = false;
			_service.log.exception.data_server_disconnected.args(_settings.uri).print();
		}

		if (_settings.retryTimeout) {
			setTimeout(function () {
				_self.connect().then(function () {
					_self.connected = true;
				}).catch(function (err) {
					_self.connected = false;
				});
			}, _settings.retryTimeout);
		}
	});

	_self.connect = function () {
		return new Promise(function (resolve, reject) {
			if (_self.connected) {
				resolve();
			} else {
				_self.context.openUri(_settings.uri, _settings.options).then(function () {
					resolve();
				}).catch(function (err) {
					_service.log.exception.data_server_connection_failed.args(_settings.uri, err).print();
					reject();
				});
			}
		});
	};
};
