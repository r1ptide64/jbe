var express = require('express');
var router  = express.Router();
var debug   = require('debug')('jbe:api');

router.get('/', function (req, res, next) {
    res.sendStatus(204);
});

router.post('/', function (req, res, next) {
    debug(JSON.stringify(req.body, null, '\t'));
    res.sendStatus(204);
});

module.exports = router;