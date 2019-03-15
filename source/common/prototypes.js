'use strict';

module.exports = function () {
	if (!String.prototype.isObjectId) {
		String.prototype.isObjectId = function padStart() {
			return this.match(/^[0-9a-fA-F]{24}$/);
		};
	}

	/*if (!Array.prototype.toClient) {
		Array.prototype.toClient = function () {
			return this.map(function (value) { return value && value.toClient ? value.toClient() : value; });
		};
	}*/
};
