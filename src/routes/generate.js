// routes/generate.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

router.post('/', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'Промпт не должен быть пустым' });

  try {
    const response = await axios.post(`${API_URL}/generate`, { prompt });
    res.json({ content: response.data.content });
  } catch (error) {
    const message = error.response?.data?.error || 'Ошибка на сервере';
    res.status(error.response?.status || 500).json({ error: message });
  }
});

module.exports = router;
