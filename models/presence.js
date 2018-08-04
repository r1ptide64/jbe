const app = require('../app');
const request = require('request');
const debug = require('debug')('jbe:presence');

const NUM_INACTIVE_OBSERVATIONS = 6 * 4;
const FETCH_INTERVAL = 10 * 1000;

const regex = new RegExp('^{arp_table:: (.*)}$', 'm');
const reqOptions = {
    uri: 'http://192.168.1.2/Status_Lan.live.asp',
    auth: {
        user: 'clb',
        pass: 'DereHeIs!'
    }
};
const items = app.manager.items.presence;

class Person {
    constructor(MAC, name) {
        this.MAC = MAC;
        this.name = name;
        this.item = items[name];
        this.inactiveCount = 0;
    }

    setActivityState(active) {
        debug(`setting activity state ${active} on ${this.name}...`);
        if (active) {
            this.inactiveCount = 0;
            this.item.setState('Home', 'presence');
        }
        else {
            if (++this.inactiveCount > NUM_INACTIVE_OBSERVATIONS) {
                this.item.setState('Away', 'presence');
            }
        }
    }
}
const people = [
    new Person('64:BC:0C:4E:EF:9F', 'josh'),
    new Person('64:BC:0C:65:78:B6', 'chelsea')
];

function handleResponse(err, resp, body) {
    if (err) {
        debug('error fetching data: ', err);
        return;
    }
    const match = regex.exec(body);
    if (!Array.isArray(match)) {
        debug('unable to parse active clients from router: ', body);
        return;
    }
    const data = match[1];
    people.forEach(person => {
        person.setActivityState(data.indexOf(person.MAC) > 0);
    });
}

(function fetchData() {
    debug('fetching data from router!');
    request.get(reqOptions, handleResponse);
    setTimeout(fetchData, FETCH_INTERVAL);
})();