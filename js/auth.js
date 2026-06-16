import { BASE_URL } from './api.js';

const TOKEN_KEY = 'bc26_token';
const USER_KEY  = 'bc26_user';

let currentToken = localStorage.getItem(TOKEN_KEY) || null;
let currentUser  = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

export function getToken()    { return currentToken; }
export function getUser()     { return currentUser;  }
export function isLoggedIn()  { return !!currentToken; }

export function setSession(token, user) {
    currentToken = token;
    currentUser  = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.dispatchEvent(new CustomEvent('auth-changed'));
}

export function clearSession() {
    currentToken = null;
    currentUser  = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.dispatchEvent(new CustomEvent('auth-changed'));
}

export async function authFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (response.status === 401) clearSession();
    return response;
}

export async function register(email, username, password) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao criar conta');
    setSession(data.token, data.user);
    return data.user;
}

export async function login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');
    setSession(data.token, data.user);
    return data.user;
}

/**
 * Chamado pelo Google One Tap / botão GSI.
 * @param {string} credential  - JWT retornado pelo Google
 * @param {string} [username]  - enviado apenas na segunda tentativa (tela de username)
 * @returns {{ needsUsername: boolean, suggestion?: string, credential?: string } | void}
 */
export async function googleLogin(credential, username = null) {
    const body = { credential };
    if (username) body.username = username;

    const response = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.status === 202 && data.needsUsername) {
        // Precisa pedir username ao usuário
        return { needsUsername: true, suggestion: data.suggestion, credential: data.credential };
    }

    if (!response.ok) throw new Error(data.error || 'Erro ao entrar com Google');

    setSession(data.token, data.user);
    return { needsUsername: false };
}

export function logout() {
    clearSession();
}