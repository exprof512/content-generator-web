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
            historyList.innerHTML = `<p class="p-4 text-sm text-gray-500 dark:text-gray-400">История чатов пуста.</p>`;
            return;
        }

        // Группируем чаты по chat_id
        const chats = {};
        history.forEach(item => {
            const chatId = item.chat_id || 'default';
            if (!chats[chatId]) {
                chats[chatId] = {
                    items: [],
                    latest_timestamp: new Date(0),
                    title: 'Новый чат'
                };
            }
            chats[chatId].items.push(item);
            const current_timestamp = new Date(item.created_at);
            if (current_timestamp > chats[chatId].latest_timestamp) {
                chats[chatId].latest_timestamp = current_timestamp;
                chats[chatId].title = item.chat_title || (item.prompt ? item.prompt.substring(0, 40) + '...' : 'Без названия');
            }
        });

        // Группируем по датам
        const groupedByDate = {
            today: [],
            yesterday: [],
            last7days: [],
            last30days: [],
            older: []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 7);
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 30);

        for (const chatId in chats) {
            const chat = chats[chatId];
            const chatDate = new Date(chat.latest_timestamp);

            if (chatDate >= today) {
                groupedByDate.today.push({ id: chatId, ...chat });
            } else if (chatDate >= yesterday) {
                groupedByDate.yesterday.push({ id: chatId, ...chat });
            } else if (chatDate >= last7days) {
                groupedByDate.last7days.push({ id: chatId, ...chat });
            } else if (chatDate >= last30days) {
                groupedByDate.last30days.push({ id: chatId, ...chat });
            } else {
                groupedByDate.older.push({ id: chatId, ...chat });
            }
        }

        // Функция для рендера группы
        const renderGroup = (title, group) => {
            if (group.length === 0) return;

            const groupContainer = document.createElement('div');
            groupContainer.className = 'mb-4';
            
            const groupTitle = document.createElement('h3');
            groupTitle.className = 'px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';
            groupTitle.textContent = title;
            groupContainer.appendChild(groupTitle);

            const list = document.createElement('div');
            list.className = 'space-y-1';
            group.sort((a, b) => b.latest_timestamp - a.latest_timestamp); // Сортировка внутри группы

            group.forEach(chat => {
                const chatElement = document.createElement('div');
                chatElement.className = 'history-item group flex items-center justify-between w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer transition-colors';
                chatElement.dataset.chatId = chat.id;

                const titleSpan = document.createElement('span');
                titleSpan.className = 'truncate flex-1';
                titleSpan.textContent = chat.title;

                const menuButton = document.createElement('button');
                menuButton.className = 'opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity';
                menuButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01"></path></svg>';
                
                chatElement.appendChild(titleSpan);
                chatElement.appendChild(menuButton);
                list.appendChild(chatElement);

                // Обработчик клика по чату
                chatElement.addEventListener('click', (e) => {
                    if (e.target === menuButton || menuButton.contains(e.target)) return;
                    loadChatMessages(chat.items);
                    window.currentChatId = chat.id;
                    sessionStorage.setItem('currentChatId', chat.id);
                });

                // Обработчик для меню
                menuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showHistoryItemMenu(e.currentTarget, chat.id, chat.title, chatElement);
                });
            });

            groupContainer.appendChild(list);
            historyList.appendChild(groupContainer);
        };

        renderGroup('Сегодня', groupedByDate.today);
        renderGroup('Вчера', groupedByDate.yesterday);
        renderGroup('Предыдущие 7 дней', groupedByDate.last7days);
        renderGroup('Предыдущие 30 дней', groupedByDate.last30days);
        renderGroup('Ранее', groupedByDate.older);

    } catch (error) {
        console.error('Failed to fetch history:', error);
        historyList.innerHTML = `<p class="p-4 text-sm text-red-500">Ошибка загрузки истории.</p>`;
    }
}

function showHistoryItemMenu(button, chatId, currentTitle, element) {
    // Удаляем существующие меню
    document.querySelectorAll('.history-item-menu').forEach(menu => menu.remove());

    const menu = document.createElement('div');
    menu.className = 'history-item-menu absolute z-30 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1';
    
    // Позиционирование относительно кнопки
    menu.style.top = `${button.offsetTop + button.offsetHeight}px`;
    menu.style.right = `0px`;

    menu.innerHTML = `
        <button class="rename-btn block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Переименовать</button>
        <button class="delete-btn block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Удалить</button>
    `;

    element.appendChild(menu);

    menu.querySelector('.rename-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showRenameChatModal(chatId, element.querySelector('span'));
        menu.remove();
    });

    menu.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteChat(chatId, element);
        menu.remove();
    });

    // Закрытие меню по клику вне его
    setTimeout(() => {
        document.addEventListener('click', function onClickOutside(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', onClickOutside);
            }
        }, { once: true });
    }, 0);
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
    chatItems.forEach(item => {
        addMessageToChat(item.prompt, 'user', item.id);
        addMessageToChat(item.response, 'ai', item.id);
    });
}

// При создании нового чата — генерируем новый chat_id
document.getElementById('new-chat-button')?.addEventListener('click', () => {
    currentChatId = generateChatId();
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