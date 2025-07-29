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
            
            // Получаем полный список моделей и информацию о доступности
            const allModels = data.all_models || {};
            const modelsInfo = data.models_info || {};
            
            // Преобразуем в формат для выпадающего списка
            MODEL_OPTIONS = {};
            Object.keys(allModels).forEach(agent => {
                MODEL_OPTIONS[agent] = (allModels[agent] || []).map(model => {
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
                    
                    // Проверяем доступность модели
                    const isAvailable = modelsInfo[agent] && modelsInfo[agent][model];
                    
                    return { 
                        value: model, 
                        label,
                        available: isAvailable
                    };
                });
            });
        } catch (e) {
            // fallback: дефолтные модели
            MODEL_OPTIONS = {
        chatgpt: [
            { value: 'gpt-4o-mini', label: 'GPT-4o-mini', available: true },
            { value: 'gpt-4', label: 'GPT-4', available: false },
            { value: 'gpt-4.1', label: 'GPT-4.1', available: false }
        ],
        gemini: [
                    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', available: true },
                    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', available: false },
                    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', available: false }
        ],
        deepseek: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat', available: false },
            { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', available: false },
            { value: 'deepseek-coder', label: 'DeepSeek Coder', available: false }
        ],
        dalle: [
            { value: 'dall-e-2', label: 'DALL-E 2', available: true },
            { value: 'dall-e-3', label: 'DALL-E 3', available: false }
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
        await fetchAvailableModels();
        renderModelDropdown(selectedAgent);
        if (modelDropdownLabel) modelDropdownLabel.textContent = (MODEL_OPTIONS[selectedAgent]?.[0]?.label) || '';
        updateGenerateButtonState();
        if (typeof renderUserProfile === 'function') renderUserProfile();
    }

    function renderModelDropdown(agentKey) {
        if (!modelDropdownList || !modelDropdownLabel) return;
        modelDropdownList.innerHTML = '';
        const options = MODEL_OPTIONS[agentKey] || [];
        
        if (!options.length) {
            selectedModel = null;
            if (modelDropdownLabel) modelDropdownLabel.textContent = 'Нет доступных моделей';
            if (generateButton) generateButton.disabled = true;
            return;
        }
        
        // Находим первую доступную модель для выбора по умолчанию
        let firstAvailableModel = null;
        let firstModel = null;
        
        options.forEach(opt => {
            const li = document.createElement('div');
            
            if (opt.available) {
                // Доступная модель
                li.innerHTML = `<button type="button" class="dropdown-item flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-pink-50 dark:hover:bg-gray-700" data-value="${opt.value}"><span>${opt.label}</span></button>`;
                const button = li.querySelector('button');
                button.addEventListener('click', () => {
                    selectedModel = opt.value;
                    if (modelDropdownLabel) modelDropdownLabel.textContent = opt.label;
                    if (modelDropdownMenu) modelDropdownMenu.style.display = 'none';
                });
                
                // Запоминаем первую доступную модель
                if (firstAvailableModel === null) {
                    firstAvailableModel = opt.value;
                }
            } else {
                // Заблокированная модель
                li.innerHTML = `<button type="button" class="dropdown-item flex items-center justify-between w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-60" data-value="${opt.value}" disabled><span>${opt.label}</span><span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">PRO</span></button>`;
                const button = li.querySelector('button');
                button.addEventListener('click', () => {
                    showProModal();
                    if (modelDropdownMenu) modelDropdownMenu.style.display = 'none';
                });
            }
            
            // Запоминаем первую модель (любую) для fallback
            if (firstModel === null) {
                firstModel = opt.value;
            }
            
            modelDropdownList.appendChild(li);
        });
        
        // Выбираем первую доступную модель по умолчанию, или первую модель если нет доступных
        if (firstAvailableModel) {
            selectedModel = firstAvailableModel;
            const firstOption = options.find(opt => opt.value === firstAvailableModel);
            if (modelDropdownLabel && firstOption) modelDropdownLabel.textContent = firstOption.label;
        } else if (firstModel) {
            // Если нет доступных моделей, выбираем первую (заблокированную)
            selectedModel = firstModel;
            const firstOption = options.find(opt => opt.value === firstModel);
            if (modelDropdownLabel && firstOption) modelDropdownLabel.textContent = firstOption.label;
        } else {
            selectedModel = null;
            if (modelDropdownLabel) modelDropdownLabel.textContent = 'Нет доступных моделей';
        }
        
        if (generateButton) generateButton.disabled = !selectedModel;
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
        if (promptInput) {
            promptInput.placeholder = PLACEHOLDERS[agent] || 'Введите ваш запрос...';
        }
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
        
        // Блокируем кнопку и input во время генерации
        generateButton.disabled = true;
        promptInput.disabled = true;
        
        // Показываем спиннер в кнопке (как в ChatGPT)
        generateButton.innerHTML = '<svg class="animate-spin inline w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="hidden md:inline">Генерация...</span>';
        
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
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-2 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            updateGenerateButtonState();
            return;
        }
        
        if (subscription.warning) {
            addMessageToChat(subscription.warning, 'ai-warning');
            showWarningBanner(subscription.warning);
            if (subscription.warning.includes('скоро закончится')) {
                showProModal();
            }
        }
        
        if (!subscription.can_generate) {
            replaceLoaderWithAIResponse('Генерация недоступна. Пожалуйста, оплатите подписку.');
            promptInput.disabled = false;
            generateButton.disabled = false;
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-2 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            updateGenerateButtonState();
            showProModal();
            return;
        }
        
        const model = selectedAgent;
        const submodel = selectedModel;
        const chat_id = window.currentChatId;
        
        // Проверяем доступность выбранной модели
        const currentOptions = MODEL_OPTIONS[model] || [];
        const selectedOption = currentOptions.find(opt => opt.value === submodel);
        if (selectedOption && !selectedOption.available) {
            replaceLoaderWithAIResponse('Эта модель недоступна для вашего тарифа. Перейдите на PRO для доступа ко всем моделям.');
            promptInput.disabled = false;
            generateButton.disabled = false;
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-2 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            updateGenerateButtonState();
            showProModal();
            return;
        }
        
        // --- STOP BUTTON LOGIC ---
        if (!currentAbortController) {
            currentAbortController = new AbortController();
        }
        
        // Меняем кнопку на "Стоп" с иконкой X
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
            // Восстанавливаем кнопку и input
            promptInput.disabled = false;
            generateButton.disabled = false;
            generateButton.innerHTML = '<span class="hidden md:inline">Генерировать</span> <svg class="inline w-6 h-6 ml-2 -mt-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>';
            generateButton.onclick = handleGeneration;
            currentAbortController = null;
            updateGenerateButtonState();
            
            // Обновляем информацию о подписке после генерации
            try {
                const updatedSubscription = await checkSubscription();
                
                // Обновляем счетчик в UI
                const generationsCounter = document.getElementById('account-generations');
                const textCounter = document.getElementById('account-generations-text');
                const imageCounter = document.getElementById('account-generations-image');
                if (generationsCounter) {
                    if (updatedSubscription.tariff === 'free') {
                        // Для FREE показываем дневной лимит (осталось/лимит)
                        const textLimit = updatedSubscription.limits?.text_gen_limit || 0;
                        const imageLimit = updatedSubscription.limits?.image_gen_limit || 0;
                        const textUsed = updatedSubscription.text_gen_count || 0;
                        const imageUsed = updatedSubscription.image_gen_count || 0;
                        const textLeft = Math.max(0, textLimit - textUsed);
                        const imageLeft = Math.max(0, imageLimit - imageUsed);
                        const totalLeft = textLeft + imageLeft;
                        const totalLimit = textLimit + imageLimit;
                        generationsCounter.textContent = `${totalLeft}/${totalLimit}`;
                        if (textCounter) textCounter.textContent = `Текст: ${textLeft}/${textLimit}`;
                        if (imageCounter) imageCounter.textContent = `Картинки: ${imageLeft}/${imageLimit}`;
                    } else if (updatedSubscription.tariff === 'max') {
                        // Для MAX показываем "Безлимитно"
                        generationsCounter.textContent = 'Безлимитно';
                        if (textCounter) textCounter.textContent = '';
                        if (imageCounter) imageCounter.textContent = '';
                    } else {
                        // Для PRO показываем оставшиеся генерации
                        generationsCounter.textContent = updatedSubscription.generations_left || 0;
                        if (textCounter) textCounter.textContent = '';
                        if (imageCounter) imageCounter.textContent = '';
                    }
                }
            } catch (e) {
                console.log('Failed to update subscription info:', e);
            }
        }
    }

    function updateGenerateButtonState() {
        if (promptInput && generateButton) {
            const hasText = promptInput.value.trim() !== '';
            generateButton.disabled = !hasText;
            
            // Визуальная обратная связь
            if (hasText) {
                generateButton.classList.remove('opacity-50');
                generateButton.classList.add('hover:from-purple-600', 'hover:to-pink-600');
                generateButton.style.cursor = 'pointer';
            } else {
                generateButton.classList.add('opacity-50');
                generateButton.classList.remove('hover:from-purple-600', 'hover:to-pink-600');
                generateButton.style.cursor = 'not-allowed';
            }
        }
    }

    // --- Event Listeners ---
    if (generateButton) {
        generateButton.addEventListener('click', (e) => {
            if (!generateButton.disabled) {
                handleGeneration();
            }
        });
    }

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

    // Инициализация состояния кнопки при загрузке
    updateGenerateButtonState();

    // Быстрые шаблоны
    document.querySelectorAll('.quick-template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!promptInput) return;
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
    const newChatButton = document.getElementById('new-chat-button');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            window.currentChatId = generateChatId();
            sessionStorage.setItem('currentChatId', window.currentChatId);
            resetChatLayout();
            hidePromptHelpers(); // скрываем FAQ/Шаблоны при новом чате
        });
    }

    // --- Auth Modal Listeners ---
    const showAuthModalBtn = document.getElementById('show-auth-modal-btn');
    if (showAuthModalBtn) {
        showAuthModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('login');
        });
    }
    const authModalClose = document.getElementById('auth-modal-close');
    if (authModalClose) authModalClose.addEventListener('click', hideAuthModal);
    const showRegisterView = document.getElementById('show-register-view');
    if (showRegisterView) showRegisterView.addEventListener('click', () => showAuthModal('register'));
    const showLoginView = document.getElementById('show-login-view');
    if (showLoginView) showLoginView.addEventListener('click', () => showAuthModal('login'));
    const showForgotPasswordView = document.getElementById('show-forgot-password-view');
    if (showForgotPasswordView) showForgotPasswordView.addEventListener('click', () => showAuthModal('forgot'));
    const backToLoginView = document.getElementById('back-to-login-view');
    if (backToLoginView) backToLoginView.addEventListener('click', () => showAuthModal('login'));
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', window.handleEmailLogin);
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', window.handleEmailRegister);
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', window.handleForgotPasswordRequest);
    // Close modal on overlay click
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') {
                hideAuthModal();
            }
        });
    }
    const leaveReviewBtn = document.getElementById('leave-review-btn');
    if (leaveReviewBtn) {
        leaveReviewBtn.addEventListener('click', () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                showAuthModal('login');
                return;
            }
            showToast('Функция отзывов пока недоступна', 'info');
        });
    }

    // --- Dropdown logic ---
    if (agentDropdownBtn && agentDropdownMenu && modelDropdownMenu) {
        agentDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            agentDropdownMenu.style.display = agentDropdownMenu.style.display === 'block' ? 'none' : 'block';
            modelDropdownMenu.style.display = 'none';
        });
    }
    if (modelDropdownBtn && modelDropdownMenu && agentDropdownMenu) {
        modelDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelDropdownMenu.style.display = modelDropdownMenu.style.display === 'block' ? 'none' : 'block';
            agentDropdownMenu.style.display = 'none';
        });
    }
    if (agentDropdownMenu && modelDropdownMenu) {
        document.addEventListener('click', () => {
            agentDropdownMenu.style.display = 'none';
            modelDropdownMenu.style.display = 'none';
        });
    }
    if (agentDropdownMenu && agentDropdownLabel) {
        agentDropdownMenu.querySelectorAll('.dropdown-item').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedAgent = btn.getAttribute('data-value');
                if (agentDropdownLabel) agentDropdownLabel.textContent = btn.textContent.trim();
                agentDropdownMenu.style.display = 'none';
                renderModelDropdown(selectedAgent);
                updatePromptPlaceholder();
            });
        });
    }
    if (modelDropdownMenu && modelDropdownLabel) {
        modelDropdownMenu.querySelectorAll('.dropdown-item').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedModel = btn.getAttribute('data-value');
                if (modelDropdownLabel) modelDropdownLabel.textContent = btn.textContent.trim();
                modelDropdownMenu.style.display = 'none';
            });
        });
    }

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
            const subscription = await apiCall('/api/subscription/check');
            
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
            
            // Подготавливаем данные для счетчиков
            let generationsText = '';
            let generationsImage = '';
            let generationsDisplay = '';
            let expiresDisplay = '';
            
            if (user.tariff === 'free') {
                const textLimit = subscription.limits?.text_gen_limit || 0;
                const imageLimit = subscription.limits?.image_gen_limit || 0;
                const textUsed = subscription.text_gen_count || 0;
                const imageUsed = subscription.image_gen_count || 0;
                const textLeft = Math.max(0, textLimit - textUsed);
                const imageLeft = Math.max(0, imageLimit - imageUsed);
                const totalLeft = textLeft + imageLeft;
                const totalLimit = textLimit + imageLimit;
                generationsDisplay = `${totalLeft}/${totalLimit}`;
                generationsText = `Текст: ${textLeft}/${textLimit}`;
                generationsImage = `Картинки: ${imageLeft}/${imageLimit}`;
                expiresDisplay = 'Без срока';
            } else if (user.tariff === 'max') {
                generationsDisplay = 'Безлимитно';
                generationsText = '';
                generationsImage = '';
                expiresDisplay = user.subscription_expires ? new Date(user.subscription_expires).toLocaleDateString('ru-RU') : '';
            } else {
                generationsDisplay = user.generations_left || 0;
                generationsText = '';
                generationsImage = '';
                expiresDisplay = user.subscription_expires ? new Date(user.subscription_expires).toLocaleDateString('ru-RU') : '';
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
                            <p class="text-gray-600 dark:text-gray-300">Осталось генераций: <b id="account-generations" class="text-gray-800 dark:text-white">${generationsDisplay}</b></p>
                            ${(user.tariff === 'free') ? `<div id="account-generations-details" class="mt-1 text-xs">
                                <span id="account-generations-text" class="text-purple-600 dark:text-purple-400 mr-3">${generationsText}</span>
                                <span id="account-generations-image" class="text-pink-600 dark:text-pink-400">${generationsImage}</span>
                            </div>` : ''}
                            <p class="text-gray-600 dark:text-gray-300">Активен до: <b id="account-expires" class="text-gray-800 dark:text-white">${expiresDisplay}</b></p>
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
    updatePromptPlaceholder(); // теперь безопасно
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
    await fetchUserTariff();
    renderModelDropdown(selectedAgent);
    if (modelDropdownLabel) modelDropdownLabel.textContent = (MODEL_OPTIONS[selectedAgent]?.[0]?.label) || '';
    
    // Обновляем состояние кнопки после загрузки моделей
    updateGenerateButtonState();

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
    

    // --- FAQ/modal open/close logic ---
    function openFAQModal() {
      document.getElementById('faq-modal').classList.remove('hidden');
    }
    function closeFAQModal() {
      document.getElementById('faq-modal').classList.add('hidden');
    }
    function openTemplatesModal() {
      document.getElementById('prompt-templates-modal').classList.remove('hidden');
      // renderPromptTemplates() будет вызвана в templates.js
    }
    function closeTemplatesModal() {
      document.getElementById('prompt-templates-modal').classList.add('hidden');
    }

    // Обработчики для кнопок закрытия модальных окон
    document.getElementById('faq-close')?.addEventListener('click', closeFAQModal);
    document.getElementById('prompt-templates-close')?.addEventListener('click', closeTemplatesModal);

    // --- Обработчики для кнопок с data-action ---
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        if (action === 'show-faq') {
            openFAQModal();
        } else if (action === 'show-templates') {
            openTemplatesModal();
        }
    });

    // Закрытие модальных окон по клику вне их области
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

    // Финальная инициализация состояния кнопки
    updateGenerateButtonState();
});