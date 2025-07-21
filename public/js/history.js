let currentChatId = null;

function generateChatId() {
    // Можно использовать Date.now + случайное число
    return 'chat_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
}

async function fetchAndRenderHistory() {
    const historyList = document.getElementById('history-list');
    try {
        const history = await apiCall('/api/history');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = `<p class="p-4 text-sm text-gray-500">История чатов пуста.</p>`;
            return;
        }

        // Группируем по chat_id
        const chats = {};
        history.forEach(item => {
            const chatId = item.chat_id || 'default';
            if (!chats[chatId]) chats[chatId] = [];
            chats[chatId].push(item);
        });

        // Сортировка по времени последнего сообщения в чате (новые сверху)
        const sortedChatIds = Object.keys(chats).sort((a, b) => {
            const aLast = chats[a][chats[a].length - 1].created_at;
            const bLast = chats[b][chats[b].length - 1].created_at;
            return bLast.localeCompare(aLast);
        });

        sortedChatIds.forEach(chatId => {
            const chatItems = chats[chatId];
            // Блок чата
            const chatBlock = document.createElement('div');
            chatBlock.className = 'mb-4 p-3 rounded-xl bg-white dark:bg-gray-800 shadow border border-purple-100 dark:border-gray-700 cursor-pointer hover:border-purple-400 transition-all';

            // Заголовок чата (можно добавить дату первого сообщения)
            const firstDate = chatItems[0].created_at ? new Date(chatItems[0].created_at).toLocaleDateString('ru-RU') : '';
            chatBlock.innerHTML = `<div class="font-bold text-purple-700 dark:text-purple-300 mb-2 text-sm">Чат от ${firstDate}</div>`;

            // Краткое описание (первые 1-2 промпта)
            const previewPrompts = chatItems.slice(0, 2).map(i => i.prompt).join(' | ');
            const previewDiv = document.createElement('div');
            previewDiv.className = 'text-gray-600 dark:text-gray-400 text-xs truncate mb-2';
            previewDiv.textContent = previewPrompts;
            chatBlock.appendChild(previewDiv);

            // Кнопка удалить чат
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-history-btn p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors ml-2 float-right';
            deleteBtn.title = 'Удалить чат';
            deleteBtn.innerHTML = `<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteChat(chatId, chatBlock);
            });
            chatBlock.appendChild(deleteBtn);

            // Клик по чату — показать все сообщения этого чата
            chatBlock.addEventListener('click', () => {
                loadChatMessages(chatItems);
                currentChatId = chatId;
            });

            historyList.appendChild(chatBlock);
        });
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

// Кастомное модальное окно для подтверждения удаления чата
function showDeleteChatModal(chatId, element) {
    let modal = document.getElementById('delete-chat-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    // Кнопки
    const confirmBtn = document.getElementById('delete-chat-confirm');
    const cancelBtn = document.getElementById('delete-chat-cancel');
    // Очистка старых обработчиков
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
    // Подтверждение
    confirmBtn.onclick = async () => {
        try {
            await apiCall(`/api/history?chat_id=${encodeURIComponent(chatId)}`, 'DELETE');
            element.remove();
        } catch (error) {
            // Можно добавить showToast или showErrorModal
        }
        modal.classList.add('hidden');
    };
    cancelBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}

async function handleDeleteChat(chatId, element) {
    showDeleteChatModal(chatId, element);
}

function loadChatMessages(chatItems) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    activateChatLayout();
    chatItems.forEach(item => {
        addMessageToChat(item.prompt, 'user', item.id);
        addMessageToChat(item.response, 'ai', item.id);
    });
}

// При создании нового чата — генерируем новый chat_id
document.getElementById('new-chat-button')?.addEventListener('click', () => {
    currentChatId = generateChatId();
    resetChatLayout();
});