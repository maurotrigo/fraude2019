const debug = require('debug')('server');

const appConfig = require('../config/config.json')
const electores = require('./electores-mongodb');
const db = require('./database/database')();
const Utils = require('./utils');

const runElectores = (config, options) => {
	config = config || {
		start: 0,
		amount: 10
	};

	options = options || {};

	const host = options.host || 'host';
	const env = options.env || 'test';
	const exec = options.exec;
	let electoresFn = env === 'test' ? testCallback : electores;

	return electoresFn(config, host, exec)
		.then(() => {
			debug('Saving macro...');
			db.saveMacro({
				exec: exec,
				config: config
			})
				.then(() => {
					debug('Macro saved');
				})
				.catch((error) => {
					debug('Macro error');
					debug(error);
				});
		})
		.catch((error) => {
			debug('Error');
			debug(error);
		});
};

const runElectoresWithSteps = (config, options, steps) => {
	config = config || {
		start: 0,
		amount: 10
	};

	options = options || {};

	const host = options.host || 'host';
	const env = options.env || 'test';
	const exec = options.exec;
	let electoresFn = env === 'test' ? testCallback : electores;
	let stepConfigs = steps.stepConfigs;

	return Utils.executeSteps(stepConfigs, (currentStepConfig, result) => {
		debug(currentStepConfig);
		debug(result);
		return electoresFn(currentStepConfig, host, exec);
	})
		.then(() => {
			debug('Saving macro...');
			db.saveMacro({
				exec: exec,
				config: config
			})
				.then(() => {
					debug('Macro saved');
				})
				.catch((error) => {
					debug('Macro error');
					debug(error);
				});
		})
		.catch((error) => {
			debug('Error');
			debug(error);
		});
};

const testCallback = (config) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(config);
		}, 1000);
	});
};

module.exports = {
	runElectores,
	runElectoresWithSteps
};
