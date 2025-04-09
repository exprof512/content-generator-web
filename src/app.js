const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

// Конфигурация
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Переменные окружения
const API_URL = process.env.API_URL || 'http://localhost:8080';

// Роуты
app.get('/', (req, res) => {
  res.render('index', { 
    result: null,
    error: null
  });
});

app.post('/generate', async (req, res) => {
    try {
      const response = await axios.post(`${API_URL}/generate`, {
        prompt: req.body.prompt
      });
      res.json({ content: response.data.content });
    } catch (error) {
      console.error("Error calling Go backend:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Ошибка на сервере при обработке запроса';
      res.status(error.response?.status || 500).json({ error: errorMessage });
    }
  });

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});