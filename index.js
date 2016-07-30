var express = require('express'),
    router  = express.Router(),
    path    = require('path');

// GET home page.
router.get('/', function (req, res, next) {
    var options = {
        root: path.join(__dirname, 'public')
    };
    res.sendFile('/index.html', options, function (err) {
        if (err) {
            next(err);
        }
    });
});

// serve client scripts
router.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
router.use('/favicon', express.static(path.join(__dirname, 'public', 'favicon')));
router.use(express.static(path.join(__dirname, 'public')));

module.exports = router;