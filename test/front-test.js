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

function loadDemoPage() {
    driver.get('localhost:' + config.PORT + '/demo.html');
    let logElement = driver.findElement(By.id('log'));
    driver.wait(Until.elementTextIs(logElement, 'Ready'), config.TIMEOUT, 'Could not locate "Ready"');
}

test.describe('Front end tests', function() {
    this.timeout(config.TIMEOUT);

    test.before(function() {
        chromedriver.start();
        driver = new Webdriver.Builder().withCapabilities(Webdriver.Capabilities.chrome()).build();
        BrowserPhoneServer.run(config);
    });

    test.beforeEach(loadDemoPage);

    test.after(function() {
        driver.quit();
        chromedriver.stop();
        BrowserPhoneServer.close();
    });

    test.describe('Static phone-browser tests', function() {

        test.xit('should find all components', function(done) {
            driver.findElement(By.css('button.call')).isDisplayed();
            driver.findElement(By.css('button.hangup')).isDisplayed();
            driver.findElement(By.id('number')).isDisplayed();
            driver.findElement(By.css('button.browser-phone-add-contact-button')).isDisplayed();
            driver.findElement(By.id('log')).getText().then((text) => {
                text.should.be.equal('Ready');
                done();
            });
        });

        test.xit('should see a working phone number input', function(done) {
            let input = driver.findElement(By.id('number'));
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

        test.xit('should see a disabled attribute in the hangup button, not in the call one', function(done) {
            driver.findElement(By.css('button.hangup')).getAttribute('disabled').then(function(value) {
                value.should.be.equal("true");
                driver.findElement(By.css('button.call')).getAttribute('disabled').then(function(value) {
                    should.not.exist(value);
                    done();
                });
            });
        });

        test.xit('should see font awesome icons', function(done) {
            driver.findElement(By.css('i.fa-microphone')).isDisplayed();
            driver.findElement(By.css('i.fa-microphone-slash')).isDisplayed();
            driver.findElement(By.css('i.fa-plus')).isDisplayed();
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

        test.it('should be able to add a contact and see it as suggestion', function(done) {
            driver.findElement(By.css('btn btn-success browser-phone-add-contact-button')).click();
            let name = driver.findElement(By.id('name'));
            let twilioId = driver.findElement(By.id('twilioId'));
            let number = driver.findElement(By.id('number'));
            name.sendKeys('Uo Test User');
            twilioId.sendKeys('uotestuser');
            number.sendKeys('351351351351');
            driver.findElement(By.id('save')).click();
            /*            let input = driver.findElement(By.id('number'));
                        let name = 'Ya';
                        let firstSuggestionSelector = '.tt-dataset-contacts > .tt-suggestion > .tt-highlight';
                        input.sendKeys(name + ';351145431491');
                        driver.findElement(By.css('button.browser-phone-add-contact-button')).click();
                        input.clear();
                        input.sendKeys(name.charAt(0));
                        driver.wait(Until.elementLocated(By.css('.tt-dataset-contacts > .tt-suggestion')), config.TIMEOUT, 'Could not see the suggestion');
                        driver.findElement(By.css(firstSuggestionSelector)).getText().then(function(text) {
                            text.should.be.equal(name.charAt(0));
                            database.collection('contacts').remove({
                                name
                            }, function(err, doc) {
                                should.not.exist(err);
                                doc.result.ok.should.be.exactly(1);
                                done();
                            });
                        });*/
        });

        test.xit('Should be able to use Return button in the add-contact-form', function(done) {

        });

    });

    test.describe('Test call', function() {

        //test disabled due to http://stackoverflow.com/questions/38832776/how-do-i-allow-chrome-to-use-my-microphone-programatically
        test.xit('should be able to call a number even if not valid', function(done) {
            let log = driver.findElement(By.id('log'));
            driver.findElement(By.id('number')).sendKeys('123');
            driver.findElement(By.css('button.call')).click();
            driver.wait(Until.elementTextIs(log, 'Successfully established call'), config.TIMEOUT, 'Could not successfuly establish a call').then(function() {
                driver.findElement(By.css('button.hangup')).click();
                driver.wait(Until.elementTextIs(log, 'Call ended'), config.TIMEOUT, 'Could not successfuly establish a call').then(function() {
                    done();
                });
            });
        });

    });

});