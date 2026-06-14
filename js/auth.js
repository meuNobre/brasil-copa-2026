import { BASE_URL } from './api.js';

const TOKEN_KEY = 'bc26_token';
const USER_KEY = 'bc26_user';

// Estado em memória + sincronizado com localStorage (persiste entre sessões
// do navegador, que é o comportamento esperado para "ficar logado").
let currentToken = localStorage.getItem(TOKEN_KEY) || null;
let currentUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

export function getToken() {
    return currentToken;
}

export function getUser() {
    return currentUser;
}

export function isLoggedIn() {
    return !!currentToken;
}

export function setSession(token, user) {
    currentToken = token;
    currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.dispatchEvent(new CustomEvent('auth-changed'));
}

export function clearSession() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.dispatchEvent(new CustomEvent('auth-changed'));
}

/**
 * fetch autenticado: anexa o Bearer token automaticamente.
 * Se a API responder 401, limpa a sessão local.
 */
export async function authFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
        clearSession();
    }

    return response;
}

export async function register(email, username, password) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
    }

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

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
    }

    setSession(data.token, data.user);
    return data.user;
}

export function logout() {
    clearSession();
}
