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

function activateChatLayout() {
    if (isChatActive) return;
    isChatActive = true;
    const initialView = document.getElementById('initial-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatContainer = document.getElementById('chat-container');

    initialView.classList.add('hidden');
    chatMessages.classList.remove('hidden');
    chatContainer.classList.remove('justify-center');
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatMessages.parentNode.scrollTop = chatMessages.parentNode.scrollHeight;
}

function resetChatLayout() {
    isChatActive = false;
    const initialView = document.getElementById('initial-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatContainer = document.getElementById('chat-container');

    chatMessages.innerHTML = '';
    chatMessages.classList.add('hidden');
    initialView.classList.remove('hidden');
    chatContainer.classList.add('justify-center');
}

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

function addMessageToChat(content, type, historyId = null) {
    activateChatLayout();
    const chatMessages = document.getElementById('chat-messages');
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'flex w-full gap-4 mb-4';
    if (type === 'user') {
        messageWrapper.classList.add('justify-end');
    } else {
        messageWrapper.classList.add('justify-start');
    }
    const messageElement = document.createElement('div');
    const isUser = type === 'user';
    const isError = type === 'ai-error';

    messageElement.className = `chat-message group animate__animated animate__fadeInUp ${isUser ? 'user' : 'ai'} ${isUser ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} rounded-2xl shadow-lg px-5 py-4 max-w-xl lg:max-w-3xl`;
    messageElement.style.border = isUser ? '2px solid #a78bfa' : '2px solid #e5e7eb';
    messageElement.style.marginBottom = '12px';

    if (isUser) {
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-actions mt-2 flex gap-2">
                <button class="message-action-btn copy-btn" title="Копировать">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
                <button class="message-action-btn edit-btn" title="Редактировать">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                </button>
            </div>
        `;
        messageElement.querySelector('.copy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(content);
        });
        messageElement.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('prompt-input').value = content;
            document.getElementById('prompt-input').focus();
            messageElement.remove();
        });
        messageWrapper.appendChild(messageElement);
    } else {
        const aiBubble = document.createElement('div');
        aiBubble.className = `prose dark:prose-invert max-w-3xl w-full bg-gray-50 dark:bg-gray-900 border border-purple-100 dark:border-gray-700 px-6 py-5 rounded-2xl shadow-lg ${isError ? 'border-red-500' : ''}`;
        // Если это картинка DALL-E, используем прокси-эндпоинт
        let isImage = false;
        if (historyId && typeof content === 'string' && content.startsWith('https://')) {
            isImage = /\.(jpg|jpeg|png|gif|webp)$/.test(content.split('?')[0]);
        }
        if (isImage && !isError) {
            aiBubble.innerHTML = `<img src="/api/image/${historyId}" alt="Generated image" class="rounded-lg max-w-sm"/>`;
        } else {
            aiBubble.innerHTML = marked.parse(content);
        }
        // Стилизация code/pre
        aiBubble.querySelectorAll('pre').forEach(preElement => {
            preElement.classList.add('bg-gray-900', 'text-white', 'rounded-xl', 'p-4', 'overflow-x-auto', 'my-4', 'shadow-inner');
            preElement.style.fontSize = '1rem';
            preElement.style.lineHeight = '1.6';
            preElement.style.border = '1px solid #a78bfa';
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper group flex items-center gap-2';
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.className = 'copy-code-btn px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all ml-2';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(preElement.querySelector('code').innerText);
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
            };
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            wrapper.appendChild(copyButton);
        });
        messageElement.appendChild(aiBubble);
        messageWrapper.appendChild(messageElement);
    }
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatMessages.classList.remove('hidden');
    chatMessages.parentNode.scrollTop = chatMessages.parentNode.scrollHeight;
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