const User = require('../models/user');

async function authenticate(req, res, next) {
    if (User.isUserLogedIn(req)) {
        const data = await User.authenticate(req);

        if (!req.isAuthenticated) {
            res.redirect('/login');
            return;
        }

        req.userId = data.userId;
        req.tokenExp = data.exp;

        if (!req.userId) {
            return res.redirect('/login');
        }

        if(next){
            return next();
        }
    }

    res.redirect('/login');
}

module.exports = authenticate;
