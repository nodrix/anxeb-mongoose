'use strict';

const path = require('path');

const utils = {
	data : {
		populate : function (obj, source, backward) {
			var model = obj._doc || obj;
			if (backward === true) {
				for (var i in source) {
					if (i !== '_id') {
						obj[i] = source[i];
					}
				}
			} else {
				for (var i in model) {
					if (source[i] !== undefined && i !== '_id') {
						obj[i] = source[i];
					}
				}
			}
		},
		copy     : function (obj) {
			if (obj) {
				return JSON.parse(JSON.stringify(obj));
			} else {
				return null;
			}
		},
		validate : function (err, inner) {
			if (err && err.name === 'ValidationError') {
				var fields = [];
				var message = '';

				for (var field in err.errors) {

					var item = err.errors[field];
					var fName = item.message;

					var inx = fName.indexOf('/');
					if (inx > -1) {
						var index = parseInt(fName.substring(0, inx));
						fName = fName.substring(inx + 1);
						fields.push({
							name  : field,
							index : index
						});
					} else {
						fields.push({
							name  : fName,
							index : -1
						});
					}
					message += (message.length ? ', ' : '') + fName;
				}

				return inner.args(message).toError({ meta : { fields : fields } });
			} else {
				return null;
			}
		}
	},
	path : path
};

module.exports = utils;