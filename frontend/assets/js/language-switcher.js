let currentLanguage = localStorage.getItem('language') || 'sk';

function getTranslation(key, params = {}) {
    if (!translations[currentLanguage] || !translations[currentLanguage][key]) {
        console.warn(`Translation not found for key: ${key} in language: ${currentLanguage}`);
        return key;
    }
    
    let translation = translations[currentLanguage][key];
    for (const [paramKey, paramValue] of Object.entries(params)) {
        translation = translation.replace(`{${paramKey}}`, paramValue);
    }
    
    return translation;
}

function switchLanguage(lang) {
    if (!translations[lang]) {
        console.error(`Language not supported: ${lang}`);
        return;
    }
    
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
    
    const langNotification = document.createElement('div');
    langNotification.className = 'lang-notification';
    langNotification.textContent = getTranslation('language_changed');
    document.body.appendChild(langNotification);
    
    setTimeout(() => {
        langNotification.classList.add('show');
        setTimeout(() => {
            langNotification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(langNotification);
            }, 300);
        }, 2000);
    }, 100);
}

function updatePageLanguage() {
    document.documentElement.lang = currentLanguage;
    
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-lang-title]').forEach(element => {
        const key = element.getAttribute('data-lang-title');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.title = translations[currentLanguage][key];
        }
    });
    
  
    
    document.querySelectorAll('.language-switcher button').forEach(button => {
        const lang = button.getAttribute('data-lang');
        if (lang === currentLanguage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

document.addEventListener('DOMContentLoaded', () => {

        updatePageLanguage();
});

function translateString(key, params = {}) {
    return getTranslation(key, params);
}

window.translateString = translateString;
window.switchLanguage = switchLanguage;
window.getTranslation = getTranslation;