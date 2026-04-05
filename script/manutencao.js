// ============================================
// MANUTENCAO.JS - Tela de Manutenção (Simplificada)
// Disponível para: operador, admin
// ============================================

const manutencaoTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-clipboard-list me-2"></i>
        <span>Selecione os itens que deseja registrar e informe a data/hora e quilometragem atuais</span>
    </div>
</div>
<div class="card border-0 shadow-sm rounded-4 mb-3">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-tools me-2"></i>Registrar Manutenção
        </h6>
        <form id="manutencao-form">
            <!-- Campos principais -->
            <div class="input-highlight mb-3">
                <label><i class="fas fa-calendar-alt me-1"></i> DATA E HORA DA MANUTENÇÃO</label>
                <input type="datetime-local" id="data-manutencao" required>
            </div>
            <div class="input-highlight mb-3">
                <label><i class="fas fa-tachometer-alt me-1"></i> QUILOMETRAGEM ATUAL (km)</label>
                <input type="text" id="km-manutencao" placeholder="Ex: 45.230" inputmode="numeric" required>
            </div>
            
            <div class="border-bottom my-3"></div>
            <h6 class="text-secondary fw-semibold mb-3">
                <i class="fas fa-oil-can me-2"></i>Óleos
            </h6>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-oil-can text-primary"></i>
                        <strong>Óleo do Motor</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-oleo-motor">
                        <label class="form-check-label small" for="troca-oleo-motor">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-cogs text-primary"></i>
                        <strong>Óleo do Câmbio</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-oleo-cambio">
                        <label class="form-check-label small" for="troca-oleo-cambio">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-cogs text-primary"></i>
                        <strong>Óleo do Diferencial</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-oleo-diferencial">
                        <label class="form-check-label small" for="troca-oleo-diferencial">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="border-bottom my-3"></div>
            <h6 class="text-secondary fw-semibold mb-3">
                <i class="fas fa-filter me-2"></i>Filtros
            </h6>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-oil-can text-primary"></i>
                        <strong>Filtro do Motor</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-filtro-motor">
                        <label class="form-check-label small" for="troca-filtro-motor">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-gas-pump text-primary"></i>
                        <strong>Filtro do Diesel</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-filtro-diesel">
                        <label class="form-check-label small" for="troca-filtro-diesel">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-wind text-primary"></i>
                        <strong>Filtro de Ar</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-filtro-ar">
                        <label class="form-check-label small" for="troca-filtro-ar">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-filter text-primary"></i>
                        <strong>Filtro do Câmbio</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-filtro-cambio">
                        <label class="form-check-label small" for="troca-filtro-cambio">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <div class="manutencao-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-filter text-primary"></i>
                        <strong>Filtro P.U.</strong>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="troca-filtro-pu">
                        <label class="form-check-label small" for="troca-filtro-pu">Registrar troca</label>
                    </div>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary w-100 py-2 mt-3">
                <i class="fas fa-save me-2"></i>Registrar Manutenção
            </button>
        </form>
    </div>
</div>
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-history me-2"></i>Histórico de Manutenções
        </h6>
        <div id="manutencoes-list" class="list-manutencoes"></div>
    </div>
</div>
`;

// Função auxiliar para converter string com pontos para número
function converterKmParaNumero(valor) {
  if (!valor) return 0;
  const numeroLimpo = valor.toString().replace(/\./g, "");
  return parseFloat(numeroLimpo) || 0;
}

// Função auxiliar para formatar número com pontos
function formatarKm(valor) {
  if (!valor) return "";
  return Math.floor(valor).toLocaleString("pt-BR");
}

// Função para formatar campo de km em tempo real
function setupKmFormatting() {
  const campoKm = document.getElementById('km-manutencao');
  if (campoKm) {
    campoKm.removeEventListener("input", handleKmInput);
    campoKm.addEventListener("input", handleKmInput);
    campoKm.removeEventListener("blur", handleKmBlur);
    campoKm.addEventListener("blur", handleKmBlur);
  }
}

function handleKmInput(e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (valor) {
    e.target.value = parseInt(valor, 10).toLocaleString("pt-BR");
  }
}

function handleKmBlur(e) {
  if (!e.target.value) return;
  let valor = e.target.value.replace(/\D/g, "");
  if (valor) {
    e.target.value = parseInt(valor, 10).toLocaleString("pt-BR");
  }
}

// Função para definir data/hora atual automaticamente
function setCurrentDateTime() {
  const campoData = document.getElementById('data-manutencao');
  if (campoData) {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    
    campoData.value = `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  }
}

function initManutencao(container) {
  console.log("🔧 Inicializando tela de Manutenção");

  if (container) {
    container.innerHTML = manutencaoTemplate;
  }

  // Definir data/hora atual automaticamente
  setCurrentDateTime();
  
  setupManutencaoListeners();
}

function setupManutencaoListeners() {
  console.log("🔧 Configurando listeners de manutenção...");

  const form = document.getElementById("manutencao-form");
  if (form) {
    form.removeEventListener("submit", handleManutencaoSubmit);
    form.addEventListener("submit", handleManutencaoSubmit);
  }

  setupKmFormatting();
  loadHistoricoManutencoes();
}

async function loadHistoricoManutencoes() {
  const manutencoesList = document.getElementById("manutencoes-list");
  if (!manutencoesList) return;

  if (!window.db) {
    console.error("❌ Firestore não disponível");
    manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro de conexão</p></div>`;
    return;
  }

  manutencoesList.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

  try {
    if (!window.currentUser || !window.currentUser.id) {
      manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Usuário não identificado</p></div>`;
      return;
    }

    const snapshot = await window.db
      .collection("manutencoes")
      .where("motoristaId", "==", window.currentUser.id)
      .limit(50)
      .get();

    if (snapshot.empty) {
      manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-tools fa-3x mb-3 opacity-50"></i><p>Nenhum registro de manutenção</p></div>`;
      return;
    }

    let manutencoes = [];
    snapshot.forEach((doc) => manutencoes.push({ id: doc.id, ...doc.data() }));
    
    manutencoes.sort((a, b) => {
      const dataA = a.dataManutencao?.seconds || 0;
      const dataB = b.dataManutencao?.seconds || 0;
      return dataB - dataA; // Mais recente primeiro
    });

    let html = "";
    manutencoes.forEach((manutencao) => {
      const dataFormatada = manutencao.dataManutencao
        ? new Date(manutencao.dataManutencao.seconds * 1000).toLocaleString("pt-BR")
        : "Data não informada";

      const itensTrocados = [];
      const trocas = manutencao.trocas || {};

      const itensMap = {
        oleoMotor: {
          nome: "Óleo do Motor",
          icone: "fa-oil-can",
          cor: "primary",
        },
        oleoCambio: {
          nome: "Óleo do Câmbio",
          icone: "fa-cogs",
          cor: "primary",
        },
        oleoDiferencial: {
          nome: "Óleo do Diferencial",
          icone: "fa-differential",
          cor: "primary",
        },
        filtroMotor: {
          nome: "Filtro do Motor",
          icone: "fa-filter",
          cor: "success",
        },
        filtroDiesel: {
          nome: "Filtro do Diesel",
          icone: "fa-gas-pump",
          cor: "success",
        },
        filtroAr: { nome: "Filtro de Ar", icone: "fa-wind", cor: "success" },
        filtroCambio: {
          nome: "Filtro do Câmbio",
          icone: "fa-filter",
          cor: "success",
        },
        filtroPU: { nome: "Filtro P.U.", icone: "fa-filter", cor: "success" },
      };

      for (const [key, item] of Object.entries(itensMap)) {
        if (trocas[key]?.trocado) {
          const kmTroca = trocas[key].km || manutencao.km;
          let dataTroca = trocas[key].data || dataFormatada;

          if (
            trocas[key].data &&
            typeof trocas[key].data === "object" &&
            trocas[key].data.seconds
          ) {
            dataTroca = new Date(
              trocas[key].data.seconds * 1000,
            ).toLocaleString("pt-BR");
          } else if (
            typeof dataTroca === "string" &&
            dataTroca.match(/^\d{4}-\d{2}-\d{2}/)
          ) {
            dataTroca = dataTroca.split("-").reverse().join("/");
          }

          itensTrocados.push({
            ...item,
            km: formatarKm(kmTroca),
            data: dataTroca,
          });
        }
      }

      if (itensTrocados.length === 0) return;

      html += `
        <div class="manutencao-card">
            <div class="manutencao-header">
                <span class="manutencao-data"><i class="fas fa-calendar-alt me-1"></i>${dataFormatada}</span>
                <span class="manutencao-km"><i class="fas fa-tachometer-alt me-1"></i>${formatarKm(manutencao.km)} km</span>
            </div>
            <div class="manutencao-itens">
                ${itensTrocados
                  .map(
                    (item) => `
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
                `,
                  )
                  .join("")}
            </div>
        </div>
      `;
    });

    manutencoesList.innerHTML =
      html ||
      `<div class="empty-state"><i class="fas fa-tools fa-3x mb-3 opacity-50"></i><p>Nenhum registro de manutenção</p></div>`;
  } catch (error) {
    console.error("Erro ao carregar manutenções:", error);
    manutencoesList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao carregar histórico</p></div>`;
  }
}

window.initManutencao = initManutencao;
