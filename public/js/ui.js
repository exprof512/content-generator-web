let isChatActive = false;

function showAuthModal(view = 'login') {
    const modal = document.getElementById('auth-modal');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const forgotView = document.getElementById('forgot-password-view');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const forgotError = document.getElementById('forgot-error');

    loginError.textContent = '';
    loginError.className = 'text-red-500 text-sm mt-2 h-4'; // Reset to error style
    registerError.textContent = '';
    forgotError.textContent = '';

    if (view === 'login') {
        loginView.classList.remove('hidden');
        registerView.classList.add('hidden');
        forgotView.classList.add('hidden');
    } else if (view === 'register') {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
        forgotView.classList.add('hidden');
    } else {
        loginView.classList.add('hidden');
        registerView.classList.add('hidden');
        forgotView.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('forgot-password-form').reset();
}

// --- Marked.js & Highlight.js Setup ---
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    gfm: true,
    breaks: true,
});



function clearAppState() {
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = '';
    }

    // Clear user info in the dropdown
    const profileButton = document.getElementById('user-profile-button');
    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    if (profileButton) profileButton.innerHTML = '';
    if (dropdownAvatar) dropdownAvatar.innerHTML = '';
    if (dropdownName) dropdownName.textContent = '';
    if (dropdownEmail) dropdownEmail.textContent = '';

    // Reset the main chat view to its initial state
    resetChatLayout();
}

function addMessageToChat(content, type, historyId = null, isLoader = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex items-start gap-4 py-4 border-b border-gray-200 dark:border-gray-700';

    

    const messageContent = document.createElement('div');
    messageContent.className = 'flex-1';

    if (type === 'user') {
        messageWrapper.classList.add('justify-start');
        messageContent.className = 'prose dark:prose-invert max-w-none';
        messageContent.textContent = content;
    } else {
        messageWrapper.classList.add('justify-end');
        messageContent.className = 'prose dark:prose-invert max-w-none';

        if (isLoader) {
            messageContent.innerHTML = '<div class="flex items-center gap-2"><span class="loader inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span><span class="text-gray-500 dark:text-gray-400">AI думает...</span></div>';
        } else {
            // Обработка Markdown для ответа AI
            messageContent.innerHTML = marked.parse(content);
            // Стилизация блоков кода
            messageContent.querySelectorAll('pre').forEach(preElement => {
                preElement.classList.add('bg-gray-800', 'dark:bg-black', 'text-white', 'rounded-lg', 'p-4', 'overflow-x-auto', 'my-4', 'shadow-inner');
                const code = preElement.querySelector('code');
                const lang = code.className.replace('language-', '');
                
                const header = document.createElement('div');
                header.className = 'flex justify-between items-center bg-gray-700 dark:bg-gray-900 text-gray-300 px-4 py-2 rounded-t-lg text-sm';
                header.innerHTML = `<span>${lang || 'code'}</span><button class="copy-code-btn text-xs hover:text-white">Копировать</button>`;
                
                preElement.parentNode.insertBefore(header, preElement);

                header.querySelector('.copy-code-btn').addEventListener('click', (e) => {
                    navigator.clipboard.writeText(code.innerText);
                    e.target.textContent = 'Скопировано!';
                    setTimeout(() => { e.target.textContent = 'Копировать'; }, 2000);
                });
            });
        }
    }

    
    messageWrapper.appendChild(messageContent);
    chatMessages.appendChild(messageWrapper);

    // Прокрутка вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoaderAfterUserMessage() {
    // Добавляет спиннер сразу после последнего сообщения пользователя
    addMessageToChat('', 'ai', null, true);
}

function replaceLoaderWithAIResponse(aiContent, historyId = null) {
    const chatMessages = document.getElementById('chat-messages');
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage) {
        lastMessage.remove();
        addMessageToChat(aiContent, 'ai', historyId);
    }
}

function showLoader() {
    activateChatLayout();
    const chatMessages = document.getElementById('chat-messages');
    const loaderElement = document.createElement('div');
    loaderElement.id = 'ai-loader';
    loaderElement.className = 'chat-message ai';
    loaderElement.innerHTML = `<div class="message-bubble ai-bubble"><div class="loader"></div></div>`;
    chatMessages.appendChild(loaderElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoader() {
    const loaderElement = document.getElementById('ai-loader');
    if (loaderElement) loaderElement.remove();
}

const LANGS = {
    RU: {
        login: 'Войти',
        'about-title': 'О платформе',
        'about-desc': 'ContentGen Hub — это ваш универсальный AI-хаб: тексты, изображения, код, аналитика. Всё в одном окне, с удобным интерфейсом и прозрачными тарифами.',
        'about-1-title': 'Все топовые AI-модели',
        'about-1-desc': 'ChatGPT, Gemini, DALL-E, DeepSeek и другие — в одном аккаунте.',
        'about-2-title': 'Простота и скорость',
        'about-2-desc': 'Минималистичный интерфейс, быстрый отклик, ничего лишнего.',
        'about-3-title': 'Выгодно и честно',
        'about-3-desc': 'Прозрачные тарифы, бесплатный старт, поддержка 24/7.'
    },
    EN: {
        login: 'Sign In',
        'about-title': 'About the Platform',
        'about-desc': 'ContentGen Hub is your universal AI hub: text, images, code, analytics. All in one window, with a simple interface and transparent pricing.',
        'about-1-title': 'All Top AI Models',
        'about-1-desc': 'ChatGPT, Gemini, DALL-E, DeepSeek and more — in one account.',
        'about-2-title': 'Simplicity & Speed',
        'about-2-desc': 'Minimalist interface, instant response, nothing extra.',
        'about-3-title': 'Fair & Profitable',
        'about-3-desc': 'Transparent pricing, free start, 24/7 support.'
    }
};

function getInitialLang() {
    const savedLang = (localStorage.getItem('lang') || 'RU').toUpperCase();
    // Убедимся, что сохраненный язык валиден, иначе вернем 'RU'
    return LANGS[savedLang] ? savedLang : 'RU';
}
let currentLang = getInitialLang();

function switchLang(lang) {
    if (lang) {
        currentLang = lang;
    } else {
        currentLang = currentLang === 'RU' ? 'EN' : 'RU';
    }
    localStorage.setItem('lang', currentLang);
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = currentLang;
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (LANGS[currentLang][key]) el.textContent = LANGS[currentLang][key];
    });
    // Кнопки RU/EN в аккаунте
    const ruBtn = document.getElementById('lang-ru-btn');
    const enBtn = document.getElementById('lang-en-btn');
    if (ruBtn && enBtn) {
        if (currentLang === 'RU') {
            ruBtn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'font-bold');
            enBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'font-bold');
        } else {
            enBtn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'font-bold');
            ruBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'font-bold');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = currentLang;
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) langSwitch.addEventListener('click', () => switchLang());
    // Кнопки RU/EN в аккаунте
    const ruBtn = document.getElementById('lang-ru-btn');
    const enBtn = document.getElementById('lang-en-btn');
    if (ruBtn) ruBtn.addEventListener('click', () => switchLang('RU'));
    if (enBtn) enBtn.addEventListener('click', () => switchLang('EN'));
    switchLang(currentLang);
});

function updateGenerateButtonState() {
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    if (promptInput && generateButton) {
        generateButton.disabled = promptInput.value.trim() === '';
    }
}

// Переключатель языка
// const langSwitcher = document.getElementById('lang-switcher');
// if (langSwitcher) {
//     langSwitcher.addEventListener('click', () => {
//         const nextLang = i18n.currentLang === 'ru' ? 'en' : 'ru';
//         i18n.setLanguage(nextLang);
//     });
// }