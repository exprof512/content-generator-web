const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Load .env file from project dir

const app = express();
const port = process.env.PORT || 3000;

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to pass environment variables to all rendered templates
app.use((req, res, next) => {
    res.locals.API_BASE_URL = process.env.API_BASE_URL;
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/pricing', (req, res) => {
    res.render('pricing');
});

// New route for the account page
app.get('/account', (req, res) => {
    res.render('account');
});

// New pages for Privacy and Terms
app.get('/privacy', (req, res) => {
    res.render('privacy');
});

app.get('/terms', (req, res) => {
    res.render('terms');
});

app.get('/reset-password', (req, res) => {
    res.render('reset-password');
});

app.get('/auth/callback.html', (req, res) => {
    res.render('auth/callback');
});

app.listen(port, () => {
    console.log(`Frontend server is running on http://localhost:${port}`);
});