document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    const usernameText = document.getElementById('usernameText');
    const welcomeUsername = document.getElementById('welcomeUsername'); // <--- toto je nové
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const pdfEditorLink = document.getElementById('pdfEditorLink');
    const historyLink = document.getElementById('historyLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (username) {
        if (usernameText) usernameText.innerText = username;
        if (welcomeUsername) welcomeUsername.innerText = username; // <--- toto je nové
        if (userInfo) userInfo.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (pdfEditorLink) pdfEditorLink.style.display = 'block';
        if (role === 'admin' && historyLink) historyLink.style.display = 'block';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});
