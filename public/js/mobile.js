// Дополнительные исправления для мобильных устройств
document.addEventListener('DOMContentLoaded', () => {
    // Определение мобильного устройства
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isMobile) {
        document.body.classList.add('mobile-device');

        // Исправление для iOS Safari viewport
        if (isIOS) {
            document.body.classList.add('ios-device');

            // Исправление высоты для iOS
            const setIOSHeight = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };

            setIOSHeight();
            window.addEventListener('resize', setIOSHeight);
            window.addEventListener('orientationchange', () => {
                setTimeout(setIOSHeight, 100);
            });
        }

        // Предотвращение зума при фокусе на input
        const preventZoom = () => {
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    if (input.style.fontSize !== '16px') {
                        input.style.fontSize = '16px';
                    }
                });
            });
        };

        preventZoom();

        // Улучшение скролла для мобильных
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            // Добавляем momentum scrolling для iOS
            chatMessages.style.webkitOverflowScrolling = 'touch';

            // Предотвращение bounce эффекта
            chatMessages.addEventListener('touchstart', (e) => {
                const scrollTop = chatMessages.scrollTop;
                const scrollHeight = chatMessages.scrollHeight;
                const height = chatMessages.clientHeight;

                if (scrollTop === 0) {
                    chatMessages.scrollTop = 1;
                } else if (scrollTop + height >= scrollHeight) {
                    chatMessages.scrollTop = scrollHeight - height - 1;
                }
            });
        }

        // Исправление для клавиатуры
        let initialViewportHeight = window.innerHeight;

        const handleViewportChange = () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;

            // Если высота уменьшилась более чем на 150px, вероятно открылась клавиатура
            if (heightDifference > 150) {
                document.body.classList.add('keyboard-open');

                // Скроллим к активному элементу
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    setTimeout(() => {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            } else {
                document.body.classList.remove('keyboard-open');
            }
        };

        window.addEventListener('resize', handleViewportChange);

        // Дополнительные стили для мобильных устройств
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            .mobile-device #chat-messages {
                padding-bottom: 20px;
            }
            
            .mobile-device.keyboard-open #chat-container {
                height: 50vh;
            }
            
            .ios-device #app-page {
                height: calc(var(--vh, 1vh) * 100);
            }
            
            .ios-device #chat-container {
                height: calc(var(--vh, 1vh) * 100 - 140px);
            }
            
            .mobile-device .message-bubble {
                font-size: 16px;
                line-height: 1.5;
            }
            
            .mobile-device .ai-bubble pre {
                font-size: 14px;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
        `;
        document.head.appendChild(mobileStyles);
    }

    // Улучшение функции скролла для всех устройств
    window.scrollToBottom = (smooth = true) => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const scrollOptions = {
                top: chatMessages.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            };

            if (isMobile) {
                // Для мобильных устройств используем более надежный метод
                setTimeout(() => {
                    chatMessages.scrollTo(scrollOptions);
                }, 100);
            } else {
                chatMessages.scrollTo(scrollOptions);
            }
        }
    };

    // Автоматический скролл при добавлении новых сообщений
    const observeNewMessages = () => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Проверяем, добавлено ли новое сообщение
                        const addedMessage = Array.from(mutation.addedNodes).find(node =>
                            node.nodeType === Node.ELEMENT_NODE && node.classList.contains('chat-message')
                        );

                        if (addedMessage) {
                            setTimeout(() => window.scrollToBottom(), 150);
                        }
                    }
                });
            });

            observer.observe(chatMessages, { childList: true });
        }
    };

    observeNewMessages();

    // Исправление для touch событий на кнопках
    const improveButtonTouch = () => {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });

            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
            });
        });
    };

    if (isMobile) {
        improveButtonTouch();
    }
});