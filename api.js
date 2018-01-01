var express = require('express');
var router  = express.Router();

router.get('/', function (req, resp, next) {
    res.sendStatus(204);
});

module.export = router;