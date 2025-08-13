const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Load .env file from project dir

const app = express();
const port = process.env.PORT || 3000;

// Security Headers Middleware
app.use((req, res, next) => {
    // Content Security Policy - разрешаем CDN ресурсы
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://widget.cloudpayments.ru; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://widget.cloudpayments.ru; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: ${process.env.API_BASE_URL}; connect-src 'self' http://localhost:8080 https://api.openai.com https://generativelanguage.googleapis.com https://api.deepseek.com; frame-ancestors 'none';`);
    
    // X-Frame-Options - защита от clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options - предотвращение MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection - дополнительная защита от XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy - контроль передачи referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy - контроль доступа к API браузера
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
});

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to pass environment variables to all rendered templates
app.use((req, res, next) => {
    res.locals.API_BASE_URL = process.env.API_BASE_URL;
    res.locals.CLOUDPAYMENTS_PUBLIC_ID = process.env.CLOUDPAYMENTS_PUBLIC_ID;
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/pricing', (req, res) => {
    res.render('pricing');
});

app.get('/payment', (req, res) => {
    res.render('payment', { tariff: req.query.tariff });
});

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