document.addEventListener('DOMContentLoaded', () => {

    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    const usernameText = document.getElementById('usernameText');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const pdfEditorLink = document.getElementById('pdfEditorLink');
    const historyLink = document.getElementById('historyLink');
    const manualLink = document.getElementById('manualLink');
    const apiDocsLink = document.getElementById('apiDocsLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardLink = document.getElementById('dashboardLink');

    if (username) {

        if (usernameText) usernameText.innerText = username;
        if (welcomeUsername) welcomeUsername.innerText = username;
        if (userInfo) userInfo.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (pdfEditorLink) pdfEditorLink.style.display = 'block';
        if (manualLink) manualLink.style.display = 'block';
        if (apiDocsLink) apiDocsLink.style.display = 'block';
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (role === 'admin' && historyLink) historyLink.style.display = 'block';
    } else {

        if (userInfo) userInfo.remove();
        if (pdfEditorLink) pdfEditorLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (manualLink) manualLink.style.display = 'none';
        if (apiDocsLink) apiDocsLink.style.display = 'none';
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


    //Prístupy na podstránky podľa roly
    const token = localStorage.getItem("access_token");
    const currentPage = window.location.pathname.split("/").pop();

    const protectedPages = ["dashboard.html", "pdf.html", "manual.html"];
    const authPages = ["login.html", "register.html"];

    // Používateľ NIE je prihlásený – zablokuj prístup na chránené stránky
    if (!token && protectedPages.includes(currentPage)) {
        window.location.href = "login.html";
    }

    // Používateľ JE prihlásený – zablokuj prístup na login a register
    if (token && authPages.includes(currentPage)) {
        window.location.href = "index.html";
    }

    // Ak je bežný používateľ na history.html → prístup zamietnutý
    if (currentPage === "history.html") {
        if (!token) {
            window.location.href = "login.html";
        } else if (role !== "admin") {
            window.location.href = "access_denied.html";
        }
    }

    if(currentPage === "manual_edit.html")  {
        if (!token) {
            window.location.href = "login.html";
        }
        else if (role !== "admin") {
            window.location.href = "access_denied.html";
        }
    }


    //Expirácia a refresh access tokenu
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (e) {
            return null;
        }
    }

    function showTokenExpiredModal() {
        $('#tokenExpiredModal').modal('show');
    }

    function checkTokenExpiration() {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const payload = parseJwt(token);
        if (!payload || !payload.exp) return;

        const exp = payload.exp * 1000; // sekundy → ms
        const now = Date.now();

        if (now >= exp) {
            showTokenExpiredModal();
        } else {
            // automaticky skontroluj znova 10 sekúnd pred expiráciou
            setTimeout(checkTokenExpiration, exp - now - 10000);
        }
    }


    const refreshModalBtn = document.getElementById('refreshModalBtn');

    if (refreshModalBtn) {
        refreshModalBtn.addEventListener('click', () => {
            const token = localStorage.getItem("access_token");

            fetch("http://localhost:8000/api/user/refresh-token", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error("Obnovenie zlyhalo.");
                    return res.json();
                })
                .then(data => {
                    localStorage.setItem("access_token", data.access_token);

                    // Zobraz správu v modali
                    const tokenMsg = document.getElementById("tokenMessage");
                    if (tokenMsg) {
                        tokenMsg.textContent = "Token bol úspešne obnovený. Pokračujte v práci.";
                        tokenMsg.style.color = "green";
                    }

                    // Zavri modal po 3 sekundách
                    setTimeout(() => {
                        $('#tokenExpiredModal').modal('hide');
                        if (tokenMsg) tokenMsg.textContent = "";
                        checkTokenExpiration(); // nastav kontrolu znova
                    }, 3000);
                })
                .catch(err => {
                    const tokenMsg = document.getElementById("tokenMessage");
                    if (tokenMsg) {
                        tokenMsg.textContent = "Chyba pri obnove tokenu. Prihláste sa znova.";
                        tokenMsg.style.color = "red";
                    }
                    setTimeout(() => window.location.href = "login.html", 3000);
                });
        });
    }

    checkTokenExpiration();
});




