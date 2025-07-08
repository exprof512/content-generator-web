document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = window.API_BASE_URL || 'http://localhost:8080';
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('jwt_token');
            window.location.href = '/';
            return;
        }

        const user = await response.json();

        const avatarWrapper = document.getElementById('account-avatar-wrapper');
        if (user.avatar_url) {
            avatarWrapper.innerHTML = `<img src="${user.avatar_url}" alt="User Avatar" class="w-full h-full object-cover">`;
        } else {
            avatarWrapper.textContent = user.name.charAt(0).toUpperCase();
        }

        document.getElementById('account-name').textContent = user.name;
        document.getElementById('account-email').textContent = user.email;
        document.getElementById('account-tariff').textContent = user.tariff;
        document.getElementById('account-generations').textContent = user.generations_left;
        document.getElementById('account-expires').textContent = new Date(user.subscription_expires_at).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        document.getElementById('account-logout-button').onclick = () => {
            localStorage.removeItem('jwt_token');
            window.location.href = '/';
        };

    } catch (error) {
        console.error('Failed to load account data:', error);
        localStorage.removeItem('jwt_token');
        window.location.href = '/';
    }
});