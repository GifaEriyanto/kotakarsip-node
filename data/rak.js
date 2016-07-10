var connection = require('../config/db');

var data_rak;
connection.query("SELECT * FROM app_master_rack;", function (err, results) {
	data_rak = results
	console.log(results);
});


module.exports = data_rak;