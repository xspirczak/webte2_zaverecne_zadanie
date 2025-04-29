document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        const res = await fetch(`${BACKEND_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('access_token', result.access_token);
            localStorage.setItem('role', result.role);
            localStorage.setItem('username', result.username);
            document.getElementById('responseMsg').innerText = "Úspešne prihlásený!";
            setTimeout(() => window.location.href = "dashboard.html", 1000);
        } else {
            document.getElementById('responseMsg').innerText = result.detail;
        }
    });
});
