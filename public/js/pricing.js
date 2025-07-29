document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = window.API_BASE_URL || '';

    // --- UI HELPERS ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const typeClasses = {
            error: 'bg-red-600',
            success: 'bg-green-600',
            info: 'bg-purple-600'
        };
        toast.className = `fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-base font-semibold transition-all duration-300 ${typeClasses[type] || typeClasses.info}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // --- PAYMENT LOGIC ---
    async function initiatePayment(system, tariff) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            showToast('Сначала войдите в аккаунт', 'error');
            return;
        }

        // Показываем "В разработке" для Telegram
        if (system === 'telegram') {
            showToast('Оплата через Telegram в разработке', 'info');
            return;
        }

        try {
            const res = await fetch(`${apiBaseUrl}/api/payment/${system}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tariff })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Ошибка при создании платежа');
            }

            const paymentData = await res.json();

            if (system === 'yookassa') {
                if (paymentData.status === 'ok') {
                    // Free тариф активирован
                    showToast('Тариф успешно обновлен!', 'success');
                    setTimeout(() => { 
                        window.location.href = '/'; 
                    }, 2000);
                } else if (paymentData.status === 'payment_created') {
                    // Создан платеж для платного тарифа
                    showToast('Перенаправляем на оплату...', 'info');
                    // TODO: Здесь будет редирект на страницу оплаты ЮKassa
                    // Пока что показываем информацию о платеже
                    console.log('Payment created:', paymentData);
                    showToast(`Создан платеж на сумму ${paymentData.amount} ₽`, 'info');
                } else {
                    showToast('Платеж обработан!', 'success');
                    setTimeout(() => { 
                        window.location.href = '/'; 
                    }, 2000);
                }
            } else {
                showToast('Платеж успешно обработан! Ваш тариф обновлен.', 'success');
                setTimeout(() => { 
                    window.location.href = '/'; 
                }, 2000);
            }
        } catch (e) {
            console.error(`Payment error for ${system}:`, e);
            showToast(`Ошибка оплаты: ${e.message || 'Неизвестная ошибка'}`, 'error');
        }
    }

    // --- FREE TARIFF LOGIC ---
    async function activateFreeTariff() {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            showToast('Сначала войдите в аккаунт', 'error');
            return;
        }

        try {
            // Проверяем текущий тариф пользователя
            const userResponse = await fetch(`${apiBaseUrl}/api/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!userResponse.ok) {
                throw new Error('Ошибка получения данных пользователя');
            }
            
            const user = await userResponse.json();
            
            // Если пользователь уже имеет тариф, просто переходим на генерацию
            if (user.tariff && user.tariff !== 'free') {
                showToast('Переходим к генерации...', 'info');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
                return;
            }
            
            // Если пользователь на free тарифе или без тарифа, устанавливаем free
            const res = await fetch(`${apiBaseUrl}/api/payment/yookassa`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tariff: 'free' })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Ошибка при активации бесплатного тарифа');
            }

            showToast('Бесплатный тариф активирован!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            
        } catch (e) {
            console.error('Free tariff activation error:', e);
            showToast(`Ошибка: ${e.message || 'Неизвестная ошибка'}`, 'error');
        }
    }

    // --- AUTH BLOCK LOGIC ---
    async function renderPricingAuthBlock() {
        const block = document.getElementById('pricing-auth-block');
        const backBtn = document.getElementById('back-to-generator-btn');
        const payButtons = document.querySelectorAll('.pay-btn');
        if (!block) return;

        const token = localStorage.getItem('jwt_token');
        if (token) {
            backBtn?.classList.remove('hidden');
            payButtons.forEach(btn => btn.disabled = false);

            try {
                const response = await fetch(`${apiBaseUrl}/api/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch user data');
                const user = await response.json();

                const initial = user.name ? user.name.charAt(0).toUpperCase() : 'П';
                const avatarHtml = user.avatar_url ?
                    `<img src="${user.avatar_url}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">` :
                    `<span class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-xl font-bold">${initial}</span>`;

                block.innerHTML = `<div class='relative'>
                    <button id="pricing-profile-btn" class="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow transition-all focus:outline-none">${avatarHtml}</button>
                    <div id="pricing-account-dropdown" class="hidden absolute right-0 top-full mt-2 w-80 max-w-xs overflow-x-auto shadow-xl bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 z-50">
                      <div class="p-3">
                        <div class="flex items-center gap-4 mb-3">
                          <div class="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl font-bold overflow-hidden">${user.avatar_url ? `<img src='${user.avatar_url}' class='w-full h-full object-cover rounded-full'>` : initial}</div>
                          <div>
                            <div class="font-semibold text-gray-900 dark:text-white truncate">${user.name || ''}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${user.email || ''}</div>
                          </div>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                          <span class="text-gray-600 dark:text-gray-300">Тариф: <b class="text-gray-800 dark:text-white">${user.tariff || 'FREE'}</b></span>
                        </div>
                      </div>
                      <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <div class="p-1">
                        <a href="/privacy" target="_blank" class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Privacy Policy</a>
                        <a href="/terms" target="_blank" class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Terms of Use</a>
                        <button id="pricing-logout-btn" class="block w-full text-left mt-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Выйти</button>
                      </div>
                    </div>
                </div>`;

                // Re-attach event listeners for dynamic content
                const profileBtn = document.getElementById('pricing-profile-btn');
                const dropdown = document.getElementById('pricing-account-dropdown');
                profileBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown?.classList.toggle('hidden');
                });
                document.getElementById('pricing-logout-btn')?.addEventListener('click', async () => {
                    if (window.logout) await window.logout();
                    window.location.reload();
                });

            } catch (error) {
                console.error("Auth block render error:", error);
                localStorage.removeItem('jwt_token'); // Clear bad token
                renderPricingAuthBlock(); // Rerender as logged out
            }
        } else {
            backBtn?.classList.add('hidden');
            payButtons.forEach(btn => btn.disabled = true);
            block.innerHTML = `<button id="show-auth-modal-btn" class="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow transition-all">Войти</button>`;
            document.getElementById('show-auth-modal-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof showAuthModal === 'function') showAuthModal('login');
            });
        }
    }

    // --- INITIALIZATION ---
    renderPricingAuthBlock();

    // Обработчик для кнопки "Начать бесплатно"
    document.querySelector('.rounded-2xl a[href="/"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        activateFreeTariff();
    });

    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const { system, tariff } = btn.dataset;
            initiatePayment(system, tariff);
        });
    });

    document.getElementById('back-to-generator-btn')?.addEventListener('click', () => {
        window.location.href = '/generator';
    });

    // Hook for auth modal to re-render this block after successful login
    window.afterAuthSuccess = renderPricingAuthBlock;
});