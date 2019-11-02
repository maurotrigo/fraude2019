const debug = require('debug')('main');

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

const executeSteps = (steps, fn) => {
	let promises = [];
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

	return Promise.all(promises);
};

const executeRange = (start, end, fn) => {
	let promises = [];
	var stepPromise = new Promise((resolve) => { resolve(null); }),
		stepIndex = 0;
	while (stepIndex < end) {
		let currentIndex = stepIndex;
		stepPromise = stepPromise.then((result) => {
			return fn(currentIndex, result);
		});
		promises.push(stepPromise);
		stepIndex++;
	}

	return Promise.all(promises);
};

module.exports = {
	generateSteps,
	executeSteps
}
