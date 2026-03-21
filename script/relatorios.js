// ============================================
// RELATORIOS.JS - Tela de Relatórios
// Disponível para: gerente, supervisor, admin
// ============================================

function initRelatorios() {
  console.log("📊 Inicializando tela de Relatórios");
  setupRelatoriosListeners();
  loadAllFretes();
}

function setupRelatoriosListeners() {
  document.getElementById("filter-motorista")?.addEventListener("input", debounce(loadAllFretes, 500));
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

  document.getElementById("total-fretes").textContent = totalFretes;
  document.getElementById("total-km").textContent = totalKm + " km";
  document.getElementById("total-peso").textContent = totalPeso.toFixed(1) + " t";
  document.getElementById("total-combustivel").textContent = totalComb + " L";
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

window.initRelatorios = initRelatorios;