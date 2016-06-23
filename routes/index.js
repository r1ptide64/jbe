var express = require('express');
var mongoose = require('mongoose');
require('../models/switches.js');
var JoebSwitch = mongoose.model('JoebSwitch');
var HvacModel = require('../models/hvac.js');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
    var options = {
        root: path.join(__dirname, '..', 'views')
    };
    res.sendFile('/index.html', options, function (err) {
        if (err) {
            next(err);
        }
    });
});

router.route('/hvac')
.get(function (req, res, next) {
    HvacModel.findById(1, function (err, hvacState) {
        if (err) {
            next(err);
        }
        else {
            res.json(hvacState);
        }
    });
})
.post(function (req, res, next) { 
    HvacModel.findById(1, function (err, hvacState) {
        if (err) {
            next(err);
        }
        else {
            console.log(req.body);
            hvacState.setpoint = req.body.setpoint;
            hvacState.mode = req.body.mode;
            hvacState.save(function (err) {
                if (err) {
                    next(err);
                }
                else {
                    res.json(hvacState);
                }
            });
        }
    });
});

router.get('/items', function (req, res, next) {
    JoebSwitch.find( function (err, items) {
        if (err) {
            next(err);
        }
        else {
            res.json(items);
        }
    });
});

router.param('id', function (req, res, next, id) {
    //console.log('in param fn!');
    //console.log(id);
    var query = JoebSwitch.findById(id);
    query.exec(function (err, item) {
        //console.log('in query!');
        //console.log(item);
        if (err) {
            next(err);
        }
        else if(!item) {
            next(new Error('item not found'));
        }
        else {
            req.item = item;
            //console.log('in param fn!');
            //console.log(item);
            next();
        }
    });
});

router.get('/items/:id', function (req, res) { 
    res.json(req.item);
});

router.post('/items/:id', function (req, res, next) {
    console.log(req.body);
    console.log(req.item);
    req.item.state = req.body.state;
    req.item.save(function (err) {
        if (err) {
            next(err);
        }
        else {
            res.json(req.item);
        }
    });
});

module.exports = router;