const express = require('express');
const path = require('path');

const app = express();
// Порт будет взят из переменной окружения, как настроено в docker-compose.yml
const port = process.env.PORT || 3000;

// Настраиваем EJS как шаблонизатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Указываем, что статические файлы (css, js, картинки) лежат в папке 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.render('index');
});

// Маршрут для страницы оплаты
// Он принимает параметр 'plan' из URL (например, /payment?plan=pro)
app.get('/payment', (req, res) => {
    const plan = req.query.plan || 'unknown';
    res.render('payment', { plan: plan });
});

app.listen(port, () => {
    console.log(`Frontend server is running on http://localhost:${port}`);
});