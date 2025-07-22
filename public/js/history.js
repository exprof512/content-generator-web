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

            // --- Название чата (теперь только с сервера) ---
            let chatTitle = chatItems[0].chat_title;
            if (!chatTitle) {
                const firstDate = chatItems[0].created_at ? new Date(chatItems[0].created_at).toLocaleDateString('ru-RU') : '';
                chatTitle = `Чат от ${firstDate}`;
            }
            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-bold text-purple-700 dark:text-purple-300 mb-2 text-sm inline-block';
            titleDiv.textContent = chatTitle;
            chatBlock.appendChild(titleDiv);

            // --- Кнопка переименовать ---
            const renameBtn = document.createElement('button');
            renameBtn.className = 'rename-chat-btn p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ml-2';
            renameBtn.title = 'Переименовать чат';
            renameBtn.innerHTML = `<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h12"/></svg>`;
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRenameChatModal(chatId, titleDiv);
            });
            chatBlock.appendChild(renameBtn);

            // --- Кнопка удалить чат ---
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
                window.currentChatId = chatId;
                sessionStorage.setItem('currentChatId', chatId);
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

// --- Модалка для переименования чата ---
function showRenameChatModal(chatId, titleDiv) {
    let modal = document.getElementById('rename-chat-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'rename-chat-modal';
        modal.className = 'fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate__animated animate__fadeIn animate__faster';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative p-8">
                <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Переименовать чат</h2>
                <input id="rename-chat-input" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500 mb-4" placeholder="Новое название чата">
                <div class="flex justify-end gap-4">
                    <button id="rename-chat-cancel" class="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Отмена</button>
                    <button id="rename-chat-confirm" class="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Сохранить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    const input = document.getElementById('rename-chat-input');
    input.value = titleDiv.textContent;
    input.focus();
    document.getElementById('rename-chat-cancel').onclick = () => modal.classList.add('hidden');
    document.getElementById('rename-chat-confirm').onclick = async () => {
        const newTitle = input.value.trim();
        if (newTitle) {
            try {
                await apiCall(`/api/history/title`, 'PATCH', { chat_id: chatId, chat_title: newTitle });
                titleDiv.textContent = newTitle;
            } catch (e) {
                showToast('Ошибка при переименовании чата', 'error');
            }
        }
        modal.classList.add('hidden');
    };
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}