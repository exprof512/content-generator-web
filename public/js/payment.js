document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = window.API_BASE_URL || '';
    const cloudPaymentsPublicId = window.CLOUDPAYMENTS_PUBLIC_ID || '';

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
    async function initPayment() {
        const urlParams = new URLSearchParams(window.location.search);
        const tariff = urlParams.get('tariff');

        if (!tariff) {
            showToast('Тариф не выбран', 'error');
            return;
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            showToast('Сначала войдите в аккаунт', 'error');
            return;
        }

        try {
            const res = await fetch(`${apiBaseUrl}/api/payment/charge`, {
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

            const widget = new cp.CloudPayments();
            widget.pay('charge', // или 'auth'
                {
                    publicId: cloudPaymentsPublicId, //id из личного кабинета
                    description: paymentData.description,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    accountId: paymentData.accountId,
                    invoiceId: paymentData.invoiceId,
                    email: paymentData.email,
                    skin: "modern", //дизайн виджета
                    autoClose: 3,
                    data: paymentData.data
                },
                {
                    onSuccess: function (options) { // success
                        showToast('Оплата прошла успешно!', 'success');
                        setTimeout(() => { window.location.href = '/'; }, 2000);
                    },
                    onFail: function (reason, options) { // fail
                        showToast(`Ошибка оплаты: ${reason}`, 'error');
                    },
                    onComplete: function (paymentResult, options) { //Вызывается как только виджет получает от api.cloudpayments ответ с результатом транзакции.
                        //например вызов вашей аналитики Facebook Pixel)
                    }
                }
            )
        } catch (e) {
            console.error(`Payment error for ${tariff}:`, e);
            showToast(`Ошибка оплаты: ${e.message || 'Неизвестная ошибка'}`, 'error');
        }
    }

    initPayment();
});