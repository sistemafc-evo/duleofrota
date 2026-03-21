// ============================================
// MANUTENCAO.JS - Tela de Manutenção
// Disponível para: operador, admin
// ============================================

const manutencaoTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3"><i class="fas fa-clipboard-list me-2"></i><span>Registre as manutenções realizadas no veículo</span></div>
</div>
<div class="card border-0 shadow-sm rounded-4 mb-3">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3"><i class="fas fa-tools me-2"></i>Registrar Manutenção</h6>
        <form id="manutencao-form">
            <div class="input-highlight mb-3">
                <label><i class="fas fa-calendar-alt me-1"></i> DATA DA MANUTENÇÃO</label>
                <input type="date" id="data-manutencao" required>
            </div>
            <div class="input-highlight mb-3">
                <label><i class="fas fa-tachometer-alt me-1"></i> QUILOMETRAGEM (km)</label>
                <input type="number" id="km-manutencao" placeholder="Ex: 45.230" step="1" min="0" required>
            </div>
            <div class="border-bottom my-3"></div>
            <h6 class="text-secondary fw-semibold mb-3"><i class="fas fa-oil-can me-2"></i>Óleos</h6>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-oil-can text-primary"></i><strong>Óleo do Motor</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-oleo-motor"><label class="form-check-label small" for="troca-oleo-motor">Trocar</label></div>
                </div>
                <div id="campos-oleo-motor" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-oleo-motor"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-oleo-motor" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-cogs text-primary"></i><strong>Óleo do Câmbio</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-oleo-cambio"><label class="form-check-label small" for="troca-oleo-cambio">Trocar</label></div>
                </div>
                <div id="campos-oleo-cambio" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-oleo-cambio"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-oleo-cambio" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-differential text-primary"></i><strong>Óleo do Diferencial</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-oleo-diferencial"><label class="form-check-label small" for="troca-oleo-diferencial">Trocar</label></div>
                </div>
                <div id="campos-oleo-diferencial" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-oleo-diferencial"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-oleo-diferencial" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="border-bottom my-3"></div>
            <h6 class="text-secondary fw-semibold mb-3"><i class="fas fa-filter me-2"></i>Filtros</h6>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-oil-can text-primary"></i><strong>Filtro do Motor</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-filtro-motor"><label class="form-check-label small" for="troca-filtro-motor">Trocar</label></div>
                </div>
                <div id="campos-filtro-motor" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-filtro-motor"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-filtro-motor" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-gas-pump text-primary"></i><strong>Filtro do Diesel</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-filtro-diesel"><label class="form-check-label small" for="troca-filtro-diesel">Trocar</label></div>
                </div>
                <div id="campos-filtro-diesel" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-filtro-diesel"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-filtro-diesel" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-wind text-primary"></i><strong>Filtro de Ar</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-filtro-ar"><label class="form-check-label small" for="troca-filtro-ar">Trocar</label></div>
                </div>
                <div id="campos-filtro-ar" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-filtro-ar"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-filtro-ar" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2"><i class="fas fa-filter text-primary"></i><strong>Filtro P.U.</strong></div>
                    <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="troca-filtro-pu"><label class="form-check-label small" for="troca-filtro-pu">Trocar</label></div>
                </div>
                <div id="campos-filtro-pu" class="campos-troca" style="display: none;">
                    <div class="row g-2"><div class="col-6"><div class="campo-troca"><label><i class="fas fa-calendar-alt me-1"></i> Data</label><input type="date" id="data-filtro-pu"></div></div><div class="col-6"><div class="campo-troca"><label><i class="fas fa-tachometer-alt me-1"></i> Km</label><input type="number" id="km-filtro-pu" placeholder="km"></div></div></div>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary w-100 py-2 mt-3"><i class="fas fa-save me-2"></i>Registrar Manutenção</button>
        </form>
    </div>
</div>
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3"><i class="fas fa-history me-2"></i>Histórico de Manutenções</h6>
        <div id="manutencoes-list" class="list-manutencoes"></div>
    </div>
</div>
`;

function initManutencao(container) {
    console.log("🔧 Inicializando tela de Manutenção");
    
    if (container) {
        container.innerHTML = manutencaoTemplate;
    }
    
    setupManutencaoListeners();
}

function setupManutencaoListeners() {
    console.log("🔧 Configurando listeners de manutenção...");

    const switches = [
        "oleo-motor", "oleo-cambio", "oleo-diferencial",
        "filtro-motor", "filtro-diesel", "filtro-ar", "filtro-pu"
    ];

    switches.forEach((item) => {
        const checkbox = document.getElementById(`troca-${item}`);
        if (checkbox) {
            checkbox.removeEventListener("change", handleSwitchChange);
            checkbox.addEventListener("change", handleSwitchChange);
        }
    });

    const form = document.getElementById("manutencao-form");
    if (form) {
        form.removeEventListener("submit", handleManutencaoSubmit);
        form.addEventListener("submit", handleManutencaoSubmit);
    }

    loadHistoricoManutencoes();
}

function handleSwitchChange(e) {
    const checkbox = e.target;
    const itemId = checkbox.id.replace("troca-", "");
    const campos = document.getElementById(`campos-${itemId}`);
    if (campos) {
        campos.style.display = checkbox.checked ? "block" : "none";
    }
}

async function loadHistoricoManutencoes() {
    const manutencoesList = document.getElementById("manutencoes-list");
    if (!manutencoesList) return;

    // Verificar se db existe
    if (!window.db) {
        console.error("❌ Firestore não disponível");
        manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro de conexão</p></div>`;
        return;
    }

    manutencoesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

    try {
        if (!window.currentUser || !window.currentUser.id) {
            manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Usuário não identificado</p></div>`;
            return;
        }

        const snapshot = await window.db.collection("manutencoes").where("motoristaId", "==", window.currentUser.id).limit(50).get();

        if (snapshot.empty) {
            manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-tools fa-3x mb-3 opacity-50"></i><p>Nenhum registro de manutenção</p></div>`;
            return;
        }

        let manutencoes = [];
        snapshot.forEach((doc) => manutencoes.push({ id: doc.id, ...doc.data() }));
        manutencoes.sort((a, b) => (b.dataManutencao?.seconds || 0) - (a.dataManutencao?.seconds || 0));

        let html = "";
        manutencoes.forEach((manutencao) => {
            const dataFormatada = manutencao.dataManutencao
                ? new Date(manutencao.dataManutencao.seconds * 1000).toLocaleDateString() + " " + new Date(manutencao.dataManutencao.seconds * 1000).toLocaleTimeString()
                : "Data não informada";

            const itensTrocados = [];
            const trocas = manutencao.trocas || {};

            const itensMap = {
                oleoMotor: { nome: "Óleo do Motor", icone: "fa-oil-can", cor: "primary" },
                oleoCambio: { nome: "Óleo do Câmbio", icone: "fa-cogs", cor: "primary" },
                oleoDiferencial: { nome: "Óleo do Diferencial", icone: "fa-differential", cor: "primary" },
                filtroMotor: { nome: "Filtro do Motor", icone: "fa-filter", cor: "success" },
                filtroDiesel: { nome: "Filtro do Diesel", icone: "fa-gas-pump", cor: "success" },
                filtroAr: { nome: "Filtro de Ar", icone: "fa-wind", cor: "success" },
                filtroPU: { nome: "Filtro P.U.", icone: "fa-filter", cor: "success" }
            };

            for (const [key, item] of Object.entries(itensMap)) {
                if (trocas[key]?.trocado) {
                    const kmTroca = trocas[key].km || manutencao.km;
                    const dataTroca = trocas[key].data || dataFormatada;
                    itensTrocados.push({ ...item, km: kmTroca, data: dataTroca });
                }
            }

            if (itensTrocados.length === 0) return;

            html += `
                <div class="manutencao-card">
                    <div class="manutencao-header">
                        <span class="manutencao-data"><i class="fas fa-calendar-alt me-1"></i>${dataFormatada}</span>
                        <span class="manutencao-km"><i class="fas fa-tachometer-alt me-1"></i>${manutencao.km || 0} km</span>
                    </div>
                    <div class="manutencao-itens">
                        ${itensTrocados.map(item => `
                            <div class="manutencao-item-trocado" style="background: ${item.cor === "primary" ? "#e3f2fd" : "#e8f5e9"}; border-left: 3px solid ${item.cor === "primary" ? "#4158D0" : "#2e7d32"}">
                                <i class="fas ${item.icone} me-2" style="color: ${item.cor === "primary" ? "#4158D0" : "#2e7d32"}"></i>
                                <div class="manutencao-item-info">
                                    <strong>${item.nome}</strong>
                                    <div class="manutencao-item-detalhes">
                                        <span class="badge bg-light text-dark me-2"><i class="fas fa-calendar-alt me-1"></i>${item.data}</span>
                                        <span class="badge bg-light text-dark"><i class="fas fa-tachometer-alt me-1"></i>${item.km} km</span>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        });

        manutencoesList.innerHTML = html || `<div class="empty-state"><i class="fas fa-tools fa-3x mb-3 opacity-50"></i><p>Nenhum registro de manutenção</p></div>`;
    } catch (error) {
        console.error("Erro ao carregar manutenções:", error);
        manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao carregar histórico</p></div>`;
    }
}

async function handleManutencaoSubmit(e) {
    e.preventDefault();
    if (!window.currentUser) return alert("Usuário não logado!");

    const dataManutencao = document.getElementById("data-manutencao").value;
    const km = parseFloat(document.getElementById("km-manutencao").value);

    if (!dataManutencao || !km) return alert("Preencha a data e a quilometragem da manutenção!");

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
    btn.disabled = true;

    try {
        const trocas = {};
        const dataObj = new Date(dataManutencao);

        if (document.getElementById("troca-oleo-motor")?.checked) {
            trocas.oleoMotor = { trocado: true, data: document.getElementById("data-oleo-motor")?.value || dataManutencao, km: parseFloat(document.getElementById("km-oleo-motor")?.value) || km };
        }
        if (document.getElementById("troca-oleo-cambio")?.checked) {
            trocas.oleoCambio = { trocado: true, data: document.getElementById("data-oleo-cambio")?.value || dataManutencao, km: parseFloat(document.getElementById("km-oleo-cambio")?.value) || km };
        }
        if (document.getElementById("troca-oleo-diferencial")?.checked) {
            trocas.oleoDiferencial = { trocado: true, data: document.getElementById("data-oleo-diferencial")?.value || dataManutencao, km: parseFloat(document.getElementById("km-oleo-diferencial")?.value) || km };
        }
        if (document.getElementById("troca-filtro-motor")?.checked) {
            trocas.filtroMotor = { trocado: true, data: document.getElementById("data-filtro-motor")?.value || dataManutencao, km: parseFloat(document.getElementById("km-filtro-motor")?.value) || km };
        }
        if (document.getElementById("troca-filtro-diesel")?.checked) {
            trocas.filtroDiesel = { trocado: true, data: document.getElementById("data-filtro-diesel")?.value || dataManutencao, km: parseFloat(document.getElementById("km-filtro-diesel")?.value) || km };
        }
        if (document.getElementById("troca-filtro-ar")?.checked) {
            trocas.filtroAr = { trocado: true, data: document.getElementById("data-filtro-ar")?.value || dataManutencao, km: parseFloat(document.getElementById("km-filtro-ar")?.value) || km };
        }
        if (document.getElementById("troca-filtro-pu")?.checked) {
            trocas.filtroPU = { trocado: true, data: document.getElementById("data-filtro-pu")?.value || dataManutencao, km: parseFloat(document.getElementById("km-filtro-pu")?.value) || km };
        }

        if (Object.keys(trocas).length === 0) {
            alert("Selecione pelo menos um item para registrar a manutenção!");
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const manutencao = {
            motoristaId: window.currentUser.id,
            motoristaNome: window.currentUser.nome,
            dataManutencao: dataObj,
            km: km,
            trocas: trocas,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "realizada",
            perfil: window.currentUser.perfil
        };

        await window.db.collection("manutencoes").add(manutencao);
        alert("Manutenção registrada com sucesso!");

        e.target.reset();
        document.querySelectorAll(".campos-troca").forEach(campo => campo.style.display = "none");
        document.querySelectorAll(".form-check-input").forEach(sw => sw.checked = false);
        loadHistoricoManutencoes();
    } catch (error) {
        console.error("Erro ao salvar manutenção:", error);
        alert(`Erro ao salvar manutenção: ${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.initManutencao = initManutencao;
