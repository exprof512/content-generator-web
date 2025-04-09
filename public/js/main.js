document.addEventListener('DOMContentLoaded', () => {
  // --- Глобальные переменные
  let history = JSON.parse(localStorage.getItem('contentHistory')) || [];
  let darkMode = localStorage.getItem('darkMode') === 'true';

  const el = id => document.getElementById(id);

  const generateButton = el('generateButton');
  const promptTextarea = el('prompt');
  const resultDiv = el('result');
  const outputDiv = el('output');
  const statsDiv = el('output-stats');
  const loaderDiv = el('loader');
  const errorDiv = el('errorMessage');
  const historyModal = el('historyModal');
  const historyListDiv = el('historyList');
  const themeIcon = el('theme-icon');
  const themeText = el('theme-text');

  // --- Инициализация
  initTheme();
  renderHistory();
  setupTemplateListeners();

  // --- Темная тема
  window.toggleDarkMode = () => {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    updateTheme();
  };

  function initTheme() {
    updateTheme();
  }

  function updateTheme() {
    document.documentElement.classList.toggle('dark', darkMode);
    if (themeIcon && themeText) {
      themeIcon.textContent = darkMode ? '☀️' : '🌙';
      themeText.textContent = darkMode ? 'Светлая тема' : 'Тёмная тема';
    }
  }

  // --- Шаблоны
  const templatePrompts = {
    blog: "Напиши SEO-оптимизированный пост для блога на тему: ",
    social: "Создай короткий пост для социальных сетей о: ",
    product: "Напиши продающее описание для товара: ",
    email: "Напиши цепляющее письмо для email-рассылки на тему: ",
    meta: "Создай SEO-оптимизированное meta-описание для страницы: ",
    video: "Напиши сценарий для 3-минутного видео о: "
  };

  function setupTemplateListeners() {
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const basePrompt = templatePrompts[card.dataset.template] || "";
        promptTextarea.value = basePrompt;
        promptTextarea.focus();
      });
    });
  }

  window.copyResult = () => {
    const text = outputDiv.innerText;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Текст скопирован!'))
      .catch(() => showError('Не удалось скопировать'));
  };
  
  // Экспорт
  window.exportResult = async (type) => {
    const text = outputDiv.innerText;
    
    if(type === 'txt') {
      const blob = new Blob([text], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-${Date.now()}.txt`;
      a.click();
    }
    else if(type === 'pdf') {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text(text, 10, 10, {maxWidth: 180});
      doc.save(`content-${Date.now()}.pdf`);
    }
  };
  
  // Уведомления
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 p-4 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-lg animate__animated animate__fadeInUp';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // --- Генерация
  window.generateContent = async () => {
    const prompt = promptTextarea.value.trim();
    if (!prompt) return showError('Введите текст запроса или выберите шаблон.');

    generateButton.disabled = true;
    hideError();
    resultDiv.classList.add('hidden');
    loaderDiv.classList.remove('hidden');

    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ prompt })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка сервера');

      displayResult(data.content);
      saveToHistory(prompt, data.content);
    } catch (err) {
      console.error(err);
      showError(err.message);
    } finally {
      generateButton.disabled = false;
      loaderDiv.classList.add('hidden');
    }
  };

  function displayResult(text) {
    outputDiv.innerHTML = text.replace(/\n/g, '<br>');
    statsDiv.textContent = `Символов: ${text.length} | Слов: ${text.trim().split(/\s+/).length}`;
    resultDiv.classList.remove('hidden');
  }

  // --- Ошибки
  function showError(message) {
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => hideError(), 6000);
  }

  function hideError() {
    if (!errorDiv) return;
    errorDiv.classList.add('hidden');
  }

  // --- История
  function saveToHistory(prompt, result) {
    const entry = {
      prompt,
      result,
      date: new Date().toLocaleString('ru-RU')
    };
    history.unshift(entry);
    history = history.slice(0, 50);
    localStorage.setItem('contentHistory', JSON.stringify(history));
  }

  function renderHistory() {
    if (!historyListDiv) return;

    if (history.length === 0) {
      historyListDiv.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">История пуста.</p>';
      return;
    }

    historyListDiv.innerHTML = history.map((item, index) => `
      <div class="p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <div onclick="loadHistoryItem(${index})" class="cursor-pointer">
          <div class="text-xs text-gray-500 dark:text-gray-400">${item.date}</div>
          <div class="font-semibold truncate dark:text-white">Промпт: ${item.prompt}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300 truncate">Результат: ${item.result.slice(0, 100)}...</div>
        </div>
        <button onclick="deleteHistoryItem(${index}, event)" class="absolute top-2 right-2 text-red-500">✕</button>
      </div>
    `).join('');
  }

  window.showHistory = () => {
    renderHistory();
    historyModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  };

  window.hideHistory = () => {
    historyModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  window.loadHistoryItem = index => {
    const item = history[index];
    if (!item) return showError("Элемент не найден");
    promptTextarea.value = item.prompt;
    displayResult(item.result);
    hideHistory();
  };

  window.deleteHistoryItem = (index, event) => {
    event.stopPropagation();
    if (!confirm("Удалить запись?")) return;
    history.splice(index, 1);
    localStorage.setItem('contentHistory', JSON.stringify(history));
    renderHistory();
  };

  window.clearHistory = () => {
    if (!confirm("Очистить всю историю?")) return;
    history = [];
    localStorage.removeItem('contentHistory');
    renderHistory();
  };
});
