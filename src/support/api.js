const requestPromise = require('request-promise-native');

class Api {

	constructor(host) {
		this.host = host;
		this.defaultRequestOptions = {
			method: 'get',
			gzip: true,
			headers: {
				'sec-fetch-mode': 'cors',
				'cookie': '__cfduid=d9dacdb48ce4820c66ef4833fbfffbd641569197372',
				'origin': 'https://trep.oep.org.bo',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US,en;q=0.9',
				'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
				'accept': '*/*',
				'referer': host + '/listaMesas.html',
				'authority': 'trep.oep.org.bo',
				'x-requested-with': 'XMLHttpRequest',
				'sec-fetch-site': 'same-origin',
				'content-length': '0',
				'content-type': 'application/json; charset=utf-8'
			}
		};
	}

	request(url, options) {
		options = options || this.getDefaultOptions();
		options.url = url;
		return requestPromise(options);
}

	getDefaultOptions() {
		return Object.assign({}, this.defaultRequestOptions);
	}

	getResulActaUrl(itemId, secondary) {
		let sufix = !secondary ? '1' : '2';
		return this.host + '/resul/resulActa/' + itemId + '/' + sufix;
	}

	getActaImageUrl(itemId) {
		return this.host + '/resul/imgActa/' + itemId + '1.jpg';
	}

	getElectorUrl(id) {
		return this.host + '/resul/mesaElector/' + id;
	}

}

module.exports = Api;
