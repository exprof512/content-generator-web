// Централизованная функция для API вызовов, требующих аутентификации
async function apiCall(endpoint, method = 'GET', body = null) {
    const API_URL = window.API_BASE_URL || 'http://localhost:8080';
    let token = localStorage.getItem('jwt_token');

    if (!token) {
        await window.logout();
        throw new Error('Not authenticated');
    }

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, options);
    } catch (e) {
        throw new Error('Network error');
    }

    if (response.status === 401) {
        // Попробовать refresh
        try {
            const refreshResp = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
            if (refreshResp.ok) {
                const data = await refreshResp.json();
                if (data.token) {
                    localStorage.setItem('jwt_token', data.token);
                    // Повторить исходный запрос с новым токеном
                    options.headers['Authorization'] = `Bearer ${data.token}`;
                    response = await fetch(`${API_URL}${endpoint}`, options);
                    if (response.status !== 401) {
                        if (!response.ok) {
                            let errorData = {};
                            try { errorData = await response.json(); } catch {}
                            throw new Error(errorData.error || 'API request failed');
                        }
                        return response.json();
                    }
                }
            }
        } catch {}
        // Если refresh не сработал — logout
        await window.logout();
        if (typeof showSessionExpiredModal === 'function') showSessionExpiredModal();
        throw new Error('Session expired');
    }

    if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch {}
        throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
}

// Функция для публичных API вызовов (логин, регистрация)
async function publicApiCall(endpoint, method = 'POST', body = null) {
    const API_URL = window.API_BASE_URL || 'http://localhost:8080';

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
}

// PATCH-запрос с авторизацией
async function patchApiCall(endpoint, body = null) {
    const API_URL = window.API_BASE_URL || 'http://localhost:8080';
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.logout();
        throw new Error('Not authenticated');
    }
    const options = {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, options);
    } catch (e) {
        throw new Error('Network error');
    }
    if (response.status === 401) {
        window.logout();
        throw new Error('Session expired');
    }
    if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch {}
        throw new Error(errorData.error || 'API request failed');
    }
    return response.json();
}

// Проверка подписки пользователя
async function checkSubscription() {
    return apiCall('/api/subscription/check', 'GET');
}

window.apiCall = apiCall;
window.publicApiCall = publicApiCall;

async function fetchImage(imageUrl) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        await window.logout();
        throw new Error('Not authenticated');
    }

    const options = {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    };

    const response = await fetch(imageUrl, options);

    if (response.status === 401) {
        // Handle token refresh or logout
        await window.logout();
        if (typeof showSessionExpiredModal === 'function') showSessionExpiredModal();
        throw new Error('Session expired');
    }

    if (!response.ok) {
        throw new Error('Image request failed');
    }

    return response.blob();
}