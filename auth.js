async function postJson(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({ message: 'Unexpected server response.' }));
    return { ok: response.ok, data };
}

function showMessage(messageElement, message, isError = true) {
    if (!messageElement) {
        alert(message);
        return;
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? 'red' : 'green';
}

function clearPasswords(...passwordInputs) {
    passwordInputs.forEach(input => {
        if (input) {
            input.value = '';
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const createForm = document.getElementById('create-account-form');
    const resetForm = document.getElementById('reset-password-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const messageElement = document.getElementById('login-message');

            const result = await postJson('/api/auth/login', {
                username: usernameInput.value.trim(),
                password: passwordInput.value
            });

            //where the userID is stored
            //const user = JSON.parse(localStorage.getItem("gmUser"));
            //const userId = user.userId;
            if (result.ok) {
                localStorage.setItem('gmUser', JSON.stringify(result.data));
                window.location.href = 'home.html';
            } else {
                showMessage(messageElement, result.data.message || 'Login failed.');
                usernameInput.value = '';
                clearPasswords(passwordInput);
            }
        });
    }

    if (createForm) {
        createForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('create-username');
            const passwordInput = document.getElementById('create-password');
            const confirmPasswordInput = document.getElementById('create-confirm-password');
            const messageElement = document.getElementById('create-message');

            const result = await postJson('/api/auth/register', {
                username: usernameInput.value.trim(),
                password: passwordInput.value,
                confirmPassword: confirmPasswordInput.value
            });

            if (result.ok) {
                showMessage(messageElement, result.data.message || 'Account created successfully.', false);
                window.location.href = 'login.html';
            } else {
                showMessage(messageElement, result.data.message || 'Account creation failed.');
                clearPasswords(passwordInput, confirmPasswordInput);
            }
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('reset-username');
            const passwordInput = document.getElementById('reset-password');
            const confirmPasswordInput = document.getElementById('reset-confirm-password');
            const messageElement = document.getElementById('reset-message');

            const result = await postJson('/api/auth/reset-password', {
                username: usernameInput.value.trim(),
                password: passwordInput.value,
                confirmPassword: confirmPasswordInput.value
            });

            if (result.ok) {
                showMessage(messageElement, result.data.message || 'Password reset successful.', false);
                window.location.href = 'login.html';
            } else {
                showMessage(messageElement, result.data.message || 'Password reset failed.');
                usernameInput.value = '';
                clearPasswords(passwordInput, confirmPasswordInput);
            }
        });
    }
});