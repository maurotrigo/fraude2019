const moment = require('moment');

const debug = require('debug')('main');
const databaseDebug = require('debug')('database');
const errorDebug = require('debug')('error');
const parseDebug = require('debug')('parse');

const Database = require('./database');
const Api = require('./api');

const db = new Database();


const saveData = (itemId, data) => {
	databaseDebug('Saving', itemId);
	db.saveElector(data);
};

const parseData = (itemId, data) => {
	try {
		data = JSON.parse(data);
		data.listaMesa = data.listaMesa || [];
		if (!data.listaMesa.length) {
			return null;
		} else {
			data.created_at = moment().toDate();
			data.ci = itemId;
			data.count = data.listaMesa.length;
			return data;
		}
	} catch (error) {
		parseDebug(error);
		return null;
	}
};

const saveRun = (config, validItems, invalidItems, execId) => {
	let runId = moment().format('lll');
	databaseDebug('Saving run: ' + runId);

	let newRun = {
		execId: execId,
		config: config,
		valid: validItems,
		invalid: invalidItems,
		created_at: moment().toDate()
	};

	db.saveElectoresRun(newRun);

	return newRun;
};

module.exports = function(config, host, execId) {
	execId = execId || 'local';

	const api = new Api(host);

	let start = config.start || 0,
		amount = config.amount || 10,
		end = start + amount;
	let collection = [];
	return new Promise((resolve, reject) => {
		try {

			let promises = [],
				validItemsCount = 0,
				invalidItemsCount = 0,
				promise;

			for (let itemId = start; itemId < end; itemId++) {
				debug('Elector ID: ' + itemId);

				promise = api.request(api.getElectorUrl(itemId))
					.then(function(body) {
						let data = parseData(itemId, body);
						if (data) {
							debug(data);
							validItemsCount++;
							collection.push(data);
						} else {
							invalidItemsCount++;
						}
					})
					.catch(function(err) {
						errorDebug('err:', err);
					});

				promises.push(promise);
			}

			Promise.all(promises)
				.then(function() {
					debug('Finished.');
					debug('invalidItemsCount:', invalidItemsCount);

					db.saveElectores(collection);

					let runResult = saveRun(config, validItemsCount, invalidItemsCount, execId);
					resolve(runResult);
				})
				.catch(function(err) {
					errorDebug('err:', err);
					reject(err);
				});
		} catch (error) {
			reject(error);
		}
	});
};
