import { authFetch } from './auth.js';
import { getFlag, translateTeamName, formatDate, stageLabel } from './ui.js';
import { isLoggedIn } from './auth.js';

const BRASIL_TEAM_ID = 764; // ID da Football-Data usado pelo backend do bolão

// ordem de exibição das fases do mata-mata (cobre variações de nomenclatura da API)
const ORDEM_FASES = [
    'GROUP_STAGE',
    'LAST_32', 'ROUND_OF_32',
    'LAST_16', 'ROUND_OF_16',
    'QUARTER_FINALS', 'QUARTERFINALS',
    'SEMI_FINALS', 'SEMIFINALS',
    'THIRD_PLACE',
    'FINAL'
];

/**
 * Carrega os jogos da fase de grupos do Brasil e renderiza o bolão.
 */
export async function loadBolao() {
    const container = document.getElementById('bolao-content');

    if (!isLoggedIn()) {
        container.innerHTML = renderLoginPrompt();
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Carregando seu bolão...</p>
        </div>
    `;

    try {
        const response = await authFetch('/bolao/jogos');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar bolão');
        }

        if (!data.jogos || data.jogos.length === 0) {
            container.innerHTML = `
                <div class="info-card">
                    <p class="info-card-text">
                        Ainda não há jogos cadastrados no bolão.
                        Volte em breve!
                    </p>
                </div>
            `;
            return;
        }

        let totalPontos = 0;
        let jogosAvaliados = 0;

        data.jogos.forEach(jogo => {
            if (jogo.status === 'FINISHED' && jogo.meuPalpite?.pontos !== null && jogo.meuPalpite?.pontos !== undefined) {
                totalPontos += jogo.meuPalpite.pontos;
                jogosAvaliados++;
            }
        });

        const fases = agruparPorFase(data.jogos);
        const faseGrupos = fases.find(f => f.chave === 'GROUP_STAGE');
        const fasesMataMata = fases.filter(f => f.chave !== 'GROUP_STAGE');

        let html = '';

        if (faseGrupos) {
            html += `
                <div class="status-bar">
                    <span class="section-title">Fase de Grupos</span>
                </div>
            `;
            html += faseGrupos.jogos.map(renderJogoBolao).join('');
        }

        if (fasesMataMata.length > 0) {
            html += `
                <div class="status-bar" style="margin-top:${faseGrupos ? '1.75rem' : '0'}">
                    <span class="section-title">Mata-Mata 🏆</span>
                </div>
                <p class="bracket-hint">Arraste para o lado pra ver todas as fases →</p>
                <div class="bracket-wrap">
                    ${fasesMataMata.map(renderColunaFase).join('')}
                </div>
            `;
        }

        const resumo = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-num verde">${totalPontos}</div>
                    <div class="stat-label">Seus pontos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num amarelo">${jogosAvaliados}</div>
                    <div class="stat-label">Jogos avaliados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num verde">${data.jogos.length}</div>
                    <div class="stat-label">Total de jogos</div>
                </div>
            </div>
        `;

        const legenda = `
            <div class="api-note">
                <p>
                    <strong>Como pontuar:</strong> acerte o placar exato e ganhe
                    <strong>10 pontos</strong>. Acerte só o resultado (vitória, empate
                    ou derrota do Brasil) e ganhe <strong>5 pontos</strong>. Errar tudo
                    não pontua. Palpites podem ser enviados ou editados até o
                    início de cada jogo. No mata-mata, cada fase aparece como uma
                    coluna do chaveamento — o adversário só pode ser palpitado
                    depois que o confronto anterior define quem avança.
                </p>
            </div>
        `;

        container.innerHTML = resumo + legenda + html;

        // liga os eventos de envio de palpite
        container.querySelectorAll('form.palpite-form').forEach(form => {
            form.addEventListener('submit', onSubmitPalpite);
        });

    } catch (error) {
        container.innerHTML = `
            <div class="error-card">
                <p>Erro ao carregar o bolão</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

/**
 * Agrupa os jogos por fase (grupo único + uma coluna por fase do mata-mata),
 * já na ordem correta de progressão do chaveamento.
 */
function agruparPorFase(jogos) {
    const grupos = new Map();

    jogos.forEach(jogo => {
        const chave = jogo.stage || (jogo.groupName ? 'GROUP_STAGE' : 'OUTROS');
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(jogo);
    });

    const chaves = [...grupos.keys()].sort((a, b) => {
        const ia = ORDEM_FASES.indexOf(a);
        const ib = ORDEM_FASES.indexOf(b);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });

    return chaves.map(chave => ({ chave, jogos: grupos.get(chave) }));
}

function renderColunaFase(fase) {
    return `
        <div class="bracket-round">
            <div class="bracket-round-title">${stageLabel(fase.chave)}</div>
            ${fase.jogos.map(renderJogoDoMataMata).join('')}
        </div>
    `;
}

function renderJogoDoMataMata(jogo) {
    const homeDefinido = Boolean(jogo.homeTeamId);
    const awayDefinido = Boolean(jogo.awayTeamId);

    if (!homeDefinido || !awayDefinido) {
        return `
            <div class="bracket-match-tbd">
                <div class="game-date">${formatDate(jogo.utcDate)}</div>
                <div class="bracket-tbd-text">
                    ${homeDefinido ? translateTeamName(jogo.homeTeamName) : 'A definir'}
                    <span class="palpite-x">×</span>
                    ${awayDefinido ? translateTeamName(jogo.awayTeamName) : 'A definir'}
                </div>
                <div class="bracket-tbd-note">Confronto ainda não definido</div>
            </div>
        `;
    }

    return renderJogoBolao(jogo);
}

function renderLoginPrompt() {
    return `
        <div class="info-card">
            <span class="info-card-title">Bolão da Copa</span>
            <p class="info-card-text">
                Faça login ou crie uma conta para montar seu bolão da fase de
                grupos do Brasil, registrar seus palpites e disputar o ranking
                com outros torcedores.
            </p>
            <button class="btn-support" onclick="window.openAuthModal()">
                Entrar ou criar conta
            </button>
        </div>
    `;
}

function renderJogoBolao(jogo) {
    const isBrasilHome = jogo.homeTeamId === BRASIL_TEAM_ID;
    const homeName = translateTeamName(jogo.homeTeamName);
    const awayName = translateTeamName(jogo.awayTeamName);

    const palpite = jogo.meuPalpite;
    const bloqueado = jogo.bloqueado;
    const finalizado = jogo.status === 'FINISHED';

    let pontosTag = '';
    if (finalizado && palpite && palpite.pontos !== null && palpite.pontos !== undefined) {
        const cls = palpite.pontos === 10 ? 'win' : (palpite.pontos === 5 ? 'draw' : 'loss');
        const texto = palpite.pontos === 10
            ? 'Placar exato (+10)'
            : (palpite.pontos === 5 ? 'Resultado certo (+5)' : 'Sem pontos');
        pontosTag = `<span class="score-status ${cls}">${texto}</span>`;
    }

    const placarReal = finalizado
        ? `<span class="score">${jogo.homeScore ?? '?'} <span class="score-sep">×</span> ${jogo.awayScore ?? '?'}</span>`
        : '';

    const temPenaltis = jogo.penaltiesHome !== null && jogo.penaltiesHome !== undefined;
    const penaltisTag = temPenaltis
        ? `<span class="bracket-penaltis">pênaltis ${jogo.penaltiesHome}-${jogo.penaltiesAway}</span>`
        : '';

    let avancaTag = '';
    if (finalizado && !jogo.groupName && jogo.winnerTeamId) {
        const brasilAvancou = jogo.winnerTeamId === BRASIL_TEAM_ID;
        avancaTag = `
            <div class="bracket-result ${brasilAvancou ? 'avanca' : 'eliminado'}">
                ${brasilAvancou ? '✅ Brasil avança' : '❌ Brasil eliminado'}
                ${penaltisTag}
            </div>
        `;
    }

    let inputsArea;

    if (bloqueado) {
        inputsArea = palpite
            ? `<div class="palpite-resultado">
                 <span class="palpite-label">Seu palpite</span>
                 <span class="palpite-placar">${palpite.homeScore} × ${palpite.awayScore}</span>
                 ${pontosTag}
               </div>`
            : `<div class="palpite-resultado">
                 <span class="palpite-label">Você não palpitou neste jogo</span>
               </div>`;
    } else {
        const homeVal = palpite ? palpite.homeScore : '';
        const awayVal = palpite ? palpite.awayScore : '';
        const botaoTexto = palpite ? 'Atualizar palpite' : 'Salvar palpite';

        inputsArea = `
            <form class="palpite-form" data-jogo-id="${jogo.id}">
                <input type="number" min="0" max="20" class="palpite-input" name="homeScore" value="${homeVal}" placeholder="0" required>
                <span class="palpite-x">×</span>
                <input type="number" min="0" max="20" class="palpite-input" name="awayScore" value="${awayVal}" placeholder="0" required>
                <button type="submit" class="refresh-btn palpite-submit">${botaoTexto}</button>
            </form>
            <div class="palpite-feedback" data-feedback-for="${jogo.id}"></div>
        `;
    }

    return `
        <div class="game-card">
            <div class="game-meta">
                <span class="game-phase">${stageLabel(jogo.stage, jogo.groupName)}</span>
                <span class="game-date">${formatDate(jogo.utcDate)}</span>
            </div>
            <div class="game-teams">
                <div class="team ${isBrasilHome ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(jogo.homeTeamName)}</span>
                    <span class="team-name">${homeName}</span>
                </div>
                <div class="score-box">
                    ${placarReal || '<span style="font-size:1.1rem;color:var(--muted);font-weight:600">VS</span>'}
                </div>
                <div class="team ${!isBrasilHome ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(jogo.awayTeamName)}</span>
                    <span class="team-name">${awayName}</span>
                </div>
            </div>
            <div class="palpite-area">
                ${inputsArea}
            </div>
            ${avancaTag}
        </div>
    `;
}

async function onSubmitPalpite(event) {
    event.preventDefault();

    const form = event.target;
    const jogoId = Number(form.dataset.jogoId);
    const homeScore = Number(form.homeScore.value);
    const awayScore = Number(form.awayScore.value);
    const feedback = document.querySelector(`[data-feedback-for="${jogoId}"]`);
    const submitBtn = form.querySelector('.palpite-submit');

    if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
        feedback.textContent = 'Informe um placar válido (0 a 20).';
        feedback.className = 'palpite-feedback erro';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    try {
        const response = await authFetch('/bolao/palpites', {
            method: 'POST',
            body: JSON.stringify({ jogoId, homeScore, awayScore })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar palpite');
        }

        feedback.textContent = 'Palpite salvo!';
        feedback.className = 'palpite-feedback sucesso';
        submitBtn.textContent = 'Atualizar palpite';
    } catch (error) {
        feedback.textContent = error.message;
        feedback.className = 'palpite-feedback erro';
        submitBtn.textContent = 'Salvar palpite';
    } finally {
        submitBtn.disabled = false;
    }
}