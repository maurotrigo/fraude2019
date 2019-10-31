const restify = require('restify');
const debug = require('debug')('server');

const appConfig = require('../config/config.json')
const db = require('./database/database')();
const Utils = require('./utils');

const run = require('./run-electores');

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

	let runOptions = prepareRunOptions(req);
	run.runElectores(config, runOptions)
		.catch((error) => {
			saveError(error);
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

	let runOptions = prepareRunOptions(req);

	run.runElectoresWithSteps(config, runOptions, steps)
		.catch((error) => {
			saveError(error);
		});

	next();
};

const prepareRunOptions = (req) => {
	let hostKey = req.body.config.source || 'computo';
	const host = appConfig.hosts[hostKey];

	const env = req.body.env || 'test';
	const exec = req.body.exec;
	return {
		host: host,
		env: env,
		exec: exec
	};
};

server.listen(80, () => {
  debug('%s listening at %s', server.name, server.url);
});