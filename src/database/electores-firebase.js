const moment = require('moment');
const databaseDebug = require('debug')('database');

const firebase = require('./firebase');
const db = firebase.getFirestore();

const reportError = (error) => {
	let runId = moment().unix();
	let docRef = db.collection('electores').doc(runId);
	docRef.set({
		created_at: moment().toDate(),
		error: error
	});
};

const saveData = (itemId, execId, data) => {
	databaseDebug('Saving', itemId);
	let docRef = db.collection('electores').doc('elector-' + itemId);
	docRef.set(data);
};

const saveRun = (newRun) => {
	let runId = moment().format('lll');
	databaseDebug('Saving run: ' + runId);

	let docRef = db.collection('electores_runs').doc(runId);
	docRef.set(newRun);

	newRun.id = runId;
	return newRun;
};

module.exports = {
	reportError,
	saveData,
	saveRun
};