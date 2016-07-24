var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var crypto = require('crypto');
var routes = require('./routes/index');
var app = express();

var passport = require('passport');
var expressSession = require('express-session');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
var LocalStrategy = require('passport-local').Strategy;
var connection = require('./config/db');

// passport/login.js
passport.use('login', new LocalStrategy({
		passReqToCallback : true
	},
	function(req, username, password, done) {
		const pass = crypto.createHmac('sha256', password).digest('hex');

		// check in db if a user with username exists or not
		connection.query("SELECT * FROM app_users WHERE user_login='" + username + "' AND user_pass='" + pass + "'", function (err, user) {
			
			// In case of any error, return using the done method
			if (err)
				return done(err);
			
			// Username does not exist, log error & redirect back
			if (user.length === 0) {
				return done(null, false);
			}
			return done(null, user);
		});
	}
));


passport.serializeUser(function(user, done) {
	done(null, user[0].user_login);
});
 
passport.deserializeUser(function(id, done) {
	connection.query("SELECT * FROM app_users WHERE id='" + id[0].id + "'", function (err, user) {
		done(err, user);
	});
});

// routes
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

// export
module.exports = app;