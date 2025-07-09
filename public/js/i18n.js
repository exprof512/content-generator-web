const i18n = {
    translations: {},
    currentLang: 'ru',

    async init() {
        try {
            const [ru, en] = await Promise.all([
                fetch('/locales/ru.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to load ru.json: ${res.statusText}`);
                    return res.json();
                }),
                fetch('/locales/en.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to load en.json: ${res.statusText}`);
                    return res.json();
                })
            ]);
            this.translations = { ru, en };
        } catch (error) {
            console.error("Error loading translation files:", error);
            document.body.style.visibility = 'visible'; // Show body anyway on error
            return;
        }

        const savedLang = localStorage.getItem('lang') || 'ru';
        this.setLanguage(savedLang);

        document.querySelectorAll('.lang-switcher button[data-lang]').forEach(button => {
            button.addEventListener('click', (event) => {
                // **КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ**: Предотвращаем "всплытие" клика,
                // чтобы он не закрывал меню аккаунта.
                event.stopPropagation(); 
                this.setLanguage(button.dataset.lang);
            });
        });
    },

    setLanguage(lang) {
        if (!['ru', 'en'].includes(lang)) {
            lang = 'ru';
        }
        this.currentLang = lang;
        localStorage.setItem('lang', lang);

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.getTranslation(key);
            if (text) {
                if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && element.hasAttribute('placeholder')) {
                    element.placeholder = text;
                } else {
                    element.textContent = text;
                }
            }
        });

        const generateButton = document.getElementById('generate-button');
        if (generateButton) {
            generateButton.title = this.getTranslation('app.generateTitle');
        }
        const accountButton = document.getElementById('user-profile-button');
        if (accountButton) {
            accountButton.title = this.getTranslation('account.title');
        }

        this.updateSwitchers(lang);
        
        if (document.body.style.visibility === 'hidden') {
            document.body.style.visibility = 'visible';
        }
    },

    getTranslation(key) {
        const keys = key.split('.');
        let result = this.translations[this.currentLang];
        for (const k of keys) {
            result = result ? result[k] : undefined;
        }
        return result || key;
    },

    updateSwitchers(lang) {
        document.querySelectorAll('.lang-switcher').forEach(switcher => {
            const ruButton = switcher.querySelector('[data-lang="ru"]');
            const enButton = switcher.querySelector('[data-lang="en"]');
            if (ruButton && enButton) {
                ruButton.classList.toggle('text-purple-600', lang === 'ru');
                ruButton.classList.toggle('font-semibold', lang === 'ru');
                ruButton.classList.toggle('text-gray-400', lang !== 'ru');

                enButton.classList.toggle('text-purple-600', lang === 'en');
                enButton.classList.toggle('font-semibold', lang === 'en');
                enButton.classList.toggle('text-gray-400', lang !== 'en');
            }
        });
    }
};