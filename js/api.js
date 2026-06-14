const BRASIL_TEAM_ID = 764; // ID do Brasil (Football-Data v4 "competitions/WC/matches")
const BASE_URL = 'https://brasil-copa-2026-api.vercel.app/api';

export async function fetchData(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

export { BRASIL_TEAM_ID, BASE_URL };
