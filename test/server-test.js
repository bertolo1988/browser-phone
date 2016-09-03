var config = require('../config');
var BrowserPhoneServer = require("../server/browser-phone-server");
var supertest = require('supertest');
var request = supertest('http://localhost:' + config.PORT);
var should = require('should');
var mongoClient = require('mongodb').MongoClient;
var database;

describe('Server tests', function() {
    this.timeout(config.TIMEOUT);

    before(function(done) {
        BrowserPhoneServer.run(config);
        mongoClient.connect('mongodb://' + config.DATABASE_ADDRESS, function(err, db) {
            should.not.exist(err);
            should.exist(db);
            database = db;
            done();
        });
    });

    after(function() {
        BrowserPhoneServer.close();
        database.close();
    });

    describe('test route /voice', function() {
        it('should get a default message from /voice', function(done) {
            request
                .get('/voice')
                .expect(200)
                .expect('content-type', 'text/xml')
                .expect(function(res) {
                    res.text.includes(config.ERROR_VOICE_MESSAGE).should.be.true();
                })
                .end(done);
        });
        it('should get a number dial /voice?phone=123', function(done) {
            request
                .get('/voice?phone=123')
                .expect(200)
                .expect('content-type', 'text/xml')
                .expect(function(res) {
                    res.text.includes('<Number>123</Number>').should.be.true();
                    res.text.includes('callerId="' + config.CALLER_ID + '"').should.be.true();
                })
                .end(done);
        });
        it('should get a client dial /voice?phone=AAA', function(done) {
            request
                .get('/voice?phone=AAA')
                .expect(200)
                .expect('content-type', 'text/xml')
                .expect(function(res) {
                    res.text.includes('<Client>AAA</Client>').should.be.true();
                    res.text.includes('callerId="' + config.CALLER_ID + '"').should.be.true();
                })
                .end(done);
        });
    });

    describe('test route /token', function() {
        it('should get a response from /token', function(done) {
            request
                .get('/token')
                .expect(200)
                .expect('content-type', 'application/json; charset=utf-8')
                .expect(function(res) {
                    let response = JSON.parse(res.text);
                    should.exist(response);
                })
                .end(done);
        });
    });

    describe('test contacts feature routes: /contacts and /addContact', function() {

        function removePhoneByName(name) {
            database.collection('contacts').remove({ name }, function(err, doc) {
                should.not.exist(err);
                res.result.ok.should.be.exactly(1);
            });
        }

        function checkForContact(contact, done) {
            request
                .get('/contacts')
                .expect(200)
                .expect('content-type', 'application/json; charset=utf-8')
                .expect(function(res) {
                    res.text.includes(contact.name).should.be.true();
                    removePhoneByName(contact.name);
                })
                .end(done);
        }

        it('should be able to retrieve data from /contacts', function(done) {
            let contact = { name: 'Martucho', number: '351911722348' };
            database.collection('contacts').insert(contact);
            checkForContact(contact, done);
        });

        it('should insert a contact and confirm in /contacts', function(done) {
            let contact = { name: 'Lauren', number: '351911712348' };
            request
                .post('/addContact')
                .send(contact)
                .end(function(err, res) {
                    should.not.exist(err);
                    checkForContact(contact, done);
                });
        });
    });

});
