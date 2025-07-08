document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const modelSelect = document.getElementById('model-select');
    const profileButton = document.getElementById('user-profile-button');
    const accountDropdown = document.getElementById('account-dropdown');

    // --- Core Logic ---
    async function handleGeneration() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        const model = modelSelect.value;
        addMessageToChat(prompt, 'user');
        promptInput.value = '';
        promptInput.style.height = 'auto';
        updateGenerateButtonState();
        showLoader();

        try {
            const result = await apiCall('/api/generate', 'POST', { model, prompt });
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