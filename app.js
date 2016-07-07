var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('jbe:app');
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/test');
//var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
//db.once('open', function () {
//    debug('connected to database!');
//});
//var HvacSchema = mongoose.Schema({
//    _id: Number,
//    mode: String,
//    setpoint: Number,
//    temperature: Number,
//    humidity: Number
//});

//var HvacModel = mongoose.model('hvac', HvacSchema);

//var query = HvacModel.findById(1);
//query.exec(function (err, doc) {
//    debug('in test find by id!');
//    if (!err) {
//        debug('got doc!');
//        debug(doc);
//    }
//});
//var tester = require('./models/items.js');
//tester.on('mqttIn', function (newState) {
//    debug('mqtt in! newstate below...');
//    debug(newState);
//});

//var mqtt = require('mqtt');
//var mongoose = require('mongoose');
//require('./models/switches.js');
//mongoose.connect('mongodb://localhost/test');
//var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));

//db.once('open', function () {
//    debug('connected to database!');
//});

var routes = require('./routes/index');
//var users = require('./routes/users');

//var tstAry = require('./models/test.js');
//for (var i = 0; i < tstAry.length; i++) {
//    tstAry[i].print();
//}
//var client = mqtt.connect('mqtt://192.168.1.200:1883');
//client.on('connect', function () {
//    var topics = [
//        'home/gf-therm/humidity/humidity',
//        'home/gf-therm/temperature/temperature',
//        'home/+/+/on'
//    ];
//    client.subscribe(topics, function (err, granted) {
//        if (err) {
//            console.error(err);
//        }
//        else {
//            debug('subscribed to relevant MQTT topics!');
//        }
//    });
//});

//var maxAryLength = 5;
//var averager = {
//    ary: [],
//    val: 0,
//    push: function (obs) {
//        if (this.ary.push(obs) > maxAryLength) {
//            this.ary.shift();
//        }
//        var i;
//        for (i = 0, this.val=0; i < this.ary.length; i++) {
//            this.val += this.ary[i];
//        }
//        this.val /= this.ary.length;
//        return this.val;
//    }
//};

//client.on('message', function (topic, message) {
//    debug('got message on topic ' + topic);
//    if (topic.search("temperature") >= 0) {
//        var rawTmp = Number(message.toString());
//        if (!isNaN(rawTmp)) {
//            averager.push(rawTmp);
//            debug(averager.val);
//        }
//    }
//});

//var mySwitch = items.switches[0];
//mySwitch.on('err', function (err) {
//    debug('error in app.js: ' + err);
//});
//mySwitch.on('update', function (newVal, oldVal, source) {
//    debug('update in app.js! newval: ' + newVal + ", oldval: " + oldVal + "  (from " + source + ")");
//});
//mySwitch.on('change', function (newVal, oldVal, source) {
//    debug('change in app.js! newval: ' + newVal + ", oldval: " + oldVal + "  (from " + source + ")");
//});
var app = express();
app.items = require('./models/items.js');
debug('app.items = ' + JSON.stringify(app.items, null, '\t'));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'views')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

//app.use('/', function (req, res, next) {
//    debug('request to root!');
//    debug(tester.doc);
//    next();
//});

app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;