// ============================================
// MANUTENCAO.JS
// Toda a lógica da tela de manutenção
// ============================================

// Configurar listeners da tela de manutenção
function setupManutencaoListeners() {
  console.log("🔧 Configurando listeners de manutenção...");

  // Eventos dos switches para mostrar/esconder campos
  const switches = [
    "oleo-motor",
    "oleo-cambio",
    "oleo-diferencial",
    "filtro-motor",
    "filtro-diesel",
    "filtro-ar",
    "filtro-pu",
  ];

  switches.forEach((item) => {
    const checkbox = document.getElementById(`troca-${item}`);
    if (checkbox) {
      checkbox.removeEventListener("change", handleSwitchChange);
      checkbox.addEventListener("change", handleSwitchChange);
    }
  });

  // Submit do formulário
  const form = document.getElementById("manutencao-form");
  if (form) {
    form.removeEventListener("submit", handleManutencaoSubmit);
    form.addEventListener("submit", handleManutencaoSubmit);
  }

  // Carregar histórico de manutenções
  loadHistoricoManutencoes();
}

// Função para lidar com o toggle dos switches
function handleSwitchChange(e) {
  const checkbox = e.target;
  const itemId = checkbox.id.replace("troca-", "");
  const campos = document.getElementById(`campos-${itemId}`);
  if (campos) {
    campos.style.display = checkbox.checked ? "block" : "none";
  }
}

// Carregar histórico de manutenções da coleção "manutencoes"
async function loadHistoricoManutencoes() {
  const manutencoesList = document.getElementById("manutencoes-list");
  if (!manutencoesList) return;

  manutencoesList.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

  try {
    // Buscar manutenções do motorista na coleção "manutencoes"
    const snapshot = await db
      .collection("manutencoes")
      .where("motoristaId", "==", currentUser.id)
      .limit(50)
      .get();

    if (snapshot.empty) {
      manutencoesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tools fa-3x mb-3 opacity-50"></i>
          <p>Nenhum registro de manutenção</p>
          <small class="text-secondary">Registre a primeira manutenção acima</small>
        </div>`;
      return;
    }

    // Converter para array
    let manutencoes = [];
    snapshot.forEach((doc) => {
      manutencoes.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar manualmente no JavaScript (mais recente primeiro)
    manutencoes.sort((a, b) => {
      if (!a.dataManutencao) return 1;
      if (!b.dataManutencao) return -1;
      return b.dataManutencao.seconds - a.dataManutencao.seconds;
    });

    let html = "";
    manutencoes.forEach((manutencao) => {
      const dataFormatada = manutencao.dataManutencao
        ? new Date(
            manutencao.dataManutencao.seconds * 1000,
          ).toLocaleDateString() +
          " " +
          new Date(
            manutencao.dataManutencao.seconds * 1000,
          ).toLocaleTimeString()
        : "Data não informada";

      // Coletar itens trocados com detalhes
      const itensTrocados = [];
      const trocas = manutencao.trocas || {};

      // Mapeamento dos itens com ícones e cores
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
        filtroPU: { nome: "Filtro P.U.", icone: "fa-filter", cor: "success" },
      };

      for (const [key, item] of Object.entries(itensMap)) {
        if (trocas[key]?.trocado) {
          const kmTroca = trocas[key].km || manutencao.km;
          const dataTroca = trocas[key].data || dataFormatada;

          itensTrocados.push({
            ...item,
            km: kmTroca,
            data: dataTroca,
          });
        }
      }

      if (itensTrocados.length === 0) {
        return; // Pular manutenção sem itens
      }

      html += `
        <div class="manutencao-card">
          <div class="manutencao-header">
            <span class="manutencao-data">
              <i class="fas fa-calendar-alt me-1"></i>
              ${dataFormatada}
            </span>
            <span class="manutencao-km">
              <i class="fas fa-tachometer-alt me-1"></i>
              ${manutencao.km || 0} km
            </span>
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
                    <span class="badge bg-light text-dark me-2">
                      <i class="fas fa-calendar-alt me-1"></i>${typeof item.data === "string" ? item.data : new Date(item.data.seconds * 1000).toLocaleDateString()}
                    </span>
                    <span class="badge bg-light text-dark">
                      <i class="fas fa-tachometer-alt me-1"></i>${item.km} km
                    </span>
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

    if (html === "") {
      manutencoesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tools fa-3x mb-3 opacity-50"></i>
          <p>Nenhum registro de manutenção</p>
          <small class="text-secondary">Registre a primeira manutenção acima</small>
        </div>`;
    } else {
      manutencoesList.innerHTML = html;
    }
  } catch (error) {
    console.error("Erro ao carregar manutenções:", error);
    manutencoesList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i>
        <p>Erro ao carregar histórico</p>
        <small class="text-secondary">${error.message}</small>
      </div>`;
  }
}

// Salvar manutenção na coleção "manutencoes"
async function handleManutencaoSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Usuário não logado!");
    return;
  }

  const dataManutencao = document.getElementById("data-manutencao").value;
  const km = parseFloat(document.getElementById("km-manutencao").value);

  if (!dataManutencao || !km) {
    alert("Preencha a data e a quilometragem da manutenção!");
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
  btn.disabled = true;

  try {
    // Preparar os dados da manutenção
    const trocas = {};
    const dataObj = new Date(dataManutencao);

    // Óleos
    if (document.getElementById("troca-oleo-motor")?.checked) {
      trocas.oleoMotor = {
        trocado: true,
        data:
          document.getElementById("data-oleo-motor")?.value || dataManutencao,
        km: parseFloat(document.getElementById("km-oleo-motor")?.value) || km,
      };
    }
    if (document.getElementById("troca-oleo-cambio")?.checked) {
      trocas.oleoCambio = {
        trocado: true,
        data:
          document.getElementById("data-oleo-cambio")?.value || dataManutencao,
        km: parseFloat(document.getElementById("km-oleo-cambio")?.value) || km,
      };
    }
    if (document.getElementById("troca-oleo-diferencial")?.checked) {
      trocas.oleoDiferencial = {
        trocado: true,
        data:
          document.getElementById("data-oleo-diferencial")?.value ||
          dataManutencao,
        km:
          parseFloat(document.getElementById("km-oleo-diferencial")?.value) ||
          km,
      };
    }

    // Filtros
    if (document.getElementById("troca-filtro-motor")?.checked) {
      trocas.filtroMotor = {
        trocado: true,
        data:
          document.getElementById("data-filtro-motor")?.value || dataManutencao,
        km: parseFloat(document.getElementById("km-filtro-motor")?.value) || km,
      };
    }
    if (document.getElementById("troca-filtro-diesel")?.checked) {
      trocas.filtroDiesel = {
        trocado: true,
        data:
          document.getElementById("data-filtro-diesel")?.value ||
          dataManutencao,
        km:
          parseFloat(document.getElementById("km-filtro-diesel")?.value) || km,
      };
    }
    if (document.getElementById("troca-filtro-ar")?.checked) {
      trocas.filtroAr = {
        trocado: true,
        data:
          document.getElementById("data-filtro-ar")?.value || dataManutencao,
        km: parseFloat(document.getElementById("km-filtro-ar")?.value) || km,
      };
    }
    if (document.getElementById("troca-filtro-pu")?.checked) {
      trocas.filtroPU = {
        trocado: true,
        data:
          document.getElementById("data-filtro-pu")?.value || dataManutencao,
        km: parseFloat(document.getElementById("km-filtro-pu")?.value) || km,
      };
    }

    if (Object.keys(trocas).length === 0) {
      alert("Selecione pelo menos um item para registrar a manutenção!");
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    // Criar documento na coleção "manutencoes"
    const manutencao = {
      motoristaId: currentUser.id,
      motoristaNome: currentUser.nome,
      dataManutencao: dataObj,
      km: km,
      trocas: trocas,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "realizada",
    };

    await db.collection("manutencoes").add(manutencao);

    alert("Manutenção registrada com sucesso!");

    // Limpar formulário
    e.target.reset();

    // Esconder todos os campos de troca
    document.querySelectorAll(".campos-troca").forEach((campo) => {
      campo.style.display = "none";
    });

    // Desmarcar todos os switches
    document.querySelectorAll(".form-check-input").forEach((sw) => {
      sw.checked = false;
    });

    // Recarregar histórico
    loadHistoricoManutencoes();
  } catch (error) {
    console.error("Erro ao salvar manutenção:", error);
    alert(`Erro ao salvar manutenção: ${error.message}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
