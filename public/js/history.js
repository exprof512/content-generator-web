async function fetchAndRenderHistory() {
    const historyList = document.getElementById('history-list');
    try {
        const history = await apiCall('/api/history');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = `<p class="p-4 text-sm text-gray-500">История генераций пуста.</p>`;
        } else {
            history.forEach(item => {
                const historyItemElement = document.createElement('div');
                historyItemElement.className = 'group relative p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-sm truncate';
                historyItemElement.textContent = item.prompt;
                historyItemElement.title = item.prompt;
                historyItemElement.dataset.historyId = item.id;

                historyItemElement.addEventListener('click', () => {
                    loadChatFromHistory(item);
                });

                const actionsWrapper = document.createElement('div');
                actionsWrapper.className = 'history-item-actions';
                actionsWrapper.innerHTML = `
                    <button class="history-action-btn delete-history-btn" title="Удалить">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                historyItemElement.appendChild(actionsWrapper);

                actionsWrapper.querySelector('.delete-history-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteHistoryItem(item.id, historyItemElement);
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