const jsonfile = require('jsonfile')
const debug = require('debug')('json-db');

module.exports = {

	write: (data, file) => {
		jsonfile.writeFile(file, data, function (err) {
			if (err) {
				debug(err);
			}
		});
	}

};