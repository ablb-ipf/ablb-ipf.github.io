// Main JavaScript para funcionalidades do site

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initForms();
    initSearch();
    loadData();
});

// Navegação Mobile
function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const drawer = document.querySelector('.drawer');
    const drawerOverlay = document.querySelector('.drawer-overlay');
    const drawerLinks = document.querySelectorAll('.drawer-links a');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            drawer.classList.toggle('open');
            drawerOverlay.classList.toggle('open');
        });
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', function() {
            drawer.classList.remove('open');
            drawerOverlay.classList.remove('open');
        });
    }

    drawerLinks.forEach(link => {
        link.addEventListener('click', function() {
            drawer.classList.remove('open');
            drawerOverlay.classList.remove('open');
        });
    });
}

// Filtros
function initFilters() {
    const filterInputs = document.querySelectorAll('.filter-group input, .filter-group select');
    const chips = document.querySelectorAll('.chip');

    filterInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    chips.forEach(chip => {
        chip.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    });
}

function applyFilters() {
    // Implementação específica por página
    const event = new Event('filterChange');
    document.dispatchEvent(event);
}

// Formulários
function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    });
}

function handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validação básica
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#dc3545';
        } else {
            field.style.borderColor = '';
        }
    });

    if (!isValid) {
        showSnackbar('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Simulação de envio (substituir por integração real)
    showSnackbar('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    form.reset();
}

// Busca
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Disparar filtro para atualizar resultados
            const event = new Event('filterChange');
            document.dispatchEvent(event);
        });
    });
}

// Armazenar dados globalmente
let eventosData = [];
let resultadosData = [];
let recordsData = [];

// Carregar dados JSON
async function loadData() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    try {
        if (currentPage === 'calendario.html') {
            await loadCalendario();
        } else if (currentPage === 'resultados.html') {
            await loadResultados();
        } else if (currentPage === 'records.html') {
            await loadRecords();
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function loadCalendario() {
    try {
        const response = await fetch('assets/data/calendario.json');
        eventosData = await response.json();
        renderCalendario(eventosData);
        setupCalendarioFilters();
    } catch (error) {
        console.error('Erro ao carregar calendário:', error);
        const container = document.getElementById('eventos-container');
        if (container) {
            container.innerHTML = '<div class="empty-state"><p>Erro ao carregar eventos. Tente novamente mais tarde.</p></div>';
        }
    }
}

async function loadResultados() {
    try {
        const response = await fetch('assets/data/resultados.json');
        resultadosData = await response.json();
        renderResultados(resultadosData);
        setupResultadosFilters();
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        const container = document.getElementById('resultados-container');
        if (container) {
            container.innerHTML = '<div class="empty-state"><p>Erro ao carregar resultados. Tente novamente mais tarde.</p></div>';
        }
    }
}

async function loadRecords() {
    try {
        const response = await fetch('assets/data/records.json');
        recordsData = await response.json();
        renderRecords(recordsData);
        setupRecordsFilters();
    } catch (error) {
        console.error('Erro ao carregar records:', error);
        const container = document.getElementById('records-container');
        if (container) {
            container.innerHTML = '<div class="empty-state"><p>Erro ao carregar records. Tente novamente mais tarde.</p></div>';
        }
    }
}

// Renderização de dados
function renderCalendario(eventos) {
    const container = document.getElementById('eventos-container');
    if (!container) return;

    if (eventos.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum evento encontrado.</p></div>';
        return;
    }

    container.innerHTML = eventos.map(evento => `
        <div class="card fade-in">
            <h3 class="card-title">${evento.titulo}</h3>
            <p><strong>Data:</strong> ${formatDate(evento.data)}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Tipo:</strong> ${evento.tipo}</p>
            ${evento.descricao ? `<p>${evento.descricao}</p>` : ''}
        </div>
    `).join('');
}

function renderResultados(resultados) {
    const container = document.getElementById('resultados-container');
    if (!container) return;

    if (resultados.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum resultado encontrado.</p></div>';
        return;
    }

    container.innerHTML = resultados.map(competicao => `
        <div class="card fade-in">
            <h3 class="card-title">${competicao.nome}</h3>
            <p><strong>Data:</strong> ${formatDate(competicao.data)}</p>
            <p><strong>Local:</strong> ${competicao.local}</p>
            ${renderTabelaResultados(competicao.resultados)}
        </div>
    `).join('');
}

function renderRecords(records) {
    const container = document.getElementById('records-container');
    if (!container) return;

    if (records.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum record encontrado.</p></div>';
        return;
    }

    container.innerHTML = records.map(record => `
        <div class="card fade-in">
            <h3 class="card-title">${record.categoria}</h3>
            <p><strong>Atleta:</strong> ${record.atleta}</p>
            <p><strong>Exercício:</strong> ${record.exercicio}</p>
            <p><strong>Peso:</strong> ${record.peso} kg</p>
            <p><strong>Data:</strong> ${formatDate(record.data)}</p>
            ${record.competicao ? `<p><strong>Competição:</strong> ${record.competicao}</p>` : ''}
        </div>
    `).join('');
}

// Setup de filtros (uma vez apenas)
function setupCalendarioFilters() {
    document.addEventListener('filterChange', function() {
        applyCalendarioFilters();
    });
}

function setupResultadosFilters() {
    document.addEventListener('filterChange', function() {
        applyResultadosFilters();
    });
}

function setupRecordsFilters() {
    document.addEventListener('filterChange', function() {
        applyRecordsFilters();
    });
}

function renderTabelaResultados(resultados) {
    if (!resultados || resultados.length === 0) return '';
    
    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Atleta</th>
                        <th>Categoria</th>
                        <th>Squat</th>
                        <th>Bench</th>
                        <th>Deadlift</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultados.map((r, i) => `
                        <tr>
                            <td>${i + 1}º</td>
                            <td>${r.atleta}</td>
                            <td>${r.categoria}</td>
                            <td>${r.squat || '-'} kg</td>
                            <td>${r.bench || '-'} kg</td>
                            <td>${r.deadlift || '-'} kg</td>
                            <td><strong>${r.total} kg</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Filtros específicos
function applyCalendarioFilters() {
    const mesFilter = document.getElementById('filter-mes')?.value;
    const anoFilter = document.getElementById('filter-ano')?.value;
    const tipoFilter = document.getElementById('filter-tipo')?.value;

    let filtered = eventosData.filter(evento => {
        const eventoDate = new Date(evento.data);
        const mes = mesFilter ? parseInt(mesFilter) : eventoDate.getMonth() + 1;
        const ano = anoFilter ? parseInt(anoFilter) : eventoDate.getFullYear();

        return (!mesFilter || eventoDate.getMonth() + 1 === mes) &&
               (!anoFilter || eventoDate.getFullYear() === ano) &&
               (!tipoFilter || evento.tipo === tipoFilter);
    });

    renderCalendario(filtered);
}

function applyResultadosFilters() {
    const anoFilter = document.getElementById('filter-ano')?.value;
    const categoriaFilter = document.getElementById('filter-categoria')?.value;
    const searchTerm = document.getElementById('search-atleta')?.value.toLowerCase() || '';

    let filtered = resultadosData.filter(comp => {
        const compDate = new Date(comp.data);
        const matchAno = !anoFilter || compDate.getFullYear() === parseInt(anoFilter);
        const matchCategoria = !categoriaFilter || comp.categoria === categoriaFilter;
        const matchSearch = !searchTerm || comp.resultados.some(r => 
            r.atleta.toLowerCase().includes(searchTerm)
        );
        
        return matchAno && matchCategoria && matchSearch;
    });

    renderResultados(filtered);
}

function applyRecordsFilters() {
    const categoriaFilter = document.getElementById('filter-categoria')?.value;
    const exercicioFilter = document.getElementById('filter-exercicio')?.value;

    let filtered = recordsData.filter(record => {
        return (!categoriaFilter || record.categoria === categoriaFilter) &&
               (!exercicioFilter || record.exercicio === exercicioFilter);
    });

    renderRecords(filtered);
}

// Utilitários
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function showSnackbar(message) {
    let snackbar = document.querySelector('.snackbar');
    if (!snackbar) {
        snackbar = document.createElement('div');
        snackbar.className = 'snackbar';
        document.body.appendChild(snackbar);
    }
    
    snackbar.textContent = message;
    snackbar.classList.add('show');
    
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000);
}
