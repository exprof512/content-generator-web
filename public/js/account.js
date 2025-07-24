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
        if (document.getElementById('account-expires')) document.getElementById('account-expires').textContent = new Date(user.subscription_expires).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('account-logout-button').onclick = window.logout;
    } catch (error) {
        alert('Ошибка загрузки данных аккаунта: ' + (error.message || 'Нет соединения с сервером'));
        await window.logout();
        window.location.href = '/';
    } finally {
        hideLoader();
    }

    // Переключатель языка
    // const langSwitcher = document.getElementById('lang-switcher');
    // if (langSwitcher) {
    //     langSwitcher.addEventListener('click', () => {
    //         const nextLang = i18n.currentLang === 'ru' ? 'en' : 'ru';
    //         i18n.setLanguage(nextLang);
    //     });
    // }
});