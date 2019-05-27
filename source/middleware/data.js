'use strict';

const mongoose = require("mongoose");
const utils = require('../common/utils');

module.exports = function (service, models, context) {
	let _self = this;
	let _models = models;

	_self.service = service;
	_self.find = {};
	_self.list = {};
	_self.retrieve = {};
	_self.upsert = {};
	_self.create = {};
	_self.delete = {};
	_self.aggregate = {};

	let setupModel = function (model) {
		if (model !== undefined && model !== null) {
			model.persist = function () {
				return new Promise(function (resolve, reject) {
					model.save().then(function (data) {
						resolve(data);
					}).catch(function (err) {
						let valErr = utils.data.validate(err, context.log.exception.missing_fields);
						if (valErr) {
							context.log.exception.data_validation_exception.args(valErr).throw(context);
						} else {
							_self.service.log.exception.data_exception.args(err).throw(context);
						}
						if (reject) {
							reject(err);
						}
					});
				});
			};
		}
	};

	let FindContext = function (model) {
		return function (query, populate) {
			return new Promise(function (resolve, reject) {
				let call = model.findOne(query);
				if (populate) {
					call = call.populate(populate);
				}
				call.then(function (data) {
					setupModel(data);
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
		return function (query, populate) {
			return new Promise(function (resolve, reject) {
				let call = model.find(query);
				if (populate) {
					call = call.populate(populate);
				}
				call.then(function (data) {
					if (data instanceof Array) {
						for (let i = 0; i < data.length; i++) {
							setupModel(data[i]);
						}
					}
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
		return function (params, populate) {
			return new Promise(function (resolve, reject) {
				if (params == null) {
					resolve(null);
				} else {
					let call = null;
					if (typeof params === 'string') {
						call = model.findById(params);
					} else {
						call = model.findOne(params);
					}
					if (populate) {
						call = call.populate(populate);
					}
					call.then(function (data) {
						setupModel(data);
						resolve(data);
					}).catch(function (err) {
						_self.service.log.exception.data_exception.args(err).throw(context);
						if (reject) {
							reject(err);
						}
					});
				}
			});
		}
	};

	let UpsertContext = function (model) {
		return function (objectId, params) {
			return new Promise(function (resolve, reject) {
				if (objectId == null) {
					let data = new model(params);
					setupModel(data);
					resolve(data);
				} else {
					model.findById(objectId).then(function (data) {
						if (!data) {
							data = new model(params);
						} else {
							utils.data.populate(data, params, true);
						}
						setupModel(data);
						resolve(data);
					}).catch(function (err) {
						_self.service.log.exception.data_exception.args(err).throw(context);
						if (reject) {
							reject(err);
						}
					});
				}
			});
		}
	};

	let CreateContext = function (model) {
		return function (params) {
			let newModel = new model(params);
			setupModel(newModel);
			return newModel;
		}
	};

	let DeleteContext = function (model) {
		return function (query) {
			return new Promise(function (resolve, reject) {

				model.deleteMany(typeof query === 'object' ? query : { _id : query }).then(function () {
					resolve();
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
					if (reject) {
						reject(err);
					}
				});
			});
		}
	};

	let AggregateContext = function (model) {
		return function (params) {
			return new Promise(function (resolve, reject) {
				model.aggregate(params).then(function (data) {
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
		for (let key in _models.list) {
			let model = _models.list[key];
			_self.find[key] = new FindContext(model);
			_self.list[key] = new ListContext(model);
			_self.retrieve[key] = new RetrieveContext(model);
			_self.upsert[key] = new UpsertContext(model);
			_self.create[key] = new CreateContext(model);
			_self.delete[key] = new DeleteContext(model);
			_self.aggregate[key] = new AggregateContext(model);
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