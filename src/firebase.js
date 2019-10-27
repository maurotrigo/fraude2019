const serviceAccount = require('../config/serviceAccountKey.json');
const config = require('../config/config.json');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.databaseURL
});

module.exports = {

	getFirestore: function() {
		return admin.firestore();
	}

};
