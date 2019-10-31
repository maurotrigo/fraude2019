const moment = require('moment');

const debug = require('debug')('main');
const errorDebug = require('debug')('error');
const parseDebug = require('debug')('parse');

const electoresDB = require('./database/database')();

const Api = require('./support/api');

const NO_RESULT = -1,
	REQUEST_ERROR = -2;
const parseData = (itemId, data) => {
	try {
		data = JSON.parse(data);

		if (!data.listaMesa) {
			return REQUEST_ERROR;
		}

		data.listaMesa = data.listaMesa || [];

		if (!data.listaMesa.length) {
			return NO_RESULT;
		} else {
			data.created_at = moment().toDate();
			data.ci = itemId;
			data.count = data.listaMesa.length;
			return data;
		}
	} catch (error) {
		parseDebug(error);
		return REQUEST_ERROR;
	}
};

module.exports = function(config, host, execId) {

	const api = new Api(host);

	let start = config.start || 0,
		amount = config.amount || 10,
		end = start + amount;
	return new Promise((resolve, reject) => {
		try {

			let promises = [],
				collection = [],
				errors = 0,
				validItemsCount = 0,
				invalidItemsCount = 0,
				promise;

			for (let itemId = start; itemId < end; itemId++) {
				debug('Elector ID: ' + itemId);

				promise = api.requestWithTimeout(api.getElectorUrl(itemId), {}, 8)
					.then(function(body) {
						let data = parseData(itemId, body);

						switch (data) {

							case REQUEST_ERROR: {
								electoresDB.reportError(body);
								errors++;
								break;
							}

							case NO_RESULT: {
								invalidItemsCount++;
								break;
							}

							default: {
								debug(data);
								collection.push(data);
								validItemsCount++;
							}

						}

					})
					.catch(function(err) {
						errors++;
						errorDebug('err:', err);
					});

				promises.push(promise);
			}

			Promise.all(promises)
				.then(function() {
					debug('Finished.');
					debug('invalidItemsCount:', invalidItemsCount);

					debug('Saving electores...');
					electoresDB.saveElectores(collection)
						.then(() => {
							debug('Electores saved!');
						})
						.catch(reject);

					let runResult = electoresDB.saveRun({
						config: config,
						valid: validItemsCount,
						invalid: invalidItemsCount,
						errors: errors,
					});
					resolve(runResult);
				})
				.catch(reject);
		} catch (error) {
			electoresDB.reportError(error);
			reject(error);
		}
	});
};