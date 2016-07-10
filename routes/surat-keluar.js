var express = require('express');
var path = require('path');
var router = express.Router();
var connection = require('../config/db');
var variable = require('../extra/variable');

var data_rak;
connection.query("SELECT * FROM app_master_rack;", function (err, results) {
	data_rak = results;
});

router.get('/', function(req, res, next) {
	connection.query("SELECT * FROM view_outbox", function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-keluar/index', {
			title : "Surat Keluar",
			path : variable.nav,
			currentPage : req.path,
			menuActive : "/surat-keluar",
			data : rows,
			data_rak : data_rak
		})
		
		console.log(rows);
	})
});

module.exports = router;
