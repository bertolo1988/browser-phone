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

    this.addPrediction = function(contact) {
        bloodhoundEngine.add(contact.name + ', ' + contact.twilioId + ', ' + contact.number);
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

    function isValidContact(contact) {
        return contact != null && isValidName(contact.name) && (isValidPhone(contact.number) || contact.number.length == 0);
    }

    $scope.saveContact = function(contact) {
        if (isValidContact(contact)) {
            BrowserPhoneService.addContact(contact).then(function(resp) {
                if (resp.data === 'Contact added!') {
                    BloodhoundEngineService.addPrediction(contact);
                    $scope.hideAddContactForm();
                    $scope.clearAddContactForm();
                    window.alert('Contact added!');
                }
            }, function(error) {
                window.alert('Some error ocurred!');
            });
        } else {
            window.alert('Contact format was not valid!');
        }
    };

    $scope.hideAddContactForm = function() {
        $scope.isAddContactMode = false;
    };

    $scope.showAddContactForm = function() {
        $scope.isAddContactMode = true;
    };

    $scope.hideAddContactForm();

}]);

BrowsePhoneModule.directive('browserPhone', ['BrowserPhoneService', 'BloodhoundEngineService', function(BrowserPhoneService, BloodhoundEngineService) {
    return {
        templateUrl: 'view/browser-phone.html',
        controller: 'BrowserPhoneController',
        link: function(scope, element, attr, ctrl) {
            let jqElement = $(element);

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
                    let dialled = scope.getCallableNumber(jqElement.find('#number').val());
                    jqElement.find('#log').text('Successfully established call with ' + dialled);
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

            scope.getCallableNumber = function(contactString) {
                let result = contactString;
                if (contactString.indexOf(',') > -1) {
                    let data = contactString.split(',');
                    if (data[1].length > 0) {
                        result = data[1];
                    } else if (data[2].length > 0) {
                        result = data[2];
                    }
                }
                console.log(result);
                return result;
            };

            scope.call = function() {
                let numberValue = jqElement.find('#number').val();
                let callable = scope.getCallableNumber(numberValue);
                params = {
                    'phone': callable
                };
                Twilio.Device.connect(params);
            };

            scope.hangup = function() {
                Twilio.Device.disconnectAll();
            };

            scope.showAddContactForm = function() {
                scope.isAddContactMode = true;
            };

            scope.clearAddContactForm = function() {
                jqElement.find('#add-contact-form')[0].reset();
            };

            scope.addContact = function(contact) {
                scope.saveContact(contact);
            };
        }
    };
}]);
