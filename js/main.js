import { loadJogos } from './games.js';
import { loadGrupo } from './standings.js';
import { loadBolao } from './bolao.js';
import { loadRanking } from './ranking.js';
import { initAuthUI } from './auth-ui.js';

export function showTab(tabName, event) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.tab[data-tab]').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (event?.target) {
        event.target.classList.add('active');
    }

    if (tabName === 'grupo') loadGrupo();
    if (tabName === 'bolao') loadBolao();
    if (tabName === 'ranking') loadRanking();
}

export function startAutoRefresh() {
    setInterval(() => {
        const activeTab = document.querySelector('.section.active');

        if (activeTab?.id === 'tab-jogos') loadJogos();
        if (activeTab?.id === 'tab-grupo') loadGrupo();
        if (activeTab?.id === 'tab-ranking') loadRanking();
    }, 60000);
}

window.showTab = showTab;
window.loadJogos = loadJogos;
window.loadGrupo = loadGrupo;
window.loadBolao = loadBolao;
window.loadRanking = loadRanking;

initAuthUI();
loadJogos();
startAutoRefresh();

// recarrega o bolão automaticamente quando o usuário loga/deslogar
document.addEventListener('auth-changed', () => {
    const activeTab = document.querySelector('.section.active');
    if (activeTab?.id === 'tab-bolao') loadBolao();
});
