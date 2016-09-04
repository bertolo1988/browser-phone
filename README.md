[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4511df6b57e54761bdbbfee823198094)](https://www.codacy.com/app/tiagobertolo/browser-telephone?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=bertolo1988/browser-telephone&amp;utm_campaign=Badge_Grade)
[![Build Status](https://travis-ci.org/bertolo1988/browser-telephone.svg?branch=master)](https://travis-ci.org/bertolo1988/browser-telephone)

# Browser Telephone

A real working telephone that uses [twilio](https://www.twilio.com/) services made in Javascript.

## Requirements

 - [npm](http://npmjs.org/)
 - [node](http://nodejs.org/)
 - [gulp](http://gulpjs.com/)
 - [mongodb](https://www.mongodb.com/)
 - [twilio account and app](https://www.twilio.com/)

## Installing

`npm install`

## Configuration

Create a file named config.js with the following format:

	var config = {
    	TWILIO_ACCOUNT_SID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    	TWILIO_AUTH_TOKEN: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    	MY_APP_SID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    	ERROR_VOICE_MESSAGE: 'Invalid number! You can not dial that sir!',
        CLIENT_NAME: 'the name twilio will use to identify you',
        CALLER_ID: 'some number recognized by your twilio app',
    	PORT: 1337,
    	TIMEOUT: 5000,
        DATABASE_ADDRESS: 'localhost:27017/bp-data'
	};
	module.exports = config;

## Running

First you need to make sure that your mongodb database is running.

Head to your mongodb instalation folder and run `mongod --dbpath="data_folder"` and then:

`npm start`

Demo page will be at `localhost:config.PORT/demo.html`

## Tests

`npm test`

## Tips

* Add contacts

While adding contacts you can define both fields like this: `name;number`.

The number must be 12 digits long and the name must be only characters.

This was done like this due to the fact that this phone can call normal phone numbers or names.

* Shortcuts

You can use `CTRL+SPACE` to start or end a call.







