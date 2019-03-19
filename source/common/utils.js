'use strict';

const path = require('path');

const utils = {
	data : {
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