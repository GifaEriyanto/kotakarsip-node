var express = require('express');
var path = require('path');
var router = express.Router();
var bodyParser = require('body-parser');
var pagination = require('pagination');
var qString = require('querystring');
var crypto = require('crypto');
var moment = require('moment');
var fs = require('fs');
var app = express();

var passport = require('passport');
var expressSession = require('express-session');

var connection = require('../config/db');
var variable = require('../extra/variable');

// Upload File By Multer
var multer = require('multer');
var storage_inbox = multer.diskStorage({
	destination: './public/uploads/inbox',
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			if (err) return cb(err)

			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
})
var upload_inbox = multer({ storage: storage_inbox })

var storage_outbox = multer.diskStorage({
	destination: './public/uploads/outbox',
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			if (err) return cb(err)

			cb(null, raw.toString('hex') + path.extname(file.originalname))
		})
	}
})
var upload_outbox = multer({ storage: storage_outbox })

// Query DB

var data_rak;
connection.query("SELECT * FROM app_master_rack WHERE archive = '0'", function (err, results) {
	data_rak = results;
});


var data_disposisi;
connection.query("SELECT * FROM app_master_disposition WHERE archive = '0'", function (err, results) {
	data_disposisi = results;
});

var count_inbox;
connection.query("SELECT count(id) as count FROM view_inbox", function (err, results) {
	count_inbox = results[0].count;
});

var count_inbox;
connection.query("SELECT count(id) as count FROM view_outbox", function (err, results) {
	count_outbox = results[0].count;
});



router
	.get('/login', function (req, res, next) {
		res.render('./login/index');
	})
	.post('/login', passport.authenticate('login', {
		successRedirect: '/',
		failureRedirect: '/login'
	}));



var isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated())
	return next();
	res.redirect('/login');
}

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});


// Get Home Page
router.get('/', isAuthenticated, function(req, res, next) {
	var query = [	
		"SELECT * FROM view_inbox ORDER BY id LIMIT 12",
		"SELECT * FROM view_outbox ORDER BY id LIMIT 12",
		"SELECT count(id) as count, rack_number FROM view_inbox GROUP BY rack_number LIMIT 3",
		"SELECT count(id) as count, rack_number FROM view_outbox GROUP BY rack_number LIMIT 3"
	]
	connection.query(query.join(";"), function (err, results) {
		if (err) throw err;

		res.render('./dashboard/index', {
			title : "Beranda",
			path : variable.nav,
			currentPage : req.path,
			menuActive : "/",
			data_sm : results[0],
			data_sk : results[1],
			data_sm_count : results[2],
			data_sk_count : results[3],
			data_rak : data_rak,
			name : req.session.passport.user
		})
	})
});



// Get Surat Masuk Page
router.get('/surat-masuk', isAuthenticated, function(req, res, next) {

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
			pageActive : paginator._result.current,
			name : req.session.passport.user
		})
	})
});



router.get('/surat-masuk/list', isAuthenticated, function (req, res, next) {

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
			date : function (i) {
				return moment(rows[i].inbox_date).format('DD-MM-YYYY')
			},
			pages : paginator._result.range,
			pageActive : paginator._result.current,
			name : req.session.passport.user
		})
	})
})



router
	.get('/surat-masuk/tambah', isAuthenticated, function (req, res, next) {
		connection.query("SELECT id FROM app_users WHERE user_login = '" + req.session.passport.user + "'", function (err, results) {
			res.render('./surat-masuk/tambah', {
				title : "Tambah Surat Masuk Baru",
				path : variable.nav,
				menuActive : "/surat-masuk",
				data_disposisi : data_disposisi,
				data_rak : data_rak,
				id : results[0].id,
				name : req.session.passport.user
			})
		})
	})
	.post('/surat-masuk/tambah', upload_inbox.single('inbox_file'), function(req, res) {

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



router
	.get('/surat-masuk/sunting/:id', isAuthenticated, function (req, res, next) {
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
				date : moment(rows[0].inbox_date).format('YYYY-MM-DD'),
				data_rak : data_rak,
				name : req.session.passport.user
			})

		})
	})
	.post('/surat-masuk/sunting/:id', upload_inbox.single('inbox_file'), function(req, res) {
		var post = {
			id : req.params.id,
			id_user : req.body.id_user,
			id_rack : req.body.id_rack,
			inbox_date : req.body.inbox_date,
			inbox_from : req.body.inbox_from,
			inbox_number : req.body.inbox_number,
			inbox_title : req.body.inbox_title,
			inbox_desc : req.body.inbox_desc,
			inbox_disposition : req.body.inbox_disposition.toString()
		}
		
		if (typeof req.file !== "undefined") {
			connection.query('UPDATE app_inbox SET inbox_file = ? WHERE id = ?', [req.file.filename, post.id]);
		}

		connection.query('UPDATE app_inbox SET id_user = ?, id_rack = ?, inbox_date = ?, inbox_from = ?, inbox_number = ?, inbox_title = ?, inbox_desc = ?, inbox_disposition = ? WHERE id = ?', [post.id_user, post.id_rack, post.inbox_date, post.inbox_from, post.inbox_number, post.inbox_title, post.inbox_desc, post.inbox_disposition, post.id], function(err, result) {
			if (err) throw err;

			res.redirect('/surat-masuk/sunting/' + post.id)
		});

	});



router.get('/surat-masuk/detail/:id', isAuthenticated, function (req, res, next) {
	connection.query("SELECT * FROM view_inbox WHERE id = " + req.params.id, function (err, rows, field) {
		if (err) throw err;

		connection.query("SELECT id FROM view_notification WHERE id_content = '" + rows[0].id + "' AND user_login_get = '" + req.session.passport.user + "'", function (err, notif) {
			if (notif.length > 0) {
				connection.query('UPDATE app_notifications_read SET status = ? WHERE id = ?', [0, notif[0].id]);
			}
		})

		var dis = "["+rows[0].inbox_disposition+"]";
		res.render('./surat-masuk/detail', {
			title : "Detail Surat Masuk #" + req.params.id,
			path : variable.nav,
			menuActive : "/surat-masuk",
			id : req.params.id,
			data : rows,
			data_rak : data_rak,
			title : rows[0].inbox_title,
			inbox_disposition : JSON.parse(dis),
			data_disposisi : data_disposisi,
			date : moment(rows[0].inbox_date).format('DD-MM-YYYY'),
			name : req.session.passport.user
		})
	})
})



router.get('/surat-masuk/cetak', isAuthenticated, function (req, res, next) {
	connection.query("SELECT * FROM view_inbox ORDER BY id", function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-masuk/cetak', {
			title : "Cetak Surat Masuk",
			data : rows,
			data_rak : data_rak,
			date : function (i) {
				return moment(rows[i].inbox_date).format('DD-MM-YYYY')
			},
			inbox_disposition : function (i) {
				var dis = "["+rows[i].inbox_disposition+"]";
				return JSON.parse(dis);
			},
			data_disposisi : data_disposisi,
			name : req.session.passport.user
		})
	})
})



router.get('/surat-masuk/hapus/:id', isAuthenticated, function (req, res, next) {
	connection.query("DELETE FROM app_inbox WHERE id=" + req.params.id, function (err, rows, field) {
		if (err) throw err;

		res.redirect('/surat-masuk');
	})
})




// Get Surat Keluar Page
router.get('/surat-keluar', isAuthenticated, function(req, res, next) {

	// Pagination
	var pageActive = 1;
	if ( req.param('page') > 1 ) {
		pageActive = req.param('page');
	}

	var paginator = new pagination.SearchPaginator({prelink:req.path, current: pageActive, rowsPerPage: variable.page.limit, totalResult: count_outbox});
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
			pageActive : paginator._result.current,
			name : req.session.passport.user
		})
	})
});



router.get('/surat-keluar/list', isAuthenticated, function (req, res, next) {

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

		res.render('./surat-keluar/index-list', {
			title : "Surat keluar",
			path : variable.nav,
			currentPage : path.dirname(currentPage),
			menuActive : "/surat-keluar",
			data : rows,
			data_rak : data_rak,
			date : function (i) {
				return moment(rows[i].inbox_date).format('DD-MM-YYYY')
			},
			pages : paginator._result.range,
			pageActive : paginator._result.current,
			name : req.session.passport.user
		})
	})
})



router
	.get('/surat-keluar/tambah', isAuthenticated, function (req, res, next) {
		connection.query("SELECT id FROM app_users WHERE user_login = '" + req.session.passport.user + "'", function (err, results) {
			res.render('./surat-keluar/tambah', {
				title : "Tambah Surat keluar Baru",
				path : variable.nav,
				menuActive : "/surat-keluar",
				data_rak : data_rak,
				id : results[0].id,
				name : req.session.passport.user
			})
		})
	})
	.post('/surat-keluar/tambah', upload_outbox.single('outbox_file'), function(req, res) {
		var post = {
			id_user : req.body.id_user,
			id_rack : req.body.id_rack,
			outbox_date : req.body.outbox_date,
			outbox_for : req.body.outbox_for,
			outbox_number : req.body.outbox_number,
			outbox_title : req.body.outbox_title,
			outbox_desc : req.body.outbox_desc,
			outbox_file : req.file.filename
		}

		connection.query('INSERT INTO app_outbox SET ?', post, function(err, result) {
			if (err) throw err;

			res.redirect('/surat-keluar/tambah');
		});

	});



router
	.get('/surat-keluar/sunting/:id', isAuthenticated, function (req, res, next) {
		connection.query("SELECT * FROM view_outbox WHERE id = " + req.params.id, function (err, rows, field) {
			res.render('./surat-keluar/sunting', {
				title : "Sunting Surat keluar #" + req.params.id,
				path : variable.nav,
				menuActive : "/surat-keluar",
				id : req.params.id,
				id_user : rows[0].id_user,
				id_rack : rows[0].id_rack,
				outbox_date : rows[0].outbox_date,
				outbox_for : rows[0].outbox_for,
				outbox_number : rows[0].outbox_number,
				outbox_title : rows[0].outbox_title,
				outbox_desc : rows[0].outbox_desc,
				date : moment(rows[0].outbox_date).format('YYYY-MM-DD'),
				data_rak : data_rak,
				name : req.session.passport.user
			})

		})
	})
	.post('/surat-keluar/sunting/:id', upload_outbox.single('outbox_file'), function(req, res) {
		var post = {
			id : req.params.id,
			id_user : req.body.id_user,
			id_rack : req.body.id_rack,
			outbox_date : req.body.outbox_date,
			outbox_for : req.body.outbox_for,
			outbox_number : req.body.outbox_number,
			outbox_title : req.body.outbox_title,
			outbox_desc : req.body.outbox_desc
		}

		if (typeof req.file !== "undefined") {
			connection.query('UPDATE app_outbox SET outbox_file = ? WHERE id = ?', [req.file.filename, post.id]);
		}

		connection.query('UPDATE app_outbox SET id_user = ?, id_rack = ?, outbox_date = ?, outbox_for = ?, outbox_number = ?, outbox_title = ?, outbox_desc = ? WHERE id = ?', [post.id_user, post.id_rack, post.outbox_date, post.outbox_for, post.outbox_number, post.outbox_title, post.outbox_desc, post.id], function(err, result) {
			if (err) throw err;

			res.redirect('/surat-keluar/sunting/' + post.id)
		});

	});



router.get('/surat-keluar/detail/:id', isAuthenticated, function (req, res, next) {
	connection.query("SELECT * FROM view_outbox WHERE id = " + req.params.id, function (err, rows, field) {
		if (err) throw err;

		connection.query("SELECT id FROM view_notification WHERE id_content = '" + rows[0].id + "' AND user_login_get = '" + req.session.passport.user + "'", function (err, notif) {
			if (notif.length > 0) {
				connection.query('UPDATE app_notifications_read SET status = ? WHERE id = ?', [0, notif[0].id]);
			}
		})

		res.render('./surat-keluar/detail', {
			title : "Detail Surat keluar #" + req.params.id,
			path : variable.nav,
			menuActive : "/surat-keluar",
			id : req.params.id,
			data : rows,
			title : rows[0].outbox_title,
			data_rak : data_rak,
			date : moment(rows[0].outbox_date).format('DD-MM-YYYY'),
			name : req.session.passport.user
		})
	})
})



router.get('/surat-keluar/cetak', isAuthenticated, function (req, res, next) {
	connection.query("SELECT * FROM view_outbox ORDER BY id", function (err, rows, field) {
		if (err) throw err;

		res.render('./surat-keluar/cetak', {
			title : "Cetak Surat keluar",
			data : rows,
			data_rak : data_rak,
			date : function (i) {
				return moment(rows[i].outbox_date).format('DD-MM-YYYY')
			},
			name : req.session.passport.user
		})
	})
})



router.get('/surat-keluar/hapus/:id', isAuthenticated, function (req, res, next) {
	connection.query("DELETE FROM app_outbox WHERE id=" + req.params.id, function (err, rows, field) {
		if (err) throw err;

		res.redirect('/surat-keluar');
	})
})



// Get Master Page
router
	.get('/master', isAuthenticated, function(req, res, next) {

		// Path
		var currentPage = req.path;

		var query = [	
			"SELECT * FROM app_master_rack WHERE archive = '0'",
			"SELECT * FROM app_master_disposition WHERE archive = '0'",
			"SELECT * FROM app_users WHERE archive = '0' AND user_login != '" + req.session.passport.user + "'"
		]
		
		connection.query(query.join(";"), function (err, results) {
			if (err) throw err;

			res.render('./master/index', {
				title : "Master Data",
				path : variable.nav,
				currentPage : currentPage,
				menuActive : "/master",
				data_rack : results[0],
				data_disposition : results[1],
				data_users : results[2],
				name : req.session.passport.user
			})
		})
	})
	.post('/master', function(req, res) {

		var init = req.body.init;
		var del = req.body.delete;
		if (init === 'rack') {
			var post = {
				rack_number : req.body.rack_number
			}

			connection.query('INSERT INTO app_master_rack SET ?', post, function(err, result) {
				if (err) throw err;
			});

		} else if (init === 'disposition') {
			var post = {
				disposition_name : req.body.disposition_name,
				disposition_position : req.body.disposition_position
			}

			connection.query('INSERT INTO app_master_disposition SET ?', post, function(err, result) {
				if (err) throw err;
			});

		} else if (init === 'users') {
			var secret = req.body.user_pass;
			const pass = crypto.createHmac('sha256', secret).digest('hex');

			var post = {
				user_login : req.body.user_login,
				user_pass : pass,
				user_displayname : req.body.user_displayname,
				user_email : req.body.user_email
			}

			connection.query('INSERT INTO app_users SET ?', post, function(err, result) {
				if (err) throw err;
			});

		} else if (init === 'master_rack' || init === 'master_disposition') {
			connection.query("UPDATE app_" + init + " SET archive='1' WHERE id=" + req.body.id, function (err, rows, field) {
				if (err) throw err;
			})

		} else if (init === 'master_users') {
			connection.query("UPDATE app_users SET archive='1' WHERE id=" + req.body.id, function (err, rows, field) {
				if (err) throw err;
			})

		} else if (init === 'edit_disposition') {
			var post = {
				id : req.body.id,
				disposition_name : req.body.disposition_name,
				disposition_position : req.body.disposition_position
			}

			connection.query('UPDATE app_master_disposition SET disposition_name = ?, disposition_position = ? WHERE id = ?', [post.disposition_name, post.disposition_position, post.id], function(err, result) {
				if (err) throw err;
			});

		} else if (init === 'edit_users') {

			var post = {
				id : req.body.id,
				user_login : req.body.user_login,
				user_displayname : req.body.user_displayname,
				user_email : req.body.user_email,
			}

			var secret = req.body.user_pass;
			var password;
			if (secret !== "") {
				password = crypto.createHmac('sha256', secret).digest('hex');
				connection.query('UPDATE app_users SET user_pass = ? WHERE id = ?', [password, post.id], function(err, result) {
					if (err) throw err;
				});
			}

			connection.query('UPDATE app_users SET user_login = ?, user_displayname = ?, user_email = ? WHERE id = ?', [post.user_login, post.user_displayname, post.user_email, post.id], function(err, result) {
				if (err) throw err;
			});

			
		} else if (init === 'edit_rack') {
			var post = {
				id : req.body.id,
				rack_number : req.body.rack_number,
			}

			connection.query('UPDATE app_master_rack SET rack_number = ? WHERE id = ?', [post.rack_number, post.id], function(err, result) {
				if (err) throw err;
			});
		}
		
		res.redirect('/master');

	});



router
	.get('/pengaturan-akun', isAuthenticated, function (req, res, next) {
		connection.query('SELECT * FROM app_users WHERE user_login="' + req.session.passport.user + '"', function (err, results) {
			if (err) throw err;
			
			res.render('./pengaturan-akun/index', {
				title : "Pengaturan Akun",
				path : variable.nav,
				menuActive : "/master",
				data : results,
				name : req.session.passport.user
			})
		})
	})
	.post('/pengaturan-akun', function (req, res) {

		var post = {
			id : req.body.id,
			user_login : req.body.user_login,
			user_displayname : req.body.user_displayname,
			user_email : req.body.user_email,
		}

		var secret = req.body.user_pass;
		var password;
		if (secret !== "") {
			password = crypto.createHmac('sha256', secret).digest('hex');
			connection.query('UPDATE app_users SET user_pass = ? WHERE id = ?', [password, post.id], function(err, result) {
				if (err) throw err;
			});
		}

		connection.query('UPDATE app_users SET user_login = ?, user_displayname = ?, user_email = ? WHERE id = ?', [post.user_login, post.user_displayname, post.user_email, post.id], function(err, result) {
			if (err) throw err;

			res.redirect('/pengaturan-akun');
		});
	})



router.get('/search', isAuthenticated, function (req, res, next) {

	var rack = "";
	var daterange = "";
	if (req.query.daterange !== "") {
		var str = req.query.daterange;
		var date = new Array();
		date = str.split(" - ");

		daterange =  req.query.type + "_date BETWEEN '" + date[0] + "' AND '" + date[1] + "' AND ";
	}

	if (req.query.rack !== "") {
		var str = req.query.rack;
		if (typeof str !== "undefined") {
			var arr = str.toString();
			rack = "id_rack IN ('" + arr + "') AND ";
		}
	}

	var query = "SELECT * FROM view_" + req.query.type + " WHERE " + rack + daterange + " " +  req.query.type +"_title LIKE '%" + req.query.q + "%' ORDER BY id";
	console.log(query);
	// Pagination
	var pageActive = 1;
	if ( req.param('page') > 1 ) {
		pageActive = req.param('page');
	}

	var paginator = new pagination.SearchPaginator({prelink:req.path, current: pageActive, rowsPerPage: variable.page.limit, totalResult: count_inbox});
	paginator.getPaginationData();

	var start = paginator._result.current * variable.page.limit - variable.page.limit;
	var end = variable.page.limit;

	connection.query(query, function (err, results) {
		if (err) throw err;

		res.render('./search/index', {
			title : "Pencarian...",
			path : variable.nav,
			currentPage : req.path,
			menuActive : "/",
			data : results,
			data_rak : data_rak,
			type : req.query.type,
			pages : paginator._result.range,
			pageActive : paginator._result.current,
			type : req.query.type,
			rack : req.query.rack,
			daterange : req.query.daterange,
			q : req.query.q,
			name : req.session.passport.user
		})
	})
})



router.get('/notif', isAuthenticated, function (req, res, next) {

	connection.query("SELECT * FROM app_users WHERE user_login = '" + req.session.passport.user + "'", function (err, results) {
		var id = results[0].id;

		connection.query("SELECT * FROM view_notification WHERE id_user = '" + id + "' AND user_login != '" + req.session.passport.user + "' ORDER BY id DESC LIMIT 30" , function (err, results) {
			if (err) throw err;

			res.render('./notif/index', {
				title : "Notifikasi",
				path : variable.nav,
				menuActive : "",
				data : results,
				name : req.session.passport.user
			})
		})
	})

})

module.exports = router;