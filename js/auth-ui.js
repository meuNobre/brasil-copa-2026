import { login, register, logout, isLoggedIn, getUser } from './auth.js';

export function initAuthUI() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close');
    const form = document.getElementById('auth-form');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const usernameField = document.getElementById('auth-username-field');
    const errorBox = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit');

    let mode = 'login';

    function setMode(newMode) {
        mode = newMode;
        errorBox.textContent = '';
        tabLogin.classList.toggle('active', mode === 'login');
        tabRegister.classList.toggle('active', mode === 'register');
        usernameField.style.display = mode === 'register' ? 'block' : 'none';
        submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    }

    tabLogin.addEventListener('click', () => setMode('login'));
    tabRegister.addEventListener('click', () => setMode('register'));

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Aguarde...';

        const email = form.email.value.trim();
        const password = form.password.value;
        const username = form.username.value.trim();

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, username, password);
            }
            modal.classList.remove('open');
            form.reset();
        } catch (err) {
            errorBox.textContent = err.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
        }
    });

    setMode('login');

    document.addEventListener('auth-changed', updateAuthHeader);
    updateAuthHeader();
}

export function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
}

function updateAuthHeader() {
    const headerArea = document.getElementById('auth-header-area');

    if (isLoggedIn()) {
        const user = getUser();
        headerArea.innerHTML = `
            <span class="user-badge">👤 ${user.username}</span>
            <button class="tab" id="logout-btn">Sair</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            logout();
            window.location.reload();
        });
    } else {
        headerArea.innerHTML = `
            <button class="tab" id="login-btn">Entrar</button>
        `;
        document.getElementById('login-btn').addEventListener('click', openAuthModal);
    }
}

window.openAuthModal = openAuthModal;
