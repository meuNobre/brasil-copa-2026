import { fetchData, BRASIL_TEAM_ID } from './api.js';
import { renderGame, renderCountdown, renderStats } from './ui.js';

/**
 * Busca jogos do Brasil na Copa do Mundo
 */
export async function loadJogos() {
    const container = document.getElementById('jogos-content');

    try {
        const data = await fetchData('/jogos');

        if (!data || !Array.isArray(data.matches)) {
            throw new Error("Formato inválido da API");
        }

        const games = data.matches.filter(match =>
            match.homeTeam?.id === BRASIL_TEAM_ID ||
            match.awayTeam?.id === BRASIL_TEAM_ID
        );

        const finished = games.filter(g => g.status === 'FINISHED');
        const live = games.filter(g => g.status === 'IN_PLAY' || g.status === 'PAUSED');
        const upcoming = games.filter(g => g.status === 'SCHEDULED' || g.status === 'TIMED');

        const wins = finished.filter(g => {
            const brasilHome = g.homeTeam.id === BRASIL_TEAM_ID;
            const brasilScore = brasilHome ? g.score.fullTime.home : g.score.fullTime.away;
            const outroScore = brasilHome ? g.score.fullTime.away : g.score.fullTime.home;
            return brasilScore > outroScore;
        }).length;

        const goals = finished.reduce((acc, g) => {
            const brasilHome = g.homeTeam.id === BRASIL_TEAM_ID;
            return acc + (brasilHome ? g.score.fullTime.home : g.score.fullTime.away);
        }, 0);

        let html = '';

        html += renderStats(finished.length, wins, goals);

        if (upcoming.length > 0) {
            const next = upcoming[0];
            const opponent = next.homeTeam.id === BRASIL_TEAM_ID
                ? next.awayTeam.name
                : next.homeTeam.name;

            html += `
                <div class="next-game-highlight">
                    <div class="next-label">⚽ Próximo jogo</div>
                    <div class="next-match">Brasil × ${opponent}</div>
                    <div class="next-datetime">${next.utcDate}</div>
                    ${renderCountdown(next.utcDate)}
                </div>
            `;
        }

        if (live.length > 0) {
            html += `<div class="status-bar">
                <span class="section-title">🔴 Ao vivo agora</span>
            </div>`;
            live.forEach(game => html += renderGame(game));
        }

        if (upcoming.length > 0) {
            html += `<div class="status-bar" style="margin-top:1.5rem">
                <span class="section-title">Próximos jogos</span>
            </div>`;
            upcoming.forEach((game, index) => {
                html += renderGame(game, index === 0);
            });
        }

        if (finished.length > 0) {
            html += `<div class="status-bar" style="margin-top:1.5rem">
                <span class="section-title">Resultados</span>
                <button class="refresh-btn" onclick="loadJogos()">↻ Atualizar</button>
            </div>`;
            [...finished].reverse().forEach(game => {
                html += renderGame(game);
            });
        }

        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-card">
                <p>Erro ao buscar jogos</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}
