function updateAuthState(isAuthenticated) {
    const landingPage = document.getElementById('landing-page');
    const appPage = document.getElementById('app-page');

    if (isAuthenticated) {
        document.body.classList.remove('is-landing');
        document.body.classList.add('is-app');
        landingPage.classList.add('hidden');
        appPage.classList.remove('hidden');
        appPage.classList.add('flex');
        fetchUserData();
        fetchAndRenderHistory();
    } else {
        document.body.classList.add('is-landing');
        document.body.classList.remove('is-app');
        landingPage.classList.remove('hidden');
        appPage.classList.add('hidden');
        appPage.classList.remove('flex');
    }
}

window.logout = function() {
    localStorage.removeItem('jwt_token');
    clearAppState(); // Clear all UI elements related to the user session
    updateAuthState(false);
};

async function fetchUserData() {
    const profileButton = document.getElementById('user-profile-button');
    const dropdownAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const accountTariff = document.getElementById('account-tariff');
    const accountGenerations = document.getElementById('account-generations');
    const accountExpires = document.getElementById('account-expires');

    try {
        const user = await apiCall('/api/me');
        const userInitial = user.name.charAt(0).toUpperCase();

        if (user.avatar_url) {
            const avatarImg = `<img src="${user.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
            profileButton.innerHTML = avatarImg;
            dropdownAvatar.innerHTML = avatarImg;
        } else {
            profileButton.textContent = userInitial;
            dropdownAvatar.textContent = userInitial;
        }
        dropdownName.textContent = user.name;
        dropdownEmail.textContent = user.email;
        accountTariff.textContent = user.tariff.charAt(0).toUpperCase() + user.tariff.slice(1);
        accountGenerations.textContent = user.generations_left;
        accountExpires.textContent = new Date(user.subscription_expires_at).toLocaleDateString('ru-RU');

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // apiCall will trigger logout on 401
    }
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
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

async function handleEmailLogin(event) {
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
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

async function handleForgotPasswordRequest(event) {
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