const moment = require('moment');

const debug = require('debug')('main');
const databaseDebug = require('debug')('database');
const errorDebug = require('debug')('error');
const parseDebug = require('debug')('parse');

const firebase = require('./firebase');
const Api = require('./api');

const feed = (start, limit) => {
	start = start || 0;
	limit = limit || 4;

	limit = start + limit;

	var result = [];

	for (var i = start; i <= limit; i++) {
		result.push(i);
	}

	return result;
};

const db = firebase.getFirestore();

const saveData = (itemId, data) => {
	databaseDebug('Saving', itemId);
	let docRef = db.collection('actas_1').doc('mesa-' + itemId);
	docRef.set(data);
};

const parseData = (itemId, data) => {
	try {
		data = JSON.parse(data);
		data = data.resulActa;
		data.img = api.getActaImageUrl(itemId);
		data.resul = data.resul.reduce(parseResults, {});
		return data;
	} catch (error) {
		parseDebug(error);
		return null;
	}
};

const parseResults = (memo, resulItem) => {
	memo[resulItem.sigla] = Number(resulItem.votos);
	return memo;
};

const saveRun = (start, amount, invalidItems) => {
	let runId = moment().format('lll');
	databaseDebug('Saving run: ' + runId);
	let end = start + amount;

	let docRef = db.collection('runs').doc(runId);
	let newRun = {
		start: start,
		end: end,
		invalidIds: invalidItems
	};
	docRef.set(newRun);

	newRun.id = runId;
	return newRun;
};

module.exports = (config, host) => {
	const api = new Api(host);

	return new Promise((resolve, reject) => {
		try {
			let items = [],
			promises = [],
			start = config.start,
			amount = config.amount;

			items = feed(start, amount);
			let invalidItems = [],
				promise;

			items.forEach(function(itemId) {
				debug('ITEM ID: ' + itemId);

				promise = api.request(api.getResulActaUrl(itemId))
					.then(function(body) {
						let data = parseData(itemId, body);
						if (data) {
							debug(data);
							saveData(itemId, data);
						} else {
							invalidItems.push(itemId);
						}
					})
					.catch(function(err) {
						errorDebug('err:', err);
					});

				promises.push(promise);

			});

			Promise.all(promises)
				.then(function() {
					debug('Finished.');
					debug('invalidItems:', invalidItems);
					let runResult = saveRun(start, amount, invalidItems);
					resolve(runResult);
				});
		} catch (error) {
			reject(error);
		}
	});
};
