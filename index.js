const express = require('express');
const app = express();
const auth = require('./routes/auth');
const path = require('path');
const User = require('./models/user')
const cookieParser = require('cookie-parser');
const authenticate = require('./utils/authenticate');
const dotenv = require('dotenv');

dotenv.config();

app.set('view engine', 'ejs')
app.set('views', 'views');

app.use('/auth', auth);
app.use(express.json());
app.use(cookieParser());
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Login Home' });
})

app.get('/register', redirectLogedIn,(req, res) => {
    res.render('register');
})

app.get('/login', redirectLogedIn,(req, res) => {
    res.render('login');
})

app.get('/dashboard', authenticate, async (req, res) => {
    const userId = req.userId;
    const u = await User.getUser(userId);
    if (!u) {
        res.send('an error occured !');
    }
    res.render('dashboard', { user: u });
})

app.get('/logout', User.logout, (req, res) => {
    res.redirect('/login');
})

async function redirectLogedIn(req, res, next) {
    if (User.isUserLogedIn(req)) {
        try {
            const data = await User.verifyToken(req.cookies.authToken);
        } catch (error) {
            User.logout();
            return res.redirect('/login');
        }

        return res.redirect('/dashboard');
    }

    next()
}

app.listen(process.env.PORT || 5000, '127.0.0.1', () => {
    console.log('App running on `127.0.0.1:5000`')
})