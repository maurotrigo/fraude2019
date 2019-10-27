const moment = require('moment');

const debug = require('debug')('main');
const databaseDebug = require('debug')('database');
const errorDebug = require('debug')('error');
const parseDebug = require('debug')('parse');

const firebase = require('./firebase');
const Api = require('./api');

const db = firebase.getFirestore();

const saveData = (itemId, data) => {
	databaseDebug('Saving', itemId);
	let docRef = db.collection('electores').doc('elector-' + itemId);
	docRef.set(data);
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

const saveRun = (config, validItems, invalidItems) => {
	let runId = moment().format('lll');
	databaseDebug('Saving run: ' + runId);

	let docRef = db.collection('electores_runs').doc(runId);
	let newRun = {
		config: config,
		valid: validItems,
		invalid: invalidItems
	};
	docRef.set(newRun);

	newRun.id = runId;
	return newRun;
};

module.exports = function(config, host) {

	const api = new Api(host);

	let start = config.start || 0,
		amount = config.amount || 10,
		end = start + amount;
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
							saveData(itemId, data);
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
					let runResult = saveRun(config, validItemsCount, invalidItemsCount);
					resolve(runResult);
				});
		} catch (error) {
			reject(error);
		}
	});
};
