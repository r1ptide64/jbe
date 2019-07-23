const router = require('express').Router();
const debug = require('debug')('jbe:api-v2');
const util = require('util');

router.post('/login', function (req, res) {
    return res.redirect(util.format(
        '%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code',
        '/frontend', req.body.client_id,
        encodeURIComponent(req.body.redirect_uri), req.body.state));
});

router.get('/auth', function (req, res) {
    const responseurl = util.format('%s?code=%s&state=%s',
        decodeURIComponent(req.query.redirect_uri), 'xxxxxx',
        req.query.state);
    debug(responseurl);
    return res.redirect(responseurl);
});

router.post('/token', function (req, res) {
    const grantType = req.query.grant_type
        ? req.query.grant_type : req.body.grant_type;
    const secondsInDay = 86400; // 60 * 60 * 24

    let obj;
    if (grantType === 'authorization_code') {
        obj = {
            token_type: 'bearer',
            access_token: '123access',
            refresh_token: '123refresh',
            expires_in: secondsInDay,
        };
    } else if (grantType === 'refresh_token') {
        obj = {
            token_type: 'bearer',
            access_token: '123access',
            expires_in: secondsInDay,
        };
    }
    res.json(obj);
});

router.get('/tjson', function (req, res) {
    res.json(undefined);
});

module.exports = router;