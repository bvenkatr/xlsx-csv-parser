var config = require('./myconfig');
var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var fs = require('fs');
var readline = require('readline');
var moment = require('moment');

var conString = "postgres://"+config.username+":"+config.password+"@"+config.ipaddress+"/"+config.database;
fileName = '../mycsv.csv';

pg.connect(conString, function (err, con, done) {
	var stream = con.query(copyFrom("COPY tablename FROM STDIN WITH NULL 'null'"));

	fs.exists(fileName, function (exists) {
		if (!exists) {
			stream.end();
		}

		var rd = readline.createInterface({
			input: fs.createReadStream(fileName),
			output: process.stdout,
			terminal: false
		});

		rd.on('line', function (line) {
			var line = line.split(',');
			var newline = [];
			for(i=0, len=line.length; i<len; i++){
				if(i === 2){
					newline.push(moment(line[i], 'M/D/YYYY').format('YYYY-MM-DD'));
					newline.push('\t');
				}
				newline.push(line[i]);
				if(i != len-1){
					newline.push('\t');
				}
			}
			newline.push('\n');
			//var line = line.replace(', ', '\t') + '\n';
			stream.write(newline.join(''));
		});

		rd.on('close', function () {
			stream.end();
		});

		rd.on('error', function () {
			stream.end();
			throw new Error(arguments);
		});
	});
	stream.on('end', function () {
		done(con);
		con.end();
	});
	stream.on('error', function () {
		console.log('ERROR', arguments);
		done(con);
		con.end();
	});
	console.log("Successfully completed");
});
