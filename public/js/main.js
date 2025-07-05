document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8080';
    let currentModel = '';

    // --- DOM Elements ---
    const generatorSection = document.getElementById('generator-section');
    const heroSection = document.getElementById('hero-section');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const authControls = document.getElementById('auth-controls');
    const callToAction = document.getElementById('call-to-action');

    // Modal Elements
    const modal = document.getElementById('generator-modal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal-button');
    const modalPrompt = document.getElementById('modal-prompt');
    const modalGenerateButton = document.getElementById('modal-generate-button');
    const modalResultArea = document.getElementById('modal-result-area');
    const modalLoader = document.getElementById('modal-loader');
    const modalError = document.getElementById('modal-error-message');
    const modalResultWrapper = document.getElementById('modal-result-wrapper');
    const modalResultContent = document.getElementById('modal-result-content');

    // --- Auth ---
    function updateAuthState(isAuthenticated) {
        if (isAuthenticated) {
            generatorSection.classList.remove('hidden');
            heroSection.classList.add('hidden');
            loginButton.classList.add('hidden');
            logoutButton.classList.remove('hidden');
        } else {
            generatorSection.classList.add('hidden');
            heroSection.classList.remove('hidden');
            loginButton.classList.remove('hidden');
            logoutButton.classList.add('hidden');
        }
    }

    window.logout = function() {
        localStorage.removeItem('jwt_token');
        updateAuthState(false);
    };

    // --- Modal Logic ---
    function openModal(model, title) {
        currentModel = model;
        modalTitle.textContent = title;
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('opacity-0', '-translate-y-10');
        }, 10); // Delay for transition
        resetModalState();
    }

    function closeModal() {
        modalContent.classList.add('opacity-0', '-translate-y-10');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    function resetModalState() {
        modalPrompt.value = '';
        modalResultArea.classList.add('hidden');
        modalError.classList.add('hidden');
        modalLoader.classList.add('hidden');
        modalResultWrapper.classList.add('hidden');
    }

    // --- API Call ---
    async function generateContent() {
        const prompt = modalPrompt.value;
        if (!prompt) {
            showError('Пожалуйста, введите запрос.');
            return;
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            showError('Ошибка авторизации. Пожалуйста, войдите снова.');
            logout();
            return;
        }

        // UI updates for loading
        modalResultArea.classList.remove('hidden');
        modalLoader.classList.remove('hidden');
        modalError.classList.add('hidden');
        modalResultWrapper.classList.add('hidden');
        modalGenerateButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ model: currentModel, prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Произошла неизвестная ошибка.');
            }

            const data = await response.json();
            displayResult(data.content);

        } catch (error) {
            showError(error.message);
        } finally {
            modalLoader.classList.add('hidden');
            modalGenerateButton.disabled = false;
        }
    }

    function displayResult(content) {
        modalResultWrapper.classList.remove('hidden');
        if (currentModel === 'dalle') {
            modalResultContent.innerHTML = `<img src="${content}" alt="Generated image by DALL-E" class="rounded-lg shadow-md mx-auto max-h-full" />`;
        } else {
            modalResultContent.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
        }
    }

    function showError(message) {
        modalResultArea.classList.remove('hidden');
        modalResultWrapper.classList.add('hidden');
        modalError.textContent = message;
        modalError.classList.remove('hidden');
    }

    // --- Result Actions ---
    window.copyResult = function() {
        if (currentModel === 'dalle') return; // Don't copy image URLs
        const content = modalResultContent.innerText;
        navigator.clipboard.writeText(content).then(() => {
            const copyText = document.getElementById('copy-text');
            copyText.textContent = 'Скопировано!';
            setTimeout(() => { copyText.textContent = 'Копировать'; }, 2000);
        });
    };

    window.exportResult = function(format) {
        if (currentModel === 'dalle') return;
        const content = modalResultContent.innerText;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contentgen-hub-result.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Event Listeners ---
    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => {
            const model = card.dataset.model;
            const title = card.querySelector('h3').textContent;
            openModal(model, title);
        });
    });

    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    modalGenerateButton.addEventListener('click', generateContent);

    // --- Initial Setup ---
    const token = localStorage.getItem('jwt_token');
    updateAuthState(!!token);
});

// --- Dark Mode ---
function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    body.classList.toggle('dark');

    if (body.classList.contains('dark')) {
        themeIcon.innerHTML = `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.innerHTML = `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
        localStorage.setItem('theme', 'light');
    }
}

// Load theme from local storage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    toggleDarkMode(); // To set the correct icon
}