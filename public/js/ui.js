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

async function addMessageToChat(content, type, historyId = null, isLoader = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message ${type}`;

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}-bubble`;

    if (isLoader) {
        bubble.innerHTML = '<div class="loader"></div>';
    } else {
        if (content.startsWith('https://') && (content.includes('.png') || content.includes('.jpg') || content.includes('.jpeg'))) {
            const imageUrl = `${window.API_BASE_URL}/api/images/${historyId}`;
            try {
                const imageBlob = await fetchImage(imageUrl);
                const objectURL = URL.createObjectURL(imageBlob);
                
                const imageContainer = document.createElement('div');
                imageContainer.className = 'relative';

                const image = document.createElement('img');
                image.src = objectURL;
                image.className = 'w-full h-auto rounded-lg';

                const downloadButton = document.createElement('button');
                downloadButton.className = 'absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition';
                downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>';
                downloadButton.onclick = () => downloadImage(objectURL);
                
                imageContainer.appendChild(image);
                imageContainer.appendChild(downloadButton);
                bubble.appendChild(imageContainer);

            } catch (error) {
                console.error('Failed to load image:', error);
                bubble.innerHTML = 'Failed to load image.';
            }
        } else {
            bubble.innerHTML = marked.parse(content);
            bubble.querySelectorAll('pre code').forEach((block) => {
                const preElement = block.parentElement;
                preElement.classList.add('code-block-wrapper');
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-code-btn';
                copyButton.textContent = 'Copy';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(block.textContent);
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                };
                preElement.appendChild(copyButton);
            });
        }
    }

    messageWrapper.appendChild(bubble);
    chatMessages.appendChild(messageWrapper);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function showLoaderAfterUserMessage() {
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

function updateGenerateButtonState() {
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    if (promptInput && generateButton) {
        generateButton.disabled = promptInput.value.trim() === '';
    }
}
