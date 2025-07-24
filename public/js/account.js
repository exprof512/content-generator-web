document.addEventListener('DOMContentLoaded', async () => {
    // Loader
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
        const avatarWrapper = document.getElementById('account-avatar-wrapper');
        if (user.avatar_url) {
            avatarWrapper.innerHTML = `<img src="${user.avatar_url}" alt="User Avatar" class="w-full h-full object-cover rounded-full">`;
        } else {
            avatarWrapper.textContent = user.name.charAt(0).toUpperCase();
        }
        if (document.getElementById('account-name')) document.getElementById('account-name').textContent = user.name;
        if (document.getElementById('account-email')) document.getElementById('account-email').textContent = user.email;
        if (document.getElementById('account-tariff')) document.getElementById('account-tariff').textContent = user.tariff;
        if (document.getElementById('account-generations')) document.getElementById('account-generations').textContent = user.generations_left;
        if (document.getElementById('account-expires')) {
            const { text, isActive } = formatSubscriptionDate(user.subscription_expires, user.tariff);
            const el = document.getElementById('account-expires');
            el.textContent = text;
            el.className = isActive
                ? 'text-lg font-semibold text-green-700 dark:text-green-400'
                : 'text-lg font-semibold text-gray-400 dark:text-gray-500';
        }
        document.getElementById('account-logout-button').onclick = window.logout;
    } catch (error) {
        alert('Ошибка загрузки данных аккаунта: ' + (error.message || 'Нет соединения с сервером'));
        await window.logout();
        window.location.href = '/';
    } finally {
        hideLoader();
    }
});

function formatSubscriptionDate(expires, tariff) {
    if (tariff === 'free' || !expires || new Date(expires) < new Date()) {
        return { text: 'Нет активной подписки', isActive: false };
    }
    const date = new Date(expires);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return { text: 'до ' + date.toLocaleDateString('ru-RU', options), isActive: true };
}