async function fetchAndRenderHistory() {
    const historyList = document.getElementById('history-list');
    try {
        const history = await apiCall('/api/history');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = `<p class="p-4 text-sm text-gray-500">История генераций пуста.</p>`;
        } else {
            history.forEach(item => {
                // Новый красивый блок истории
                const historyItemElement = document.createElement('div');
                historyItemElement.className = 'group flex items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-gray-800 shadow hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium transition-all border border-transparent hover:border-purple-300';
                
                // Левая часть: иконка + текст
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 overflow-hidden flex-1';
                left.innerHTML = `<svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span class="truncate">${item.prompt}</span>`;
                left.title = item.prompt;
                
                // Правая часть: удалить
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-history-btn p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors';
                deleteBtn.title = 'Удалить';
                deleteBtn.innerHTML = `<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteHistoryItem(item.id, historyItemElement);
                });
                
                historyItemElement.appendChild(left);
                historyItemElement.appendChild(deleteBtn);
                
                historyItemElement.addEventListener('click', () => {
                    loadChatFromHistory(item);
                });
                
                historyList.appendChild(historyItemElement);
            });
        }
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

async function handleDeleteHistoryItem(id, element) {
    if (!confirm('Вы уверены, что хотите удалить этот элемент истории?')) return;
    try {
        await apiCall(`/api/history/${id}`, 'DELETE');
        element.remove();
    } catch (error) {
        alert('Не удалось удалить элемент истории.');
    }
}

function loadChatFromHistory(historyItem) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    activateChatLayout();
    addMessageToChat(historyItem.prompt, 'user');
    addMessageToChat(historyItem.response, 'ai');
}