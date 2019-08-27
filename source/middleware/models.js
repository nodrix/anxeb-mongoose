'use strict';

const mongoose = require("mongoose");
const paginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

module.exports = function (service, connection, modelsPath) {
	let _self = this;
	_self.service = service;
	_self.connection = connection;
	_self.list = {};

	_self.include = {
		model : function (params) {

			if (params.childs) {
				for (let c in params.childs) {
					let child_params = params.childs[c];

					let child_options = {
						collection : child_params.collection || child_params.name
					};

					if (child_params.options) {
						child_options = child_params.options;
						child_options.collection = child_params.collection || child_params.options.collection || child_params.name
					}

					let child_schema = new Schema(child_params.schema, child_options);

					if (child_params.virtuals) {
						for (let v in child_params.virtuals) {
							child_schema.virtual(v).get(child_params.virtuals[v]);
						}
					}

					if (child_params.methods) {
						for (let m in child_params.methods) {
							child_schema.method(m, child_params.methods[m]);

							if (!Array.prototype[m]) {
								Array.prototype[m] = function (params) {
									return this.map(function (value) { return value && value[m] ? value[m](params) : value; });
								};
							}
						}
					}

					_self.list[params.name + child_params.name] = _self.context.model(params.name + child_params.name, child_schema);
				}
			}

			let options = {
				collection : params.collection || params.name
			};

			if (params.options) {
				options = params.options;
				options.collection = params.collection || params.options.collection || params.name
			}

			let schema = new Schema(params.schema, options);

			if (params.virtuals) {
				for (let v in params.virtuals) {
					schema.virtual(v).get(params.virtuals[v]);
				}
			}

			if (params.methods) {
				for (let m in params.methods) {
					schema.method(m, params.methods[m]);

					if (!Array.prototype[m]) {
						Array.prototype[m] = function (params) {
							return this.map(function (value) { return value && value[m] ? value[m](params) : value; });
						};
					}
				}
			}

			if (params.plugins) {
				for (let p in params.plugins) {
					schema.plugin(params.plugins[p]);
				}
			}
			schema.plugin(paginate);

			_self.list[params.name] = _self.connection.context.model(params.name, schema);
		}
	};

	if (modelsPath) {
		_self.service.fetch.modules(modelsPath, 'models').map(function (item) {
			item.module.name = item.module.name || item.name.toPascalCase();
			if (!item.module.disabled) {
				_self.include.model(item.module);
			}
		});
	}

};