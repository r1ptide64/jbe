var mongoose = require('mongoose'),
    debug    = require('debug')('jbe:db'),
    app      = require('../app');

const dbName = app.isPrd ?
    'prd' :
    'test';

debug('opening connection to %s...', dbName);
mongoose.connect('mongodb://192.168.1.200/' + dbName);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', debug.bind(debug, 'connected to database!'));

var ItemSchema = mongoose.Schema({
    _id       : String,
    state     : mongoose.Schema.Types.Mixed,
    lastChange: Date,
    lastUpdate: Date
});
var ItemModel = mongoose.model('item', ItemSchema);

function DB(item) {
    if (!item) return;

    ItemModel.findById(item.id, function (err, doc) {
        if (err) {
            item.emit('error', err);
        }
        else if (doc === null) {
            doc = new ItemModel({
                _id       : item.id,
                state     : item.state,
                lastUpdate: item.lastUpdate,
                lastChange: item.lastChange
            });
            doc.save(function saveDoc(err, product) {
                if (err) {
                    item.emit('err', err);
                }
                else {
                    docReady(item, product);
                }
            });
        }
        else {
            item.state = doc.state;
            item.lastUpdate = doc.lastUpdate;
            item.lastChange = doc.lastChange;
            docReady(item, doc);
        }
    });
};

function docReady(item, doc) {
    item.on('update', function saveDoc(newState, oldState, source) {
        if (source === 'db') return;

        var now = Date.now();
        doc.lastUpdate = now;

        if (newState !== oldState) {
            doc.lastChange = now;
            doc.state = newState;
        }

        doc.save(function (err) {
            if (err) {
                item.emit('error', err);
            }
        });
    });
}

module.exports = DB;