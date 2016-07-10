var mysql = require('mysql');

// DB CONFIG
// ==============================================

var connection = mysql.createConnection({
	host     : 'localhost',
	port     : '3306',
	user     : 'root',
	password : '',
	database : 'ms_kotakarsip',
	multipleStatements: true
});

module.exports = connection;