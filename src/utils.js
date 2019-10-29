const moment = require('moment');
const debug = require('debug')('macro');
const firebase = require('./firebase');

const db = firebase.getFirestore();

const saveMacro = (data) => {
	let macroId = moment().format('lll');
	debug('Saving macro ' + macroId);
	let docRef = db.collection('macros').doc(macroId);
	docRef.set({
		created_at: moment().toDate(),
		data: data
	});
};

module.exports = {
	saveMacro
};