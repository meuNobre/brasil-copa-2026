import { login, register, logout, isLoggedIn, getUser, googleLogin } from './auth.js';


const GOOGLE_CLIENT_ID = '775293905598-g38j9qse8i52jlj1ars65jel497t4i82.apps.googleusercontent.com';

export function initAuthUI() {
    const modal          = document.getElementById('auth-modal');
    const closeBtn       = document.getElementById('auth-modal-close');
    const form           = document.getElementById('auth-form');
    const tabLogin       = document.getElementById('auth-tab-login');
    const tabRegister    = document.getElementById('auth-tab-register');
    const usernameField  = document.getElementById('auth-username-field');
    const errorBox       = document.getElementById('auth-error');
    const submitBtn      = document.getElementById('auth-submit');

    // Painel de escolha de username (novo usuário Google)
    const usernamePanel      = document.getElementById('auth-google-username-panel');
    const usernameInput      = document.getElementById('auth-google-username-input');
    const usernameConfirmBtn = document.getElementById('auth-google-username-confirm');
    const usernameError      = document.getElementById('auth-google-username-error');

    let mode = 'login';
    let pendingGoogleCredential = null;

    function initGoogleSignIn() {
        if (!window.google) return;

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            // Desativa o One Tap automático (menos intrusivo)
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        // Renderiza o botão oficial dentro do container
        const container = document.getElementById('auth-google-btn-container');
        if (container) {
            google.accounts.id.renderButton(container, {
                type: 'standard',
                shape: 'rectangular',
                theme: 'outline',
                text: 'signin_with',
                size: 'large',
                locale: 'pt-BR',
                width: container.offsetWidth || 300,
            });
        }
    }

    async function handleGoogleCallback(response) {
        errorBox.textContent = '';
        try {
            const result = await googleLogin(response.credential);
            if (result.needsUsername) {
                pendingGoogleCredential = result.credential;
                showUsernamePanel(result.suggestion);
            } else {
                closeModal();
            }
        } catch (err) {
            errorBox.textContent = err.message;
        }
    }

    // ── Tela de username para novos usuários Google ───────────────────────────
    function showUsernamePanel(suggestion = '') {
        form.style.display = 'none';
        document.querySelector('.auth-tabs').style.display = 'none';
        const googleWrapper = document.getElementById('auth-google-wrapper');
        if (googleWrapper) googleWrapper.style.display = 'none';

        usernamePanel.style.display = 'block';
        usernameInput.value = suggestion;
        usernameError.textContent = '';
        usernameInput.focus();
    }

    function hideUsernamePanel() {
        usernamePanel.style.display = 'none';
        form.style.display = 'block';
        document.querySelector('.auth-tabs').style.display = 'flex';
        const googleWrapper = document.getElementById('auth-google-wrapper');
        if (googleWrapper) googleWrapper.style.display = 'block';
    }

    usernameConfirmBtn?.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        usernameError.textContent = '';
        usernameConfirmBtn.disabled = true;
        usernameConfirmBtn.textContent = 'Aguarde...';
        try {
            await googleLogin(pendingGoogleCredential, username);
            pendingGoogleCredential = null;
            hideUsernamePanel();
            closeModal();
        } catch (err) {
            usernameError.textContent = err.message;
        } finally {
            usernameConfirmBtn.disabled = false;
            usernameConfirmBtn.textContent = 'Confirmar';
        }
    });

    // ── Modal / abas / form email+senha ───────────────────────────────────────
    function setMode(newMode) {
        mode = newMode;
        errorBox.textContent = '';
        tabLogin.classList.toggle('active', mode === 'login');
        tabRegister.classList.toggle('active', mode === 'register');
        usernameField.style.display = mode === 'register' ? 'block' : 'none';
        submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    }

    function closeModal() {
        modal.classList.remove('open');
        form.reset();
        errorBox.textContent = '';
        hideUsernamePanel();
    }

    tabLogin.addEventListener('click', () => setMode('login'));
    tabRegister.addEventListener('click', () => setMode('register'));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Aguarde...';

        const email    = form.email.value.trim();
        const password = form.password.value;
        const username = form.username?.value.trim();

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, username, password);
            }
            closeModal();
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

    // Inicializa Google quando o script GSI estiver carregado
    if (window.google?.accounts) {
        initGoogleSignIn();
    } else {
        // O script GSI é async; espera ele terminar de carregar
        const interval = setInterval(() => {
            if (window.google?.accounts) {
                clearInterval(interval);
                initGoogleSignIn();
            }
        }, 100);
    }
}

export function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
}

function updateAuthHeader() {
    const headerArea = document.getElementById('auth-header-area');
    if (isLoggedIn()) {
        const user = getUser();
        headerArea.innerHTML = `
            <span class="user-badge">${user.username}</span>
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