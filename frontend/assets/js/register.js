document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const res = await fetch(`${BACKEND_URL}/api/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            const msgElement = document.getElementById('responseMsg');

            if (res.ok) {
                msgElement.innerText = result.message || "Registrácia prebehla úspešne.";
                msgElement.style.color = 'green';

                // ✅ Presmerovanie na login
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                msgElement.innerText = result.detail || "Chyba pri registrácii.";
                msgElement.style.color = 'red';
            }

        } catch (error) {
            console.error("Chyba počas registrácie:", error);
            document.getElementById('responseMsg').innerText = "Nastala chyba pri komunikácii so serverom.";
        }
    });
});
