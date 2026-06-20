import { fetchData } from './api.js';
import { getUser } from './auth.js';

export async function loadRanking() {
    const container = document.getElementById('ranking-content');

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Carregando ranking...</p>
        </div>
    `;

    try {
        const data = await fetchData('/bolao/ranking');

        if (!data.ranking || data.ranking.length === 0) {
            container.innerHTML = `
                <div class="info-card">
                    <p class="info-card-text">
                        Ainda não há participantes no bolão. Crie sua conta e
                        seja o primeiro a palpitar!
                    </p>
                </div>
            `;
            return;
        }

        const meuUsername = getUser()?.username;

        let html = `
            <div class="status-bar">
                <span class="section-title">Ranking do Bolão</span>
                <button class="refresh-btn" onclick="window.loadRanking()">↻ Atualizar</button>
            </div>
            <div class="game-card" style="padding:0;overflow:hidden">
                <table class="group-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style="text-align:left">Jogador</th>
                            <th>Jogos</th>
                            <th>Placar</th>
                            <th>Result.</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.ranking.forEach(r => {
            const isMe = r.username === meuUsername;
            const medalha = r.posicao === 1 ? '1º' : (r.posicao === 2 ? '2º' : (r.posicao === 3 ? '3º' : r.posicao + 'º'));

            html += `
                <tr class="${isMe ? 'brasil-row' : ''}">
                    <td>
                        <span class="pos-num ${r.posicao <= 3 ? 'q' : ''}">${medalha}</span>
                    </td>
                    <td>${r.username}${isMe ? ' <small style="color:var(--muted)">(você)</small>' : ''}</td>
                    <td>${r.jogosAvaliados}</td>
                    <td>${r.acertosExatos}</td>
                    <td>${r.acertosResultado}</td>
                    <td><strong>${r.pontos}</strong></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <p style="font-size:0.72rem;color:var(--muted);margin-top:0.5rem">
                Placares exatos · Resultados certos · Pontos: 10 por placar exato, 5 por resultado certo
            </p>
        `;

        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-card">
                <p>Erro ao buscar ranking</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}