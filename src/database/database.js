const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('db');
const moment = require('moment');

const appConfig = require('../../config/config.json')

class Database {

	constructor() {
		const url = appConfig.mongodb.dbURI || 'mongodb://localhost:27017';
		const client = new MongoClient(url, { useUnifiedTopology: true });
		const dbName = 'f-2019';

		client.connect((err) => {
			if (err) {
				debug(err);
			} else {
				debug('DB ' + dbName + ' connected!');
				this.db = client.db(dbName);
			}
			client.close();
		});
	}

	saveElectores(electoresCollection) {
		if (!electoresCollection.length) {
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {
			let col = this.db.collection('electores');

			col.insertMany(electoresCollection, (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	saveRun(electoresRun) {
		return new Promise((resolve, reject) => {
			let col = this.db.collection('electores_run');

			col.insertOne(electoresRun, (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	saveMacro(data) {
		return new Promise((resolve, reject) => {
			let macroId = moment().format('lll');
			debug('Saving macro ' + macroId);
			let col = this.db.collection('macros');
			col.insertOne({
				created_at: moment().toDate(),
				data: data
			}, (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

}

module.exports = Database;