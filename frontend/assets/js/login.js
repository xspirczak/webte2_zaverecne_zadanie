document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const responseMsg = document.getElementById('responseMsg');

    let errorDiv = document.getElementById('errorDiv');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorDiv';
        errorDiv.className = 'alert alert-danger d-none';
        form.parentNode.insertBefore(errorDiv, form);
    }

    function togglePassword(fieldId, icon) {
        const field = document.getElementById(fieldId);
        if (field.type === "password") {
            field.type = "text";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            field.type = "password";
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    window.togglePassword = togglePassword;

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    function hideError() {
        errorDiv.textContent = '';
        errorDiv.classList.add('d-none');
    }

    function validateInput(input, condition) {
        if (condition) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            return true;
        } else {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            return false;
        }
    }

    function validateFormFields() {
        const validEmail = validateInput(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
        const validPassword = validateInput(password, password.value.trim().length > 0);
        return validEmail && validPassword;
    }

    [email, password].forEach(input => {
        input.addEventListener('input', () => {
            hideError();
            validateFormFields();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        responseMsg.innerText = '';

        if (!validateFormFields()) {
            showError("Zadajte platný email a heslo.");
            return;
        }

        const data = {
            email: email.value.trim(),
            password: password.value
        };

        try {
            const res = await fetch(`${BACKEND_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                mode: 'cors'
            });

            const result = await res.json();

            if (res.ok) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('role', result.role);
                localStorage.setItem('username', result.username);
                responseMsg.innerText = "Úspešne prihlásený!";
                responseMsg.style.color = 'green';
                setTimeout(() => window.location.href = "dashboard.html", 1000);
            } else {
                showError("Neplatný email alebo heslo.");
            }

        } catch (err) {
            console.error("Chyba počas prihlásenia:", err);
            showError("Nepodarilo sa pripojiť k serveru.");
        }
    });
});
