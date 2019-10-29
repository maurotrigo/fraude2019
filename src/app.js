const restify = require('restify');
const debug = require('debug')('server');

const appConfig = require('../config/config.json')
const electores = require('./electores');
const utils = require('./utils');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.post('/electores', (req, res, next) => {
	const config = req.body.config || {
		start: 0,
		amount: 10,
		step: 1000
	};

	let hostKey = req.body.config.source || 'computo';

	const host = appConfig.hosts[hostKey];

	let steps = generateSteps(config);

	res.send(200, {
		config: config,
		steps: steps
	});

	let stepConfigs = steps.stepConfigs;

	const env = req.body.env || 'test';
	const exec = req.body.exec;
	let electoresFn = env === 'test' ? testCallback : electores;

	executeSteps(stepConfigs, (currentStepConfig, result) => {
		debug(currentStepConfig);
		debug(result);
		return electoresFn(currentStepConfig, host, exec);
	})
		.then(() => {
			debug('Saving macro...');
			utils.saveMacro({
				exec: exec,
				config: config
			});
		});

	next();
});

const executeSteps = (steps, fn) => {
	let promises = [];
	return new Promise((resolve, reject) => {
		var stepPromise = new Promise((resolve) => { resolve({ message: 'INIT' }); }),
			stepIndex = 0;
		while (stepIndex < steps.length) {
			let currentStep = steps[stepIndex];
			stepPromise = stepPromise.then((result) => {
				return fn(currentStep, result);
			});
			promises.push(stepPromise);
			stepIndex++;
		}

		Promise.all(promises).then(resolve);
	});
};

const generateSteps = (config) => {
	let start = config.start || 0,
		amount = config.amount || 10,
		step = config.step,
		end = start + amount,
		stepConfig,
		steps = amount / step;

	steps = steps > 0 ? Math.ceil(steps) : 1;
	step = amount > step ? step : amount;

	let stepStart = start,
		stepAmount,
		stepConfigs = [];

	for (var i = 0; i < steps; i++) {
		debug('i: ' + i);
		stepAmount = stepStart + step > end ? end - stepStart : step;

		stepConfig = {
			start: stepStart,
			amount: stepAmount
		};

		debug('step');
		debug(stepConfig);
		stepConfigs.push(stepConfig);

		stepStart += step;
	}
	debug('steps: ' + steps);
	debug('step: ' + step);
	debug('stepConfigs: ', stepConfigs);

	return {
		steps: steps,
		end: end,
		step: step,
		stepConfigs: stepConfigs
	}
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