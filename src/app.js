const restify = require('restify');
const debug = require('debug')('server');

const appConfig = require('../config/config.json')
const electores = require('./electores-mongodb');
const db = require('./database/database')();
const Utils = require('./utils');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

let errors = [];

const saveError = (error) => {
	if (error.length >= 10) {
		errors.pop();
	}
	errors.push(error);
}

server.get('/errors', (req, res, next) => {
	res.send(200, {
		errors: errors
	});
});

server.get('/status', (req, res, next) => {
	res.send(200, db.getStatus());
});

server.post('/electores', (req, res, next) => {
	const type = req.body.type || 'simple';

	if (type === 'simple') {
		return electoresSimple(req, res, next);
	} else {
		return electoresWithSteps(req, res, next);
	}
});

const electoresSimple = (req, res, next) => {
	const config = req.body.config || {
		start: 0,
		amount: 10
	};

	res.send(200, {
		config: config
	});

	let hostKey = req.body.config.source || 'computo';
	const host = appConfig.hosts[hostKey];

	const env = req.body.env || 'test';
	const exec = req.body.exec;
	let electoresFn = env === 'test' ? testCallback : electores;

	electoresFn(config, host, exec)
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
			saveError(error);
			debug(error);
		});

	next();
};

const electoresWithSteps = (req, res, next) => {
	const config = req.body.config || {
		start: 0,
		amount: 10,
		step: 1000
	};

	let steps = Utils.generateSteps(config);

	res.send(200, {
		config: config,
		steps: steps
	});

	let hostKey = req.body.config.source || 'computo';
	const host = appConfig.hosts[hostKey];

	let stepConfigs = steps.stepConfigs;

	const env = req.body.env || 'test';
	const exec = req.body.exec;
	let electoresFn = env === 'test' ? testCallback : electores;

	Utils.executeSteps(stepConfigs, (currentStepConfig, result) => {
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
			saveError(error);
			debug(error);
		});

	next();
};

const testCallback = (config) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(config);
		}, 1000);
	});
};

server.listen(80, () => {
  debug('%s listening at %s', server.name, server.url);
});