var express  = require('express'),
    router   = express.Router(),
    path     = require('path'),
    execFile = require('child_process').execFile;

var options = {
    root: path.join(__dirname, 'public')
};

// GET home page.
router.get('/', function (req, res, next) {
    res.sendFile('/index.html', options, function (err) {
        if (err) {
            next(err);
        }
    });
});

// WOL
router.get('/wol', function (req, res, next) {
    execFile('/home/joeb/wol.sh', (err) => {
        if (err) {
            next(err);
        }
        else {
            res.sendFile('/pug.gif', options, (err) => {
                if (err) {
                    next(err);
                }
            });
        }
    });
});

// serve client scripts
router.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
router.use('/favicon', express.static(path.join(__dirname, 'public', 'favicon')));
router.use(express.static(path.join(__dirname, 'public')));

module.exports = router;