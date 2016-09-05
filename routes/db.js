'use strict';

var q = require('q');

var connection = require('../config/db');

var db = {};

db.getRak = function () {
	var deferred = q.defer();
	connection.query('SELECT * FROM app_master_rack;', function (err, results) {
		if (err) {
			deferred.reject(err);
			return;
		}
		deferred.resolve(results);
	});
	return deferred.promise;
};



