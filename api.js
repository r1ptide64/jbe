var express           = require('express');
var router            = express.Router();
var debug             = require('debug')('jbe:api');
const {DialogflowApp} = require('actions-on-google');
var manager           = undefined;
const MIN_TEMPERATURE = 55;
const MAX_TEMPERATURE = 85;

//const


router.post('/', function (req, res) {
    debug(`received POST to API`);
    const app = new DialogflowApp({request: req, response: res});

    function confirmNumber(app) {
        if (app.data.failCount > 2) {
            app.tell('Error: kill all humans mode activated.');
            return;
        }

        function recollectNumber(app, msg) {
            app.data.failCount++;
            msg += ' Please try again.';
            app.ask(msg, ['Did you say something?', "I didn't hear you.", "Goodbye."]);
        }

        const temperature = parseFloat(app.getArgument('temperature'));

        if (isNaN(temperature)) {
            recollectNumber(app, "I don't think that's a number.");
        }
        else if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
            recollectNumber(app, "Temperature must be between 55 and 85.");
        }
        else if (temperature % 0.5 !== 0) {
            recollectNumber(app, "Temperature must be in half-degree units.");
        }
        else {
            debug(`Setting setpoint to ${temperature}`);
            manager.items.hvac.setpoint.setState(temperature, 'api');
            app.tell(`Error: temperature successfully set to ${temperature}.`);
        }
    }

    app.handleRequest(confirmNumber);
});

const setManager = function setManager(theManager) {
    manager = theManager;
};

module.exports = {router, setManager};