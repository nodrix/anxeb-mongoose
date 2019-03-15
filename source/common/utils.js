'use strict';

const path = require('path');

const utils = {
	data : {
		copy : function (obj) {
			if (obj) {
				return JSON.parse(JSON.stringify(obj));
			} else {
				return null;
			}
		}
	},
	path : path
};

module.exports = utils;