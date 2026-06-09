import { loadJogos } from './games.js';
import { loadGrupo } from './standings.js';

export function showTab(tabName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'grupo') {
        loadGrupo();
    }
}

export function startAutoRefresh() {
    setInterval(() => {
        const activeTab = document.querySelector('.section.active');

        if (activeTab?.id === 'tab-jogos') {
            loadJogos();
        }
        if (activeTab?.id === 'tab-grupo') {
            loadGrupo();
        }
    }, 60000);
}

loadJogos();
startAutoRefresh();