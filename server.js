var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var shortid = require('shortid');
var validURL = require('valid-url');
var dbURL = 'mongodb://test:test@ds019654.mlab.com:19654/url-shortener';

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

var PORT = process.env.PORT || 8080;

mongo.connect(dbURL, (err, db) => {
	if (err) throw err;
	
	
	console.log('connected to DB');
	app.listen(PORT, () => {
		console.log('Listening on port : ' + PORT);
	});
	
	var collection = db.collection('urls');
	
	app.get('/', (req, res) => {
		res.render('index');	
	});
	
	app.get('/:id', (req, res) => {
		collection.find({
			hash: req.params.id
		}).toArray((err, doc) => {
			if (err) throw err;
			if (doc.length === 1) {
				res.redirect(doc[0].url)	
			} else {
				res.end('this URL is not valid');
			}
		});
	});
	
	app.post('/posturl', (req, res) => {
		if(validURL.isUri(req.body.url)) {
			
			//When an user post an URL, we check if this URL already exists in the DB
			collection.find({
				url: req.body.url
			}).toArray((err, doc) => {
				if (err) throw err;
				
				//If it exists, we just send the link
				if (doc.length > 0) {
					res.render('link', {
			   			shortURL: 'http://' + req.headers.host + '/' + doc[0].hash,
			   			url: doc[0].url
			   		});
			   	//Else, we create an new entry before sending the link
				} else {
						collection.insert(
					   {
							hash: shortid.generate(),
							url: req.body.url
					   }, (err, result) => {
					   		if (err) throw err;
					   		res.render('link', {
					   			shortURL: 'http://' + req.headers.host + '/' + result.ops[0].hash,
					   			url: result.ops[0].url
					   		});
					   });		
				}
			});
			
		} else {
			res.render('error');
		}
	});
});