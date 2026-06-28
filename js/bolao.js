import { authFetch } from './auth.js';
import { getFlag, translateTeamName, formatDate, stageLabel } from './ui.js';
import { isLoggedIn } from './auth.js';

const ORDEM_FASES = [
    'GROUP_STAGE',
    'LAST_32', 'ROUND_OF_32',
    'LAST_16', 'ROUND_OF_16',
    'QUARTER_FINALS', 'QUARTERFINALS',
    'SEMI_FINALS', 'SEMIFINALS',
    'THIRD_PLACE',
    'FINAL'
];

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
        const [resBolao, resCampeao] = await Promise.all([
            authFetch('/bolao/jogos'),
            authFetch('/bolao/campeao'),
        ]);

        const data = await resBolao.json();
        const dataCampeao = await resCampeao.json();

        if (!resBolao.ok) throw new Error(data.error || 'Erro ao carregar bolão');

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
            if (jogo.status === 'FINISHED' && jogo.meuPalpite?.pontos != null) {
                totalPontos += jogo.meuPalpite.pontos;
                jogosAvaliados++;
            }
        });

        if (dataCampeao.palpite?.pontos != null) {
            totalPontos += dataCampeao.palpite.pontos;
        }

        const fases = agruparPorFase(data.jogos);
        const faseGrupos = fases.find(f => f.chave === 'GROUP_STAGE');
        const fasesMataMata = fases.filter(f => f.chave !== 'GROUP_STAGE');

        let html = '';

        // Card de palpite do campeão
        html += renderCardCampeao(dataCampeao);

        if (faseGrupos) {
            // Agrupa jogos da fase de grupos por grupo
            const porGrupo = new Map();
            faseGrupos.jogos.forEach(j => {
                const g = j.groupName || 'Grupo';
                if (!porGrupo.has(g)) porGrupo.set(g, []);
                porGrupo.get(g).push(j);
            });

            html += `
                <div class="status-bar" style="margin-top:1.75rem">
                    <span class="section-title">Fase de Grupos</span>
                </div>
            `;
            for (const [grupo, jogos] of [...porGrupo.entries()].sort()) {
                html += `<div class="bracket-round-title" style="margin:1rem 0 0.4rem;font-size:0.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6">${grupo}</div>`;
                html += jogos.map(renderJogoBolao).join('');
            }
        }

        if (fasesMataMata.length > 0) {
            html += `
                <div class="status-bar" style="margin-top:1.75rem">
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
                    <strong>10 pontos</strong>. Acerte só o resultado (vitória ou
                    empate) e ganhe <strong>5 pontos</strong>. Acerte o
                    <strong>campeão da Copa</strong> e ganhe <strong>20 pontos</strong>.
                    Palpites podem ser enviados ou editados até o início de cada jogo.
                    O palpite do campeão fica disponível até o início do mata-mata.
                </p>
            </div>
        `;

        container.innerHTML = resumo + legenda + html;

        container.querySelectorAll('form.palpite-form').forEach(form => {
            form.addEventListener('submit', onSubmitPalpite);
        });

        const formCampeao = container.querySelector('#form-campeao');
        if (formCampeao) formCampeao.addEventListener('submit', onSubmitCampeao);

    } catch (error) {
        container.innerHTML = `
            <div class="error-card">
                <p>Erro ao carregar o bolão</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// ---------------------------------------------------------------------------
// Card de palpite do campeão
// ---------------------------------------------------------------------------

function renderCardCampeao({ palpite, bloqueado, times = [] }) {
    const palpiteAtual = palpite ? translateTeamName(palpite.teamName) : null;

    let pontosTag = '';
    if (palpite?.pontos != null) {
        const cls = palpite.pontos > 0 ? 'win' : 'loss';
        const texto = palpite.pontos > 0
            ? `Campeão correto! (+${palpite.pontos})`
            : 'Não acertou o campeão';
        pontosTag = `<span class="score-status ${cls}">${texto}</span>`;
    }

    if (bloqueado) {
        return `
            <div class="game-card" style="border-left:3px solid var(--accent,#f0b429)">
                <div class="game-meta">
                    <span class="game-phase">🏆 Palpite do Campeão</span>
                </div>
                <div class="palpite-area">
                    <div class="palpite-resultado">
                        ${palpiteAtual
                            ? `<span class="palpite-label">Seu palpite</span>
                               <span class="palpite-placar">${palpiteAtual}</span>
                               ${pontosTag}`
                            : `<span class="palpite-label">Você não palpitou no campeão</span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    const opcoes = [...times]
        .sort((a, b) => translateTeamName(a).localeCompare(translateTeamName(b), 'pt-BR'))
        .map(t => {
            const selected = palpite?.teamName === t ? 'selected' : '';
            return `<option value="${t}" ${selected}>${getFlag(t)} ${translateTeamName(t)}</option>`;
        })
        .join('');

    return `
        <div class="game-card" style="border-left:3px solid var(--accent,#f0b429)">
            <div class="game-meta">
                <span class="game-phase">🏆 Palpite do Campeão da Copa</span>
                <span class="game-date">Disponível até o início do mata-mata</span>
            </div>
            ${palpiteAtual ? `<p style="margin:0.25rem 0 0.5rem;font-size:0.85rem;color:var(--muted)">Palpite atual: <strong>${palpiteAtual}</strong></p>` : ''}
            <div class="palpite-area">
                <form id="form-campeao" class="palpite-form" style="flex-wrap:wrap;gap:0.5rem">
                    <select name="teamName" class="palpite-input" style="width:100%;max-width:260px;padding:0.4rem 0.5rem;font-size:0.95rem" required>
                        <option value="" disabled ${!palpiteAtual ? 'selected' : ''}>Escolha o campeão…</option>
                        ${opcoes}
                    </select>
                    <button type="submit" class="refresh-btn palpite-submit">${palpiteAtual ? 'Atualizar palpite' : 'Salvar palpite'}</button>
                </form>
                <div class="palpite-feedback" id="feedback-campeao"></div>
            </div>
        </div>
    `;
}

async function onSubmitCampeao(event) {
    event.preventDefault();
    const form = event.target;
    const teamName = form.teamName.value;
    const feedback = document.getElementById('feedback-campeao');
    const submitBtn = form.querySelector('.palpite-submit');

    if (!teamName) {
        feedback.textContent = 'Selecione um time.';
        feedback.className = 'palpite-feedback erro';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    try {
        const response = await authFetch('/bolao/campeao', {
            method: 'POST',
            body: JSON.stringify({ teamName }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao salvar palpite');

        feedback.textContent = `Palpite salvo: ${translateTeamName(teamName)} 🏆`;
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

// ---------------------------------------------------------------------------
// Agrupamento e renderização de fases
// ---------------------------------------------------------------------------

function agruparPorFase(jogos) {
    const grupos = new Map();
    jogos.forEach(jogo => {
        const chave = jogo.stage || (jogo.groupName ? 'GROUP_STAGE' : 'OUTROS');
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(jogo);
    });

    return [...grupos.keys()]
        .sort((a, b) => {
            const ia = ORDEM_FASES.indexOf(a);
            const ib = ORDEM_FASES.indexOf(b);
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        })
        .map(chave => ({ chave, jogos: grupos.get(chave) }));
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
    const homeDefinido = jogo.homeTeamId && jogo.homeTeamId !== 0;
    const awayDefinido = jogo.awayTeamId && jogo.awayTeamId !== 0;

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

// ---------------------------------------------------------------------------
// Card de jogo individual
// ---------------------------------------------------------------------------

function renderJogoBolao(jogo) {
    const homeName = translateTeamName(jogo.homeTeamName);
    const awayName = translateTeamName(jogo.awayTeamName);
    const palpite = jogo.meuPalpite;
    const bloqueado = jogo.bloqueado;
    const finalizado = jogo.status === 'FINISHED';

    let pontosTag = '';
    if (finalizado && palpite?.pontos != null) {
        const cls = palpite.pontos === 10 ? 'win' : (palpite.pontos === 5 ? 'draw' : 'loss');
        const texto = palpite.pontos === 10
            ? 'Placar exato (+10)'
            : (palpite.pontos === 5 ? 'Resultado certo (+5)' : 'Sem pontos');
        pontosTag = `<span class="score-status ${cls}">${texto}</span>`;
    }

    const placarReal = finalizado
        ? `<span class="score">${jogo.homeScore ?? '?'} <span class="score-sep">×</span> ${jogo.awayScore ?? '?'}</span>`
        : '';

    const temPenaltis = jogo.penaltiesHome != null;
    const penaltisTag = temPenaltis
        ? `<span class="bracket-penaltis">pênaltis ${jogo.penaltiesHome}-${jogo.penaltiesAway}</span>`
        : '';

    // Mostra quem venceu no mata-mata (genérico, não só Brasil)
    let avancaTag = '';
    if (finalizado && !jogo.groupName && jogo.winnerTeamId) {
        const nomeVencedor = jogo.winnerTeamId === jogo.homeTeamId
            ? homeName : awayName;
        avancaTag = `
            <div class="bracket-result avanca">
                ✅ ${nomeVencedor} avança ${penaltisTag}
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
        inputsArea = `
            <form class="palpite-form" data-jogo-id="${jogo.id}">
                <input type="number" min="0" max="20" class="palpite-input" name="homeScore" value="${homeVal}" placeholder="0" required>
                <span class="palpite-x">×</span>
                <input type="number" min="0" max="20" class="palpite-input" name="awayScore" value="${awayVal}" placeholder="0" required>
                <button type="submit" class="refresh-btn palpite-submit">${palpite ? 'Atualizar palpite' : 'Salvar palpite'}</button>
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
                <div class="team">
                    <span class="team-flag">${getFlag(jogo.homeTeamName)}</span>
                    <span class="team-name">${homeName}</span>
                </div>
                <div class="score-box">
                    ${placarReal || '<span style="font-size:1.1rem;color:var(--muted);font-weight:600">VS</span>'}
                </div>
                <div class="team">
                    <span class="team-flag">${getFlag(jogo.awayTeamName)}</span>
                    <span class="team-name">${awayName}</span>
                </div>
            </div>
            <div class="palpite-area">${inputsArea}</div>
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
            body: JSON.stringify({ jogoId, homeScore, awayScore }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao salvar palpite');

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

function renderLoginPrompt() {
    return `
        <div class="info-card">
            <span class="info-card-title">Bolão da Copa</span>
            <p class="info-card-text">
                Faça login ou crie uma conta para registrar seus palpites
                e disputar o ranking com outros torcedores.
            </p>
            <button class="btn-support" onclick="window.openAuthModal()">
                Entrar ou criar conta
            </button>
        </div>
    `;
}