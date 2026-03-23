// ============================================
// RELATORIOS.JS - Tela de Relatórios para Gestor
// Disponível para: gerente, supervisor, admin
// ============================================

// Template da tela de relatórios
const relatoriosTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-chart-line me-2"></i>
        <span>Relatórios gerais da frota - Visualize e exporte dados de viagens, manutenções e abastecimentos</span>
    </div>
</div>

<!-- Cards de Resumo -->
<div class="row g-2 mb-4">
    <div class="col-6 col-md-3">
        <div class="card bg-primary text-white border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="opacity-75 d-block">Total de Viagens</small>
                        <h3 class="mb-0" id="total-viagens">0</h3>
                    </div>
                    <i class="fas fa-truck fa-2x opacity-50"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="card bg-success text-white border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="opacity-75 d-block">KM Totais</small>
                        <h3 class="mb-0" id="total-km">0</h3>
                    </div>
                    <i class="fas fa-road fa-2x opacity-50"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="card bg-warning text-dark border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="opacity-75 d-block">Manutenções</small>
                        <h3 class="mb-0" id="total-manutencoes">0</h3>
                    </div>
                    <i class="fas fa-tools fa-2x opacity-50"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="card bg-info text-white border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="opacity-75 d-block">Abastecimentos</small>
                        <h3 class="mb-0" id="total-abastecimentos">0</h3>
                    </div>
                    <i class="fas fa-gas-pump fa-2x opacity-50"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Filtros -->
<div class="card border-0 shadow-sm rounded-4 mb-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-filter me-2"></i>Filtros
        </h6>
        <div class="row g-2">
            <div class="col-md-4">
                <select id="filtro-motorista" class="form-select form-select-sm">
                    <option value="">Todos os motoristas</option>
                </select>
            </div>
            <div class="col-md-3">
                <input type="date" id="filtro-data-inicio" class="form-control form-control-sm" placeholder="Data início">
            </div>
            <div class="col-md-3">
                <input type="date" id="filtro-data-fim" class="form-control form-control-sm" placeholder="Data fim">
            </div>
            <div class="col-md-2">
                <button id="aplicar-filtros" class="btn btn-primary btn-sm w-100">
                    <i class="fas fa-search me-1"></i>Aplicar
                </button>
            </div>
        </div>
        <div class="row g-2 mt-2">
            <div class="col-md-12">
                <div class="btn-group w-100" role="group">
                    <button id="btn-viagens" class="btn btn-outline-primary btn-sm active">
                        <i class="fas fa-truck me-1"></i>Viagens
                    </button>
                    <button id="btn-manutencoes" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-tools me-1"></i>Manutenções
                    </button>
                    <button id="btn-abastecimentos" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-gas-pump me-1"></i>Abastecimentos
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Botões de Exportação -->
<div class="d-flex gap-2 mb-3 justify-content-end">
    <button id="exportar-pdf" class="btn btn-danger btn-sm">
        <i class="fas fa-file-pdf me-1"></i>Exportar PDF
    </button>
    <button id="exportar-excel" class="btn btn-success btn-sm">
        <i class="fas fa-file-excel me-1"></i>Exportar Excel
    </button>
</div>

<!-- Tabela de Dados -->
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3" id="tabela-titulo">
            <i class="fas fa-truck me-2"></i>Viagens Realizadas
        </h6>
        <div class="table-responsive">
            <table class="table table-hover table-sm" id="tabela-dados">
                <thead class="table-light">
                    <tr id="tabela-cabecalho">
                        <!-- Cabeçalho será preenchido dinamicamente -->
                    </tr>
                </thead>
                <tbody id="tabela-corpo">
                    <tr><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`;

// Estado da tela
let dadosAtuais = [];
let tipoRelatorioAtual = "viagens";
let filtrosAtuais = {
  motorista: "",
  dataInicio: "",
  dataFim: "",
};

// Inicializar tela de relatórios
function initRelatorios(container) {
  console.log("📊 Inicializando tela de Relatórios");

  if (container) {
    container.innerHTML = relatoriosTemplate;
  }

  setupRelatoriosListeners();
  carregarDados();
}

// Configurar listeners
function setupRelatoriosListeners() {
  // Botões de abas
  document
    .getElementById("btn-viagens")
    ?.addEventListener("click", () => mudarAba("viagens"));
  document
    .getElementById("btn-manutencoes")
    ?.addEventListener("click", () => mudarAba("manutencoes"));
  document
    .getElementById("btn-abastecimentos")
    ?.addEventListener("click", () => mudarAba("abastecimentos"));

  // Botão aplicar filtros
  document
    .getElementById("aplicar-filtros")
    ?.addEventListener("click", aplicarFiltros);

  // Botões de exportação
  document
    .getElementById("exportar-pdf")
    ?.addEventListener("click", exportarPDF);
  document
    .getElementById("exportar-excel")
    ?.addEventListener("click", exportarExcel);

  // Filtrar motoristas ao digitar
  document
    .getElementById("filtro-motorista")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("filtro-data-inicio")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("filtro-data-fim")
    ?.addEventListener("change", aplicarFiltros);
}

// Mudar aba
function mudarAba(tipo) {
  tipoRelatorioAtual = tipo;

  // Atualizar botões
  document.getElementById("btn-viagens").classList.remove("active");
  document.getElementById("btn-manutencoes").classList.remove("active");
  document.getElementById("btn-abastecimentos").classList.remove("active");

  if (tipo === "viagens")
    document.getElementById("btn-viagens").classList.add("active");
  if (tipo === "manutencoes")
    document.getElementById("btn-manutencoes").classList.add("active");
  if (tipo === "abastecimentos")
    document.getElementById("btn-abastecimentos").classList.add("active");

  // Atualizar título
  const titulo = document.getElementById("tabela-titulo");
  if (titulo) {
    const icones = {
      viagens: "fa-truck",
      manutencoes: "fa-tools",
      abastecimentos: "fa-gas-pump",
    };
    const textos = {
      viagens: "Viagens Realizadas",
      manutencoes: "Histórico de Manutenções",
      abastecimentos: "Registros de Abastecimento",
    };
    titulo.innerHTML = `<i class="fas ${icones[tipo]} me-2"></i>${textos[tipo]}`;
  }

  // Aplicar filtros
  aplicarFiltros();
}

// Aplicar filtros
function aplicarFiltros() {
  filtrosAtuais = {
    motorista: document.getElementById("filtro-motorista")?.value || "",
    dataInicio: document.getElementById("filtro-data-inicio")?.value || "",
    dataFim: document.getElementById("filtro-data-fim")?.value || "",
  };

  carregarDados();
}

// Carregar dados do Firebase
async function carregarDados() {
  try {
    // Mostrar loading
    document.getElementById("tabela-corpo").innerHTML =
      '<tr><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>';

    // Buscar motoristas para o filtro
    await carregarMotoristasFiltro();

    // Buscar dados conforme o tipo
    if (tipoRelatorioAtual === "viagens") {
      await carregarViagens();
    } else if (tipoRelatorioAtual === "manutencoes") {
      await carregarManutencoes();
    } else if (tipoRelatorioAtual === "abastecimentos") {
      await carregarAbastecimentos();
    }

    // Atualizar cards de resumo
    await atualizarCardsResumo();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    document.getElementById("tabela-corpo").innerHTML =
      `<tr><td colspan="10" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar dados: ${error.message}</td></tr>`;
  }
}

// Carregar motoristas para o filtro
async function carregarMotoristasFiltro() {
  try {
    const snapshot = await window.db.collection("motoristas").limit(100).get();
    const select = document.getElementById("filtro-motorista");

    if (select && !select.hasChildNodes() && snapshot.size > 0) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = data.login || doc.id;
        option.textContent = data.nome || data.login || doc.id;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Erro ao carregar motoristas:", error);
  }
}

// Carregar viagens
async function carregarViagens() {
  try {
    let query = window.db.collection("fretes");

    // Aplicar filtros
    if (filtrosAtuais.motorista) {
      query = query.where("login", "==", filtrosAtuais.motorista);
    }

    query = query.limit(100);
    const snapshot = await query.get();

    if (snapshot.empty) {
      document.getElementById("tabela-corpo").innerHTML =
        '<tr><td colspan="10" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
      dadosAtuais = [];
      return;
    }

    // Processar dados
    let viagens = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const dataViagem = data.timestamp?.seconds
        ? new Date(data.timestamp.seconds * 1000)
        : null;

      // Filtrar por data
      if (
        filtrosAtuais.dataInicio &&
        dataViagem &&
        dataViagem < new Date(filtrosAtuais.dataInicio)
      )
        return;
      if (
        filtrosAtuais.dataFim &&
        dataViagem &&
        dataViagem > new Date(filtrosAtuais.dataFim)
      )
        return;

      viagens.push({
        id: doc.id,
        data: dataViagem
          ? dataViagem.toLocaleDateString("pt-BR")
          : "Data não informada",
        motorista: data.nome || "Não identificado",
        origem: data.origem?.substring(0, 50) || "-",
        partida: data.partida?.substring(0, 50) || "-",
        entrega: data.entrega?.substring(0, 50) || "-",
        distancia: data.distancia_total || data.distancia || 0,
        toneladas: data.toneladas || 0,
        valor: data.valorTotal || 0,
        combustivel: data.combustivel || 0,
        status: data.status || "realizada",
      });
    });

    dadosAtuais = viagens;
    renderizarTabelaViagens(viagens);
  } catch (error) {
    console.error("Erro ao carregar viagens:", error);
    throw error;
  }
}

// Renderizar tabela de viagens
function renderizarTabelaViagens(dados) {
  const cabecalho = `
        <th>Data</th>
        <th>Motorista</th>
        <th>Origem</th>
        <th>Carregamento</th>
        <th>Descarga</th>
        <th>Distância (km)</th>
        <th>Toneladas (t)</th>
        <th>Valor (R$)</th>
        <th>Combustível (L)</th>
    `;

  document.getElementById("tabela-cabecalho").innerHTML = cabecalho;

  if (dados.length === 0) {
    document.getElementById("tabela-corpo").innerHTML =
      '<tr><td colspan="9" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
    return;
  }

  let html = "";
  dados.forEach((v) => {
    html += `
            <tr>
                <td class="small">${v.data}</td>
                <td class="small fw-semibold">${v.motorista}</td>
                <td class="small">${v.origem}</td>
                <td class="small">${v.partida}</td>
                <td class="small">${v.entrega}</td>
                <td class="small text-end">${formatarKm(v.distancia)}</td>
                <td class="small text-end">${v.toneladas.toFixed(1)}</td>
                <td class="small text-end text-primary fw-semibold">${formatarMoeda(v.valor)}</td>
                <td class="small text-end">${formatarKm(v.combustivel)}</td>
            </tr>
        `;
  });

  // Adicionar linha de total
  const totalDistancia = dados.reduce((sum, v) => sum + (v.distancia || 0), 0);
  const totalToneladas = dados.reduce((sum, v) => sum + (v.toneladas || 0), 0);
  const totalValor = dados.reduce((sum, v) => sum + (v.valor || 0), 0);
  const totalCombustivel = dados.reduce(
    (sum, v) => sum + (v.combustivel || 0),
    0,
  );

  html += `
        <tr class="table-light fw-semibold">
            <td colspan="5" class="text-end">TOTAIS:</td>
            <td class="text-end">${formatarKm(totalDistancia)}</td>
            <td class="text-end">${totalToneladas.toFixed(1)} t</td>
            <td class="text-end text-primary">${formatarMoeda(totalValor)}</td>
            <td class="text-end">${formatarKm(totalCombustivel)} L</td>
        </tr>
    `;

  document.getElementById("tabela-corpo").innerHTML = html;
}

// Carregar manutenções
async function carregarManutencoes() {
  try {
    let query = window.db.collection("manutencoes");

    if (filtrosAtuais.motorista) {
      query = query.where("motoristaId", "==", filtrosAtuais.motorista);
    }

    query = query.limit(100);
    const snapshot = await query.get();

    if (snapshot.empty) {
      document.getElementById("tabela-corpo").innerHTML =
        '<tr><td colspan="10" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma manutenção encontrada</td></tr>';
      dadosAtuais = [];
      return;
    }

    let manutencoes = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const dataManutencao = data.dataManutencao?.seconds
        ? new Date(data.dataManutencao.seconds * 1000)
        : null;

      if (
        filtrosAtuais.dataInicio &&
        dataManutencao &&
        dataManutencao < new Date(filtrosAtuais.dataInicio)
      )
        return;
      if (
        filtrosAtuais.dataFim &&
        dataManutencao &&
        dataManutencao > new Date(filtrosAtuais.dataFim)
      )
        return;

      // Contar itens trocados
      const itens = [];
      const trocas = data.trocas || {};
      if (trocas.oleoMotor?.trocado) itens.push("Óleo Motor");
      if (trocas.oleoCambio?.trocado) itens.push("Óleo Câmbio");
      if (trocas.oleoDiferencial?.trocado) itens.push("Óleo Diferencial");
      if (trocas.filtroMotor?.trocado) itens.push("Filtro Motor");
      if (trocas.filtroDiesel?.trocado) itens.push("Filtro Diesel");
      if (trocas.filtroAr?.trocado) itens.push("Filtro Ar");
      if (trocas.filtroCambio?.trocado) itens.push("Filtro Câmbio");
      if (trocas.filtroPU?.trocado) itens.push("Filtro P.U.");

      manutencoes.push({
        id: doc.id,
        data: dataManutencao
          ? dataManutencao.toLocaleDateString("pt-BR")
          : "Data não informada",
        motorista: data.motoristaNome || "Não identificado",
        km: data.km || 0,
        itens: itens.join(", ") || "Nenhum item",
        status: data.status || "realizada",
      });
    });

    dadosAtuais = manutencoes;
    renderizarTabelaManutencoes(manutencoes);
  } catch (error) {
    console.error("Erro ao carregar manutenções:", error);
    throw error;
  }
}

// Renderizar tabela de manutenções
function renderizarTabelaManutencoes(dados) {
  const cabecalho = `
        <th>Data</th>
        <th>Motorista</th>
        <th>Quilometragem (km)</th>
        <th>Itens Trocados</th>
        <th>Status</th>
    `;

  document.getElementById("tabela-cabecalho").innerHTML = cabecalho;

  if (dados.length === 0) {
    document.getElementById("tabela-corpo").innerHTML =
      '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma manutenção encontrada</td></tr>';
    return;
  }

  let html = "";
  dados.forEach((m) => {
    html += `
            <tr>
                <td class="small">${m.data}</td>
                <td class="small fw-semibold">${m.motorista}</td>
                <td class="small text-end">${formatarKm(m.km)}</td>
                <td class="small">${m.itens}</td>
                <td class="small"><span class="badge bg-success">${m.status}</span></td>
            </tr>
        `;
  });

  document.getElementById("tabela-corpo").innerHTML = html;
}

// Carregar abastecimentos (placeholder - ajustar conforme sua estrutura)
async function carregarAbastecimentos() {
  // Se você tiver uma coleção de abastecimentos, ajuste aqui
  document.getElementById("tabela-cabecalho").innerHTML =
    `<th>Data</th><th>Motorista</th><th>Quantidade (L)</th><th>Valor (R$)</th><th>Km</th>`;
  document.getElementById("tabela-corpo").innerHTML =
    '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Tela de abastecimentos em desenvolvimento</td></tr>';
  dadosAtuais = [];
}

// Atualizar cards de resumo
async function atualizarCardsResumo() {
  try {
    // Total de viagens
    const viagensSnapshot = await window.db
      .collection("fretes")
      .limit(1000)
      .get();
    let totalKm = 0;
    viagensSnapshot.forEach((doc) => {
      const data = doc.data();
      totalKm += data.distancia_total || data.distancia || 0;
    });

    document.getElementById("total-viagens").textContent = viagensSnapshot.size;
    document.getElementById("total-km").textContent = formatarKm(totalKm);

    // Total de manutenções
    const manutSnapshot = await window.db
      .collection("manutencoes")
      .limit(1000)
      .get();
    document.getElementById("total-manutencoes").textContent =
      manutSnapshot.size;

    // Total de abastecimentos (ajustar)
    document.getElementById("total-abastecimentos").textContent = "0";
  } catch (error) {
    console.error("Erro ao atualizar cards:", error);
  }
}

// Funções auxiliares
function formatarKm(valor) {
  if (!valor) return "0";
  return Math.floor(valor).toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
  if (!valor) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Exportar para Excel (XLSX)
function exportarExcel() {
  if (!dadosAtuais || dadosAtuais.length === 0) {
    alert("Não há dados para exportar!");
    return;
  }

  // Criar array com os dados da planilha
  let dadosPlanilha = [];

  // Cabeçalho com informações do relatório
  const dataGeracao =
    new Date().toLocaleDateString("pt-BR") +
    " " +
    new Date().toLocaleTimeString("pt-BR");
  const tituloRelatorio =
    tipoRelatorioAtual === "viagens"
      ? "RELATÓRIO DE VIAGENS"
      : tipoRelatorioAtual === "manutencoes"
        ? "RELATÓRIO DE MANUTENÇÕES"
        : "RELATÓRIO DE ABASTECIMENTOS";

  dadosPlanilha.push([tituloRelatorio]);
  dadosPlanilha.push([]);
  dadosPlanilha.push(["Data de Geração:", dataGeracao]);
  dadosPlanilha.push([
    "Período:",
    `${filtrosAtuais.dataInicio || "Todas as datas"} até ${filtrosAtuais.dataFim || "Hoje"}`,
  ]);
  dadosPlanilha.push([
    "Motorista:",
    filtrosAtuais.motorista || "Todos os motoristas",
  ]);
  dadosPlanilha.push([]);

  if (tipoRelatorioAtual === "viagens") {
    // Cabeçalho da tabela
    dadosPlanilha.push([
      "Data",
      "Motorista",
      "Origem",
      "Carregamento",
      "Descarga",
      "Distância (km)",
      "Toneladas (t)",
      "Valor (R$)",
      "Combustível (L)",
    ]);

    // Dados
    dadosAtuais.forEach((v) => {
      dadosPlanilha.push([
        v.data,
        v.motorista,
        v.origem,
        v.partida,
        v.entrega,
        v.distancia,
        v.toneladas.toFixed(1),
        v.valor,
        v.combustivel,
      ]);
    });

    // Linha de total
    const totalDistancia = dadosAtuais.reduce(
      (sum, v) => sum + (v.distancia || 0),
      0,
    );
    const totalToneladas = dadosAtuais.reduce(
      (sum, v) => sum + (v.toneladas || 0),
      0,
    );
    const totalValor = dadosAtuais.reduce((sum, v) => sum + (v.valor || 0), 0);
    const totalCombustivel = dadosAtuais.reduce(
      (sum, v) => sum + (v.combustivel || 0),
      0,
    );

    dadosPlanilha.push([
      "TOTAIS",
      "",
      "",
      "",
      "",
      totalDistancia,
      totalToneladas.toFixed(1),
      totalValor,
      totalCombustivel,
    ]);
  } else if (tipoRelatorioAtual === "manutencoes") {
    // Cabeçalho da tabela
    dadosPlanilha.push([
      "Data",
      "Motorista",
      "Quilometragem (km)",
      "Itens Trocados",
      "Status",
    ]);

    // Dados
    dadosAtuais.forEach((m) => {
      dadosPlanilha.push([m.data, m.motorista, m.km, m.itens, m.status]);
    });
  }

  // Criar uma planilha (worksheet)
  const worksheet = XLSX.utils.aoa_to_sheet(dadosPlanilha);

  // Definir largura das colunas
  const colunas = [];
  if (tipoRelatorioAtual === "viagens") {
    colunas.push(
      { wch: 12 },
      { wch: 20 },
      { wch: 40 },
      { wch: 40 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    );
  } else if (tipoRelatorioAtual === "manutencoes") {
    colunas.push(
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 60 },
      { wch: 12 },
    );
  }
  worksheet["!cols"] = colunas;

  // Criar workbook e adicionar a planilha
  const workbook = XLSX.utils.book_new();
  const nomeSheet =
    tipoRelatorioAtual === "viagens"
      ? "Viagens"
      : tipoRelatorioAtual === "manutencoes"
        ? "Manutenções"
        : "Abastecimentos";
  XLSX.utils.book_append_sheet(workbook, worksheet, nomeSheet);

  // Gerar arquivo XLSX
  const nomeArquivo = `frotatrack_${tipoRelatorioAtual}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

// Exportar para PDF (usando window.print para simplicidade)
function exportarPDF() {
  if (!dadosAtuais || dadosAtuais.length === 0) {
    alert("Não há dados para exportar!");
    return;
  }

  const conteudoOriginal = document.getElementById("tabela-dados").outerHTML;
  const titulo = document.getElementById("tabela-titulo").innerHTML;
  const dataGeracao =
    new Date().toLocaleDateString("pt-BR") +
    " " +
    new Date().toLocaleTimeString("pt-BR");

  const janela = window.open("", "_blank");
  janela.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório FrotaTrack - ${tipoRelatorioAtual}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; font-family: Arial, sans-serif; }
                h2 { color: #4158D0; margin-bottom: 20px; }
                .header { margin-bottom: 30px; border-bottom: 2px solid #4158D0; padding-bottom: 10px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th { background-color: #4158D0; color: white; padding: 8px; text-align: left; }
                td { padding: 6px; border-bottom: 1px solid #ddd; }
                .text-end { text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2><i class="fas fa-chart-line"></i> ${titulo.replace(/<[^>]*>/g, "")}</h2>
                <p>Gerado em: ${dataGeracao}</p>
                <p>Motorista: ${filtrosAtuais.motorista || "Todos"} | Período: ${filtrosAtuais.dataInicio || "Todas"} até ${filtrosAtuais.dataFim || "Hoje"}</p>
            </div>
            ${conteudoOriginal}
            <div class="footer">
                <p>FrotaTrack - Sistema de Gestão de Frotas</p>
            </div>
        </body>
        </html>
    `);
  janela.document.close();
  janela.print();
}

window.initRelatorios = initRelatorios;
