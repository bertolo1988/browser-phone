var chromedriver = require("chromedriver");
var Webdriver = require("selenium-webdriver");
var test = require('selenium-webdriver/testing');
var By = Webdriver.By;
var Until = Webdriver.until;
var config = require('../config');
var BrowserPhoneServer = require("../server/browser-phone-server");
var should = require('should');
var mongoClient = require('mongodb').MongoClient;
var driver;

test.describe('Front end tests', function() {

    const ID = {
        number: 'number',
        log: 'log',
        addContact: {
            name: 'addContactNameInput',
            twilioId: 'addContactTwilioIdInput',
            number: 'addContactNumberInput',
            return: 'addContactReturnButton',
            save: 'addContactSaveButton'
        }
    };

    const CSS = {
        call: 'button.call',
        hangup: 'button.hangup',
        addContact: 'button.browser-phone-add-contact-button',
        addContactIcon: 'i.fa-plus',
        'mic': 'i.fa-microphone',
        'micSlash': 'i.fa-microphone-slash',
        firstSuggestion: '.tt-dataset-contacts > .tt-suggestion > .tt-highlight'
    };

    function loadDemoPage() {
        driver.get('localhost:' + config.PORT + '/demo.html');
        let logElement = driver.findElement(By.id(ID.log));
        driver.wait(Until.elementTextIs(logElement, 'Ready'), config.TIMEOUT, 'Could not locate "Ready"');
    }

    this.timeout(config.TIMEOUT);
    test.before(() => {
        chromedriver.start();
        driver = new Webdriver.Builder().withCapabilities(Webdriver.Capabilities.chrome()).build();
        BrowserPhoneServer.run(config);
    });
    test.after(() => {
        driver.quit();
        chromedriver.stop();
        BrowserPhoneServer.close();
    });
    test.beforeEach(loadDemoPage);

    test.describe('Static phone-browser tests', function() {

        test.it('should find all components', function(done) {
            driver.findElement(By.css(CSS.call)).isDisplayed();
            driver.findElement(By.css(CSS.hangup)).isDisplayed();
            driver.findElement(By.id(ID.number)).isDisplayed();
            driver.findElement(By.css(CSS.addContact)).isDisplayed();
            driver.findElement(By.id(ID.log)).getText().then((text) => {
                text.should.be.equal('Ready');
                done();
            });
        });

        test.it('should see a working phone number input', function(done) {
            let input = driver.findElement(By.id(ID.number));
            input.getAttribute('placeholder').then(function(placeholder) {
                placeholder.should.equal('Enter a phone number...');
                input.sendKeys('A');
                input.getAttribute('value').then(function(data) {
                    data.should.equal('A');
                    input.clear();
                    input.getAttribute('value').then(function(data) {
                        data.length.should.be.exactly(0);
                        done();
                    });
                });
            });
        });

        test.it('should see a disabled attribute in the hangup button, not in the call one', function(done) {
            driver.findElement(By.css(CSS.hangup)).getAttribute('disabled').then(function(value) {
                value.should.be.equal('true');
                driver.findElement(By.css(CSS.call)).getAttribute('disabled').then(function(value) {
                    should.not.exist(value);
                    done();
                });
            });
        });

        test.it('should see font awesome icons', function(done) {
            driver.findElement(By.css(CSS.mic)).isDisplayed();
            driver.findElement(By.css(CSS.micSlash)).isDisplayed();
            driver.findElement(By.css(CSS.addContactIcon)).isDisplayed();
            done();
        });

    });

    test.describe('Test contacts', function() {

        var database;

        test.before(function(done) {
            mongoClient.connect('mongodb://' + config.DATABASE_ADDRESS, function(err, db) {
                should.not.exist(err);
                should.exist(db);
                database = db;
                done();
            });
        });

        test.after(function() {
            database.close();
        });

        function addNewContact(user) {
            driver.findElement(By.css('.browser-phone-add-contact-button')).click();
            let nameElement = driver.findElement(By.id(ID.addContact.name));
            let twilioIdElement = driver.findElement(By.id(ID.addContact.twilioId));
            let numberElement = driver.findElement(By.id(ID.addContact.number));
            nameElement.sendKeys(user.name);
            twilioIdElement.sendKeys(user.twilioId);
            numberElement.sendKeys(user.number);
            driver.findElement(By.id(ID.addContact.save)).click();
            driver.switchTo().alert().dismiss();
        }

        function removeContact(name, done) {
            database.collection('contacts').remove({
                name
            }, function(err, doc) {
                should.not.exist(err);
                doc.result.ok.should.be.exactly(1);
                done();
            });
        }

        test.it('should be able to add a contact and see it as suggestion', function(done) {
            let user = {
                name: 'Uo Test User',
                twilioId: 'uotestuser',
                number: '123123123123'
            };
            addNewContact(user);
            let input = driver.findElement(By.id(ID.number));
            input.clear();
            input.sendKeys(user.name);
            driver.wait(Until.elementLocated(By.css(CSS.firstSuggestion)), config.TIMEOUT, 'Could not see the suggestion');
            driver.findElement(By.css(CSS.firstSuggestion)).getText().then(function(text) {
                text.should.be.equal(user.name);
                removeContact(user.name, done);
            });
        });

        test.it('should to use return button from add contact form', function(done) {
            driver.findElement(By.css(CSS.addContact)).click();
            driver.findElement(By.id(ID.addContact.return)).click();
            driver.wait(Until.elementLocated(By.id(ID.number)), config.TIMEOUT, 'Could not see number input!');
            done();
        });

    });

    test.describe('Test call', function() {

        //test disabled due to http://stackoverflow.com/questions/38832776/how-do-i-allow-chrome-to-use-my-microphone-programatically
        test.xit('should be able to call a number even if not valid', function(done) {
            let log = driver.findElement(By.id(ID.log));
            driver.findElement(By.id(ID.number)).sendKeys('123');
            driver.findElement(By.css(CSS.call)).click();
            driver.wait(Until.elementTextIs(log, 'Successfully established call'), config.TIMEOUT, 'Could not successfuly establish a call').then(function() {
                driver.findElement(By.css('button.hangup')).click();
                driver.wait(Until.elementTextIs(log, 'Call ended'), config.TIMEOUT, 'Could not successfuly establish a call').then(function() {
                    done();
                });
            });
        });

    });

});