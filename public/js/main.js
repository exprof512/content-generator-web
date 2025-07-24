document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const modelSelect = document.getElementById('model-select');
    const submodelSelect = document.getElementById('submodel-select');
    const agentDropdownBtn = document.getElementById('agent-dropdown-btn');
    const agentDropdownMenu = document.getElementById('agent-dropdown-menu');
    const agentDropdownLabel = document.getElementById('agent-dropdown-label');
    const modelDropdownBtn = document.getElementById('model-dropdown-btn');
    const modelDropdownMenu = document.getElementById('model-dropdown-menu');
    const modelDropdownLabel = document.getElementById('model-dropdown-label');
    const modelDropdownList = document.getElementById('model-dropdown-list');

    let selectedAgent = 'chatgpt';
    let selectedModel = 'gpt-4o-mini';

    // --- Модели для каждого ИИ ---
    let MODEL_OPTIONS = {};
    let AVAILABLE_MODELS = {};
    let userTariff = 'free'; // default, обновляется после запроса /api/me
    let userEmail = '';
    let isAdmin = false;
    let imageGenCount = 0;
    let textGenCount = 0;

    async function fetchAvailableModels() {
        try {
            const data = await apiCall('/api/available-models', 'GET');
            userTariff = data.tariff || 'free';
            AVAILABLE_MODELS = data.available_models || {};
            // Преобразуем в формат для выпадающего списка
            MODEL_OPTIONS = {};
            Object.keys(AVAILABLE_MODELS).forEach(agent => {
                MODEL_OPTIONS[agent] = (AVAILABLE_MODELS[agent] || []).map(model => {
                    // Человеко-читабельные лейблы
                    let label = model;
                    if (model === 'gpt-4o-mini') label = 'GPT-4o-mini';
                    if (model === 'gpt-4') label = 'GPT-4';
                    if (model === 'gpt-4.1') label = 'GPT-4.1';
                    if (model === 'gemini-2.0-flash') label = 'Gemini 2.0 Flash';
                    if (model === 'gemini-2.5-flash') label = 'Gemini 2.5 Flash';
                    if (model === 'gemini-2.5-pro') label = 'Gemini 2.5 Pro';
                    if (model === 'deepseek-chat') label = 'DeepSeek Chat';
                    if (model === 'deepseek-reasoner') label = 'DeepSeek Reasoner';
                    if (model === 'deepseek-coder') label = 'DeepSeek Coder';
                    if (model === 'gpt-image-1') label = 'GPT Image 1';
                    if (model === 'dall-e-2') label = 'DALL-E 2';
                    if (model === 'dall-e-3') label = 'DALL-E 3';
                    return { value: model, label };
                });
            });
        } catch (e) {
            // fallback: дефолтные модели
            MODEL_OPTIONS = {
        chatgpt: [
            { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4.1', label: 'GPT-4.1' }
        ],
        gemini: [
                    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
                    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
        ],
        deepseek: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat' },
            { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
            { value: 'deepseek-coder', label: 'DeepSeek Coder' }
        ],
        dalle: [
            { value: 'gpt-image-1', label: 'GPT Image 1' },
            { value: 'dall-e-2', label: 'DALL-E 2' },
            { value: 'dall-e-3', label: 'DALL-E 3' }
        ]
    };
        }
    }

    // Loader
    function showLoader() {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30';
            loader.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }
    function hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = 'none';
    }

    async function fetchUserTariff() {
        showLoader();
        try {
            const user = await apiCall('/api/me');
            userTariff = user.tariff || 'free';
            userEmail = user.email || '';
            imageGenCount = user.image_gen_count || 0;
            textGenCount = user.text_gen_count || 0;
            isAdmin = (window.ADMIN_EMAIL && userEmail === window.ADMIN_EMAIL);
        } catch (e) {
            userTariff = 'free';
            userEmail = '';
            isAdmin = false;
        } finally {
            hideLoader();
        }
    }

    // --- Кастомное модальное окно для PRO ---
    function showProModal() {
        let modal = document.getElementById('pro-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        // Закрытие по кнопке или overlay
        const closeBtn = document.getElementById('pro-modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    }

    // --- Обновление тарифа пользователя после оплаты ---
    window.updateUserTariff = async function() {
        await fetchUserTariff();
        if (typeof renderUserProfile === 'function') renderUserProfile();
    }

    function renderModelDropdown(agentKey) {
        modelDropdownList.innerHTML = '';
        const options = MODEL_OPTIONS[agentKey] || [];
        if (!options.length) {
            selectedModel = null;
            modelDropdownLabel.textContent = 'Нет доступных моделей';
            if (generateButton) generateButton.disabled = true;
            return;
        }
        options.forEach(opt => {
            const li = document.createElement('li');
            li.innerHTML = `<button type="button" class="dropdown-item flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-pink-50 dark:hover:bg-gray-700" data-value="${opt.value}"><span>${opt.label}</span></button>`;
            const button = li.querySelector('button');
            button.addEventListener('click', () => {
                selectedModel = opt.value;
                modelDropdownLabel.textContent = opt.label;
                modelDropdownMenu.style.display = 'none';
            });
            modelDropdownList.appendChild(li);
        });
        // Выбрать первую доступную модель по умолчанию
        selectedModel = options[0].value;
        modelDropdownLabel.textContent = options[0].label;
        if (generateButton) generateButton.disabled = false;
    }

    // Маппинг placeholder по модели
    const PLACEHOLDERS = {
        chatgpt: 'Задайте вопрос или напишите, что нужно сгенерировать...',
        dalle: 'Опишите картинку, которую хотите получить...',
        gemini: 'Введите аналитический запрос или идею...',
        deepseek: 'Опишите задачу по коду или вопрос по программированию...'
    };

    function updatePromptPlaceholder() {
        let agent = selectedAgent;
        promptInput.placeholder = PLACEHOLDERS[agent] || 'Введите ваш запрос...';
    }

    // Кнопка отправки с иконкой
    function updateSendButton() {
        if (generateButton) {
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-1 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            generateButton.classList.add('py-3', 'px-6', 'text-lg', 'rounded-xl', 'bg-purple-600', 'hover:bg-purple-700', 'text-white', 'w-full', 'md:w-auto');
        }
    }

    // Тосты/уведомления
    function showToast(message, type = 'info') {
        let toast = document.createElement('div');
        toast.className = `fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-base font-semibold transition-all duration-300 ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-purple-600'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; }, 2500);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    // Баннер о скором окончании подписки
    function showWarningBanner(warning) {
        let banner = document.getElementById('warning-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'warning-banner';
            banner.className = 'fixed top-0 left-0 w-full z-40 bg-yellow-100 text-yellow-900 text-center py-2 px-4 font-semibold shadow-md';
            document.body.appendChild(banner);
        }
        banner.textContent = warning;
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 8000);
    }

    // --- Core Logic ---
    // Добавляем мини-спиннер для генерации
    function showMiniSpinner() {
        let spinner = document.getElementById('mini-spinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'mini-spinner';
            spinner.className = 'inline-block align-middle ml-2';
            spinner.innerHTML = '<svg class="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>';
            const btn = document.getElementById('generate-button');
            if (btn) btn.parentNode.insertBefore(spinner, btn.nextSibling);
        }
        spinner.style.display = 'inline-block';
    }
    function hideMiniSpinner() {
        const spinner = document.getElementById('mini-spinner');
        if (spinner) spinner.style.display = 'none';
    }

    let promptHelpersVisible = false;
    function showPromptHelpers() {
        if (!promptHelpersVisible) {
            document.getElementById('prompt-helper-buttons').style.display = 'flex';
            promptHelpersVisible = true;
        }
    }
    function hidePromptHelpers() {
        document.getElementById('prompt-helper-buttons').style.display = 'none';
        promptHelpersVisible = false;
    }

    let currentAbortController = null;

    async function handleGeneration() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        generateButton.disabled = true;
        promptInput.disabled = true;
        promptInput.value = '';
        promptInput.style.height = 'auto';
        updateGenerateButtonState();
        // 1. Добавить вопрос пользователя в чат
        addMessageToChat(prompt, 'user');
        // 2. Добавить спиннер для ответа ИИ
        showLoaderAfterUserMessage();
        showPromptHelpers(); // показываем FAQ/Шаблоны после первого промта
        let subscription;
        try {
            subscription = await checkSubscription();
        } catch (e) {
            replaceLoaderWithAIResponse('Ошибка проверки подписки: ' + (e.message || 'Нет соединения с сервером'));
            promptInput.disabled = false;
            generateButton.disabled = false;
            return;
        }
        if (subscription.warning) {
            addMessageToChat(subscription.warning, 'ai-warning');
            showWarningBanner(subscription.warning);
            if (subscription.warning.includes('скоро закончится')) {
                showPaymentNotification(subscription.plan || 'pro');
            }
        }
        if (!subscription.can_generate) {
            replaceLoaderWithAIResponse('Генерация недоступна. Пожалуйста, оплатите подписку.');
            promptInput.disabled = false;
            generateButton.disabled = false;
            showPaymentNotification(subscription.plan || 'pro');
                return;
            }
        const model = selectedAgent;
        const submodel = selectedModel;
        const chat_id = window.currentChatId;
        // --- STOP BUTTON LOGIC ---
        if (!currentAbortController) {
            currentAbortController = new AbortController();
        }
        generateButton.innerHTML = '<span class="hidden md:inline">Стоп</span> <svg class="inline w-6 h-6 ml-1 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6L18 18M6 18L18 6"/></svg>';
        generateButton.disabled = false;
        generateButton.onclick = () => {
            if (currentAbortController) currentAbortController.abort();
            generateButton.disabled = true;
        };
        let result;
        try {
            result = await apiCall('/api/generate', 'POST', { model, submodel, prompt, chat_id }, { signal: currentAbortController.signal });
            replaceLoaderWithAIResponse(result.content);
            fetchAndRenderHistory();
            showToast('Генерация завершена!', 'success');
        } catch (error) {
            if (error.name === 'AbortError') {
                replaceLoaderWithAIResponse('Генерация отменена.');
            } else {
                replaceLoaderWithAIResponse('Ошибка: ' + (error.message || 'Нет соединения с сервером'));
            }
        } finally {
            promptInput.disabled = false;
            generateButton.disabled = false;
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-2 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            generateButton.onclick = handleGeneration;
            currentAbortController = null;
            updateGenerateButtonState();
        }
    }

    function updateGenerateButtonState() {
        if (promptInput) generateButton.disabled = promptInput.value.trim() === '';
    }

    // --- Event Listeners ---
    if (generateButton) generateButton.addEventListener('click', handleGeneration);

    if (promptInput) {
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!generateButton.disabled) {
                    handleGeneration();
                }
            }
        });
        promptInput.addEventListener('input', () => {
            updateGenerateButtonState();
            // Авто-увеличение высоты, как в ChatGPT
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(promptInput.scrollHeight, 160) + 'px'; // 160px = max-h-40
        });
    }

    // Быстрые шаблоны
    document.querySelectorAll('.quick-template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            promptInput.value = btn.dataset.template;
            promptInput.focus();
            updateGenerateButtonState();
        });
    });

    // --- Chat ID logic ---
    if (!window.currentChatId) {
        window.currentChatId = sessionStorage.getItem('currentChatId') || generateChatId();
        sessionStorage.setItem('currentChatId', window.currentChatId);
    }
    document.getElementById('new-chat-button')?.addEventListener('click', () => {
        window.currentChatId = generateChatId();
        sessionStorage.setItem('currentChatId', window.currentChatId);
        resetChatLayout();
        hidePromptHelpers(); // скрываем FAQ/Шаблоны при новом чате
    });

    // --- Auth Modal Listeners ---
    document.getElementById('show-auth-modal-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal('login');
    });
    document.getElementById('auth-modal-close')?.addEventListener('click', hideAuthModal);
    document.getElementById('show-register-view')?.addEventListener('click', () => showAuthModal('register'));
    document.getElementById('show-login-view')?.addEventListener('click', () => showAuthModal('login'));
    document.getElementById('show-forgot-password-view')?.addEventListener('click', () => showAuthModal('forgot'));
    document.getElementById('back-to-login-view')?.addEventListener('click', () => showAuthModal('login'));
    document.getElementById('login-form')?.addEventListener('submit', window.handleEmailLogin);
    document.getElementById('register-form')?.addEventListener('submit', window.handleEmailRegister);
    document.getElementById('forgot-password-form')?.addEventListener('submit', window.handleForgotPasswordRequest);
    // Close modal on overlay click
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') {
            hideAuthModal();
        }
    });

    document.getElementById('leave-review-btn')?.addEventListener('click', () => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            // User is authenticated
            alert('Спасибо! Функционал добавления отзывов скоро появится.');
        } else {
            // User is not authenticated, show login modal
            showAuthModal('login');
        }
    });

    // --- Dropdown logic ---
    agentDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        agentDropdownMenu.style.display = agentDropdownMenu.style.display === 'block' ? 'none' : 'block';
        modelDropdownMenu.style.display = 'none';
    });
    modelDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdownMenu.style.display = modelDropdownMenu.style.display === 'block' ? 'none' : 'block';
        agentDropdownMenu.style.display = 'none';
    });
    document.addEventListener('click', () => {
        agentDropdownMenu.style.display = 'none';
        modelDropdownMenu.style.display = 'none';
    });
    agentDropdownMenu.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAgent = btn.getAttribute('data-value');
            agentDropdownLabel.textContent = btn.textContent.trim();
            agentDropdownMenu.style.display = 'none';
            renderModelDropdown(selectedAgent);
            updatePromptPlaceholder();
        });
    });
    modelDropdownMenu.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedModel = btn.getAttribute('data-value');
            modelDropdownLabel.textContent = btn.textContent.trim();
            modelDropdownMenu.style.display = 'none';
        });
    });

    // FAQ и профиль — обработчики только после DOMContentLoaded
    const faqBtn = document.getElementById('faq-btn');
    const faqModal = document.getElementById('faq-modal');
    const faqClose = document.getElementById('faq-close');
    const profileButton = document.getElementById('user-profile-button');
    let accountDropdown = document.getElementById('account-dropdown');

    // Восстановление/рендер аватара
    async function renderUserProfile() {
        try {
            const user = await apiCall('/api/me');
            if (profileButton) {
                if (user.avatar_url) {
                    profileButton.innerHTML = `<img src="${user.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
                } else {
                    profileButton.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'П';
                }
            }
            // dropdown
            if (!accountDropdown) {
                accountDropdown = document.createElement('div');
                accountDropdown.id = 'account-dropdown';
                accountDropdown.className = 'hidden absolute top-14 right-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-1 animate__animated animate__fadeIn animate__faster';
                profileButton.parentNode.appendChild(accountDropdown);
            }
            accountDropdown.innerHTML = `
                <div class="p-3">
                    <div class="flex items-center gap-4 mb-3">
                        <div id="dropdown-user-avatar" class="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl font-bold overflow-hidden">${user.avatar_url ? `<img src='${user.avatar_url}' class='w-full h-full object-cover rounded-full'>` : (user.name ? user.name.charAt(0).toUpperCase() : 'П')}</div>
                        <div>
                            <div id="dropdown-user-name" class="font-semibold text-gray-900 dark:text-white truncate">${user.name || ''}</div>
                            <div id="dropdown-user-email" class="text-sm text-gray-500 dark:text-gray-400 truncate">${user.email || ''}</div>
                        </div>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-300">Тариф: <b id="account-tariff" class="text-gray-800 dark:text-white">${user.tariff || ''}</b></span>
                            <a href="/pricing" class="text-purple-600 dark:text-purple-400 hover:underline font-medium">Сменить</a>
                        </div>
                        <div class="mt-2">
                            <p class="text-gray-600 dark:text-gray-300">Осталось генераций: <b id="account-generations" class="text-gray-800 dark:text-white">${user.generations_left || ''}</b></p>
                            <p class="text-gray-600 dark:text-gray-300">Активен до: <b id="account-expires" class="text-gray-800 dark:text-white">${user.subscription_expires ? new Date(user.subscription_expires).toLocaleDateString('ru-RU') : ''}</b></p>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div class="p-1 text-gray-700 dark:text-gray-300">
                    <div class="px-3 py-2 flex justify-between items-center text-sm">
                        <span>Темная тема</span>
                        <label for="theme-toggle" class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="theme-toggle" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div class="p-1">
                    <a href="/privacy" target="_blank" class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Privacy Policy</a>
                    <a href="/terms" target="_blank" class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Terms of Use</a>
                    <button id="logout-button" class="block w-full text-left mt-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Выйти</button>
                </div>
            `;
        } catch (e) {
            // fallback: просто буква
            if (profileButton) profileButton.textContent = 'П';
        }
    }
    // Экспортируем функцию для вызова из других файлов (auth.js)
    window.renderUserProfile = renderUserProfile;
    // Навешиваем обработчики на профиль и FAQ
    if (profileButton) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (accountDropdown) {
                accountDropdown.classList.toggle('hidden');
                if (!accountDropdown.classList.contains('hidden')) {
                    if (faqModal) faqModal.classList.add('hidden');
                }
            }
        });
        document.addEventListener('click', (e) => {
            if (accountDropdown && !profileButton.contains(e.target) && !accountDropdown.contains(e.target)) {
                accountDropdown.classList.add('hidden');
            }
        });
    }
    if (faqBtn && faqModal && faqClose) {
        faqBtn.addEventListener('click', () => {
            faqModal.classList.remove('hidden');
            if (accountDropdown) accountDropdown.classList.add('hidden');
        });
        faqClose.addEventListener('click', () => {
            faqModal.classList.add('hidden');
        });
        faqModal.addEventListener('click', (e) => {
            if (e.target === faqModal) faqModal.classList.add('hidden');
        });
    }
    // После авторизации рендерим профиль
    await renderUserProfile();

    document.getElementById('logout-button')?.addEventListener('click', window.logout);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = document.documentElement.classList.contains('dark');
        themeToggle.addEventListener('change', () => {
            window.toggleDarkMode();
        });
    }

    // FAQ/Справка модалка
    if (typeof faqBtn !== 'undefined' && faqBtn && typeof faqModal !== 'undefined' && faqModal && typeof faqClose !== 'undefined' && faqClose) {
        faqBtn.addEventListener('click', () => {
            faqModal.classList.remove('hidden');
            if (typeof accountDropdown !== 'undefined' && accountDropdown) accountDropdown.classList.add('hidden');
        });
        faqClose.addEventListener('click', () => {
            faqModal.classList.add('hidden');
        });
        faqModal.addEventListener('click', (e) => {
            if (e.target === faqModal) faqModal.classList.add('hidden');
        });
    }

    // PRO banner
    function showProBanner() {
        const banner = document.getElementById('pro-banner');
        if (banner) {
            banner.style.display = 'block';
            const closeBtn = document.getElementById('pro-banner-close');
            if (closeBtn) closeBtn.onclick = () => { banner.style.display = 'none'; };
            setTimeout(() => { banner.style.display = 'none'; }, 8000);
        }
    }

    // --- Hero CTA ---
    const heroCtaBtn = document.getElementById('hero-cta-btn');
    if (heroCtaBtn) {
        heroCtaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof showAuthModal === 'function') showAuthModal('register');
        });
    }
    document.getElementById('hero-cta-btn-2')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('show-auth-modal-btn')?.click();
    });

    // --- Initial Setup ---
    const token = localStorage.getItem('jwt_token');
    updateAuthState(!!token);
    updateGenerateButtonState();
    updatePromptPlaceholder();
    updateSendButton();

    // --- Dark Mode ---
    window.toggleDarkMode = function() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        if (themeToggle) {
            themeToggle.checked = document.documentElement.classList.contains('dark');
        }
    }
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // После авторизации и показа app-page — инициализируем меню моделей
    await fetchAvailableModels();
    renderModelDropdown(selectedAgent);
    modelDropdownLabel.textContent = (MODEL_OPTIONS[selectedAgent]?.[0]?.label) || '';

    // --- Google Auth: блокировка без согласия только для регистрации ---
    const googleAuthLinkLogin = document.getElementById('google-auth-link-login');
    const googleAuthLinkRegister = document.getElementById('google-auth-link-register');
    const googleAcceptRegister = document.getElementById('google-accept-register');
    // --- Google Auth: абсолютные переходы на backend ---
    if (googleAuthLinkLogin) {
        googleAuthLinkLogin.addEventListener('click', function(e) {
            e.preventDefault();
            let baseUrl = window.API_BASE_URL || '';
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            window.location.href = baseUrl + '/auth/google/login';
        });
    }
    if (googleAuthLinkRegister && googleAcceptRegister) {
        googleAuthLinkRegister.addEventListener('click', function(e) {
            if (!googleAcceptRegister.checked) {
                e.preventDefault();
                googleAcceptRegister.focus();
                googleAcceptRegister.classList.add('ring', 'ring-red-400');
                setTimeout(() => googleAcceptRegister.classList.remove('ring', 'ring-red-400'), 1200);
                return;
            }
            e.preventDefault();
            let baseUrl = window.API_BASE_URL || '';
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            window.location.href = baseUrl + '/auth/google/login?register=1';
        });
    }

    // --- PROMPT TEMPLATES ---
    const PROMPT_TEMPLATES = [
      {
        title: 'Резюме для вакансии',
        text: 'Составь резюме для позиции {должность}, укажи опыт работы в {отрасль}, навыки: {ключевые навыки}.',
      },
      {
        title: 'Письмо партнёру',
        text: 'Напиши деловое письмо партнёру компании {название}, цель письма: {описание цели}.',
      },
      {
        title: 'Пост для соцсетей',
        text: 'Создай пост для {соцсеть} о запуске нового продукта {название продукта}.',
      },
      {
        title: 'SEO-описание товара',
        text: 'Напиши SEO-описание для товара {название}, целевая аудитория: {описание аудитории}.',
      },
      {
        title: 'Сценарий видео',
        text: 'Напиши сценарий для видео на тему {тема}, длительность: {минуты} минут.',
      },
      {
        title: 'Инструкция для пользователя',
        text: 'Составь пошаговую инструкцию по использованию {продукт/сервис}.',
      },
      {
        title: 'План статьи',
        text: 'Составь подробный план статьи на тему: {тема статьи}.',
      },
      {
        title: 'Перевод текста',
        text: 'Переведи следующий текст на {язык}: {текст для перевода}',
      },
      {
        title: 'Письмо поддержки',
        text: 'Составь письмо в поддержку сервиса {название}, опиши проблему: {описание проблемы}.',
      },
      {
        title: 'Промпт для генерации изображения',
        text: 'Сгенерируй изображение: {описание сцены}, стиль: {стиль}, цветовая гамма: {цвета}.',
      },
      {
        title: 'План маркетинговой кампании',
        text: 'Разработай план маркетинговой кампании для продукта {название}, бюджет: {сумма}, целевая аудитория: {описание аудитории}.',
      },
      {
        title: 'Пост для Telegram-канала',
        text: 'Напиши пост для Telegram-канала на тему {тема}, стиль: {информативный/развлекательный}.',
      },
      {
        title: 'Письмо клиенту',
        text: 'Составь письмо клиенту, который интересовался {услуга/товар}, цель письма: {цель}.',
      },
      {
        title: 'Сценарий для подкаста',
        text: 'Напиши сценарий для подкаста на тему {тема}, продолжительность: {минуты} минут.',
      },
      {
        title: 'Промпт для генерации кода',
        text: 'Напиши код на {язык программирования} для задачи: {описание задачи}.',
      },
      {
        title: 'План обучения',
        text: 'Составь план обучения по теме {тема}, уровень: {начальный/продвинутый}.',
      },
      {
        title: 'Промпт для анализа данных',
        text: 'Проанализируй данные: {описание данных}, цель анализа: {цель}.',
      },
      {
        title: 'Промпт для генерации презентации',
        text: 'Составь структуру презентации на тему {тема}, количество слайдов: {число}.',
      },
      {
        title: 'Промпт для генерации email-рассылки',
        text: 'Напиши текст email-рассылки для аудитории {описание аудитории}, цель письма: {цель}.',
      },
      {
        title: 'Промпт для генерации FAQ',
        text: 'Составь список часто задаваемых вопросов и ответов по теме {тема}.',
      },
      {
        title: 'Промпт для генерации слогана',
        text: 'Придумай слоган для компании {название}, ниша: {описание ниши}.',
      },
      {
        title: 'Промпт для генерации описания вакансии',
        text: 'Составь описание вакансии для позиции {должность}, требования: {ключевые требования}.',
      },
      {
        title: 'Промпт для генерации roadmap',
        text: 'Составь roadmap для проекта {название}, этапы: {описание этапов}.',
      },
      {
        title: 'Промпт для генерации user story',
        text: 'Составь user story для функционала {описание функционала}, роль пользователя: {роль}.',
      },
      {
        title: 'Промпт для генерации тест-кейсов',
        text: 'Составь тест-кейсы для проверки {описание функционала/продукта}.',
      },
      {
        title: 'Промпт для генерации бизнес-плана',
        text: 'Составь бизнес-план для стартапа {название}, ниша: {описание ниши}, целевая аудитория: {описание аудитории}.',
      },
      {
        title: 'Промпт для генерации пресс-релиза',
        text: 'Напиши пресс-релиз о запуске {продукт/сервис}, основные преимущества: {описание преимуществ}.',
      },
      {
        title: 'Промпт для генерации customer journey map',
        text: 'Составь customer journey map для клиента {описание клиента}, этапы: {описание этапов}.',
      },
      {
        title: 'Промпт для генерации mindmap',
        text: 'Составь mindmap по теме {тема}, основные ветви: {описание ветвей}.',
      },
      {
        title: 'Промпт для генерации отчёта',
        text: 'Составь отчёт по результатам {описание исследования/проекта}, основные выводы: {выводы}.',
      },
      {
        title: 'Промпт для генерации инструкции по безопасности',
        text: 'Составь инструкцию по безопасности для {описание процесса/оборудования}.',
      },
    ];

    function renderPromptTemplates() {
      const list = document.getElementById('prompt-templates-list');
      if (!list) return;
      list.innerHTML = '';
      PROMPT_TEMPLATES.forEach((tpl, idx) => {
        const card = document.createElement('div');
        card.className = 'bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow flex flex-col gap-2';
        card.innerHTML = `<div class="font-semibold text-purple-700 dark:text-purple-200 mb-2">${tpl.title}</div>
          <textarea readonly class="w-full bg-transparent text-gray-700 dark:text-gray-200 text-sm resize-none outline-none" rows="3">${tpl.text}</textarea>
          <div class="flex gap-2 mt-2">
            <button class="copy-template-btn px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all" data-idx="${idx}">Копировать</button>
            <button class="insert-template-btn px-3 py-1 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 transition-all" data-idx="${idx}">Вставить в чат</button>
          </div>`;
        list.appendChild(card);
      });
      // Навешиваем обработчики
      list.querySelectorAll('.copy-template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = btn.getAttribute('data-idx');
          navigator.clipboard.writeText(PROMPT_TEMPLATES[idx].text);
          btn.textContent = 'Скопировано!';
          setTimeout(() => { btn.textContent = 'Копировать'; }, 1500);
        });
      });
      list.querySelectorAll('.insert-template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = btn.getAttribute('data-idx');
          const promptInput = document.getElementById('prompt-input');
          if (promptInput) {
            promptInput.value = PROMPT_TEMPLATES[idx].text;
            promptInput.focus();
            // Автоматически закрыть модалку
            document.getElementById('prompt-templates-modal').classList.add('hidden');
          }
        });
      });
    }

    document.getElementById('prompt-templates-btn')?.addEventListener('click', () => {
      document.getElementById('prompt-templates-modal').classList.remove('hidden');
      renderPromptTemplates();
    });
    document.getElementById('prompt-templates-close')?.addEventListener('click', () => {
      document.getElementById('prompt-templates-modal').classList.add('hidden');
    });

    // --- Helper buttons visibility logic ---
    function updateHelperButtonsVisibility() {
      const promptInput = document.getElementById('prompt-input');
      const helperButtons = document.getElementById('prompt-helper-buttons');
      const inlineHelper = document.getElementById('inline-helper-buttons');
      if (!promptInput || !helperButtons || !inlineHelper) return;
      if (promptInput.value.trim() === '') {
        helperButtons.style.display = 'flex';
        inlineHelper.style.display = 'none';
      } else {
        helperButtons.style.display = 'none';
        inlineHelper.style.display = 'flex';
      }
    }
    document.getElementById('prompt-input')?.addEventListener('input', updateHelperButtonsVisibility);
    document.addEventListener('DOMContentLoaded', updateHelperButtonsVisibility);

    // --- FAQ/modal open/close logic ---
    function openFAQModal() {
      document.getElementById('faq-modal').classList.remove('hidden');
    }
    function closeFAQModal() {
      document.getElementById('faq-modal').classList.add('hidden');
    }
    function openTemplatesModal() {
      document.getElementById('prompt-templates-modal').classList.remove('hidden');
      renderPromptTemplates();
    }
    function closeTemplatesModal() {
      document.getElementById('prompt-templates-modal').classList.add('hidden');
    }
    // Кнопки в initial-view
    const showFaqBtn = document.getElementById('show-faq-btn');
    const showTemplatesBtn = document.getElementById('show-templates-btn');
    showFaqBtn?.addEventListener('click', openFAQModal);
    showTemplatesBtn?.addEventListener('click', openTemplatesModal);
    // Кнопки в inline-helper-buttons
    const inlineFaqBtn = document.getElementById('inline-faq-btn');
    const inlineTemplatesBtn = document.getElementById('inline-templates-btn');
    inlineFaqBtn?.addEventListener('click', openFAQModal);
    inlineTemplatesBtn?.addEventListener('click', openTemplatesModal);
    // Закрытие по крестику
    const faqCloseBtn = document.getElementById('faq-close');
    faqCloseBtn?.addEventListener('click', closeFAQModal);
    document.getElementById('prompt-templates-close')?.addEventListener('click', closeTemplatesModal);
    // Автоматическое закрытие по клику вне модального окна
    window.addEventListener('mousedown', (e) => {
      const faqModal = document.getElementById('faq-modal');
      if (faqModal && !faqModal.classList.contains('hidden')) {
        const inner = faqModal.children[0];
        if (inner && !inner.contains(e.target)) closeFAQModal();
      }
      const tplModal = document.getElementById('prompt-templates-modal');
      if (tplModal && !tplModal.classList.contains('hidden')) {
        const inner = tplModal.children[0];
        if (inner && !inner.contains(e.target)) closeTemplatesModal();
      }
    });

    document.getElementById('fixed-faq-btn')?.addEventListener('click', () => {
        document.getElementById('faq-modal').classList.remove('hidden');
    });
    document.getElementById('fixed-templates-btn')?.addEventListener('click', () => {
        document.getElementById('prompt-templates-modal').classList.remove('hidden');
        renderPromptTemplates();
    });

    // --- Навешиваем обработчики на FAQ/Шаблоны в prompt-helper-buttons ---
    const promptFaqBtn = document.querySelector('#prompt-helper-buttons #show-faq-btn');
    const promptTemplatesBtn = document.querySelector('#prompt-helper-buttons #show-templates-btn');
    if (promptFaqBtn) {
        promptFaqBtn.addEventListener('click', openFAQModal);
    }
    if (promptTemplatesBtn) {
        promptTemplatesBtn.addEventListener('click', openTemplatesModal);
    }
});