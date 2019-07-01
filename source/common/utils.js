'use strict';

const path = require('path');

const utils = {
	data : {
		populate : function (obj, source, backward) {
			let model = obj._doc || obj;
			if (backward === true) {
				for (let i in source) {
					if (i !== '_id') {
						obj[i] = source[i];
					}
				}
			} else {
				for (let i in model) {
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
				let fields = [];
				for (let field in err.errors) {
					let inmsg = null;
					let item = err.errors[field];

					if (item.name === 'ValidatorError') {
						let fName = item.message;
						let inx = fName.indexOf('/');
						let pfield = {
							name : field
						};

						if (inx > -1) {
							let index = fName.substring(0, inx);
							inmsg = fName.length > inx + 1 ? fName.substring(inx + 1) : null;

							if (isNaN(index)) {

							} else {
								pfield.index = parseInt(index);
							}
						}

						if (inmsg != null && inmsg.length > 0) {
							pfield.message = inmsg;
						}

						fields.push(pfield);
					}
				}

				return inner.args(fields.map((field) => field.name).join(', ').trim()).toError({ meta : { fields : fields } });
			} else {
				return null;
			}
		}
	},
	path : path
};

module.exports = utils;