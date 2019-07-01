'use strict';

const mongoose = require("mongoose");

let FieldDefinition = function (type, isEnum) {
	let isMixed = type === mongoose.Schema.Types.Mixed;
	let isArray = type === mongoose.Schema.Types.Array;
	let isRefer = type === mongoose.Schema.Types.ObjectId;

	return function (options, schema) {
		let result = typeof options === 'object' ? options : {};

		if (isRefer && (options != null || schema != null)) {
			if (typeof options === 'object' && options && options.dynamic === true) {
				result.refPath = schema;
			} else {
				result.ref = typeof options === 'string' ? options : schema;
			}
		}

		if (isEnum) {
			if (schema != null && schema instanceof Array) {
				result.enum = schema;
			} else if (options != null && options instanceof Array) {
				result.enum = options;
			}
		}

		if (typeof options === 'boolean') {
			result.required = options;
		}

		if (result.default == null) {
			result.default = null;
		}

		if (schema != null) {
			if (isMixed) {
				result.type = new mongoose.Schema(schema, { _id : result.identify === true });
			} else if (isArray) {
				result.type = [new mongoose.Schema(schema, { _id : result.identify === true })];
			} else {
				result.type = type;
			}
		} else {
			result.type = type;
		}

		if (result.required != null && result.required !== false) {
			let message = '';
			if (typeof result.required === 'number') {
				message = result.required.toString() + '/' + (result.message || '');
			} else if (typeof result.required === 'string') {
				message = 'R/' + result.required;
			} else if (typeof result.required === 'boolean') {
				message = 'R/' + (result.message || '');
			}

			result.validate = {
				validator : result.validator || function (value) {
					if (isMixed) {
						return value != null && Object.keys(value).length > 0;
					} else if (isArray) {
						return value != null && value.length > 0;
					} else {
						return value != null && value.toString().length > 0;
					}
				},
				message   : message
			};

			if (!isArray) {
				result.required = [true, message];
			}
		}

		return result;
	};
};

module.exports = {
	enum      : new FieldDefinition(mongoose.Schema.Types.String, true),
	string    : new FieldDefinition(mongoose.Schema.Types.String),
	number    : new FieldDefinition(mongoose.Schema.Types.Number),
	reference : new FieldDefinition(mongoose.Schema.Types.ObjectId),
	mixed     : new FieldDefinition(mongoose.Schema.Types.Mixed),
	array     : new FieldDefinition(mongoose.Schema.Types.Array),
	date      : new FieldDefinition(mongoose.Schema.Types.Date),
	decimal   : new FieldDefinition(mongoose.Schema.Types.Decimal),
	buffer    : new FieldDefinition(mongoose.Schema.Types.Buffer),
	bool      : new FieldDefinition(mongoose.Schema.Types.Boolean)
};