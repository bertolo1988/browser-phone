var twilio = require('twilio');
var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var should = require('should');
var bodyParser = require("body-parser");
var app = express();
var httpServer;

function buildTwimlResponse(query, callerId, errorMessage) {
    var response = new twilio.TwimlResponse();
    var phone = query.phone;

    if (!phone) {
        response.say(errorMessage, {
            voice: 'woman',
            language: 'en-gb'
        });
    } else if (!isNaN(phone)) {
        response.dial({ callerId }, (dial) => {
            dial.number(phone);
        });
    } else if (isNaN(phone)) {
        response.dial({ callerId }, (dial) => {
            dial.client(phone);
        });
    }
    return response.toString();
}

function launchServer(config, err, database) {
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/token', function(req, res) {
        var capability = new twilio.Capability(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        capability.allowClientOutgoing(config.MY_APP_SID);
        capability.allowClientIncoming(config.CLIENT_NAME);
        res.json({ token: capability.generate() });
    });

    app.get('/voice', function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/xml'
        });
        res.end(buildTwimlResponse(req.query, config.CALLER_ID, config.ERROR_VOICE_MESSAGE));
    });

    app.use('/', express.static('public'));

    //this route exists just because font-awesome needs the fonts folder by default
    //app.use('/fonts', express.static('public/dependencies'));

    app.get('/contacts', function(req, res) {
        database.collection('contacts').find({}, { name: 1, number: 1, _id: 0 }).toArray(function(err, doc) {
            should.not.exist(err, 'Error: there was a problem while trying to retrieve contacts!');
            let results = [];
            for (let obj of doc) {
                if (obj.name != null) {
                    results.push(obj.name);
                }
            }
            res.json(results);
        });
    });

    app.post('/addContact', function(req, res) {
        database.collection('contacts').insert(req.body, function(err, response) {
            should.not.exist(err, 'Error: there was a problem while adding new contact!');
            response.result.ok.should.be.equal(1);
            res.end('Contact added!');
        });
    });

    httpServer = app.listen(config.PORT);
    console.log('  Server running at http://localhost:' + config.PORT + '/');
}


function close() {
    httpServer.close();
    console.log('  bye');
}

function run(args) {
    var config = args;
    mongoClient.connect('mongodb://' + config.DATABASE_ADDRESS, function(err, database) {
        should.not.exist(err, 'You should launch the phone-browser database!');
        launchServer(config, err, database);
    });
}


module.exports.close = close;
module.exports.run = run;
