import { fetchData, BRASIL_TEAM_ID } from './api.js';
import { getFlag, translateTeamName } from './ui.js';

/**
 * Busca classificação do grupo do Brasil
 */
export async function loadGrupo() {
    const container = document.getElementById('grupo-content');

    try {
        const data = await fetchData('/grupo');
        
        const brasilGroup = data.standings.find(standing =>
            standing.table.some(row => row.team.id === BRASIL_TEAM_ID)
        );

        if (!brasilGroup) {
            throw new Error('Grupo não encontrado');
        }

        const standings = brasilGroup.table;

        let html = `
            <div class="status-bar">
                <span class="section-title">Grupo ${brasilGroup.group}</span>
                <button class="refresh-btn" onclick="loadGrupo()">↻ Atualizar</button>
            </div>
            <div class="game-card" style="padding:0;overflow:hidden">
                <table class="group-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style="text-align:left">Time</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>SG</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        standings.forEach((row, index) => {
            const isBrasil = row.team.id === BRASIL_TEAM_ID;
            const isQualified = index < 2;
            const goalDiff = row.goalsFor - row.goalsAgainst;

            html += `
                <tr class="${isBrasil ? 'brasil-row' : ''} ${isQualified ? 'qualified' : ''}">
                    <td>
                        <span class="pos-num ${isQualified ? 'q' : ''}">
                            ${row.position}
                        </span>
                    </td>
                    <td>${getFlag(row.team.name)} ${translateTeamName(row.team.name)}</td>
                    <td>${row.playedGames}</td>
                    <td>${row.won}</td>
                    <td>${row.draw}</td>
                    <td>${row.lost}</td>
                    <td>${goalDiff >= 0 ? '+' : ''}${goalDiff}</td>
                    <td><strong>${row.points}</strong></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <p style="font-size:0.72rem;color:var(--muted);margin-top:0.5rem">
                🟢 Posição verde = classificado para o mata-mata
            </p>
        `;

        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-card">
                <p>Erro ao buscar classificação</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}