var BrowsePhoneModule = angular.module('BrowsePhoneModule', []);

BrowsePhoneModule.service('BloodhoundEngineService', ['$location', function($location) {

    var bloodhoundEngine;

    this.initialize = function() {
        bloodhoundEngine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
                url: $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/contacts',
                filter(contacts) {
                    function containsNumberText(value) {
                        let text = $('browser-phone-directive #number').val();
                        return value.toLowerCase().includes(text.toLowerCase());
                    }
                    return contacts.filter(containsNumberText);
                }
            }
        });
        return bloodhoundEngine;
    };

    this.get = function() {
        return bloodhoundEngine;
    };

}]);

BrowsePhoneModule.service('BrowserPhoneService', ['$http', '$location', function($http, $location) {

    this.getCapabilityToken = function() {
        return $http({
            method: 'GET',
            url: $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/token'
        });
    };

    this.addContact = function(data) {
        return $http({
            method: 'POST',
            url: $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/addContact',
            data
        });
    };

}]);

BrowsePhoneModule.controller('BrowsePhoneController', ['$scope', 'BrowserPhoneService', 'BloodhoundEngineService', function($scope, BrowserPhoneService, BloodhoundEngineService) {

    BrowserPhoneService.getCapabilityToken().then(function(resp) {
        Twilio.Device.setup(resp.data.token, {
            debug: true
        });
    });

    function isValidName(val) {
        ///validates for a-z and A-Z and white space
        return /^[A-z ]+$/.test(val);
    }

    function isValidPhone(val) {
        //validates only numbers that are 12 digits long
        return /^\d+$/.test(val) && val.length === 12;
    }

    function disableButton(selector) {
        $(selector).addClass('disabled');
        $(selector).prop('disabled', true);
    }

    function enableButton(selector) {
        $(selector).removeClass('disabled');
        $(selector).prop('disabled', false);
    }

    Twilio.Device.ready(function(device) {
        $('browser-phone-directive #log').text('Ready');
        disableButton('browser-phone-directive .hangup');
    });

    Twilio.Device.error(function(error) {
        $('browser-phone-directive #log').text('Error: ' + error.message);
        enableButton('browser-phone-directive .call');
        disableButton('browser-phone-directive .hangup');
    });

    Twilio.Device.connect(function(conn) {
        $('browser-phone-directive #log').text('Successfully established call');
        disableButton('browser-phone-directive .call');
        enableButton('browser-phone-directive .hangup');
    });

    Twilio.Device.disconnect(function(conn) {
        $('browser-phone-directive #log').text('Call ended');
        enableButton('browser-phone-directive .call');
        disableButton('browser-phone-directive .hangup');
    });

    Twilio.Device.incoming(function(conn) {
        $('browser-phone-directive #log').text('Incoming connection from ' + conn.parameters.From);
        conn.accept();
    });

    $scope.call = function() {
        params = {
            'phone': $('browser-phone-directive #number').val()
        };
        Twilio.Device.connect(params);
    };

    $scope.hangup = function() {
        Twilio.Device.disconnectAll();
    };

    $scope.addContact = function() {
        let inputData = $('browser-phone-directive #number').val().split(';');
        var number = {};
        if (isValidName(inputData[0])) {
            number.name = inputData[0];
        }
        if (inputData.length > 1 && isValidPhone(inputData[1])) {
            number.phone = inputData[1];
        }
        BrowserPhoneService.addContact(number).then(function(resp) {
            if (resp.data === 'Contact added!') {
                BloodhoundEngineService.get().add([number.name]);
            }
        });
    };

}]);

BrowsePhoneModule.directive('browserPhone', ['BloodhoundEngineService', function(BloodhoundEngineService) {
    return {
        templateUrl: 'view/browser-phone.html',
        link: {
            post(scope, element) {
                let jqElement = $(element);
                $(document).keydown(function(evt) {
                    if (evt.keyCode === 32 && evt.ctrlKey) {
                        evt.preventDefault();
                        let button = jqElement.find('.hangup').attr('disabled') != null ? jqElement.find('.call') : jqElement.find('.hangup');
                        button.click();
                    }
                });
                jqElement.find('#number').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1
                }, {
                    name: 'contacts',
                    limt: 1,
                    source: BloodhoundEngineService.initialize()
                });
            }
        }
    };
}]);
