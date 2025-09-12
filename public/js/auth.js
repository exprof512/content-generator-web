function updateAuthState(isAuthenticated) {
    const landingPage = document.getElementById('landing-page');
    const appPage = document.getElementById('app-page');

    if (isAuthenticated) {
        document.body.classList.remove('is-landing');
        document.body.classList.add('is-app');
        if (landingPage) landingPage.classList.add('hidden');
        if (appPage) {
            appPage.classList.remove('hidden');
            appPage.classList.add('flex');
            fetchUserData();
            fetchAndRenderHistory();
        }
    } else {
        document.body.classList.add('is-landing');
        document.body.classList.remove('is-app');
        if (landingPage) landingPage.classList.remove('hidden');
        if (appPage) {
            appPage.classList.add('hidden');
            appPage.classList.remove('flex');
        }
    }
}

async function fetchUserData() {
    const profileButton = document.getElementById('user-profile-button');
    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const accountTariff = document.getElementById('account-tariff');
    const accountGenerations = document.getElementById('account-generations');
    const accountExpires = document.getElementById('account-expires');

    function showLoader() {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30';
            loader.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }
    function hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = 'none';
    }

    showLoader();
    try {
        const user = await apiCall('/api/me');
        const userInitial = user.name.charAt(0).toUpperCase();

        // --- Страница аккаунта ---
        const isAccountPage = !!document.getElementById('account-tariff');
        if (isAccountPage) {
            const accountName = document.getElementById('account-name');
            if (accountName) accountName.textContent = user.name;
            const accountEmail = document.getElementById('account-email');
            if (accountEmail) accountEmail.textContent = user.email;
            const accountTariff = document.getElementById('account-tariff');
            if (accountTariff) accountTariff.textContent = user.tariff;
            const accountGenerations = document.getElementById('account-generations');
            if (accountGenerations) accountGenerations.textContent = user.generations_left;
            const accountExpires = document.getElementById('account-expires');
            if (accountExpires) {
                const { text, isActive } = formatSubscriptionDate(user.subscription_expires, user.tariff);
                accountExpires.textContent = text;
                accountExpires.className = isActive
                    ? 'text-lg font-semibold text-green-700 dark:text-green-400'
                    : 'text-lg font-semibold text-gray-400 dark:text-gray-500';
            }
        }

        // --- Основное приложение (чат, дропдаун профиля) ---
        const isAppPage = !!document.getElementById('user-profile-button');
        if (isAppPage) {
            const profileButton = document.getElementById('user-profile-button');
            const dropdownAvatar = document.getElementById('dropdown-user-avatar');
            const dropdownName = document.getElementById('dropdown-user-name');
            const dropdownEmail = document.getElementById('dropdown-user-email');
            const accountTariff = document.getElementById('account-tariff');
            const accountGenerations = document.getElementById('account-generations');
            const accountExpires = document.getElementById('account-expires');

            if (user.avatar_url) {
                // Делаем аватар всегда круглым
                const avatarImg = `<img src="${user.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
                if (profileButton) profileButton.innerHTML = avatarImg;
                if (dropdownAvatar) dropdownAvatar.innerHTML = avatarImg;
            } else {
                if (profileButton) profileButton.textContent = userInitial;
                if (dropdownAvatar) dropdownAvatar.textContent = userInitial;
            }
            if (dropdownName) dropdownName.textContent = user.name;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
            if (accountTariff) accountTariff.textContent = user.tariff.charAt(0).toUpperCase() + user.tariff.slice(1);
            if (accountGenerations) accountGenerations.textContent = user.generations_left;
            if (accountExpires) accountExpires.textContent = new Date(user.subscription_expires).toLocaleDateString('ru-RU');
        }
    } catch (error) {
        alert('Ошибка загрузки данных пользователя: ' + (error.message || 'Нет соединения с сервером'));
    } finally {
        hideLoader();
    }
}

function formatSubscriptionDate(expires, tariff) {
    // Проверяем валидность даты
    if (!expires || expires === '0001-01-01T00:00:00Z' || expires === '1970-01-01T00:00:00Z') {
        if (tariff === 'free') {
            return { text: 'Бесплатный период', isActive: false };
        }
        return { text: 'Без срока', isActive: false };
    }
    
    const date = new Date(expires);
    
    // Проверяем, что дата валидна
    if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
        if (tariff === 'free') {
            return { text: 'Бесплатный период', isActive: false };
        }
        return { text: 'Без срока', isActive: false };
    }
    
    const now = new Date();
    const isActive = date > now;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('ru-RU', options);
    
    if (tariff === 'free') {
        return { 
            text: isActive ? `до ${formattedDate}` : 'Период истек', 
            isActive 
        };
    }
    
    return { 
        text: isActive ? `до ${formattedDate}` : 'Подписка истекла', 
        isActive 
    };
}

async function handleEmailRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = ''; // Clear previous errors

    try {
        await publicApiCall('/auth/register', 'POST', { name, email, password });

        // Switch to login view with a success message
        showAuthModal('login');

        const loginEmailInput = document.getElementById('login-email');
        const loginErrorEl = document.getElementById('login-error');

        if (loginEmailInput) loginEmailInput.value = email; // pre-fill email
        if (loginErrorEl) {
            loginErrorEl.textContent = 'Регистрация прошла успешно! Теперь вы можете войти.';
            loginErrorEl.className = 'text-green-500 text-sm mt-2 h-4';
        }
        if (typeof window.afterAuthSuccess === 'function') window.afterAuthSuccess();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

// --- JWT session expiration logic ---
function getTokenExp(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

let sessionExpTimer = null;
let sessionWarnTimer = null;

function clearSessionTimers() {
    if (sessionExpTimer) clearTimeout(sessionExpTimer);
    if (sessionWarnTimer) clearTimeout(sessionWarnTimer);
    sessionExpTimer = null;
    sessionWarnTimer = null;
}

function setupSessionTimers() {
    clearSessionTimers();
    const token = localStorage.getItem('jwt_token');
    const exp = getTokenExp(token);
    if (!exp) return;
    const now = Date.now();
    const warnTime = exp - 2 * 60 * 1000; // за 2 минуты
    if (warnTime > now) {
        sessionWarnTimer = setTimeout(() => {
            showSessionExpiringModal();
        }, warnTime - now);
    }
    if (exp > now) {
        sessionExpTimer = setTimeout(() => {
            window.logout();
            showSessionExpiredModal();
        }, exp - now);
    } else {
        window.logout();
        showSessionExpiredModal();
    }
}

function showSessionExpiringModal() {
    showAuthModal('login');
    const modal = document.getElementById('auth-modal');
    const loginView = document.getElementById('login-view');
    const loginError = document.getElementById('login-error');
    if (modal && loginView && loginError) {
        loginError.textContent = 'Сессия истекает через 2 минуты. Пожалуйста, войдите снова.';
        loginError.className = 'text-yellow-500 text-sm text-center';
    }
}

function showSessionExpiredModal() {
    showAuthModal('login');
    const modal = document.getElementById('auth-modal');
    const loginView = document.getElementById('login-view');
    const loginError = document.getElementById('login-error');
    if (modal && loginView && loginError) {
        loginError.textContent = 'Сессия истекла. Пожалуйста, войдите снова.';
        loginError.className = 'text-red-500 text-sm text-center';
    }
}

// При логине и старте приложения запускать таймеры
document.addEventListener('DOMContentLoaded', () => {
    setupSessionTimers();
});

// После успешного логина запускать таймеры
window.handleEmailLogin = async function(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const errorEl = document.getElementById('login-error');

    try {
        const data = await publicApiCall('/auth/login', 'POST', { email, password });
        localStorage.setItem('jwt_token', data.token);
        hideAuthModal();
        updateAuthState(true);
        setupSessionTimers(); // <-- добавлено
        if (typeof window.afterAuthSuccess === 'function') window.afterAuthSuccess();
        if (typeof window.renderUserProfile === 'function') {
            window.renderUserProfile();
        }
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

window.handleForgotPasswordRequest = async function(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const errorEl = document.getElementById('forgot-error');
    errorEl.textContent = '';
    // Reset class to default error color
    errorEl.className = 'text-red-500 text-sm text-center';

    try {
        const data = await publicApiCall('/auth/forgot-password', 'POST', { email });
        // On success, change color to green
        errorEl.className = 'text-green-500 text-sm text-center';
        errorEl.textContent = data.message;
    } catch (error) {
        // On error, it will keep the default red color
        errorEl.textContent = error.message;
    }
}

window.logout = async function() {
    try {
        localStorage.removeItem('jwt_token');
        await fetch((window.API_BASE_URL || 'http://localhost:8080') + '/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    updateAuthState(false);
    clearSessionTimers();
    if (typeof hideAuthModal === 'function') hideAuthModal();
};