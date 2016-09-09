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
                        let text = $('browser-phone #number').val();
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

BrowsePhoneModule.controller('BrowserPhoneController', ['$scope', 'BrowserPhoneService', 'BloodhoundEngineService', function($scope, BrowserPhoneService, BloodhoundEngineService) {
    function isValidName(val) {
        ///validates for a-z and A-Z and white space
        return /^[A-z ]+$/.test(val);
    }

    function isValidPhone(val) {
        //validates only numbers that are 12 digits long
        return /^\d+$/.test(val) && val.length === 12;
    }
    $scope.saveContact = function(inputData) {
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

BrowsePhoneModule.directive('browserPhone', ['BrowserPhoneService', 'BloodhoundEngineService', function(BrowserPhoneService, BloodhoundEngineService) {
    return {
        templateUrl: 'view/browser-phone.html',
        controller: 'BrowserPhoneController',
        link: function(scope, element, attr, ctrl) {
            let jqElement = $(element);
            scope.isAddContactMode = false;

            function setupShortcutKeys() {
                $(document).keydown(function(evt) {
                    if (evt.keyCode === 32 && evt.ctrlKey) {
                        evt.preventDefault();
                        let button = jqElement.find('.hangup').attr('disabled') != null ? jqElement.find('.call') : jqElement.find('.hangup');
                        button.click();
                    }
                });
            }

            function setupTypeahead() {
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

            function setupTwilio() {

                BrowserPhoneService.getCapabilityToken().then(function(resp) {
                    Twilio.Device.setup(resp.data.token, {
                        debug: true
                    });
                });

                function disableButton(selector) {
                    jqElement.find(selector).addClass('disabled');
                    jqElement.find(selector).prop('disabled', true);
                }

                function enableButton(selector) {
                    jqElement.find(selector).removeClass('disabled');
                    jqElement.find(selector).prop('disabled', false);
                }

                Twilio.Device.ready(function(device) {
                    jqElement.find('#log').text('Ready');
                    disableButton('.hangup');
                });

                Twilio.Device.error(function(error) {
                    jqElement.find('#log').text('Error: ' + error.message);
                    enableButton('.call');
                    disableButton('.hangup');
                });

                Twilio.Device.connect(function(conn) {
                    jqElement.find('#log').text('Successfully established call');
                    disableButton('.call');
                    enableButton('.hangup');
                });

                Twilio.Device.disconnect(function(conn) {
                    jqElement.find('#log').text('Call ended');
                    enableButton('.call');
                    disableButton('.hangup');
                });

                Twilio.Device.incoming(function(conn) {
                    jqElement.find('#log').text('Incoming connection from ' + conn.parameters.From);
                    conn.accept();
                });

            }

            setupTypeahead();
            setupShortcutKeys();
            setupTwilio();

            scope.call = function() {
                params = {
                    'phone': jqElement.find('#number').val()
                };
                Twilio.Device.connect(params);
            };

            scope.hangup = function() {
                Twilio.Device.disconnectAll();
            };

            scope.showAddContactForm = function() {
                scope.isAddContactMode = true;
            };

            scope.addContact = function() {
                scope.saveContact(jqElement.find('#number').val().split(';'));
            };
        }
    };
}]);
