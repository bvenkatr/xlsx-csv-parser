var config = require('./myconfig');
var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var xlsx = require('xlsx');
var moment = require('moment');

var workbook = xlsx.readFile(config.filepath);//Give absolute filepath
var sheet = workbook.Sheets[workbook.SheetNames[0]];
var lastcell = sheet['!ref'].split(':')[1];
var lastrow = Number(lastcell.substring(1));

var conString = "postgres://"+config.username+":"+config.password+"@"+config.ipaddress+"/"+config.database;
pg.connect(conString, function (err, con, done) {

	var stream = con.query(copyFrom("COPY " + config.tablename + " FROM STDIN WITH NULL 'null'"));

	for (var row = 2; row <= lastrow; row++) {
		var line = [];
		var firstCellRef = 'A' + row;
		if (!sheet[firstCellRef] || !sheet[firstCellRef].v || sheet[firstCellRef].v == '' || typeof(sheet[firstCellRef]) == 'undefined') {
			break;
		}
		for (var i = 65, len = lastcell.charCodeAt(0); i <= len; i++) {
			var cellref = String.fromCharCode(i) + row;

			var cellvalue = 'null';
			if (sheet[cellref]) {
				switch (i) {
					case 67:
						cellvalue = moment(sheet[cellref].w, 'M/D/YYYY').format('YYYY-MM-DD');
						break;
					case 68:
						cellvalue = Number(sheet[cellref].v);
						break;
					case 66:
					case 69:
					case 70:
					case 71:
					case 72:
					case 73:
						cellvalue = sheet[cellref].w.trim();
						break;
					default :
						cellvalue = sheet[cellref].v;
						break;
				}
			}
			line.push(cellvalue);
			if (i != len) {
				line.push('\t');
			}
		}
		line.push('\n');
		stream.write(line.join(''));
	}

	stream.on('end', function () {
		done(con);
		con.end();
	});

	stream.on('error', function () {
		console.log('ERROR', arguments);
		done(con);
		con.end();
	});

	stream.end();
	console.log('Successfully Completed');
});
