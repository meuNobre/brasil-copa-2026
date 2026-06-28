export function getFlag(teamName) {
    const flags = {
        'Brazil': '🇧🇷',
        'Morocco': '🇲🇦',
        'Haiti': '🇭🇹',
        'Scotland': 'ESC',
        'Croatia': '🇭🇷',
        'Cameroon': '🇨🇲',
        'Serbia': '🇷🇸',
        'Argentina': '🇦🇷',
        'France': '🇫🇷',
        'Germany': '🇩🇪',
        'Portugal': '🇵🇹',
        'Spain': '🇪🇸',
        'England': 'ENG',
        'Netherlands': '🇳🇱',
        'Japan': '🇯🇵',
        'South Korea': '🇰🇷',
        'United States': '🇺🇸',
        'Canada': '🇨🇦',
        'Mexico': '🇲🇽',
        'TBD': '?'
    };

    return flags[teamName] || '-';
}

export function translateTeamName(name) {
    const translations = {
        'Brazil': 'Brasil',
        'Morocco': 'Marrocos',
        'Haiti': 'Haiti',
        'Scotland': 'Escócia',
        'Croatia': 'Croácia',
        'Cameroon': 'Camarões',
        'Serbia': 'Sérvia',
        'Argentina': 'Argentina',
        'France': 'França',
        'Germany': 'Alemanha',
        'Portugal': 'Portugal',
        'Spain': 'Espanha',
        'England': 'Inglaterra',
        'Netherlands': 'Países Baixos',
        'Japan': 'Japão',
        'South Korea': 'Coreia do Sul',
        'United States': 'Estados Unidos',
        'Canada': 'Canadá',
        'Mexico': 'México',
        'TBD': 'A definir'
    };

    return translations[name] || name;
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
    }) + ' (Brasília)';
}

const STAGE_LABELS = {
    GROUP_STAGE: 'Fase de Grupos',
    LAST_32: 'Dezesseis-avos de Final',
    ROUND_OF_32: 'Dezesseis-avos de Final',
    LAST_16: 'Oitavas de Final',
    ROUND_OF_16: 'Oitavas de Final',
    QUARTER_FINALS: 'Quartas de Final',
    QUARTERFINALS: 'Quartas de Final',
    SEMI_FINALS: 'Semifinal',
    SEMIFINALS: 'Semifinal',
    THIRD_PLACE: 'Disputa de 3º Lugar',
    FINAL: 'Final',
    OUTROS: 'Outros Jogos'
};

/**
 * Traduz a fase do jogo (grupo ou mata-mata) pra um rótulo em português.
 */
export function stageLabel(stage, group) {
    if (group) return `Grupo ${group.replace('GROUP_', '')}`;
    if (stage && STAGE_LABELS[stage]) return STAGE_LABELS[stage];
    if (stage) return stage.replace(/_/g, ' ');
    return 'Copa 2026';
}

export function getStatusLabel(game) {
    const { status, score } = game;

    if (status === 'IN_PLAY' || status === 'PAUSED') {
        return { text: 'AO VIVO', cls: 'live' };
    }

    if (status === 'FINISHED') {
        const isBrasilHome = game.homeTeam.id === 764;
        const brasilScore = isBrasilHome ? score.fullTime.home : score.fullTime.away;
        const opponentScore = isBrasilHome ? score.fullTime.away : score.fullTime.home;

        if (brasilScore > opponentScore) {
            return { text: 'Vitória', cls: 'win' };
        }
        if (brasilScore < opponentScore) {
            return { text: 'Derrota', cls: 'loss' };
        }
        return { text: 'Empate', cls: 'draw' };
    }

    if (status === 'SCHEDULED' || status === 'TIMED') {
        return { text: 'Agendado', cls: '' };
    }

    return { text: status, cls: '' };
}

export function renderGame(game, isNext = false) {
    const isBrasilHome = game.homeTeam.id === 764;
    const homeTeamRaw = game.homeTeam.name;
    const awayTeamRaw = game.awayTeam.name;
    const homeTeam = translateTeamName(homeTeamRaw);
    const awayTeam = translateTeamName(awayTeamRaw);
    const homeScore = game.score.fullTime.home;
    const awayScore = game.score.fullTime.away;
    const status = getStatusLabel(game);
    const isLive = game.status === 'IN_PLAY' || game.status === 'PAUSED';
    const isFinished = game.status === 'FINISHED';

    const scoreDisplay = (isFinished || isLive)
        ? `<span class="score">${homeScore ?? '?'} <span class="score-sep">×</span> ${awayScore ?? '?'}</span>`
        : `<span style="font-size:1.1rem;color:var(--muted);font-weight:600">VS</span>`;

    return `
        <div class="game-card ${isLive ? 'live' : ''} ${isNext ? 'next' : ''}">
            <div class="game-meta">
                <span class="game-phase">${stageLabel(game.stage, game.group)}</span>
                <span class="game-date">${formatDate(game.utcDate)}</span>
            </div>
            <div class="game-teams">
                <div class="team ${homeTeam === 'Brasil' ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(homeTeamRaw)}</span>
                    <span class="team-name">${homeTeam}</span>
                </div>
                <div class="score-box">
                    ${scoreDisplay}
                    <span class="score-status ${status.cls}">${status.text}</span>
                </div>
                <div class="team ${awayTeam === 'Brasil' ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(awayTeamRaw)}</span>
                    <span class="team-name">${awayTeam}</span>
                </div>
            </div>
        </div>
    `;
}

export function renderCountdown(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) return '';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    return `
        <div class="countdown">
            <div class="countdown-unit">
                <span class="countdown-num">${days}</span>
                <span class="countdown-label">dias</span>
            </div>
            <div class="countdown-unit">
                <span class="countdown-num">${hours}</span>
                <span class="countdown-label">horas</span>
            </div>
            <div class="countdown-unit">
                <span class="countdown-num">${minutes}</span>
                <span class="countdown-label">min</span>
            </div>
        </div>
    `;
}

export function renderStats(games, wins, goals) {
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-num verde">${games}</div>
                <div class="stat-label">Jogos</div>
            </div>
            <div class="stat-card">
                <div class="stat-num amarelo">${wins}</div>
                <div class="stat-label">Vitórias</div>
            </div>
            <div class="stat-card">
                <div class="stat-num verde">${goals}</div>
                <div class="stat-label">Gols</div>
            </div>
        </div>
    `;
}