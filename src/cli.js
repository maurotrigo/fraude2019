const debug = require('debug')('cli');
var parseArgs = require('minimist');

const appConfig = require('../config/config.json')
const Utils = require('./utils');
const db = require('./database/database')();

const run = require('./run-electores');

const main = () => {
	let options = parseArgs(process.argv.slice(2));
	db.connectionPromise.then(() => {
		if (options.type === 'simple') {
			return electoresSimple(options);
		} else {
			return electoresWithSteps(options);
		}
	});
};

const electoresSimple = (options) => {
	const config = {
		start: options.start,
		amount: options.amount
	};

	debug({
		config: config
	});

	let runOptions = prepareRunOptions(config);
	run.runElectores(config, runOptions);
};

const electoresWithSteps = (options = {}) => {
	const config = {
		start: options.start,
		amount: options.amount,
		step: options.step || 10
	};
	let steps = Utils.generateSteps(config);

	debug({
		config: config,
		steps: steps
	});

	let runOptions = prepareRunOptions(config);

	run.runElectoresWithSteps(config, runOptions, steps);
};

const prepareRunOptions = (options = {}) => {
	let hostKey = options.source || 'computo';
	const host = appConfig.hosts[hostKey];

	const env = options.env || 'test';
	const exec = options.exec;
	return {
		host: host,
		env: env,
		exec: exec
	};
};

main();
