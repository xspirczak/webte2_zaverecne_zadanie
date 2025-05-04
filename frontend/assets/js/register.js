document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const errorDiv = document.getElementById('errorDiv');

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

    // Globálne prístupné pre HTML (onclick)
    window.togglePassword = togglePassword;

    function showError(message) {
        errorDiv.innerText = message;
        errorDiv.classList.remove('d-none');
    }

    function hideError() {
        errorDiv.innerText = '';
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
        const validName = validateInput(username, username.value.trim().length >= 3);
        const validEmail = validateInput(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
        const validPassword = validateInput(password, password.value.length >= 6);
        const passwordsMatch = validateInput(confirmPassword, password.value === confirmPassword.value);

        return validName && validEmail && validPassword && passwordsMatch;
    }

    [username, email, password, confirmPassword].forEach(input => {
        input.addEventListener('input', () => {
            hideError();
            validateFormFields();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!validateFormFields()) {
            showError("Prosím skontrolujte a opravte chyby vo formulári.");
            return;
        }

        const data = {
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value
        };

        try {
            const res = await fetch(`${BACKEND_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            const msgElement = document.getElementById('responseMsg');

            if (res.ok) {
                msgElement.innerText = result.message || "Registrácia prebehla úspešne.";
                msgElement.style.color = 'green';
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                showError(result.detail || "Chyba pri registrácii.");
            }

        } catch (error) {
            console.error("Chyba počas registrácie:", error);
            showError("Nastala chyba pri komunikácii so serverom.");
        }
    });
});
