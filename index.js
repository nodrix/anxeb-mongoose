'use strict';

require('./source/common/prototypes')();

const init = require('./source/init');
const pjson = require('./package.json');
const mongoose = require('mongoose');

module.exports = {
	init        : init,
	name        : pjson.name,
	version     : pjson.version,
	description : pjson.description,
	Types       : mongoose.Schema.Types,
	Schema      : mongoose.Schema
};