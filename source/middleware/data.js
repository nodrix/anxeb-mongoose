'use strict';

var mongoose = require("mongoose");

module.exports = function (service, models, context) {
	let _self = this;
	let _models = models;

	_self.service = service;
	_self.find = {};
	_self.list = {};
	_self.retrieve = {};

	let FindContext = function (model) {
		return function (params) {
			return new Promise(function (resolve, reject) {
				model.findOne(params).then(function (data) {
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
					if (reject) {
						reject(err);
					}
				});
			});
		}
	};

	let ListContext = function (model) {
		return function (params) {
			return new Promise(function (resolve, reject) {
				model.find(params).then(function (data) {
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
					if (reject) {
						reject(err);
					}
				});
			});
		}
	};

	let RetrieveContext = function (model) {
		return function (objectid) {
			return new Promise(function (resolve, reject) {
				model.findById(objectid).then(function (data) {
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
					if (reject) {
						reject(err);
					}
				});
			});
		}
	};

	if (_models && _models.list) {
		for (var key in _models.list) {
			let model = _models.list[key];
			_self.find[key] = new FindContext(model);
			_self.list[key] = new ListContext(model);
			_self.retrieve[key] = new RetrieveContext(model);
		}
	}

	Object.defineProperty(_self, 'models', {
		get : function () {
			if (_models && _models.list) {
				if (_models.connection.connected) {
					return _models.list;
				} else {
					_self.service.log.exception.data_server_offline.throw();
				}
			}
			return null;
		}
	});

};