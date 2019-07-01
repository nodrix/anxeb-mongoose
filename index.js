'use strict';

require('./source/common/prototypes')();

const init = require('./source/init');
const pjson = require('./package.json');
const mongoose = require('mongoose');
const fields = require('./source/middleware/fields');

module.exports = {
	init        : init,
	name        : pjson.name,
	version     : pjson.version,
	description : pjson.description,
	Types       : mongoose.Schema.Types,
	ObjectId    : mongoose.Types.ObjectId,
	Schema      : mongoose.Schema,
	Fields      : fields
};