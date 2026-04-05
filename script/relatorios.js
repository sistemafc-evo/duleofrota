// ============================================
// RELATORIOS.JS - Tela de Relatórios para Gestor
// Disponível para: gerente, supervisor, admin
// ============================================

// Template da tela de relatórios
const relatoriosTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-chart-line me-2"></i>
        <span>Relatórios gerais da frota - Visualize dados principais | Exporte para Excel/PDF com dados completos</span>
    </div>
</div>

<!-- Abas de seleção -->
<ul class="nav nav-tabs mb-3" id="relatorioTabs" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" id="viagens-tab" data-bs-toggle="tab" data-bs-target="#viagens-panel" type="button" role="tab">
            <i class="fas fa-truck me-1"></i> Relatório de Viagens
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="manutencoes-tab" data-bs-toggle="tab" data-bs-target="#manutencoes-panel" type="button" role="tab">
            <i class="fas fa-tools me-1"></i> Relatório de Manutenções
        </button>
    </li>
</ul>

<!-- Conteúdo das abas -->
<div class="tab-content">
    <!-- PAINEL DE VIAGENS -->
    <div class="tab-pane fade show active" id="viagens-panel" role="tabpanel">
        <!-- Cards de Resumo Viagens -->
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
                                <small class="opacity-75 d-block">Frete Total</small>
                                <h3 class="mb-0" id="total-frete">R$ 0</h3>
                            </div>
                            <i class="fas fa-dollar-sign fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card bg-info text-white border-0 shadow-sm rounded-4">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="opacity-75 d-block">Líquido Total</small>
                                <h3 class="mb-0" id="total-liquido">R$ 0</h3>
                            </div>
                            <i class="fas fa-chart-line fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros Viagens -->
        <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-filter me-2"></i>Filtros - Viagens
                </h6>
                <div class="row g-2">
                    <div class="col-md-3">
                        <select id="filtro-motorista" class="form-select form-select-sm">
                            <option value="">Todos os motoristas</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="filtro-placa" class="form-select form-select-sm">
                            <option value="">Todas as placas</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="filtro-viabilidade" class="form-select form-select-sm">
                            <option value="">Todos</option>
                            <option value="viavel">Viáveis</option>
                            <option value="inviavel">Inviáveis</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="date" id="filtro-data-inicio" class="form-control form-control-sm" placeholder="Data início">
                    </div>
                    <div class="col-md-2">
                        <input type="date" id="filtro-data-fim" class="form-control form-control-sm" placeholder="Data fim">
                    </div>
                    <div class="col-md-1">
                        <button id="aplicar-filtros" class="btn btn-primary btn-sm w-100">
                            <i class="fas fa-search me-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botões de Exportação Viagens -->
        <div class="d-flex gap-2 mb-3 justify-content-end">
            <button id="exportar-pdf-viagens" class="btn btn-danger btn-sm">
                <i class="fas fa-file-pdf me-1"></i>Exportar PDF (Completo)
            </button>
            <button id="exportar-excel-viagens" class="btn btn-success btn-sm">
                <i class="fas fa-file-excel me-1"></i>Exportar Excel (Completo)
            </button>
        </div>

        <!-- Tabela de Dados Viagens -->
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-truck me-2"></i>Viagens Realizadas
                </h6>
                <div class="table-responsive">
                    <table class="table table-hover table-sm" id="tabela-viagens">
                        <thead class="table-light">
                            <tr>
                                <th>Data</th>
                                <th>Motorista</th>
                                <th>Placa</th>
                                <th>Origem</th>
                                <th>Carregamento</th>
                                <th>Descarga</th>
                                <th>Distância (km)</th>
                                <th>Toneladas (t)</th>
                                <th>Frete (R$)</th>
                                <th>Líquido (R$)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-viagens-corpo">
                            32<td colspan="11" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td>32
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- PAINEL DE MANUTENÇÕES -->
    <div class="tab-pane fade" id="manutencoes-panel" role="tabpanel">
        <!-- Cards de Resumo Manutenções -->
        <div class="row g-2 mb-4">
            <div class="col-6 col-md-3">
                <div class="card bg-primary text-white border-0 shadow-sm rounded-4">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="opacity-75 d-block">Total Manutenções</small>
                                <h3 class="mb-0" id="total-manutencoes">0</h3>
                            </div>
                            <i class="fas fa-tools fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card bg-success text-white border-0 shadow-sm rounded-4">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="opacity-75 d-block">Total Itens Trocados</small>
                                <h3 class="mb-0" id="total-itens-trocados">0</h3>
                            </div>
                            <i class="fas fa-exchange-alt fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card bg-warning text-dark border-0 shadow-sm rounded-4">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="opacity-75 d-block">Média KM por Manutenção</small>
                                <h3 class="mb-0" id="media-km-manutencao">0</h3>
                            </div>
                            <i class="fas fa-road fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card bg-info text-white border-0 shadow-sm rounded-4">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="opacity-75 d-block">Manutenções (Último Mês)</small>
                                <h3 class="mb-0" id="manutencoes-ultimo-mes">0</h3>
                            </div>
                            <i class="fas fa-calendar-alt fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros Manutenções -->
        <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-filter me-2"></i>Filtros - Manutenções
                </h6>
                <div class="row g-2">
                    <div class="col-md-3">
                        <select id="filtro-manut-motorista" class="form-select form-select-sm">
                            <option value="">Todos os motoristas</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="filtro-manut-placa" class="form-select form-select-sm">
                            <option value="">Todas as placas</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="filtro-manut-item" class="form-select form-select-sm">
                            <option value="">Todos os itens</option>
                            <option value="oleoMotor">Óleo do Motor</option>
                            <option value="oleoCambio">Óleo do Câmbio</option>
                            <option value="oleoDiferencial">Óleo do Diferencial</option>
                            <option value="filtroMotor">Filtro do Motor</option>
                            <option value="filtroDiesel">Filtro do Diesel</option>
                            <option value="filtroAr">Filtro de Ar</option>
                            <option value="filtroCambio">Filtro do Câmbio</option>
                            <option value="filtroPU">Filtro P.U.</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="date" id="filtro-manut-data-inicio" class="form-control form-control-sm" placeholder="Data início">
                    </div>
                    <div class="col-md-2">
                        <input type="date" id="filtro-manut-data-fim" class="form-control form-control-sm" placeholder="Data fim">
                    </div>
                    <div class="col-md-1">
                        <button id="aplicar-filtros-manut" class="btn btn-primary btn-sm w-100">
                            <i class="fas fa-search me-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botões de Exportação Manutenções -->
        <div class="d-flex gap-2 mb-3 justify-content-end">
            <button id="exportar-pdf-manut" class="btn btn-danger btn-sm">
                <i class="fas fa-file-pdf me-1"></i>Exportar PDF (Completo)
            </button>
            <button id="exportar-excel-manut" class="btn btn-success btn-sm">
                <i class="fas fa-file-excel me-1"></i>Exportar Excel (Completo)
            </button>
        </div>

        <!-- Tabela de Dados Manutenções -->
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-history me-2"></i>Histórico de Manutenções
                </h6>
                <div class="table-responsive">
                    <table class="table table-hover table-sm" id="tabela-manutencoes">
                        <thead class="table-light">
                            <tr>
                                <th>Data/Hora</th>
                                <th>Motorista</th>
                                <th>Placa</th>
                                <th>KM Atual</th>
                                <th>Itens Trocados</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-manutencoes-corpo">
                            32<td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td>32
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// Estado da tela
let dadosViagensCompletos = [];
let dadosManutencoesCompletos = [];
let filtrosViagens = {
    motorista: "",
    placa: "",
    viabilidade: "",
    dataInicio: "",
    dataFim: "",
};
let filtrosManutencoes = {
    motorista: "",
    placa: "",
    item: "",
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
    carregarDadosViagens();
    carregarDadosManutencoes();
    carregarDadosFiltros();
}

// Configurar listeners
function setupRelatoriosListeners() {
    // Botões de viagens
    document.getElementById("aplicar-filtros")?.addEventListener("click", () => carregarDadosViagens());
    document.getElementById("exportar-pdf-viagens")?.addEventListener("click", () => exportarPDFViagens());
    document.getElementById("exportar-excel-viagens")?.addEventListener("click", () => exportarExcelViagens());

    // Filtros viagens
    document.getElementById("filtro-motorista")?.addEventListener("change", () => carregarDadosViagens());
    document.getElementById("filtro-placa")?.addEventListener("change", () => carregarDadosViagens());
    document.getElementById("filtro-viabilidade")?.addEventListener("change", () => carregarDadosViagens());
    document.getElementById("filtro-data-inicio")?.addEventListener("change", () => carregarDadosViagens());
    document.getElementById("filtro-data-fim")?.addEventListener("change", () => carregarDadosViagens());

    // Botões de manutenções
    document.getElementById("aplicar-filtros-manut")?.addEventListener("click", () => carregarDadosManutencoes());
    document.getElementById("exportar-pdf-manut")?.addEventListener("click", () => exportarPDFManutencoes());
    document.getElementById("exportar-excel-manut")?.addEventListener("click", () => exportarExcelManutencoes());

    // Filtros manutenções
    document.getElementById("filtro-manut-motorista")?.addEventListener("change", () => carregarDadosManutencoes());
    document.getElementById("filtro-manut-placa")?.addEventListener("change", () => carregarDadosManutencoes());
    document.getElementById("filtro-manut-item")?.addEventListener("change", () => carregarDadosManutencoes());
    document.getElementById("filtro-manut-data-inicio")?.addEventListener("change", () => carregarDadosManutencoes());
    document.getElementById("filtro-manut-data-fim")?.addEventListener("change", () => carregarDadosManutencoes());

    // Listener para abas (atualizar dados ao trocar de aba)
    document.getElementById("manutencoes-tab")?.addEventListener("shown.bs.tab", () => {
        carregarDadosManutencoes();
    });
}

// Carregar dados para os filtros (motoristas e placas)
async function carregarDadosFiltros() {
    try {
        // Carregar motoristas únicos das viagens
        const snapshot = await window.db.collection("fretes").limit(500).get();
        const motoristasSet = new Set();
        const placasSet = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.nome) motoristasSet.add(JSON.stringify({ login: data.login, nome: data.nome }));
            if (data.placa_utilizada) placasSet.add(data.placa_utilizada);
        });

        // Motoristas para filtro de viagens
        const selectMotorista = document.getElementById("filtro-motorista");
        if (selectMotorista && motoristasSet.size > 0 && selectMotorista.options.length <= 1) {
            const motoristas = Array.from(motoristasSet).map(m => JSON.parse(m));
            motoristas.sort((a, b) => a.nome.localeCompare(b.nome));
            motoristas.forEach(m => {
                const option = document.createElement("option");
                option.value = m.login || "";
                option.textContent = m.nome;
                selectMotorista.appendChild(option);
            });
        }

        // Motoristas para filtro de manutenções (buscar da coleção manutencoes)
        const manutSnapshot = await window.db.collection("manutencoes").limit(500).get();
        const motoristasManutSet = new Set();
        const placasManutSet = new Set();

        manutSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.motoristaNome) motoristasManutSet.add(JSON.stringify({ login: data.motoristaId, nome: data.motoristaNome }));
            if (data.placa) placasManutSet.add(data.placa);
        });

        const selectManutMotorista = document.getElementById("filtro-manut-motorista");
        if (selectManutMotorista && motoristasManutSet.size > 0 && selectManutMotorista.options.length <= 1) {
            const motoristas = Array.from(motoristasManutSet).map(m => JSON.parse(m));
            motoristas.sort((a, b) => a.nome.localeCompare(b.nome));
            motoristas.forEach(m => {
                const option = document.createElement("option");
                option.value = m.login || "";
                option.textContent = m.nome;
                selectManutMotorista.appendChild(option);
            });
        }

        // Placas para filtro de viagens
        const selectPlaca = document.getElementById("filtro-placa");
        if (selectPlaca && placasSet.size > 0 && selectPlaca.options.length <= 1) {
            const placas = Array.from(placasSet).sort();
            placas.forEach(placa => {
                const option = document.createElement("option");
                option.value = placa;
                option.textContent = placa;
                selectPlaca.appendChild(option);
            });
        }

        // Placas para filtro de manutenções
        const selectManutPlaca = document.getElementById("filtro-manut-placa");
        if (selectManutPlaca && placasManutSet.size > 0 && selectManutPlaca.options.length <= 1) {
            const placas = Array.from(placasManutSet).sort();
            placas.forEach(placa => {
                const option = document.createElement("option");
                option.value = placa;
                option.textContent = placa;
                selectManutPlaca.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar dados dos filtros:", error);
    }
}

// ============================================
// FUNÇÕES DE VIAGENS
// ============================================

// Carregar viagens com todos os dados
async function carregarDadosViagens() {
    try {
        document.getElementById("tabela-viagens-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>';

        // Atualizar filtros
        filtrosViagens = {
            motorista: document.getElementById("filtro-motorista")?.value || "",
            placa: document.getElementById("filtro-placa")?.value || "",
            viabilidade: document.getElementById("filtro-viabilidade")?.value || "",
            dataInicio: document.getElementById("filtro-data-inicio")?.value || "",
            dataFim: document.getElementById("filtro-data-fim")?.value || "",
        };

        let query = window.db.collection("fretes");

        if (filtrosViagens.motorista) {
            query = query.where("login", "==", filtrosViagens.motorista);
        }

        query = query.limit(500);
        const snapshot = await query.get();

        if (snapshot.empty) {
            document.getElementById("tabela-viagens-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
            dadosViagensCompletos = [];
            atualizarCardsViagens();
            return;
        }

        // Processar todos os dados
        let viagens = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataViagem = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;

            // Filtrar por data
            if (filtrosViagens.dataInicio && dataViagem && dataViagem < new Date(filtrosViagens.dataInicio)) return;
            if (filtrosViagens.dataFim && dataViagem && dataViagem > new Date(filtrosViagens.dataFim)) return;

            // Filtrar por placa
            if (filtrosViagens.placa && data.placa_utilizada !== filtrosViagens.placa) return;

            const viabilidade = data.viabilidade === true;
            
            // Filtrar por viabilidade
            if (filtrosViagens.viabilidade === "viavel" && !viabilidade) return;
            if (filtrosViagens.viabilidade === "inviavel" && viabilidade) return;

            viagens.push({
                id: doc.id,
                data: dataViagem ? dataViagem.toLocaleDateString("pt-BR") : "Data não informada",
                dataTimestamp: dataViagem,
                motorista: data.nome || "Não identificado",
                login: data.login || "",
                placa: data.placa_utilizada || "-",
                eixos: data.eixos_caminhao || 0,
                origem: data.origem || "-",
                partida: data.partida || "-",
                entrega: data.entrega || "-",
                toneladas: data.toneladas || 0,
                valorPorTonelada: data.valorPorTonelada || 0,
                valorFrete: data.valorTotal || 0,
                distanciaTrecho1: data.distancia_trecho1 || 0,
                distanciaTrecho2: data.distancia_trecho2 || 0,
                distanciaTotal: data.distancia_total || 0,
                quantidadePedagios: data.quantidade_pedagios || 0,
                valorPedagios: data.valor_total_pedagios || 0,
                pedagioAlterado: data.pedagio_alterado || false,
                pedagioValorSugerido: data.pedagio_valor_sugerido || 0,
                consumoMedio: data.consumo_medio_motorista || 0,
                combustivelEstimado: data.combustivel_estimado || 0,
                valorLDiesel: data.valor_l_diesel || 0,
                custoCombustivel: data.custo_combustivel || 0,
                cfValorPorKm: data.cf_valor_por_km || 0,
                custoFixo: data.custo_fixo || 0,
                percentualComissao: data.percentual_comissao || 0,
                comissaoValor: data.comissao_valor || 0,
                valorViabilidade: data.valor_viabilidade || 0,
                valorLiquido: data.valor_liquido || 0,
                viabilidade: viabilidade,
                status: data.status || "finalizada",
                dataFinalizacao: data.data_finalizacao?.seconds ? new Date(data.data_finalizacao.seconds * 1000) : null,
            });
        });

        dadosViagensCompletos = viagens;
        
        // Renderizar tabela VISUAL
        renderizarTabelaViagens(viagens);
        atualizarCardsViagens();
        
    } catch (error) {
        console.error("Erro ao carregar viagens:", error);
        document.getElementById("tabela-viagens-corpo").innerHTML = `<tr><td colspan="11" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar dados: ${error.message}</td></tr>`;
    }
}

// Renderizar tabela de viagens VISUAL
function renderizarTabelaViagens(dados) {
    if (dados.length === 0) {
        document.getElementById("tabela-viagens-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
        return;
    }

    let html = "";
    dados.forEach(v => {
        const statusBadge = v.status === "em_andamento" 
            ? '<span class="badge bg-warning text-dark">Em Andamento</span>' 
            : '<span class="badge bg-success">Finalizada</span>';
        
        const viabilidadeBadge = v.viabilidade
            ? '<span class="badge bg-success ms-1">✓ Viável</span>'
            : '<span class="badge bg-danger ms-1">✗ Inviável</span>';
        
        html += `
            <tr>
                <td class="small">${v.data}</td>
                <td class="small fw-semibold">${v.motorista}</td>
                <td class="small">${v.placa}</td>
                <td class="small" title="${escapeHtml(v.origem)}">${truncarTexto(v.origem, 30)}</td>
                <td class="small" title="${escapeHtml(v.partida)}">${truncarTexto(v.partida, 30)}</td>
                <td class="small" title="${escapeHtml(v.entrega)}">${truncarTexto(v.entrega, 30)}</td>
                <td class="small text-end">${formatarKm(v.distanciaTotal)}</td>
                <td class="small text-end">${v.toneladas.toFixed(1)}</td>
                <td class="small text-end text-primary fw-semibold">${formatarMoeda(v.valorFrete)}</td>
                <td class="small text-end ${v.valorLiquido >= 0 ? 'text-success' : 'text-danger'} fw-semibold">${formatarMoeda(v.valorLiquido)} ${viabilidadeBadge}</td>
                <td class="small">${statusBadge}</td>
            </tr>
        `;
    });

    // Adicionar linha de total
    const totalDistancia = dados.reduce((sum, v) => sum + v.distanciaTotal, 0);
    const totalToneladas = dados.reduce((sum, v) => sum + v.toneladas, 0);
    const totalFrete = dados.reduce((sum, v) => sum + v.valorFrete, 0);
    const totalLiquido = dados.reduce((sum, v) => sum + v.valorLiquido, 0);

    html += `
        <tr class="table-light fw-semibold">
            <td colspan="6" class="text-end">TOTAIS:</td>
            <td class="text-end">${formatarKm(totalDistancia)}</td>
            <td class="text-end">${totalToneladas.toFixed(1)} t</td>
            <td class="text-end text-primary">${formatarMoeda(totalFrete)}</td>
            <td class="text-end ${totalLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(totalLiquido)}</td>
            <td></td>
        </tr>
    `;

    document.getElementById("tabela-viagens-corpo").innerHTML = html;
}

// Atualizar cards de resumo de viagens
async function atualizarCardsViagens() {
    try {
        const snapshot = await window.db.collection("fretes").limit(1000).get();
        let totalKm = 0;
        let totalFrete = 0;
        let totalLiquido = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            totalKm += data.distancia_total || 0;
            totalFrete += data.valorTotal || 0;
            totalLiquido += data.valor_liquido || 0;
        });

        document.getElementById("total-viagens").textContent = snapshot.size;
        document.getElementById("total-km").textContent = formatarKm(totalKm);
        document.getElementById("total-frete").textContent = formatarMoeda(totalFrete);
        document.getElementById("total-liquido").textContent = formatarMoeda(totalLiquido);
    } catch (error) {
        console.error("Erro ao atualizar cards:", error);
    }
}

// ============================================
// FUNÇÕES DE MANUTENÇÕES
// ============================================

// Carregar manutenções com todos os dados
async function carregarDadosManutencoes() {
    try {
        document.getElementById("tabela-manutencoes-corpo").innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>';

        // Atualizar filtros
        filtrosManutencoes = {
            motorista: document.getElementById("filtro-manut-motorista")?.value || "",
            placa: document.getElementById("filtro-manut-placa")?.value || "",
            item: document.getElementById("filtro-manut-item")?.value || "",
            dataInicio: document.getElementById("filtro-manut-data-inicio")?.value || "",
            dataFim: document.getElementById("filtro-manut-data-fim")?.value || "",
        };

        let query = window.db.collection("manutencoes");
        query = query.limit(500);
        const snapshot = await query.get();

        if (snapshot.empty) {
            document.getElementById("tabela-manutencoes-corpo").innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma manutenção encontrada</td></tr>';
            dadosManutencoesCompletos = [];
            atualizarCardsManutencoes();
            return;
        }

        // Processar todos os dados
        let manutencoes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataManutencao = data.dataManutencao?.seconds ? new Date(data.dataManutencao.seconds * 1000) : null;

            // Filtrar por data
            if (filtrosManutencoes.dataInicio && dataManutencao && dataManutencao < new Date(filtrosManutencoes.dataInicio)) return;
            if (filtrosManutencoes.dataFim && dataManutencao && dataManutencao > new Date(filtrosManutencoes.dataFim)) return;

            // Filtrar por motorista
            if (filtrosManutencoes.motorista && data.motoristaId !== filtrosManutencoes.motorista) return;

            // Filtrar por placa (se existir no documento)
            if (filtrosManutencoes.placa && data.placa !== filtrosManutencoes.placa) return;

            const trocas = data.trocas || {};
            
            // Filtrar por item específico
            if (filtrosManutencoes.item && !trocas[filtrosManutencoes.item]?.trocado) return;

            // Listar itens trocados
            const itensTrocadosLista = [];
            const itensMap = {
                oleoMotor: "Óleo do Motor",
                oleoCambio: "Óleo do Câmbio",
                oleoDiferencial: "Óleo do Diferencial",
                filtroMotor: "Filtro do Motor",
                filtroDiesel: "Filtro do Diesel",
                filtroAr: "Filtro de Ar",
                filtroCambio: "Filtro do Câmbio",
                filtroPU: "Filtro P.U."
            };

            for (const [key, nome] of Object.entries(itensMap)) {
                if (trocas[key]?.trocado) {
                    itensTrocadosLista.push({
                        nome: nome,
                        km: trocas[key].km || data.km,
                        data: trocas[key].data
                    });
                }
            }

            if (itensTrocadosLista.length === 0) return;

            manutencoes.push({
                id: doc.id,
                dataManutencao: dataManutencao,
                dataFormatada: dataManutencao ? dataManutencao.toLocaleString("pt-BR") : "Data não informada",
                motoristaId: data.motoristaId,
                motoristaNome: data.motoristaNome || "Não identificado",
                placa: data.placa || "-",
                kmAtual: data.km || 0,
                itensTrocados: itensTrocadosLista,
                trocas: trocas,
                status: data.status || "realizada",
                timestamp: data.timestamp
            });
        });

        dadosManutencoesCompletos = manutencoes;
        
        // Renderizar tabela VISUAL
        renderizarTabelaManutencoes(manutencoes);
        atualizarCardsManutencoes();
        
    } catch (error) {
        console.error("Erro ao carregar manutenções:", error);
        document.getElementById("tabela-manutencoes-corpo").innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar dados: ${error.message}</td></tr>`;
    }
}

// Renderizar tabela de manutenções VISUAL
function renderizarTabelaManutencoes(dados) {
    if (dados.length === 0) {
        document.getElementById("tabela-manutencoes-corpo").innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma manutenção encontrada</td></tr>';
        return;
    }

    let html = "";
    dados.forEach(m => {
        const itensResumo = m.itensTrocados.map(item => item.nome).join(", ");
        
        html += `
            <tr>
                <td class="small">${m.dataFormatada}</td>
                <td class="small fw-semibold">${m.motoristaNome}</td>
                <td class="small">${m.placa}</td>
                <td class="small text-end">${formatarKm(m.kmAtual)} km</td>
                <td class="small">${truncarTexto(itensResumo, 50)}</td>
                <td class="small">
                    <button class="btn btn-sm btn-outline-info" onclick="verDetalhesManutencao('${m.id}')">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById("tabela-manutencoes-corpo").innerHTML = html;
}

// Função para ver detalhes da manutenção (modal)
window.verDetalhesManutencao = function(id) {
    const manutencao = dadosManutencoesCompletos.find(m => m.id === id);
    if (!manutencao) return;

    let detalhesHtml = `
        <div class="modal fade" id="modalDetalhesManutencao" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-tools me-2"></i>Detalhes da Manutenção</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Data/Hora:</strong> ${manutencao.dataFormatada}
                            </div>
                            <div class="col-md-6">
                                <strong>Motorista:</strong> ${manutencao.motoristaNome}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>Placa:</strong> ${manutencao.placa}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>KM Atual:</strong> ${formatarKm(manutencao.kmAtual)} km
                            </div>
                        </div>
                        <hr>
                        <h6 class="fw-semibold">Itens Trocados:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr><th>Item</th><th>Data da Troca</th><th>KM da Troca</th></tr>
                                </thead>
                                <tbody>
    `;

    manutencao.itensTrocados.forEach(item => {
        let dataTroca = item.data;
        if (dataTroca && typeof dataTroca === "object" && dataTroca.seconds) {
            dataTroca = new Date(dataTroca.seconds * 1000).toLocaleString("pt-BR");
        } else if (dataTroca && dataTroca.includes("T")) {
            dataTroca = new Date(dataTroca).toLocaleString("pt-BR");
        }
        detalhesHtml += `
            <tr>
                <td>${item.nome}</td>
                <td>${dataTroca || manutencao.dataFormatada}</td>
                <td class="text-end">${formatarKm(item.km)} km</td>
            </tr>
        `;
    });

    detalhesHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById("modalDetalhesManutencao");
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML("beforeend", detalhesHtml);
    const modal = new bootstrap.Modal(document.getElementById("modalDetalhesManutencao"));
    modal.show();

    // Remover do DOM após fechar
    document.getElementById("modalDetalhesManutencao").addEventListener("hidden.bs.modal", function() {
        this.remove();
    });
};

// Atualizar cards de resumo de manutenções
async function atualizarCardsManutencoes() {
    try {
        const snapshot = await window.db.collection("manutencoes").limit(1000).get();
        let totalItensTrocados = 0;
        let totalKm = 0;
        let manutencoesUltimoMes = 0;
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);

        snapshot.forEach(doc => {
            const data = doc.data();
            const dataManutencao = data.dataManutencao?.seconds ? new Date(data.dataManutencao.seconds * 1000) : null;
            totalKm += data.km || 0;
            
            // Contar itens trocados
            const trocas = data.trocas || {};
            for (const key in trocas) {
                if (trocas[key]?.trocado) totalItensTrocados++;
            }

            // Contar manutenções do último mês
            if (dataManutencao && dataManutencao >= umMesAtras) {
                manutencoesUltimoMes++;
            }
        });

        const mediaKm = snapshot.size > 0 ? Math.round(totalKm / snapshot.size) : 0;

        document.getElementById("total-manutencoes").textContent = snapshot.size;
        document.getElementById("total-itens-trocados").textContent = totalItensTrocados;
        document.getElementById("media-km-manutencao").textContent = formatarKm(mediaKm);
        document.getElementById("manutencoes-ultimo-mes").textContent = manutencoesUltimoMes;
    } catch (error) {
        console.error("Erro ao atualizar cards de manutenções:", error);
    }
}

// ============================================
// EXPORTAÇÃO PARA EXCEL - VIAGENS
// ============================================
function exportarExcelViagens() {
    if (!dadosViagensCompletos || dadosViagensCompletos.length === 0) {
        alert("Não há dados de viagens para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    let dadosPlanilha = [];
    
    dadosPlanilha.push(["RELATÓRIO COMPLETO DE VIAGENS - FROTATRACK"]);
    dadosPlanilha.push([]);
    dadosPlanilha.push(["Data de Geração:", dataGeracao]);
    dadosPlanilha.push(["Total de Viagens:", dadosViagensCompletos.length]);
    dadosPlanilha.push(["Período:", `${filtrosViagens.dataInicio || "Todas"} até ${filtrosViagens.dataFim || "Hoje"}`]);
    dadosPlanilha.push(["Motorista:", filtrosViagens.motorista || "Todos"]);
    dadosPlanilha.push(["Placa:", filtrosViagens.placa || "Todas"]);
    dadosPlanilha.push(["Viabilidade:", filtrosViagens.viabilidade === "viavel" ? "Apenas Viáveis" : filtrosViagens.viabilidade === "inviavel" ? "Apenas Inviáveis" : "Todos"]);
    dadosPlanilha.push([]);
    
    dadosPlanilha.push([
        "ID", "Data", "Data Finalização", "Motorista", "Login", "Placa", "Eixos",
        "Origem", "Carregamento", "Descarga",
        "Toneladas (t)", "Valor por Tonelada (R$)", "Frete Total (R$)",
        "Distância Trecho 1 (km)", "Distância Trecho 2 (km)", "Distância Total (km)",
        "Quantidade Pedágios", "Valor Pedágios (R$)", "Pedágio Alterado", "Valor Pedágio Sugerido (R$)",
        "Consumo Médio (km/L)", "Combustível Estimado (L)", "Valor Diesel (R$/L)", "Custo Combustível (R$)",
        "Custo Fixo (R$/km)", "Custo Fixo Total (R$)",
        "Percentual Comissão (%)", "Valor Comissão (R$)",
        "Custo Total Viabilidade (R$)", "Valor Líquido (R$)", "Viável?", "Status"
    ]);
    
    dadosViagensCompletos.forEach(v => {
        dadosPlanilha.push([
            v.id, v.data, v.dataFinalizacao ? v.dataFinalizacao.toLocaleDateString("pt-BR") : "-",
            v.motorista, v.login || "-", v.placa, v.eixos,
            v.origem, v.partida, v.entrega,
            v.toneladas, v.valorPorTonelada, v.valorFrete,
            v.distanciaTrecho1, v.distanciaTrecho2, v.distanciaTotal,
            v.quantidadePedagios, v.valorPedagios, v.pedagioAlterado ? "Sim" : "Não", v.pedagioValorSugerido,
            v.consumoMedio, v.combustivelEstimado, v.valorLDiesel, v.custoCombustivel,
            v.cfValorPorKm, v.custoFixo,
            v.percentualComissao, v.comissaoValor,
            v.valorViabilidade, v.valorLiquido,
            v.viabilidade ? "Viável" : "Inviável",
            v.status === "em_andamento" ? "Em Andamento" : "Finalizada"
        ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(dadosPlanilha);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Completo_Viagens");
    
    const nomeArquivo = `frotatrack_relatorio_viagens_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
}

// ============================================
// EXPORTAÇÃO PARA EXCEL - MANUTENÇÕES
// ============================================
function exportarExcelManutencoes() {
    if (!dadosManutencoesCompletos || dadosManutencoesCompletos.length === 0) {
        alert("Não há dados de manutenções para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    let dadosPlanilha = [];
    
    dadosPlanilha.push(["RELATÓRIO COMPLETO DE MANUTENÇÕES - FROTATRACK"]);
    dadosPlanilha.push([]);
    dadosPlanilha.push(["Data de Geração:", dataGeracao]);
    dadosPlanilha.push(["Total de Manutenções:", dadosManutencoesCompletos.length]);
    dadosPlanilha.push(["Período:", `${filtrosManutencoes.dataInicio || "Todas"} até ${filtrosManutencoes.dataFim || "Hoje"}`]);
    dadosPlanilha.push(["Motorista:", filtrosManutencoes.motorista || "Todos"]);
    dadosPlanilha.push(["Placa:", filtrosManutencoes.placa || "Todas"]);
    dadosPlanilha.push(["Item Filtrado:", filtrosManutencoes.item ? filtrosManutencoes.item : "Todos"]);
    dadosPlanilha.push([]);
    
    dadosPlanilha.push([
        "ID", "Data/Hora Manutenção", "Motorista", "Placa", "KM Atual",
        "Item Trocado", "Data da Troca", "KM da Troca"
    ]);
    
    dadosManutencoesCompletos.forEach(m => {
        m.itensTrocados.forEach(item => {
            let dataTroca = item.data;
            if (dataTroca && typeof dataTroca === "object" && dataTroca.seconds) {
                dataTroca = new Date(dataTroca.seconds * 1000).toLocaleString("pt-BR");
            } else if (dataTroca && dataTroca.includes("T")) {
                dataTroca = new Date(dataTroca).toLocaleString("pt-BR");
            } else if (!dataTroca) {
                dataTroca = m.dataFormatada;
            }
            
            dadosPlanilha.push([
                m.id, m.dataFormatada, m.motoristaNome, m.placa, m.kmAtual,
                item.nome, dataTroca, item.km
            ]);
        });
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(dadosPlanilha);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Completo_Manutencoes");
    
    const nomeArquivo = `frotatrack_relatorio_manutencoes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
}

// ============================================
// EXPORTAÇÃO PARA PDF - VIAGENS
// ============================================
function exportarPDFViagens() {
    if (!dadosViagensCompletos || dadosViagensCompletos.length === 0) {
        alert("Não há dados de viagens para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    const totalFrete = dadosViagensCompletos.reduce((sum, v) => sum + v.valorFrete, 0);
    const totalLiquido = dadosViagensCompletos.reduce((sum, v) => sum + v.valorLiquido, 0);
    const totalKm = dadosViagensCompletos.reduce((sum, v) => sum + v.distanciaTotal, 0);
    const totalToneladas = dadosViagensCompletos.reduce((sum, v) => sum + v.toneladas, 0);
    const totalPedagios = dadosViagensCompletos.reduce((sum, v) => sum + v.valorPedagios, 0);
    const totalCombustivel = dadosViagensCompletos.reduce((sum, v) => sum + v.custoCombustivel, 0);
    const totalComissao = dadosViagensCompletos.reduce((sum, v) => sum + v.comissaoValor, 0);
    const totalCustoFixo = dadosViagensCompletos.reduce((sum, v) => sum + v.custoFixo, 0);
    
    const viagensViaveis = dadosViagensCompletos.filter(v => v.viabilidade).length;
    const viagensInviaveis = dadosViagensCompletos.length - viagensViaveis;
    
    const htmlConteudo = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Completo de Viagens - FrotaTrack</title>
            <meta charset="UTF-8">
            <style>
                * { font-family: Arial, sans-serif; }
                body { padding: 20px; }
                h1 { color: #4158D0; text-align: center; margin-bottom: 20px; }
                h2 { color: #333; font-size: 16px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .header-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .header-info p { margin: 5px 0; }
                .resumo-card { background: #e8f0fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .resumo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .resumo-item { background: white; padding: 10px; border-radius: 6px; text-align: center; }
                .resumo-item .label { font-size: 11px; color: #666; }
                .resumo-item .value { font-size: 16px; font-weight: bold; color: #4158D0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
                th { background: #4158D0; color: white; padding: 8px; text-align: left; }
                td { padding: 6px; border-bottom: 1px solid #ddd; }
                .text-end { text-align: right; }
                .text-success { color: #28a745; }
                .text-danger { color: #dc3545; }
                .badge-viavel { background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 9px; }
                .badge-inviavel { background: #dc3545; color: white; padding: 2px 6px; border-radius: 12px; font-size: 9px; }
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>📊 FROTATRACK - RELATÓRIO COMPLETO DE VIAGENS</h1>
            
            <div class="header-info">
                <p><strong>Data de Geração:</strong> ${dataGeracao}</p>
                <p><strong>Período:</strong> ${filtrosViagens.dataInicio || "Todas"} até ${filtrosViagens.dataFim || "Hoje"}</p>
                <p><strong>Motorista:</strong> ${filtrosViagens.motorista || "Todos"}</p>
                <p><strong>Placa:</strong> ${filtrosViagens.placa || "Todas"}</p>
                <p><strong>Total de Viagens:</strong> ${dadosViagensCompletos.length}</p>
            </div>
            
            <div class="resumo-card">
                <h2>📈 RESUMO GERAL</h2>
                <div class="resumo-grid">
                    <div class="resumo-item"><div class="label">KM Totais</div><div class="value">${formatarKm(totalKm)}</div></div>
                    <div class="resumo-item"><div class="label">Toneladas</div><div class="value">${totalToneladas.toFixed(1)} t</div></div>
                    <div class="resumo-item"><div class="label">Frete Total</div><div class="value">${formatarMoeda(totalFrete)}</div></div>
                    <div class="resumo-item"><div class="label">Valor Líquido</div><div class="value">${formatarMoeda(totalLiquido)}</div></div>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 20px; justify-content: center;">
                    <div><span class="badge-viavel">✓ Viáveis: ${viagensViaveis}</span></div>
                    <div><span class="badge-inviavel">✗ Inviáveis: ${viagensInviaveis}</span></div>
                </div>
            </div>
            
            <h2>📋 LISTA COMPLETA DE VIAGENS</h2>
            <table>
                <thead>
                    <tr>
                        <th>Data</th><th>Motorista</th><th>Placa</th><th>Origem</th><th>Carregar</th>
                        <th>Descarregar</th><th>t</th><th>Frete</th><th>km</th><th>Líquido</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosViagensCompletos.map(v => `
                        <tr>
                            <td>${v.data}</td>
                            <td>${v.motorista}</td>
                            <td>${v.placa}</td>
                            <td>${truncarTexto(v.origem, 25)}</td>
                            <td>${truncarTexto(v.partida, 25)}</td>
                            <td>${truncarTexto(v.entrega, 25)}</td>
                            <td class="text-end">${v.toneladas.toFixed(1)}</td>
                            <td class="text-end">${formatarMoeda(v.valorFrete)}</td>
                            <td class="text-end">${formatarKm(v.distanciaTotal)}</td>
                            <td class="text-end ${v.valorLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(v.valorLiquido)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>FrotaTrack - Sistema de Gestão de Frotas | Relatório gerado em ${dataGeracao}</p>
            </div>
        </body>
        </html>
    `;
    
    const janela = window.open("", "_blank");
    janela.document.write(htmlConteudo);
    janela.document.close();
    janela.print();
}

// ============================================
// EXPORTAÇÃO PARA PDF - MANUTENÇÕES
// ============================================
function exportarPDFManutencoes() {
    if (!dadosManutencoesCompletos || dadosManutencoesCompletos.length === 0) {
        alert("Não há dados de manutenções para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    let totalItens = 0;
    dadosManutencoesCompletos.forEach(m => totalItens += m.itensTrocados.length);
    
    const htmlConteudo = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Completo de Manutenções - FrotaTrack</title>
            <meta charset="UTF-8">
            <style>
                * { font-family: Arial, sans-serif; }
                body { padding: 20px; }
                h1 { color: #4158D0; text-align: center; margin-bottom: 20px; }
                h2 { color: #333; font-size: 16px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .header-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .header-info p { margin: 5px 0; }
                .resumo-card { background: #e8f0fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .resumo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .resumo-item { background: white; padding: 10px; border-radius: 6px; text-align: center; }
                .resumo-item .label { font-size: 11px; color: #666; }
                .resumo-item .value { font-size: 16px; font-weight: bold; color: #4158D0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
                th { background: #4158D0; color: white; padding: 8px; text-align: left; }
                td { padding: 6px; border-bottom: 1px solid #ddd; }
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                .page-break { page-break-before: always; }
            </style>
        </head>
        <body>
            <h1>🔧 FROTATRACK - RELATÓRIO COMPLETO DE MANUTENÇÕES</h1>
            
            <div class="header-info">
                <p><strong>Data de Geração:</strong> ${dataGeracao}</p>
                <p><strong>Período:</strong> ${filtrosManutencoes.dataInicio || "Todas"} até ${filtrosManutencoes.dataFim || "Hoje"}</p>
                <p><strong>Motorista:</strong> ${filtrosManutencoes.motorista || "Todos"}</p>
                <p><strong>Placa:</strong> ${filtrosManutencoes.placa || "Todas"}</p>
                <p><strong>Total de Manutenções:</strong> ${dadosManutencoesCompletos.length}</p>
                <p><strong>Total de Itens Trocados:</strong> ${totalItens}</p>
            </div>
            
            <div class="resumo-card">
                <h2>📈 RESUMO POR ITEM</h2>
                <div class="resumo-grid">
                    ${(() => {
                        const itensCount = {};
                        dadosManutencoesCompletos.forEach(m => {
                            m.itensTrocados.forEach(item => {
                                itensCount[item.nome] = (itensCount[item.nome] || 0) + 1;
                            });
                        });
                        return Object.entries(itensCount).map(([nome, qtd]) => `
                            <div class="resumo-item"><div class="label">${nome}</div><div class="value">${qtd} trocas</div></div>
                        `).join('');
                    })()}
                </div>
            </div>
            
            <h2>📋 LISTA COMPLETA DE MANUTENÇÕES</h2>
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora</th><th>Motorista</th><th>Placa</th><th>KM</th><th>Itens Trocados</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosManutencoesCompletos.map(m => `
                        <tr>
                            <td>${m.dataFormatada}</td>
                            <td>${m.motoristaNome}</td>
                            <td>${m.placa}</td>
                            <td class="text-end">${formatarKm(m.kmAtual)} km</td>
                            <td>${m.itensTrocados.map(i => `${i.nome} (${formatarKm(i.km)} km)`).join("; ")}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>FrotaTrack - Sistema de Gestão de Frotas | Relatório gerado em ${dataGeracao}</p>
            </div>
        </body>
        </html>
    `;
    
    const janela = window.open("", "_blank");
    janela.document.write(htmlConteudo);
    janela.document.close();
    janela.print();
}

// Funções auxiliares
function formatarKm(valor) {
    if (!valor) return "0";
    return Math.floor(valor).toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
    if (valor === undefined || valor === null) return "R$ 0,00";
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function truncarTexto(texto, maxLen) {
    if (!texto) return "-";
    if (texto.length <= maxLen) return texto;
    return texto.substring(0, maxLen) + "...";
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

window.initRelatorios = initRelatorios;
