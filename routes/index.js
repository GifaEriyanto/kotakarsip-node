var express = require('express');
var path = require('path');
var router = express.Router();
var bodyParser = require('body-parser');
var pagination = require('pagination');
var qString = require('querystring');
var crypto = require('crypto');
var fs = require('fs');
var app = express();

var connection = require('../config/db');
var variable = require('../extra/variable');



// Upload File By Multer
var multer = require('multer');
var storage = multer.diskStorage({
	destination: './public/uploads/inbox',
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			if (err) return cb(err)

			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
})
var upload = multer({ storage: storage })



// Query DB
var data_sm_count;
connection.query("SELECT count(id) as count, rack_number FROM view_inbox GROUP BY rack_number LIMIT 3;", function (err, results) {
	data_sm_count = results;
});

var data_sk_count;
connection.query("SELECT count(id) as count, rack_number FROM view_outbox GROUP BY rack_number LIMIT 3;", function (err, results) {
	data_sk_count = results;
});

var data_rak;
connection.query("SELECT * FROM app_master_rack;", function (err, results) {
	data_rak = results;
});

var data_disposisi;
connection.query("SELECT * FROM app_master_disposition;", function (err, results) {
	data_disposisi = results;
});

var count_inbox;
connection.query("SELECT count(id) as count FROM view_inbox;", function (err, results) {
	count_inbox = results[0].count;
});



// Get Home Page
router.get('/', function(req, res, next) {
	connection.query("SELECT * FROM view_inbox ORDER BY id LIMIT 12; SELECT * FROM view_outbox ORDER BY id LIMIT 12;", function (err, results) {
		if (err) throw err;

		res.render('./dashboard/index', {
			title : "Beranda",
			path : variable.nav,
			currentPage : req.path,
			menuActive : "/",
			data_sm : results[0],
			data_sk : results[1],
			data_sm_count : data_sm_count,
			data_sk_count : data_sk_count,
			data_rak : data_rak
		})
	})
});



// Get Surat Masuk Page
router.get('/surat-masuk', function(req, res, next) {

	// Pagination
	var pageActive = 1;
	if ( req.param('page') > 1 ) {
		pageActive = req.param('page');
	}

	var paginator = new pagination.SearchPaginator({prelink:req.path, current: pageActive, rowsPerPage: variable.page.limit, totalResult: count_inbox});
	paginator.getPaginationData();

	var start = paginator._result.current * variable.page.limit - variable.page.limit;
	var end = variable.page.limit;

	// Path
	var currentPage = req.path;
	
	connection.query("SELECT * FROM view_inbox ORDER BY id LIMIT " + start + "," + end, function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-masuk/index', {
			title : "Surat Masuk",
			path : variable.nav,
			currentPage : currentPage,
			menuActive : "/surat-masuk",
			data : rows,
			data_rak : data_rak,
			pages : paginator._result.range,
			pageActive : paginator._result.current
		})
	})
});



router.get('/surat-masuk/list', function (req, res, next) {

	// Pagination
	var pageActive = 1;
	if ( req.param('page') > 1 ) {
		pageActive = req.param('page');
	}

	var paginator = new pagination.SearchPaginator({prelink:req.path, current: pageActive, rowsPerPage: variable.page.limit, totalResult: count_inbox});
	paginator.getPaginationData();

	var start = paginator._result.current * variable.page.limit - variable.page.limit;
	var end = variable.page.limit;

	// Path
	var currentPage = req.path;

	connection.query("SELECT * FROM view_inbox LIMIT " + start + "," + end, function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-masuk/index-list', {
			title : "Surat Masuk",
			path : variable.nav,
			currentPage : path.dirname(currentPage),
			menuActive : "/surat-masuk",
			data : rows,
			data_rak : data_rak,
			pages : paginator._result.range,
			pageActive : paginator._result.current
		})
	})
})



router.get('/surat-masuk/tambah', function (req, res, next) {
	res.render('./surat-masuk/tambah', {
		title : "Tambah Surat Masuk Baru",
		path : variable.nav,
		menuActive : "/surat-masuk",
		data_disposisi : data_disposisi,
		data_rak : data_rak
	})
})



router.post('/surat-masuk/tambah', upload.single('inbox_file'), function(req, res) {
	var post = {
		id_user : req.body.id_user,
		id_rack : req.body.id_rack,
		inbox_date : req.body.inbox_date,
		inbox_from : req.body.inbox_from,
		inbox_number : req.body.inbox_number,
		inbox_title : req.body.inbox_title,
		inbox_desc : req.body.inbox_desc,
		inbox_disposition : req.body.inbox_disposition.toString(),
		inbox_file : req.file.filename
	}

	connection.query('INSERT INTO app_inbox SET ?', post, function(err, result) {
		if (err) throw err;

		res.redirect('/surat-masuk/tambah');
	});

});



router.get('/surat-masuk/sunting/:id', function (req, res, next) {
	connection.query("SELECT * FROM view_inbox WHERE id = " + req.params.id, function (err, rows, field) {
		var dis = "["+rows[0].inbox_disposition+"]";
		res.render('./surat-masuk/sunting', {
			title : "Sunting Surat Masuk #" + req.params.id,
			path : variable.nav,
			menuActive : "/surat-masuk",
			id : req.params.id,
			id_user : rows[0].id_user,
			id_rack : rows[0].id_rack,
			inbox_date : rows[0].inbox_date,
			inbox_from : rows[0].inbox_from,
			inbox_number : rows[0].inbox_number,
			inbox_title : rows[0].inbox_title,
			inbox_desc : rows[0].inbox_desc,
			inbox_disposition : JSON.parse(dis),
			data_disposisi : data_disposisi,
			data_rak : data_rak
		})

	})
})



router.post('/surat-masuk/sunting/:id', upload.single('inbox_file'), function(req, res) {
	var post = {
		id_user : req.body.id_user,
		id_rack : req.body.id_rack,
		inbox_date : req.body.inbox_date,
		inbox_from : req.body.inbox_from,
		inbox_number : req.body.inbox_number,
		inbox_title : req.body.inbox_title,
		inbox_desc : req.body.inbox_desc,
		inbox_disposition : req.body.inbox_disposition.toString(),
		// inbox_file : req.body.inbox_file
	}

	connection.query('UPDATE app_inbox SET id_user = ?, id_rack = ?, inbox_date = ?, inbox_from = ?, inbox_number = ?, inbox_title = ?, inbox_desc = ? WHERE id = ?', [post.id_user, post.id_rack, post.inbox_date, post.inbox_from, post.inbox_number, post.inbox_title, post.inbox_desc, post.id], function(err, result) {
		if (err) throw err;

		res.redirect('/surat-masuk/sunting/' + req.param.id)
	});

});



router.get('/surat-masuk/detail/:id', function (req, res, next) {
	connection.query("SELECT * FROM view_inbox WHERE id = " + req.params.id, function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-masuk/detail', {
			title : "Detail Surat Masuk #" + req.params.id,
			path : variable.nav,
			menuActive : "/surat-masuk",
			id : req.params.id,
			data : rows
		})
	})
})



router.get('/surat-masuk/cetak', function (req, res, next) {
	connection.query("SELECT * FROM view_inbox", function (err, rows, field) {
		res.render('./surat-masuk/cetak', {
			title : "Cetak Surat Masuk",
			data : rows,
			data_rak : data_rak,
		})
	})
})




// Get Surat Keluar Page
router.get('/surat-keluar', function(req, res, next) {

	// Pagination
	var pageActive = 1;
	if ( req.param('page') > 1 ) {
		pageActive = req.param('page');
	}

	var paginator = new pagination.SearchPaginator({prelink:req.path, current: pageActive, rowsPerPage: variable.page.limit, totalResult: count_inbox});
	paginator.getPaginationData();

	var start = paginator._result.current * variable.page.limit - variable.page.limit;
	var end = variable.page.limit;

	// Path
	var currentPage = req.path;
	
	connection.query("SELECT * FROM view_outbox LIMIT " + start + "," + end, function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-keluar/index', {
			title : "Surat Keluar",
			path : variable.nav,
			currentPage : currentPage,
			menuActive : "/surat-keluar",
			data : rows,
			data_rak : data_rak,
			pages : paginator._result.range,
			pageActive : paginator._result.current
		})
	})
});

module.exports = router;