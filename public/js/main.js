let postLoginAction = null; // Global variable to store intended action

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    await i18n.init();
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const modelSelect = document.getElementById('model-select');
    const submodelSelect = document.getElementById('submodel-select');
    const profileButton = document.getElementById('user-profile-button');
    const accountDropdown = document.getElementById('account-dropdown');
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
    const MODEL_OPTIONS = {
        chatgpt: [
            { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4.1', label: 'GPT-4.1' }
        ],
        gemini: [
            { value: 'gemini-pro', label: 'Gemini Pro' },
            { value: 'gemini-1.5', label: 'Gemini 1.5' }
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

    function renderModelDropdown(agentKey) {
        modelDropdownList.innerHTML = '';
        const options = MODEL_OPTIONS[agentKey] || [];
        options.forEach(opt => {
            const li = document.createElement('li');
            li.innerHTML = `<button type="button" class="dropdown-item flex items-center w-full px-4 py-2 text-sm hover:bg-pink-50 dark:hover:bg-gray-700" data-value="${opt.value}">${opt.label}</button>`;
            li.querySelector('button').addEventListener('click', () => {
                selectedModel = opt.value;
                modelDropdownLabel.textContent = opt.label;
                modelDropdownMenu.style.display = 'none';
            });
            modelDropdownList.appendChild(li);
        });
        // Выбрать первую модель по умолчанию
        if (options.length > 0) {
            selectedModel = options[0].value;
            modelDropdownLabel.textContent = options[0].label;
        }
    }

    // --- Dropdown logic ---
    agentDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        agentDropdownMenu.style.display = agentDropdownMenu.style.display === 'block' ? 'none' : 'block';
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
        });
    });

    modelDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdownMenu.style.display = modelDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Инициализация при загрузке
    renderModelDropdown(selectedAgent);

    // --- Core Logic ---
    async function handleGeneration() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        const model = selectedAgent;
        const submodel = selectedModel;
        // chat_id из глобальной переменной (инициализируется при старте или новом чате)
        const chat_id = window.currentChatId || (window.currentChatId = generateChatId());
        addMessageToChat(prompt, 'user');
        promptInput.value = '';
        promptInput.style.height = 'auto';
        updateGenerateButtonState();
        showLoader();

        try {
            const result = await apiCall('/api/generate', 'POST', { model, submodel, prompt, chat_id });
            removeLoader();
            addMessageToChat(result.content, 'ai');
            fetchAndRenderHistory();
        } catch (error) {
            removeLoader();
            addMessageToChat(`Ошибка: ${error.message}`, 'ai-error');
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
            promptInput.style.height = 'auto';
            promptInput.style.height = (promptInput.scrollHeight) + 'px';
        });
    }

    document.getElementById('new-chat-button')?.addEventListener('click', resetChatLayout);

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
    document.getElementById('login-form')?.addEventListener('submit', handleEmailLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleEmailRegister);
    document.getElementById('forgot-password-form')?.addEventListener('submit', handleForgotPasswordRequest);
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

    // --- Account Dropdown Listeners ---
    profileButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        accountDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!profileButton?.contains(e.target) && !accountDropdown?.contains(e.target)) {
            accountDropdown?.classList.add('hidden');
        }
    });

    document.getElementById('logout-button')?.addEventListener('click', window.logout);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = document.documentElement.classList.contains('dark');
        themeToggle.addEventListener('change', () => {
            window.toggleDarkMode();
        });
    }

    // --- Initial Setup ---
    const token = localStorage.getItem('jwt_token');
    updateAuthState(!!token);
    updateGenerateButtonState();

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
});