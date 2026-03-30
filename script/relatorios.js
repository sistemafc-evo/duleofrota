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

<!-- Filtros -->
<div class="card border-0 shadow-sm rounded-4 mb-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-filter me-2"></i>Filtros
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

<!-- Botões de Exportação -->
<div class="d-flex gap-2 mb-3 justify-content-end">
    <button id="exportar-pdf" class="btn btn-danger btn-sm">
        <i class="fas fa-file-pdf me-1"></i>Exportar PDF (Completo)
    </button>
    <button id="exportar-excel" class="btn btn-success btn-sm">
        <i class="fas fa-file-excel me-1"></i>Exportar Excel (Completo)
    </button>
</div>

<!-- Tabela de Dados (VISUAL - apenas dados principais) -->
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-truck me-2"></i>Viagens Realizadas
        </h6>
        <div class="table-responsive">
            <table class="table table-hover table-sm" id="tabela-dados">
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
                <tbody id="tabela-corpo">
                    <tr><td colspan="11" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`;

// Estado da tela
let dadosCompletos = []; // Armazena todos os dados para exportação
let tipoRelatorioAtual = "viagens";
let filtrosAtuais = {
    motorista: "",
    placa: "",
    viabilidade: "",
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
    // Botão aplicar filtros
    document.getElementById("aplicar-filtros")?.addEventListener("click", aplicarFiltros);

    // Botões de exportação
    document.getElementById("exportar-pdf")?.addEventListener("click", exportarPDF);
    document.getElementById("exportar-excel")?.addEventListener("click", exportarExcel);

    // Filtros
    document.getElementById("filtro-motorista")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filtro-placa")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filtro-viabilidade")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filtro-data-inicio")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filtro-data-fim")?.addEventListener("change", aplicarFiltros);
}

// Aplicar filtros
function aplicarFiltros() {
    filtrosAtuais = {
        motorista: document.getElementById("filtro-motorista")?.value || "",
        placa: document.getElementById("filtro-placa")?.value || "",
        viabilidade: document.getElementById("filtro-viabilidade")?.value || "",
        dataInicio: document.getElementById("filtro-data-inicio")?.value || "",
        dataFim: document.getElementById("filtro-data-fim")?.value || "",
    };

    carregarDados();
}

// Carregar dados do Firebase
async function carregarDados() {
    try {
        document.getElementById("tabela-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando dados...</td></tr>';

        // Buscar motoristas e placas para os filtros
        await carregarDadosFiltros();

        // Buscar todas as viagens
        await carregarViagens();

        // Atualizar cards de resumo
        await atualizarCardsResumo();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        document.getElementById("tabela-corpo").innerHTML = `<tr><td colspan="11" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar dados: ${error.message}</td></tr>`;
    }
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
    } catch (error) {
        console.error("Erro ao carregar dados dos filtros:", error);
    }
}

// Carregar viagens com todos os dados
async function carregarViagens() {
    try {
        let query = window.db.collection("fretes");

        if (filtrosAtuais.motorista) {
            query = query.where("login", "==", filtrosAtuais.motorista);
        }

        query = query.limit(500);
        const snapshot = await query.get();

        if (snapshot.empty) {
            document.getElementById("tabela-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
            dadosCompletos = [];
            return;
        }

        // Processar todos os dados
        let viagens = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataViagem = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000) : null;

            // Filtrar por data
            if (filtrosAtuais.dataInicio && dataViagem && dataViagem < new Date(filtrosAtuais.dataInicio)) return;
            if (filtrosAtuais.dataFim && dataViagem && dataViagem > new Date(filtrosAtuais.dataFim)) return;

            // Filtrar por placa
            if (filtrosAtuais.placa && data.placa_utilizada !== filtrosAtuais.placa) return;

            const viabilidade = data.viabilidade === true;
            
            // Filtrar por viabilidade
            if (filtrosAtuais.viabilidade === "viavel" && !viabilidade) return;
            if (filtrosAtuais.viabilidade === "inviavel" && viabilidade) return;

            viagens.push({
                // Dados básicos
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
                
                // Dados de carga
                toneladas: data.toneladas || 0,
                valorPorTonelada: data.valorPorTonelada || 0,
                valorFrete: data.valorTotal || 0,
                
                // Dados de rota
                distanciaTrecho1: data.distancia_trecho1 || 0,
                distanciaTrecho2: data.distancia_trecho2 || 0,
                distanciaTotal: data.distancia_total || 0,
                quantidadePedagios: data.quantidade_pedagios || 0,
                valorPedagios: data.valor_total_pedagios || 0,
                pedagioAlterado: data.pedagio_alterado || false,
                pedagioValorSugerido: data.pedagio_valor_sugerido || 0,
                
                // Dados de consumo
                consumoMedio: data.consumo_medio_motorista || 0,
                combustivelEstimado: data.combustivel_estimado || 0,
                valorLDiesel: data.valor_l_diesel || 0,
                custoCombustivel: data.custo_combustivel || 0,
                
                // Dados de custos
                cfValorPorKm: data.cf_valor_por_km || 0,
                custoFixo: data.custo_fixo || 0,
                percentualComissao: data.percentual_comissao || 0,
                comissaoValor: data.comissao_valor || 0,
                
                // Resultados financeiros
                valorViabilidade: data.valor_viabilidade || 0,
                valorLiquido: data.valor_liquido || 0,
                viabilidade: viabilidade,
                
                // Status
                status: data.status || "finalizada",
                dataFinalizacao: data.data_finalizacao?.seconds ? new Date(data.data_finalizacao.seconds * 1000) : null,
            });
        });

        dadosCompletos = viagens;
        
        // Renderizar tabela VISUAL (apenas dados principais)
        renderizarTabelaVisual(viagens);
        
    } catch (error) {
        console.error("Erro ao carregar viagens:", error);
        throw error;
    }
}

// Renderizar tabela VISUAL (apenas dados principais)
function renderizarTabelaVisual(dados) {
    if (dados.length === 0) {
        document.getElementById("tabela-corpo").innerHTML = '<tr><td colspan="11" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhuma viagem encontrada</td></tr>';
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

    document.getElementById("tabela-corpo").innerHTML = html;
}

// Atualizar cards de resumo
async function atualizarCardsResumo() {
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
// EXPORTAÇÃO PARA EXCEL (COM DADOS COMPLETOS)
// ============================================
function exportarExcel() {
    if (!dadosCompletos || dadosCompletos.length === 0) {
        alert("Não há dados para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    // Array para a planilha
    let dadosPlanilha = [];
    
    // Cabeçalho do relatório
    dadosPlanilha.push(["RELATÓRIO COMPLETO DE VIAGENS - FROTATRACK"]);
    dadosPlanilha.push([]);
    dadosPlanilha.push(["Data de Geração:", dataGeracao]);
    dadosPlanilha.push(["Total de Viagens:", dadosCompletos.length]);
    dadosPlanilha.push(["Período:", `${filtrosAtuais.dataInicio || "Todas"} até ${filtrosAtuais.dataFim || "Hoje"}`]);
    dadosPlanilha.push(["Motorista:", filtrosAtuais.motorista || "Todos"]);
    dadosPlanilha.push(["Placa:", filtrosAtuais.placa || "Todas"]);
    dadosPlanilha.push(["Viabilidade:", filtrosAtuais.viabilidade === "viavel" ? "Apenas Viáveis" : filtrosAtuais.viabilidade === "inviavel" ? "Apenas Inviáveis" : "Todos"]);
    dadosPlanilha.push([]);
    
    // CABEÇALHO COMPLETO DA TABELA
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
    
    // DADOS COMPLETOS
    dadosCompletos.forEach(v => {
        dadosPlanilha.push([
            v.id,
            v.data,
            v.dataFinalizacao ? v.dataFinalizacao.toLocaleDateString("pt-BR") : "-",
            v.motorista,
            v.login || "-",
            v.placa,
            v.eixos,
            v.origem,
            v.partida,
            v.entrega,
            v.toneladas,
            v.valorPorTonelada,
            v.valorFrete,
            v.distanciaTrecho1,
            v.distanciaTrecho2,
            v.distanciaTotal,
            v.quantidadePedagios,
            v.valorPedagios,
            v.pedagioAlterado ? "Sim" : "Não",
            v.pedagioValorSugerido,
            v.consumoMedio,
            v.combustivelEstimado,
            v.valorLDiesel,
            v.custoCombustivel,
            v.cfValorPorKm,
            v.custoFixo,
            v.percentualComissao,
            v.comissaoValor,
            v.valorViabilidade,
            v.valorLiquido,
            v.viabilidade ? "Viável" : "Inviável",
            v.status === "em_andamento" ? "Em Andamento" : "Finalizada"
        ]);
    });
    
    // Linha de totais
    const totalFrete = dadosCompletos.reduce((sum, v) => sum + v.valorFrete, 0);
    const totalLiquido = dadosCompletos.reduce((sum, v) => sum + v.valorLiquido, 0);
    const totalKm = dadosCompletos.reduce((sum, v) => sum + v.distanciaTotal, 0);
    const totalToneladas = dadosCompletos.reduce((sum, v) => sum + v.toneladas, 0);
    const totalPedagios = dadosCompletos.reduce((sum, v) => sum + v.valorPedagios, 0);
    const totalCombustivel = dadosCompletos.reduce((sum, v) => sum + v.custoCombustivel, 0);
    const totalComissao = dadosCompletos.reduce((sum, v) => sum + v.comissaoValor, 0);
    const totalCustoFixo = dadosCompletos.reduce((sum, v) => sum + v.custoFixo, 0);
    
    dadosPlanilha.push([]);
    dadosPlanilha.push(["RESUMO GERAL"]);
    dadosPlanilha.push(["Total de Viagens:", dadosCompletos.length]);
    dadosPlanilha.push(["Total KM Rodados:", formatarKm(totalKm)]);
    dadosPlanilha.push(["Total Toneladas Transportadas:", totalToneladas.toFixed(1) + " t"]);
    dadosPlanilha.push(["Total Frete Bruto:", formatarMoeda(totalFrete)]);
    dadosPlanilha.push(["Total Pedágios:", formatarMoeda(totalPedagios)]);
    dadosPlanilha.push(["Total Combustível:", formatarMoeda(totalCombustivel)]);
    dadosPlanilha.push(["Total Comissão:", formatarMoeda(totalComissao)]);
    dadosPlanilha.push(["Total Custo Fixo:", formatarMoeda(totalCustoFixo)]);
    dadosPlanilha.push(["Total Custos Operacionais:", formatarMoeda(totalPedagios + totalCombustivel + totalComissao + totalCustoFixo)]);
    dadosPlanilha.push(["Total Valor Líquido:", formatarMoeda(totalLiquido)]);
    
    // Criar workbook e salvar
    const worksheet = XLSX.utils.aoa_to_sheet(dadosPlanilha);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio_Completo_Viagens");
    
    const nomeArquivo = `frotatrack_relatorio_completo_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
}

// ============================================
// EXPORTAÇÃO PARA PDF (COM DADOS COMPLETOS)
// ============================================
function exportarPDF() {
    if (!dadosCompletos || dadosCompletos.length === 0) {
        alert("Não há dados para exportar!");
        return;
    }

    const dataGeracao = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
    
    // Calcular totais
    const totalFrete = dadosCompletos.reduce((sum, v) => sum + v.valorFrete, 0);
    const totalLiquido = dadosCompletos.reduce((sum, v) => sum + v.valorLiquido, 0);
    const totalKm = dadosCompletos.reduce((sum, v) => sum + v.distanciaTotal, 0);
    const totalToneladas = dadosCompletos.reduce((sum, v) => sum + v.toneladas, 0);
    const totalPedagios = dadosCompletos.reduce((sum, v) => sum + v.valorPedagios, 0);
    const totalCombustivel = dadosCompletos.reduce((sum, v) => sum + v.custoCombustivel, 0);
    const totalComissao = dadosCompletos.reduce((sum, v) => sum + v.comissaoValor, 0);
    const totalCustoFixo = dadosCompletos.reduce((sum, v) => sum + v.custoFixo, 0);
    
    const viagensViaveis = dadosCompletos.filter(v => v.viabilidade).length;
    const viagensInviaveis = dadosCompletos.length - viagensViaveis;
    
    // Gerar HTML para o PDF
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
                .badge-andamento { background: #ffc107; color: #333; padding: 2px 6px; border-radius: 12px; font-size: 9px; }
                .badge-finalizada { background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 9px; }
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <h1>📊 FROTATRACK - RELATÓRIO COMPLETO DE VIAGENS</h1>
            
            <div class="header-info">
                <p><strong>Data de Geração:</strong> ${dataGeracao}</p>
                <p><strong>Período:</strong> ${filtrosAtuais.dataInicio || "Todas"} até ${filtrosAtuais.dataFim || "Hoje"}</p>
                <p><strong>Motorista:</strong> ${filtrosAtuais.motorista || "Todos"}</p>
                <p><strong>Placa:</strong> ${filtrosAtuais.placa || "Todas"}</p>
                <p><strong>Filtro Viabilidade:</strong> ${filtrosAtuais.viabilidade === "viavel" ? "Apenas Viáveis" : filtrosAtuais.viabilidade === "inviavel" ? "Apenas Inviáveis" : "Todos"}</p>
                <p><strong>Total de Viagens:</strong> ${dadosCompletos.length}</p>
            </div>
            
            <div class="resumo-card">
                <h2>📈 RESUMO GERAL</h2>
                <div class="resumo-grid">
                    <div class="resumo-item"><div class="label">KM Totais</div><div class="value">${formatarKm(totalKm)}</div></div>
                    <div class="resumo-item"><div class="label">Toneladas</div><div class="value">${totalToneladas.toFixed(1)} t</div></div>
                    <div class="resumo-item"><div class="label">Frete Total</div><div class="value">${formatarMoeda(totalFrete)}</div></div>
                    <div class="resumo-item"><div class="label">Valor Líquido</div><div class="value">${formatarMoeda(totalLiquido)}</div></div>
                    <div class="resumo-item"><div class="label">Total Pedágios</div><div class="value">${formatarMoeda(totalPedagios)}</div></div>
                    <div class="resumo-item"><div class="label">Total Combustível</div><div class="value">${formatarMoeda(totalCombustivel)}</div></div>
                    <div class="resumo-item"><div class="label">Total Comissão</div><div class="value">${formatarMoeda(totalComissao)}</div></div>
                    <div class="resumo-item"><div class="label">Total Custo Fixo</div><div class="value">${formatarMoeda(totalCustoFixo)}</div></div>
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
                        <th>Data</th>
                        <th>Motorista</th>
                        <th>Placa</th>
                        <th>Origem</th>
                        <th>Carregar</th>
                        <th>Descarregar</th>
                        <th>t</th>
                        <th>Frete (R$)</th>
                        <th>Dist (km)</th>
                        <th>Pedágio (R$)</th>
                        <th>Combust (R$)</th>
                        <th>Custo Fixo (R$)</th>
                        <th>Comissão (R$)</th>
                        <th>Líquido (R$)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosCompletos.map(v => `
                        <tr>
                            <td>${v.data}</td>
                            <td>${v.motorista}</td>
                            <td>${v.placa}</td>
                            <td title="${escapeHtml(v.origem)}">${truncarTexto(v.origem, 25)}</td>
                            <td title="${escapeHtml(v.partida)}">${truncarTexto(v.partida, 25)}</td>
                            <td title="${escapeHtml(v.entrega)}">${truncarTexto(v.entrega, 25)}</td>
                            <td class="text-end">${v.toneladas.toFixed(1)}</td>
                            <td class="text-end">${formatarMoeda(v.valorFrete)}</td>
                            <td class="text-end">${formatarKm(v.distanciaTotal)}</td>
                            <td class="text-end">${formatarMoeda(v.valorPedagios)}</td>
                            <td class="text-end">${formatarMoeda(v.custoCombustivel)}</td>
                            <td class="text-end">${formatarMoeda(v.custoFixo)}</td>
                            <td class="text-end">${formatarMoeda(v.comissaoValor)}</td>
                            <td class="text-end ${v.valorLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(v.valorLiquido)}</td>
                            <td>${v.status === "em_andamento" ? '<span class="badge-andamento">Em Andamento</span>' : '<span class="badge-finalizada">Finalizada</span>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background: #f0f0f0; font-weight: bold;">
                        <td colspan="6" class="text-end">TOTAIS:</td>
                        <td class="text-end">${totalToneladas.toFixed(1)} t</td>
                        <td class="text-end">${formatarMoeda(totalFrete)}</td>
                        <td class="text-end">${formatarKm(totalKm)}</td>
                        <td class="text-end">${formatarMoeda(totalPedagios)}</td>
                        <td class="text-end">${formatarMoeda(totalCombustivel)}</td>
                        <td class="text-end">${formatarMoeda(totalCustoFixo)}</td>
                        <td class="text-end">${formatarMoeda(totalComissao)}</td>
                        <td class="text-end ${totalLiquido >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(totalLiquido)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="footer">
                <p>FrotaTrack - Sistema de Gestão de Frotas | Relatório gerado em ${dataGeracao}</p>
            </div>
        </body>
        </html>
    `;
    
    // Abrir janela para impressão/PDF
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
