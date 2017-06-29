var request = require("request");
var fs = require('fs');
var Twit = require('twit');
var _ = require('lodash');

process.on('uncaughtException', function (err) {
	console.log(err);

});

//Twitter Authentication
var T = new Twit({
		consumer_key: "",
		consumer_secret: "",
		access_token: "",
		access_token_secret: ""
	});

var stream = T.stream('statuses/filter', {
		track: 'ferret'
	});

stream.on('connected', function (response) {
	console.log("Connected to Twitter stream.");
	main();
});

function main() {
	getFerret();
	setTimeout(function () {
		main()
	}, 84400000); //Wait time in ms
};

function getFerret() {

	var url = "http://polecat.me/api/ferret"

		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (error)
				throw error;

			if (!error && response.statusCode === 200) {
				console.log(body.url);
				var ferret = body.url;

				//Get filename from url regex
				var filename = ferret;

				var re1 = '(imgur\\.com)'; // Fully Qualified Domain Name 1
				var re2 = '(\\/)'; // Any Single Character 1
				var re3 = '((?:[a-z0-9][a-z\\.\\d_]+)\\.(?:[a-z\\d]{3}))(?![\\w\\.])'; // File Name 1

				var p = new RegExp(re1 + re2 + re3, ["i"]);
				var m = p.exec(filename);
				if (m != null) {
					var fqdn1 = m[1];
					var c1 = m[2];
					var file1 = m[3];

					filename = m[3];
					console.log("Filename: " + filename);
				}

				download(ferret, filename, function () {
					console.log('Done downloading..');

					//Read ferret
					var b64content = fs.readFileSync('./images/ferrets/' + filename, {
							encoding: 'base64'
						});

					//Post ferret to twitter
					T.post('media/upload', {
						media_data: b64content
					}, function (err, data, response) {
						if (err)
							throw err;

						var mediaIdStr = data.media_id_string;
						var params = {
							status: '#Ferret #Ferrets ' + ferret,
							media_ids: [mediaIdStr]
						}

						T.post('statuses/update', params, function (err, data, response) {
							if (err)
								throw err;
							console.log("Posted: " + data.text);
						});

					});

				});

			}
		});
};

var download = function (uri, filename, callback) {

	request.head(uri, function (err, res, body) {
		if (err)
			throw err;

		var r = request(uri).pipe(fs.createWriteStream('./images/ferrets/' + filename));
		r.on('close', callback);
	});
};
