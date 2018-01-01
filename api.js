var express = require('express');
var router  = express.Router();

router.get('/', function (req, res, next) {
    res.sendStatus(204);
});

module.export = router;