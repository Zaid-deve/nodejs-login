const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const cookieParser = require('cookie-parser');
const authenticate = require('../utils/authenticate');
const user = require('../models/user.js');
const formidable = require('formidable');
const path = require("path");

router.use(express.urlencoded({ extended: true }));

router.use(cookieParser());

// POST Route for Signup Form Submission
router.post('/signup', async (req, res) => {
    let errors = {};

    // Call the createUser method from the User model
    let result = await User.createUser(req.body);

    if (!result.success) {
        if (!result.usernameErr && !result.emailErr && !result.passErr) {
            errors.formErr = result.message || 'An error occured, please try again !';
        } else {
            errors = { ...result };
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.json({ success: false, ...errors });
    }

    res.cookie('authToken', result.token, {
        httpOnly: true,
        maxAge: Date.now() + 60
    })

    res.json({ success: true })
});

// POST Route for Login Form Submission
router.post('/login', async (req, res) => {
    let errors = {};

    const result = await User.login(req.body);

    if (!result.success) {
        if (!result.emailErr && !result.passErr) {
            errors.formErr = result.message || 'An error occured, please try again !';
        } else {
            errors = { ...result };
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.json({ success: false, ...errors });
    }

    res.cookie('authToken', result.token, {
        httpOnly: true,
        maxAge: Date.now() + 60
    })

    res.json({ success: true })
});

// profile update
router.post('/update/profile', authenticate, async (req, res) => {
    const form = new formidable.IncomingForm();
    const profilesDir = path.join(__dirname, '../public/profiles');
    form.uploadDir = profilesDir;
    form.keepExtentions = true;

    const parsed = await form.parse(req);
    if (!parsed[1].profileImage) {
        res.send('please select a profile image')
    }

    let us = await User.update('profile', parsed[1].profileImage, req.userId)
    if (us.success) {
        return res.redirect('/dashboard')
    }

    res.json(us);
})

// username update
router.post('/update/username', authenticate, async (req, res) => {
    const username = req.body?.username;
    if (username) {
        const update = await User.update('username', username, req.userId);
        if (!update.success) {
            res.json({ success: false, message: update.message || 'Failed to update, please try again' });
        }
    }

    res.redirect('/dashboard');
})

module.exports = router;
