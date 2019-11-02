const moment = require('moment');
const debug = require('debug')('cli');
var parseArgs = require('minimist');

const appConfig = require('../config/config.json')
const Utils = require('./utils');
const db = require('./database/database')();
const Api = require('./support/api');

const main = () => {
	let options = parseArgs(process.argv.slice(2));
	debug('options:', options);

	options.amount = options.amount || 10;

	const start = options.start || 0;
	let end = start + options.amount;
	let exec = options.exec || 'none';
	let hostKey = options.source || 'computo';
	const host = appConfig.hosts[hostKey];

	const api = new Api(host);
	let items = generateItems(start, end);

	let saveFn = db.saveElectorSimple;

	db.connectionPromise.then(() => {

		Utils.executeSteps(items, (item, result) => {
			return new Promise((resolve, reject) => {
				api.request(api.getElectorUrl(item))
					.then(function(body) {
						let data = parseData(item, body);

						if (!data) {
							debug('Invalid item: ' + item);
							return resolve();
						}

						debug(item);
						debug(data);
						return db.saveElectorSimple(data)
							.then(resolve)
							.catch(resolve);
					})
					.catch(resolve);
			});
		});
	});

	return;
};

const generateItems = (start, end) => {
	let items = [];

	for (var i = start; i <= end; i++) {
		items.push(i);
	}

	return items;
};

const parseData = (itemId, data) => {
	try {
		data = JSON.parse(data);

		if (!data || !data.listaMesa) {
			return null;
		}

		if (!data.listaMesa.length) {
			return null;
		} else {
			data.created_at = moment().toDate();
			data.ci = itemId;
			data.count = data.listaMesa.length;
			return data;
		}
	} catch (error) {
		return null;
	}
};

const testCallback = (config) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(config);
		}, 1000);
	});
};

main();
