// ============================================
// RELATORIOS.JS - Tela de Relatórios
// Disponível para: gerente, supervisor, admin
// ============================================

const relatoriosTemplate = `
<div class="row g-2 mb-3">
    <div class="col-6"><div class="card bg-primary text-white border-0 shadow-sm rounded-4"><div class="card-body p-3"><small class="opacity-75 d-block">Fretes</small><h4 class="mb-0" id="total-fretes">0</h4></div></div></div>
    <div class="col-6"><div class="card bg-dark text-white border-0 shadow-sm rounded-4"><div class="card-body p-3"><small class="opacity-75 d-block">KM Total</small><h4 class="mb-0" id="total-km">0</h4></div></div></div>
    <div class="col-6"><div class="card bg-primary text-white border-0 shadow-sm rounded-4"><div class="card-body p-3"><small class="opacity-75 d-block">Peso Total</small><h4 class="mb-0" id="total-peso">0 kg</h4></div></div></div>
    <div class="col-6"><div class="card bg-dark text-white border-0 shadow-sm rounded-4"><div class="card-body p-3"><small class="opacity-75 d-block">Combustível</small><h4 class="mb-0" id="total-combustivel">0 L</h4></div></div></div>
</div>
<div class="mb-3"><input type="text" class="form-control form-control-sm" id="filter-motorista" placeholder="Buscar motorista..."></div>
<div class="card border-0 shadow-sm rounded-4"><div class="card-body p-3"><h6 class="card-title text-primary fw-semibold mb-3"><i class="fas fa-clipboard-list me-2"></i>Fretes</h6><div id="todos-fretes-list" class="list-fretes"></div></div></div>
`;

function initRelatorios(container) {
    console.log("📊 Inicializando tela de Relatórios");
    
    if (container) {
        container.innerHTML = relatoriosTemplate;
    }
    
    setupRelatoriosListeners();
    loadAllFretes();
}

function setupRelatoriosListeners() {
    const filterInput = document.getElementById("filter-motorista");
    if (filterInput) {
        filterInput.removeEventListener("input", debounce(loadAllFretes, 500));
        filterInput.addEventListener("input", debounce(loadAllFretes, 500));
    }
}

async function loadAllFretes() {
    const fretesList = document.getElementById("todos-fretes-list");
    if (!fretesList) return;

    const filterMotorista = document.getElementById("filter-motorista")?.value.toLowerCase() || "";

    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

    try {
        const snapshot = await db.collection("fretes").orderBy("timestamp", "desc").limit(50).get();

        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete</p></div>';
            updateStats([]);
            return;
        }

        let html = "";
        let fretesFiltrados = [];

        snapshot.forEach((doc) => {
            const frete = doc.data();
            if (filterMotorista && !frete.nome.toLowerCase().includes(filterMotorista)) return;
            fretesFiltrados.push(frete);

            const data = frete.timestamp ? new Date(frete.timestamp.seconds * 1000).toLocaleDateString() : "Data não disponível";
            const valorTotalFormatado = frete.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00";

            html += `
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista"><i class="fas fa-user me-1"></i>${frete.nome}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${frete.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> ${valorTotalFormatado}</div>
                        <div><i class="fas fa-road"></i> ${frete.distancia_total || frete.distancia || 0} km</div>
                        <div><i class="fas fa-gas-pump"></i> ${frete.combustivel || 0} L</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${frete.origem ? frete.origem.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${frete.partida ? frete.partida.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${frete.entrega ? frete.entrega.substring(0, 30) : "..."}...</p>
                    </div>
                </div>
            `;
        });

        fretesList.innerHTML = html || '<div class="empty-state"><i class="fas fa-filter fa-3x mb-3 opacity-50"></i><p>Nenhum resultado</p></div>';
        updateStats(fretesFiltrados);
    } catch (error) {
        console.error("Erro ao carregar fretes:", error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao carregar</p></div>';
    }
}

function updateStats(fretes) {
    let totalFretes = fretes.length;
    let totalKm = 0;
    let totalPeso = 0;
    let totalComb = 0;

    fretes.forEach(f => {
        totalKm += f.distancia_total || f.distancia || 0;
        totalPeso += f.toneladas || 0;
        totalComb += f.combustivel || 0;
    });

    const totalFretesEl = document.getElementById("total-fretes");
    const totalKmEl = document.getElementById("total-km");
    const totalPesoEl = document.getElementById("total-peso");
    const totalCombEl = document.getElementById("total-combustivel");
    
    if (totalFretesEl) totalFretesEl.textContent = totalFretes;
    if (totalKmEl) totalKmEl.textContent = totalKm + " km";
    if (totalPesoEl) totalPesoEl.textContent = totalPeso.toFixed(1) + " t";
    if (totalCombEl) totalCombEl.textContent = totalComb + " L";
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

window.initRelatorios = initRelatorios;
