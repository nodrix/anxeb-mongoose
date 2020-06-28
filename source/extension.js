'use strict';

const utils = require('./common/utils');
const Connection = require('./middleware/connection');
const Debugs = require('./events/debugs');
const Exceptions = require('./events/exceptions');
const Models = require('./middleware/models');
const Data = require('./middleware/data');

module.exports = function (service, settings) {
	let _self = this;

	_self.service = service;
	_self.settings = settings || {};
	if (!_self.settings.connection.uri) {
		_self.service.log.exception.missing_parameter.args('uri', _self.service.key + ' mongoose extension').throw();
	}

	_self.service.parameters.fill(_self.settings, 'models');
	_self.service.log.include.event(new Debugs());
	_self.service.log.include.event(new Exceptions());
	_self.connection = new Connection(_self.service, _self.settings.connection);
	_self.models = new Models(_self.service, _self.connection, _self.settings.models);
	_self.service.routing.settings.context = _self.service.routing.settings.context || {};
	_self.service.routing.settings.context.properties = _self.service.routing.settings.context.properties || {};

	_self.service.routing.settings.context.properties['data'] = function (context) {
		return new Data(_self.service, _self.models, context);
	};

	Object.defineProperty(_self.service, 'models', {
		get : function () {
			if (_self.models && _self.models.list) {
				if (_self.models.connection.connected) {
					return _self.models.list;
				} else {
					_self.service.log.exception.data_server_offline.throw();
				}
			}
			return null;
		}
	});

	_self.start = function () {
		return new Promise(function (resolve, reject) {
			_self.connection.connect().then(function () {
				resolve();
			}).catch(function (err) {
				resolve();
			});
		});
	}
};