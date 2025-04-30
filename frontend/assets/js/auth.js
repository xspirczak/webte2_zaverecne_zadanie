document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js sa spustil");

    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    const usernameText = document.getElementById('usernameText');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const pdfEditorLink = document.getElementById('pdfEditorLink');
    const historyLink = document.getElementById('historyLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (username) {
        console.log("Používateľ JE prihlásený:", username);

        if (usernameText) usernameText.innerText = username;
        if (welcomeUsername) welcomeUsername.innerText = username;
        if (userInfo) userInfo.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (pdfEditorLink) pdfEditorLink.style.display = 'block';
        if (role === 'admin' && historyLink) historyLink.style.display = 'block';
    } else {
        console.log("Používateľ NIE je prihlásený – skrývam userInfo a ďalšie časti");

        if (userInfo) userInfo.remove(); // úplne odstráni blok z DOM
        if (pdfEditorLink) pdfEditorLink.style.display = 'none';
        if (historyLink) historyLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});
