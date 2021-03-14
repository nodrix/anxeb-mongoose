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
	_self.count = {};
	_self.paginate = {};

	_self.validate = async function (models) {
		let fields = [];

		for (let key in models) {
			let model = models[key];
			try {
				await model.validate();
			} catch (err) {
				fields = fields.concat(utils.data.parseErrorToFields(err, {
					prefix : key
				}) || []);
			}
		}

		if (fields.length > 0) {
			let valErr = context.log.exception.missing_fields.args(fields.map((field) => field.name).join(', ').trim()).toError({ meta : { fields : fields } })
			_self.service.log.exception.data_validation_exception.args(valErr).throw(context);
		}
	}

	let setupModel = function (model) {
		if (model !== undefined && model !== null) {
			model.persist = function (params) {

				let getInvalids = function () {
					let invalids = [];

					if (params && params.validators) {
						for (let i = 0; i < params.validators.length; i++) {
							let validator = params.validators[i];
							if (validator.valid() === false) {
								invalids.push({ name : validator.field, index : validator.index });
							}
						}
					}
					return invalids;
				};

				return new Promise(function (resolve) {

					let handleError = function (err, invalids) {
						if (invalids == null) {
							invalids = getInvalids();
						}

						if (err == null) {
							_self.service.log.exception.data_validation_exception.include({
								fields : invalids
							}).throw(context);
						} else {
							let valErr = utils.data.validate(err, context.log.exception.missing_fields);
							if (valErr) {
								if (valErr.meta.fields != null && valErr.meta.fields instanceof Array && invalids.length > 0) {
									valErr.meta.fields = valErr.meta.fields.concat(invalids)
								}
								_self.service.log.exception.data_validation_exception.args(valErr).throw(context);
							} else {
								_self.service.log.exception.data_exception.args(err).throw(context);
							}
						}
					};

					model.validate().then(function () {
						let invalids = getInvalids();
						if (invalids.length > 0) {
							handleError(null, invalids);
						} else {
							model.save().then(function (data) {
								resolve(data);
							}).catch(handleError);
						}
					}).catch(handleError);
				});
			};

			model.check = function () {
				return new Promise(function (resolve) {
					model.validate().then(function (data) {
						resolve(data);
					}).catch(function (err) {
						let valErr = utils.data.validate(err, context.log.exception.missing_fields);
						if (valErr) {
							_self.service.log.exception.data_validation_exception.args(valErr).throw(context);
						} else {
							_self.service.log.exception.data_exception.args(err).throw(context);
						}
					});
				});
			};
		}
	};

	let FindContext = function (model) {
		return function (query, populate, sort, select) {
			return new Promise(function (resolve, reject) {
				let call = model.findOne(query);
				if (select) {
					call = call.select(populate);
				}
				if (populate) {
					call = call.populate(populate);
				}
				if (sort) {
					call = call.sort(sort);
				}
				call.then(function (data) {
					setupModel(data);
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		}
	};

	let ListContext = function (model) {
		//TODO: This params shoud be consolidated into one (all context classes apply)
		return function (query, populate, sort, select) {
			return new Promise(function (resolve) {
				let call = model.find(query);
				if (select) {
					call = call.select(populate);
				}
				if (populate) {
					call = call.populate(populate);
				}
				if (sort) {
					call = call.sort(sort);
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
				});
			});
		}
	};

	let RetrieveContext = function (model) {
		return function (params, populate, select) {
			return new Promise(function (resolve) {
				if (params == null) {
					resolve(null);
				} else {
					let call = null;
					if (typeof params === 'string') {
						call = model.findById(params);
					} else {
						call = model.findOne(params);
					}
					if (select) {
						call = call.select(select);
					}
					if (populate) {
						call = call.populate(populate);
					}
					call.then(function (data) {
						setupModel(data);
						resolve(data);
					}).catch(function (err) {
						_self.service.log.exception.data_exception.args(err).throw(context);
					});
				}
			});
		}
	};

	let UpsertContext = function (model) {
		return function (objectId, params) {
			return new Promise(function (resolve) {
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
			return new Promise(function (resolve) {

				model.deleteMany(typeof query === 'object' && !(query instanceof mongoose.Types.ObjectId) ? query : { _id : query }).then(function () {
					resolve();
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		}
	};

	let CountContext = function (model) {
		return function (query) {
			return new Promise(function (resolve) {
				model.countDocuments(typeof query === 'object' && !(query instanceof mongoose.Types.ObjectId) ? query : { _id : query }).then(function (data) {
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		}
	};

	let AggregateContext = function (model) {
		return function (params) {
			return new Promise(function (resolve) {
				model.aggregate(params).then(function (data) {
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		}
	};

	let PaginateContext = function (model) {
		return function (query, options) {
			return new Promise(function (resolve) {
				let call = model.paginate(query, options);
				call.then(function (data) {
					if (data != null && data.docs != null) {
						if (data.docs instanceof Array) {
							for (let i = 0; i < data.docs.length; i++) {
								setupModel(data.docs[i]);
							}
						}
					}
					resolve(data);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		}
	};

	if (_models && _models.list) {
		_self.multiple = function (entities) {
			return new Promise(function (resolve) {
				let promises = [];
				for (let name in entities) {
					let params = entities[name];
					let model = _models.list[params.from];

					promises.push(new Promise(function (resolve, reject) {
						let call = null;
						if (params.id) {
							call = model.findById(params.id);
						} else if (params.query) {
							call = model.find(params.query);
						}
						if (call) {
							if (params.populate) {
								call = call.populate(params.populate);
							}
							call.then(function (data) {
								if (!data) {
									data = new model(params.form);
								} else if (params.form) {
									utils.data.populate(data, params.form, true);
								}
								setupModel(data);
								resolve({ name : name, data : data });
							}).catch(reject);
						} else {
							resolve({ name : name, data : null });
						}
					}));
				}

				Promise.all(promises).then((entities) => {
					let result = {};
					for (let i = 0; i < entities.length; i++) {
						let entitiy = entities[i];
						result[entitiy.name] = entitiy.data;
					}
					resolve(result);
				}).catch(function (err) {
					_self.service.log.exception.data_exception.args(err).throw(context);
				});
			});
		};

		for (let key in _models.list) {
			let model = _models.list[key];
			_self.find[key] = new FindContext(model);
			_self.list[key] = new ListContext(model);
			_self.retrieve[key] = new RetrieveContext(model);
			_self.upsert[key] = new UpsertContext(model);
			_self.create[key] = new CreateContext(model);
			_self.delete[key] = new DeleteContext(model);
			_self.aggregate[key] = new AggregateContext(model);
			_self.count[key] = new CountContext(model);
			_self.paginate[key] = new PaginateContext(model);
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