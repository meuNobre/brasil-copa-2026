export function getFlag(teamName) {
    const flags = {
        'Brazil': '🇧🇷',
        'Morocco': '🇲🇦',
        'Haiti': '🇭🇹',
        'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        'Croatia': '🇭🇷',
        'Cameroon': '🇨🇲',
        'Serbia': '🇷🇸',
        'Argentina': '🇦🇷',
        'France': '🇫🇷',
        'Germany': '🇩🇪',
        'Portugal': '🇵🇹',
        'Spain': '🇪🇸',
        'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Netherlands': '🇳🇱',
        'Japan': '🇯🇵',
        'South Korea': '🇰🇷',
        'United States': '🇺🇸',
        'Canada': '🇨🇦',
        'Mexico': '🇲🇽',
        'TBD': '❓'
    };

    return flags[teamName] || '⚽';
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

export function getStatusLabel(game) {
    const { status, score } = game;

    if (status === 'IN_PLAY' || status === 'PAUSED') {
        return { text: '🔴 Ao vivo', cls: 'live' };
    }

    if (status === 'FINISHED') {
        const isBrasilHome = game.homeTeam.id === 764;
        const brasilScore = isBrasilHome ? score.fullTime.home : score.fullTime.away;
        const opponentScore = isBrasilHome ? score.fullTime.away : score.fullTime.home;

        if (brasilScore > opponentScore) {
            return { text: '✅ Vitória', cls: 'win' };
        }
        if (brasilScore < opponentScore) {
            return { text: '❌ Derrota', cls: 'loss' };
        }
        return { text: '🟡 Empate', cls: 'draw' };
    }

    if (status === 'SCHEDULED' || status === 'TIMED') {
        return { text: 'Agendado', cls: '' };
    }

    return { text: status, cls: '' };
}

export function renderGame(game, isNext = false) {
    const isBrasilHome = game.homeTeam.id === 764;
    const homeTeam = game.homeTeam.name;
    const awayTeam = game.awayTeam.name;
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
                <span class="game-phase">${game.group || 'Copa 2026'}</span>
                <span class="game-date">${formatDate(game.utcDate)}</span>
            </div>
            <div class="game-teams">
                <div class="team ${homeTeam === 'Brasil' ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(homeTeam)}</span>
                    <span class="team-name">${homeTeam}</span>
                </div>
                <div class="score-box">
                    ${scoreDisplay}
                    <span class="score-status ${status.cls}">${status.text}</span>
                </div>
                <div class="team ${awayTeam === 'Brasil' ? 'brasil' : ''}">
                    <span class="team-flag">${getFlag(awayTeam)}</span>
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
