// var express = require('express');
// var connection = require('./db');

// Query DB
// var data_sm_count;
// connection.query("SELECT count(id) as count, rack_number FROM view_inbox GROUP BY rack_number LIMIT 3;", function (err, results) {
// 	data_sm_count = results;
// });

// var data_sk_count;
// connection.query("SELECT count(id) as count, rack_number FROM view_outbox GROUP BY rack_number LIMIT 3;", function (err, results) {
// 	data_sk_count = results;
// });

// var data_rak;
// connection.query("SELECT * FROM app_master_rack;", function (err, results) {
// 	data_rak = results;
// });

// var data_disposisi;
// connection.query("SELECT * FROM app_master_disposition;", function (err, results) {
// 	data_disposisi = results;
// });

// var count_inbox;
// connection.query("SELECT count(id) as count FROM view_inbox;", function (err, results) {
// 	count_inbox = results[0].count;
// });


// var query = {
// 	data_rak : function () {
// 		var data = connection.query("SELECT * FROM app_master_rack;", function(err, results) {
// 		});
// 			console.log(data);
		
// 	}
// }


// module.exports = query.data_rak();
// 
// 'use strict';

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

db.getBerandaData = function () {
	var deferred = q.defer();
	var query = [
		'SELECT * FROM view_inbox ORDER BY id LIMIT 12',
		'SELECT * FROM view_outbox ORDER BY id LIMIT 12',
		'SELECT count(id) as count, rack_number FROM view_inbox GROUP BY rack_number LIMIT 3',
		'SELECT count(id) as count, rack_number FROM view_outbox GROUP BY rack_number LIMIT 3'
	];
	connection.query(query.join(';'), function (err, results) {
		if (err) {
			deferred.reject(err);
			return;
		}
		deferred.resolve(results);
	});
	return deferred.promise;
};

db.countInbox = function () {
	var deferred = q.defer();

	connection.query('SELECT count(id) as count FROM view_outbox;', function (err, results) {
		if (err) {
			deferred.reject(err);
			return;
		}
		deferred.resolve(results[0].count);
	});

	return deferred.promise;
};

db.getInboxLimit = function (objPage) {
	var deferred = q.defer();

	connection.query('SELECT * FROM view_inbox ORDER BY id LIMIT ' + objPage.startPage + ',' + objPage.endPage, function (err, results) {
		if (err) {
			deferred.reject(err);
			return;
		}
		deferred.resolve(results);
	});

	return deferred.promise;
};

module.exports = db;
