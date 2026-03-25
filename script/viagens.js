// ============================================
// VIAGENS.JS - Tela de Viagens
// Disponível para: operador, admin
// ============================================

let watchPositionId = null;
let currentLocation = null;
let currentAddress = "";
let map = null;
let marker = null;
let currentField = "";
let mapInitialized = false;
let googleMapsPromise = null;
let googleMapsApiKey = null;
let autocompletePartida = null;
let autocompleteEntrega = null;
let searchBox = null;

// Variáveis para custos
let valorLitroPorKm = 0; // R$ por km
let combustivelRealUsuario = 0; // L/100km do usuário
let consumoMedioAtualKmPorL = 2.5; // Consumo médio do motorista (km/L) - padrão 2.5
let cfValorPorKm = 0; // Custo Fixo por km (R$/km)
let viagemEmAndamento = null; // Armazena o ID da viagem em andamento
let viagemEditando = null; // Armazena o ID da viagem sendo editada

// Variáveis para veículo selecionado
let veiculosVinculados = {}; // Objeto com todos os veículos vinculados ao usuário
let veiculoSelecionado = null; // Dados do veículo atualmente selecionado

// Variáveis para controle de pedágio manual
let pedagioManual = {
    ativo: false,
    quantidade: 0,
    valorTotal: 0,
    detalhes: []
};

// Função para abrir modal de pedágio manual
function mostrarModalPedagioManual(quantidadeDetectada, precisaQuantidade = false) {
    return new Promise((resolve) => {
        // Criar modal se não existir
        let modal = document.getElementById("modal-pedagio-manual");
        
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal fade";
            modal.id = "modal-pedagio-manual";
            modal.tabIndex = "-1";
            modal.setAttribute("aria-hidden", "true");
            
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h6 class="modal-title">
                                <i class="fas fa-road me-2"></i>Informar Pedágio Manualmente
                            </h6>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info small" id="modal-pedagio-mensagem"></div>
                            <div id="campos-pedagio-manual">
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">QUANTIDADE DE PEDÁGIOS</label>
                                    <input type="number" id="pedagio-quantidade" class="form-control form-control-sm" min="0" step="1" value="${quantidadeDetectada || 0}">
                                    <small class="text-muted">Número de praças de pedágio no trajeto</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">VALOR TOTAL (R$)</label>
                                    <input type="number" id="pedagio-valor-total" class="form-control form-control-sm" min="0" step="0.01" placeholder="0,00">
                                    <small class="text-muted">Valor total de todos os pedágios somados</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">OBSERVAÇÕES</label>
                                    <textarea id="pedagio-obs" class="form-control form-control-sm" rows="2" placeholder="Informe detalhes sobre os pedágios se necessário..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-sm btn-secondary" id="btn-pedagio-sem-pedagio">Nenhum Pedágio</button>
                            <button type="button" class="btn btn-sm btn-primary" id="btn-pedagio-confirmar">Confirmar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Configurar mensagem conforme o caso
        const mensagemDiv = document.getElementById("modal-pedagio-mensagem");
        if (precisaQuantidade) {
            mensagemDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Não foi possível identificar os pedágios automaticamente.</strong><br>
                Informe a quantidade e o valor total dos pedágios para prosseguir com o cálculo.
            `;
        } else if (quantidadeDetectada > 0) {
            mensagemDiv.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                <strong>Foram identificados ${quantidadeDetectada} pedágio(s) no trajeto,</strong><br>
                mas não foi possível obter os valores reais da API. Informe o valor total para continuar.
            `;
        } else {
            mensagemDiv.innerHTML = `
                <i class="fas fa-question-circle me-2"></i>
                <strong>Não foi possível identificar os pedágios automaticamente.</strong><br>
                Se houver pedágios no trajeto, informe a quantidade e valor total.
            `;
        }
        
        // Preencher quantidade se detectada
        const qtdInput = document.getElementById("pedagio-quantidade");
        if (qtdInput && quantidadeDetectada > 0) {
            qtdInput.value = quantidadeDetectada;
        }
        
        const modalInstance = new bootstrap.Modal(modal);
        
        // Resolver promise quando confirmar
        const confirmarBtn = document.getElementById("btn-pedagio-confirmar");
        const semPedagioBtn = document.getElementById("btn-pedagio-sem-pedagio");
        
        const handleConfirmar = () => {
            const quantidade = parseInt(document.getElementById("pedagio-quantidade").value) || 0;
            let valorTotal = parseFloat(document.getElementById("pedagio-valor-total").value) || 0;
            const obs = document.getElementById("pedagio-obs").value || "";
            
            // Se quantidade > 0 e valor = 0, tentar extrair do formato
            if (quantidade > 0 && valorTotal === 0) {
                const valorInput = document.getElementById("pedagio-valor-total").value;
                if (valorInput) {
                    // Tentar extrair números
                    const numeros = valorInput.match(/[\d,\.]+/g);
                    if (numeros) {
                        let valorNumerico = numeros.join('');
                        valorNumerico = valorNumerico.replace(/\./g, '').replace(',', '.');
                        valorTotal = parseFloat(valorNumerico);
                    }
                }
            }
            
            pedagioManual = {
                ativo: true,
                quantidade: quantidade,
                valorTotal: valorTotal,
                obs: obs,
                informadoPeloUsuario: true
            };
            
            limparListeners();
            modalInstance.hide();
            resolve(pedagioManual);
        };
        
        const handleSemPedagio = () => {
            pedagioManual = {
                ativo: true,
                quantidade: 0,
                valorTotal: 0,
                obs: "Informado pelo usuário: nenhum pedágio",
                informadoPeloUsuario: true
            };
            
            limparListeners();
            modalInstance.hide();
            resolve(pedagioManual);
        };
        
        const limparListeners = () => {
            confirmarBtn.removeEventListener("click", handleConfirmar);
            semPedagioBtn.removeEventListener("click", handleSemPedagio);
        };
        
        confirmarBtn.addEventListener("click", handleConfirmar);
        semPedagioBtn.addEventListener("click", handleSemPedagio);
        
        modalInstance.show();
        
        // Limpar quando fechar sem ação
        modal.addEventListener("hidden.bs.modal", function onHidden() {
            modal.removeEventListener("hidden.bs.modal", onHidden);
            limparListeners();
            if (!pedagioManual.ativo) {
                pedagioManual = { ativo: false, quantidade: 0, valorTotal: 0 };
                resolve(null);
            }
        });
    });
}

// Função para carregar os veículos vinculados ao usuário
async function carregarVeiculosVinculados() {
    console.log("🚛 Carregando veículos vinculados ao usuário...");
    
    try {
        if (!window.db || !window.currentUser) {
            console.error("❌ Firestore ou usuário não disponível");
            return;
        }
        
        // Buscar o documento de login do usuário
        let loginDocId = null;
        const userLogin = window.currentUser.login;
        
        // Buscar em funcionarios_logins
        const funcionariosDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
        if (funcionariosDoc.exists) {
            const funcionariosLogins = funcionariosDoc.data();
            for (const [docId, userData] of Object.entries(funcionariosLogins)) {
                if (userData.login === userLogin) {
                    loginDocId = docId;
                    console.log(`✅ Login encontrado em funcionarios_logins: ${loginDocId}`);
                    break;
                }
            }
        }
        
        // Se não encontrou, buscar em admin_logins
        if (!loginDocId) {
            const adminDoc = await window.db.collection("logins").doc("admin_logins").get();
            if (adminDoc.exists) {
                const adminLogins = adminDoc.data();
                for (const [docId, userData] of Object.entries(adminLogins)) {
                    if (userData.login === userLogin) {
                        loginDocId = docId;
                        console.log(`✅ Login encontrado em admin_logins: ${loginDocId}`);
                        break;
                    }
                }
            }
        }
        
        if (!loginDocId) {
            console.warn(`⚠️ Não foi possível encontrar documento de login para: ${userLogin}`);
            return;
        }
        
        // Buscar os dados do usuário novamente para ter os veículos vinculados
        let userData = null;
        
        const funcionariosDoc2 = await window.db.collection("logins").doc("funcionarios_logins").get();
        if (funcionariosDoc2.exists) {
            const data = funcionariosDoc2.data();
            if (data[loginDocId]) {
                userData = data[loginDocId];
            }
        }
        
        if (!userData) {
            const adminDoc2 = await window.db.collection("logins").doc("admin_logins").get();
            if (adminDoc2.exists) {
                const data = adminDoc2.data();
                if (data[loginDocId]) {
                    userData = data[loginDocId];
                }
            }
        }
        
        if (!userData) {
            console.warn(`⚠️ Dados do usuário ${loginDocId} não encontrados`);
            return;
        }
        
        // Extrair os veículos vinculados
        veiculosVinculados = userData.placas_caminhoes_vinculados || {};
        
        const quantosVeiculos = Object.keys(veiculosVinculados).length;
        console.log(`✅ Carregados ${quantosVeiculos} veículo(s) vinculado(s):`, veiculosVinculados);
        
        // Criar o seletor de veículos no DOM
        criarSeletorVeiculos();
        
        // Se tiver veículos, selecionar o primeiro
        if (quantosVeiculos > 0) {
            const primeiraPlaca = Object.keys(veiculosVinculados)[0];
            selecionarVeiculo(primeiraPlaca);
        }
        
    } catch (error) {
        console.error("❌ Erro ao carregar veículos vinculados:", error);
    }
}

// Função para criar o seletor de veículos no DOM
function criarSeletorVeiculos() {
    const quantosVeiculos = Object.keys(veiculosVinculados).length;
    
    if (quantosVeiculos === 0) {
        console.warn("⚠️ Nenhum veículo vinculado ao usuário");
        return;
    }
    
    // Verificar se o seletor já existe
    let seletorContainer = document.getElementById("veiculo-selector-container");
    
    if (!seletorContainer) {
        // Criar o container do seletor
        seletorContainer = document.createElement("div");
        seletorContainer.id = "veiculo-selector-container";
        seletorContainer.className = "mb-3";
        seletorContainer.style.backgroundColor = "#e3f2fd";
        seletorContainer.style.borderRadius = "8px";
        seletorContainer.style.padding = "12px";
        seletorContainer.style.borderLeft = "4px solid #2196f3";
        
        // Inserir após o campo "ONDE ESTOU"
        const origemField = document.getElementById("origem")?.closest(".mb-2");
        if (origemField && origemField.parentNode) {
            origemField.parentNode.insertBefore(seletorContainer, origemField.nextSibling);
        }
    }
    
    // Construir o HTML do seletor
    let veiculosHtml = `
        <div class="d-flex align-items-center justify-content-between mb-2">
            <label class="form-label small fw-semibold mb-0">
                <i class="fas fa-truck me-1"></i>VEÍCULO SELECIONADO
            </label>
            <button type="button" id="btn-trocar-veiculo" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-exchange-alt me-1"></i>Trocar
            </button>
        </div>
        <div id="veiculo-info" class="small">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="fw-bold">${Object.keys(veiculosVinculados)[0] || "Nenhum"}</span>
                    <span class="text-muted ms-2">|</span>
                    <span class="text-muted ms-2" id="veiculo-tipo"></span>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary" id="veiculo-eixos">0 eixos</span>
                    <span class="badge bg-secondary ms-1" id="veiculo-peso">0 kg</span>
                </div>
            </div>
            <div class="mt-1 text-muted" style="font-size: 0.7rem;" id="veiculo-dimensoes"></div>
        </div>
    `;
    
    seletorContainer.innerHTML = veiculosHtml;
    
    // Adicionar listener para o botão de trocar veículo
    const btnTrocar = document.getElementById("btn-trocar-veiculo");
    if (btnTrocar) {
        btnTrocar.removeEventListener("click", mostrarModalTrocarVeiculo);
        btnTrocar.addEventListener("click", mostrarModalTrocarVeiculo);
    }
}

// Função para mostrar modal de troca de veículo
function mostrarModalTrocarVeiculo() {
    const quantosVeiculos = Object.keys(veiculosVinculados).length;
    
    if (quantosVeiculos === 0) {
        alert("Nenhum veículo vinculado ao seu perfil. Contate o administrador.");
        return;
    }
    
    // Criar modal dinamicamente se não existir
    let modal = document.getElementById("modal-trocar-veiculo");
    
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = "modal-trocar-veiculo";
        modal.tabIndex = "-1";
        modal.setAttribute("aria-hidden", "true");
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h6 class="modal-title">
                            <i class="fas fa-truck me-2"></i>Selecionar Veículo
                        </h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group" id="lista-veiculos-modal"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Preencher a lista de veículos
    const listaContainer = document.getElementById("lista-veiculos-modal");
    if (listaContainer) {
        let html = "";
        
        for (const [placa, dados] of Object.entries(veiculosVinculados)) {
            html += `
                <button class="list-group-item list-group-item-action veiculo-select-item" data-placa="${placa}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${placa}</strong>
                            <br>
                            <small class="text-muted">${dados.caracteristica_tipo_de_veiculo || "N/A"}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-primary">${dados.caracteristica_axleCount || 0} eixos</span>
                            <br>
                            <small>${(dados.caracteristica_weightKg || 0).toLocaleString()} kg</small>
                        </div>
                    </div>
                </button>
            `;
        }
        
        listaContainer.innerHTML = html;
        
        // Adicionar listeners para cada item
        document.querySelectorAll(".veiculo-select-item").forEach(btn => {
            btn.removeEventListener("click", () => {});
            btn.addEventListener("click", () => {
                const placa = btn.getAttribute("data-placa");
                selecionarVeiculo(placa);
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById("modal-trocar-veiculo"));
                modalInstance.hide();
            });
        });
    }
    
    // Mostrar modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Função para selecionar um veículo
function selecionarVeiculo(placa) {
    const veiculo = veiculosVinculados[placa];
    if (!veiculo) {
        console.error(`❌ Veículo ${placa} não encontrado`);
        return;
    }
    
    veiculoSelecionado = {
        placa: placa,
        ...veiculo
    };
    
    console.log(`✅ Veículo selecionado: ${placa}`, veiculoSelecionado);
    
    // Atualizar a interface
    const veiculoInfo = document.getElementById("veiculo-info");
    if (veiculoInfo) {
        const placaSpan = veiculoInfo.querySelector(".fw-bold");
        const tipoSpan = document.getElementById("veiculo-tipo");
        const eixosSpan = document.getElementById("veiculo-eixos");
        const pesoSpan = document.getElementById("veiculo-peso");
        const dimensoesSpan = document.getElementById("veiculo-dimensoes");
        
        if (placaSpan) placaSpan.textContent = placa;
        if (tipoSpan) tipoSpan.textContent = veiculo.caracteristica_tipo_de_veiculo || "N/A";
        if (eixosSpan) eixosSpan.textContent = `${veiculo.caracteristica_axleCount || 0} eixos`;
        if (pesoSpan) pesoSpan.textContent = `${(veiculo.caracteristica_weightKg || 0).toLocaleString()} kg`;
        if (dimensoesSpan) {
            dimensoesSpan.innerHTML = `
                ${(veiculo.caracteristica_lengthCm || 0)}cm (C) × 
                ${(veiculo.caracteristica_widthCm || 0)}cm (L) × 
                ${(veiculo.caracteristica_heightCm || 0)}cm (A)
            `;
        }
    }
    
    // Se já houver uma rota calculada, recalcular pedágio
    if (window.distanciasCalculadas) {
        console.log("🔄 Rota já calculada, recalculando pedágio com veículo selecionado...");
        recalcularPedagioComVeiculo();
    }
}

// Função para recalcular pedágio usando o veículo selecionado
async function recalcularPedagioComVeiculo() {
    if (!veiculoSelecionado || !window.distanciasCalculadas) {
        console.warn("⚠️ Veículo não selecionado ou rota não calculada");
        return;
    }
    
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    if (!origem || !partida || !entrega) {
        return;
    }
    
    console.log("🔄 Recalculando pedágio com características do veículo:", {
        tipo: veiculoSelecionado.caracteristica_tipo_de_veiculo,
        eixos: veiculoSelecionado.caracteristica_axleCount,
        peso: veiculoSelecionado.caracteristica_weightKg,
        dimensoes: {
            altura: veiculoSelecionado.caracteristica_heightCm,
            largura: veiculoSelecionado.caracteristica_widthCm,
            comprimento: veiculoSelecionado.caracteristica_lengthCm
        }
    });
    
    try {
        // Recalcular a rota completa com o veículo selecionado
        const distancias = await calcularDistanciaTotalComVeiculo(origem, partida, entrega, veiculoSelecionado);
        
        // Atualizar dados
        window.distanciasCalculadas = distancias;
        
        // Atualizar interface
        document.getElementById("distancia_total").textContent = distancias.distanciaTotal;
        document.getElementById("pedagio_total_valor").textContent = distancias.valorTotalPedagios.toLocaleString("pt-BR", { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
        document.getElementById("quantidade_pedagios").textContent = distancias.quantidadePedagios;
        
        // Recalcular combustível
        const combustivelEstimado = calcularCombustivelEstimado(distancias.distanciaTotal);
        
        console.log(`✅ Pedágio recalculado: ${distancias.quantidadePedagios} pedágios - Total: R$ ${distancias.valorTotalPedagios.toFixed(2)}`);
        
        // Recalcular viabilidade
        if (verificarTodosDados()) {
            setTimeout(() => calcularViabilidade(), 100);
        }
        
    } catch (error) {
        console.error("❌ Erro ao recalcular pedágio:", error);
    }
}

// Função para calcular distância e pedágio REAL via Google Routes API
async function calcularDistanciaTotalComVeiculo(origem, partida, entrega, veiculo) {
    console.log("🚗 Calculando rota com veículo específico via Google Routes API...");
    
    // Resetar flag de erro
    window.erroDetectado = false;
    
    try {
        // Obter coordenadas dos endereços
        const coordsOrigem = await getCoordsFromAddress(origem);
        const coordsPartida = await getCoordsFromAddress(partida);
        const coordsEntrega = await getCoordsFromAddress(entrega);
        
        // Calcular 1º trecho
        const resultadoTrecho1 = await chamarRoutesAPI(coordsOrigem, coordsPartida, veiculo);
        
        // Calcular 2º trecho
        const resultadoTrecho2 = await chamarRoutesAPI(coordsPartida, coordsEntrega, veiculo);
        
        // Extrair distâncias
        const distanciaTrecho1 = (resultadoTrecho1.distanceMeters / 1000).toFixed(1);
        const distanciaTrecho2 = (resultadoTrecho2.distanceMeters / 1000).toFixed(1);
        const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
        
        console.log(`📊 Distâncias calculadas:`);
        console.log(`   - 1º trecho: ${distanciaTrecho1} km`);
        console.log(`   - 2º trecho: ${distanciaTrecho2} km`);
        console.log(`   - Total: ${distanciaTotal} km`);
        
        // Extrair informações de pedágio
        let quantidadePedagios = 0;
        let valorTotalPedagios = null;
        let temValorReal = false;
        let detalhesPedagios = [];
        
        // Função para extrair pedágios da resposta da Routes API
        function extrairPedagios(routeResult) {
            const pedagios = [];
            
            if (!routeResult) return pedagios;
            
            // Verificar na travelAdvisory principal
            if (routeResult.travelAdvisory && routeResult.travelAdvisory.tollInfo) {
                const tollInfo = routeResult.travelAdvisory.tollInfo;
                if (tollInfo.estimatedPrice) {
                    // Caso seja um array
                    if (Array.isArray(tollInfo.estimatedPrice)) {
                        for (const price of tollInfo.estimatedPrice) {
                            const valor = (price.units || 0) + (price.nanos / 1000000000);
                            pedagios.push({
                                nome: price.displayName?.text || "Pedágio",
                                valor: valor,
                                moeda: price.currencyCode || "BRL"
                            });
                        }
                    } 
                    // Caso seja um objeto único
                    else if (tollInfo.estimatedPrice.units !== undefined) {
                        const valor = (tollInfo.estimatedPrice.units || 0) + (tollInfo.estimatedPrice.nanos / 1000000000);
                        pedagios.push({
                            nome: "Pedágio",
                            valor: valor,
                            moeda: tollInfo.estimatedPrice.currencyCode || "BRL"
                        });
                    }
                }
            }
            
            // Verificar também nas legs (para pedágios individuais)
            if (routeResult.legs && Array.isArray(routeResult.legs)) {
                for (const leg of routeResult.legs) {
                    if (leg.travelAdvisory && leg.travelAdvisory.tollInfo) {
                        const tollInfo = leg.travelAdvisory.tollInfo;
                        if (tollInfo.estimatedPrice) {
                            if (Array.isArray(tollInfo.estimatedPrice)) {
                                for (const price of tollInfo.estimatedPrice) {
                                    const valor = (price.units || 0) + (price.nanos / 1000000000);
                                    pedagios.push({
                                        nome: price.displayName?.text || "Pedágio",
                                        valor: valor,
                                        moeda: price.currencyCode || "BRL"
                                    });
                                }
                            } else if (tollInfo.estimatedPrice.units !== undefined) {
                                const valor = (tollInfo.estimatedPrice.units || 0) + (tollInfo.estimatedPrice.nanos / 1000000000);
                                pedagios.push({
                                    nome: "Pedágio",
                                    valor: valor,
                                    moeda: tollInfo.estimatedPrice.currencyCode || "BRL"
                                });
                            }
                        }
                    }
                }
            }
            
            return pedagios;
        }
        
        const pedagios1 = extrairPedagios(resultadoTrecho1);
        const pedagios2 = extrairPedagios(resultadoTrecho2);
        
        detalhesPedagios = [...pedagios1, ...pedagios2];
        quantidadePedagios = detalhesPedagios.length;
        
        if (quantidadePedagios > 0 && detalhesPedagios.every(p => p.valor > 0)) {
            temValorReal = true;
            valorTotalPedagios = detalhesPedagios.reduce((sum, p) => sum + p.valor, 0);
            console.log(`🛣️ PEDÁGIOS REAIS ENCONTRADOS (${quantidadePedagios}):`);
            detalhesPedagios.forEach((ped, idx) => {
                console.log(`   ${idx + 1}. ${ped.nome}: R$ ${ped.valor.toFixed(2)}`);
            });
            console.log(`💰 Valor total REAL dos pedágios: R$ ${valorTotalPedagios.toFixed(2)}`);
        } else if (quantidadePedagios > 0) {
            // Tem pedágios mas sem valores - pode acontecer se a API não retornou valores
            console.log(`⚠️ ${quantidadePedagios} pedágios detectados, mas SEM VALORES REAIS na API`);
            console.log("   - O motorista deverá informar os valores manualmente");
            temValorReal = false;
            valorTotalPedagios = null;
        } else {
            // Tentar detectar pedágios pelas instruções da Directions API
            console.log("🔍 Verificando instruções para detectar pedágios...");
            
            // Função para contar pedágios pelas instruções
            async function contarPedagiosPorInstrucoes(orig, dest) {
                let qtd = 0;
                try {
                    const directionsService = new google.maps.DirectionsService();
                    const result = await new Promise((resolve, reject) => {
                        directionsService.route(
                            { origin: orig, destination: dest, travelMode: google.maps.TravelMode.DRIVING },
                            (result, status) => {
                                if (status === "OK") resolve(result);
                                else reject(status);
                            }
                        );
                    });
                    
                    if (result.routes && result.routes[0] && result.routes[0].legs) {
                        for (const leg of result.routes[0].legs) {
                            if (leg.steps) {
                                for (const step of leg.steps) {
                                    const instruction = step.instructions || "";
                                    if (instruction.toLowerCase().includes("pedágio") || 
                                        instruction.toLowerCase().includes("toll") ||
                                        instruction.toLowerCase().includes("pedagio")) {
                                        qtd++;
                                        // Adicionar nome do pedágio baseado na instrução
                                        let nome = instruction.replace(/<[^>]*>/g, '').substring(0, 50);
                                        detalhesPedagios.push({
                                            nome: nome,
                                            valor: null,
                                            moeda: "BRL",
                                            origem: "contagem"
                                        });
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Erro ao contar pedágios por instruções:", e);
                }
                return qtd;
            }
            
            const qtd1 = await contarPedagiosPorInstrucoes(origem, partida);
            const qtd2 = await contarPedagiosPorInstrucoes(partida, entrega);
            quantidadePedagios = qtd1 + qtd2;
            
            if (quantidadePedagios > 0) {
                console.log(`⚠️ ${quantidadePedagios} pedágios detectados por instruções, mas SEM VALORES REAIS na API`);
                console.log("   - O motorista deverá informar os valores manualmente");
                temValorReal = false;
                valorTotalPedagios = null;
            } else {
                console.log("✅ Nenhum pedágio detectado na rota");
                quantidadePedagios = 0;
                valorTotalPedagios = 0;
                temValorReal = true;
            }
        }
        
        return {
            distanciaTrecho1: parseFloat(distanciaTrecho1),
            distanciaTrecho2: parseFloat(distanciaTrecho2),
            distanciaTotal: parseFloat(distanciaTotal),
            quantidadePedagios: quantidadePedagios,
            valorTotalPedagios: valorTotalPedagios,
            temValorReal: temValorReal,
            detalhesPedagios: detalhesPedagios,
            informadoManualmente: false
        };
        
    } catch (error) {
        console.error("❌ Erro ao calcular rota:", error);
        window.erroDetectado = true;
        throw error;
    }
}

// Função para chamar a Google Routes API com os dados reais do veículo do Firestore
async function chamarRoutesAPI(origem, destino, veiculo) {
    const apiKey = googleMapsApiKey;
    
    // Verificar se temos os dados do veículo
    if (!veiculo) {
        console.error("❌ Dados do veículo não fornecidos");
        throw new Error("Dados do veículo não disponíveis");
    }
    
    console.log("📋 Dados do veículo vindos do Firestore:", {
        placa: veiculo.placa,
        tipo: veiculo.caracteristica_tipo_de_veiculo,
        eixos: veiculo.caracteristica_axleCount,
        pesoKg: veiculo.caracteristica_weightKg,
        capacidadeTon: veiculo.capacidade_toneladas,
        dimensoes: {
            altura: veiculo.caracteristica_heightCm,
            largura: veiculo.caracteristica_widthCm,
            comprimento: veiculo.caracteristica_lengthCm
        }
    });
    
    // Construir o payload para a Routes API
    const payload = {
        origin: {
            location: {
                latLng: {
                    latitude: origem.lat,
                    longitude: origem.lng
                }
            }
        },
        destination: {
            location: {
                latLng: {
                    latitude: destino.lat,
                    longitude: destino.lng
                }
            }
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false
        },
        languageCode: "pt-BR",
        units: "METRIC"
    };
    
    // ADICIONAR INFORMAÇÕES DO VEÍCULO VINDAS DO FIRESTORE
    // Estas informações foram cadastradas na tela de cadastros e armazenadas no Firestore
    if (veiculo) {
        payload.routeModifiers.vehicleInfo = {
            // Tipo de combustível (padrão DIESEL para caminhões)
            emissionType: "DIESEL",
            
            // Número de eixos - vindo do cadastro (caracteristica_axleCount)
            axleCount: veiculo.caracteristica_axleCount || 2,
            
            // Peso do veículo vazio em kg - vindo do cadastro (caracteristica_weightKg)
            weight: {
                value: veiculo.caracteristica_weightKg || 0,
                unit: "KILOGRAMS"
            },
            
            // Dimensões em metros - convertendo de cm que veio do cadastro
            dimensions: {
                heightMeters: (veiculo.caracteristica_heightCm || 0) / 100,
                widthMeters: (veiculo.caracteristica_widthCm || 0) / 100,
                lengthMeters: (veiculo.caracteristica_lengthCm || 0) / 100
            }
        };
        
        console.log("✅ Informações do veículo adicionadas à requisição:", {
            eixos: veiculo.caracteristica_axleCount,
            peso: `${veiculo.caracteristica_weightKg} kg`,
            altura: `${veiculo.caracteristica_heightCm} cm (${(veiculo.caracteristica_heightCm / 100).toFixed(2)} m)`,
            largura: `${veiculo.caracteristica_widthCm} cm (${(veiculo.caracteristica_widthCm / 100).toFixed(2)} m)`,
            comprimento: `${veiculo.caracteristica_lengthCm} cm (${(veiculo.caracteristica_lengthCm / 100).toFixed(2)} m)`
        });
    }
    
    console.log("📡 Enviando requisição para Routes API com dados do veículo...");
    
    try {
        const response = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Erro na Routes API:", errorData);
            throw new Error(`Erro na Routes API: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error("Nenhuma rota encontrada");
        }
        
        const route = data.routes[0];
        
        // Log dos valores de pedágio retornados
        if (route.travelAdvisory && route.travelAdvisory.tollInfo) {
            console.log("💰 Valores de pedágio retornados pela API:");
            if (route.travelAdvisory.tollInfo.estimatedPrice) {
                route.travelAdvisory.tollInfo.estimatedPrice.forEach((price, idx) => {
                    const valor = price.price.units + (price.price.nanos / 1000000000);
                    console.log(`   ${idx + 1}. ${price.displayName?.text || "Pedágio"}: R$ ${valor.toFixed(2)}`);
                });
            }
        }
        
        return {
            distanceMeters: route.distanceMeters || 0,
            duration: route.duration || "0s",
            travelAdvisory: route.travelAdvisory || {}
        };
        
    } catch (error) {
        console.error("❌ Erro ao chamar Routes API:", error);
        throw error;
    }
}

// Função para parar o GPS
function stopGPS() {
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
        console.log("🛑 GPS parado");
    }
}

// Função para reiniciar o GPS completamente
function restartGPS() {
    return new Promise((resolve) => {
        console.log("🔄 Reiniciando GPS...");
        stopGPS();
        setTimeout(() => {
            startGPS();
            resolve();
        }, 500);
    });
}

// Função para limpar todos os campos do formulário
function limparFormulario() {
    document.getElementById("partida").value = "";
    document.getElementById("entrega").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("valorPorTonelada").value = "";
    document.getElementById("distancia_total").textContent = "0";
    document.getElementById("pedagio_total_valor").textContent = "0,00";
    document.getElementById("quantidade_pedagios").textContent = "0";
    document.getElementById("combustivel_estimado_valor").textContent = "0,0";
    document.getElementById("valor_viabilidade").textContent = "R$ 0,00";
    document.getElementById("status_viabilidade").textContent = "";
    document.getElementById("valorTotal").textContent = "R$ 0,00";
    
    // Atualizar o consumo médio na tela
    const consumoMedioSpan = document.getElementById("consumo_medio");
    if (consumoMedioSpan) {
        consumoMedioSpan.textContent = consumoMedioAtualKmPorL.toFixed(2);
    }
    
    // Manter o endereço atual se disponível
    if (window.currentAddress) {
        document.getElementById("origem").value = window.currentAddress;
    }
    
    // Limpar distâncias calculadas
    window.distanciasCalculadas = null;
    
    // Limpar modo de edição
    viagemEditando = null;
}

// Função para desabilitar/habilitar campos do formulário
function setFormEnabled(enabled) {
    const inputs = ["partida", "entrega", "peso", "valorPorTonelada"];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.disabled = !enabled;
    });
    
    const buttons = ["search-partida", "search-entrega"];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !enabled;
    });
    
    // Desabilitar/habilitar autocompletes
    if (autocompletePartida) {
        autocompletePartida.setComponentRestrictions(enabled ? { country: "BR" } : null);
    }
    if (autocompleteEntrega) {
        autocompleteEntrega.setComponentRestrictions(enabled ? { country: "BR" } : null);
    }
}

// Função para carregar o combustível real do usuário (L/100km) e o consumo médio (km/L)
async function loadCombustivelReal() {
    console.log("⛽ Carregando dados de consumo do usuário...");
    try {
        if (!window.db) {
            console.error("❌ Firestore não disponível");
            return;
        }
        
        // Buscar o id do documento de login do usuário atual
        let loginDocId = null;
        const userLogin = window.currentUser.login;
        
        console.log(`🔍 Buscando documento de login para: ${userLogin}`);
        
        // Buscar em admin_logins
        const adminDoc = await window.db.collection("logins").doc("admin_logins").get();
        if (adminDoc.exists) {
            const adminLogins = adminDoc.data();
            for (const [docId, userData] of Object.entries(adminLogins)) {
                if (userData.login === userLogin) {
                    loginDocId = docId;
                    console.log(`✅ Admin encontrado - Document ID: ${loginDocId}`);
                    break;
                }
            }
        }
        
        // Se não encontrou em admin, buscar em funcionarios_logins
        if (!loginDocId) {
            const funcionariosDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
            if (funcionariosDoc.exists) {
                const funcionariosLogins = funcionariosDoc.data();
                for (const [docId, userData] of Object.entries(funcionariosLogins)) {
                    if (userData.login === userLogin) {
                        loginDocId = docId;
                        console.log(`✅ Funcionário encontrado - Document ID: ${loginDocId}`);
                        break;
                    }
                }
            }
        }
        
        if (!loginDocId) {
            console.warn(`⚠️ Não foi possível encontrar o documento de login para: ${userLogin}`);
            const combustivelRealSpan = document.getElementById("combustivel_real_valor");
            if (combustivelRealSpan) {
                combustivelRealSpan.textContent = "0,0";
            }
            return;
        }
        
        // Buscar os dados de consumo do motorista
        const docRef = window.db.collection("custos").doc("abastecimento_motoristas");
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            const usuarioData = data[loginDocId];
            
            console.log(`📄 Dados do usuário ${loginDocId}:`, usuarioData);
            
            if (usuarioData) {
                // Carregar combustível real (L/100km)
                if (usuarioData.L_abastecimento_atual) {
                    const valorStr = usuarioData.L_abastecimento_atual || "0";
                    combustivelRealUsuario = parseFloat(valorStr.replace(',', '.'));
                    console.log(`✅ Combustível real do usuário ${loginDocId} (${userLogin}) carregado: ${combustivelRealUsuario} L/100km`);
                    
                    // Atualizar campo na tela
                    const combustivelRealSpan = document.getElementById("combustivel_real_valor");
                    if (combustivelRealSpan) {
                        combustivelRealSpan.textContent = combustivelRealUsuario.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 1, 
                            maximumFractionDigits: 1 
                        });
                    }
                } else {
                    console.warn(`⚠️ Usuário ${loginDocId} não possui L_abastecimento_atual`);
                }
                
                // Carregar consumo médio atual (km/L)
                console.log(`🔍 Verificando consumo_medio_atual_km_por_L:`, usuarioData.consumo_medio_atual_km_por_L);
                
                if (usuarioData.consumo_medio_atual_km_por_L) {
                    let consumoStr = usuarioData.consumo_medio_atual_km_por_L;
                    // Converter string para número, tratando vírgula como decimal
                    if (typeof consumoStr === 'string') {
                        consumoStr = consumoStr.replace(',', '.');
                    }
                    consumoMedioAtualKmPorL = parseFloat(consumoStr);
                    console.log(`✅ Consumo médio do usuário ${loginDocId} (${userLogin}) carregado: ${consumoMedioAtualKmPorL} km/L`);
                    
                    // Atualizar campo na tela
                    const consumoMedioSpan = document.getElementById("consumo_medio");
                    if (consumoMedioSpan) {
                        consumoMedioSpan.textContent = consumoMedioAtualKmPorL.toFixed(2);
                    }
                } else {
                    console.warn(`⚠️ Usuário ${loginDocId} (${userLogin}) não possui consumo_medio_atual_km_por_L configurado, usando padrão 2.5 km/L`);
                    consumoMedioAtualKmPorL = 2.5;
                    const consumoMedioSpan = document.getElementById("consumo_medio");
                    if (consumoMedioSpan) {
                        consumoMedioSpan.textContent = "2.5";
                    }
                }
            } else {
                console.warn(`⚠️ Usuário ${loginDocId} (${userLogin}) não encontrado no documento abastecimento_motoristas`);
                const combustivelRealSpan = document.getElementById("combustivel_real_valor");
                if (combustivelRealSpan) {
                    combustivelRealSpan.textContent = "0,0";
                }
                const consumoMedioSpan = document.getElementById("consumo_medio");
                if (consumoMedioSpan) {
                    consumoMedioSpan.textContent = "2.5";
                }
            }
        } else {
            console.warn("⚠️ Documento abastecimento_motoristas não encontrado");
            const combustivelRealSpan = document.getElementById("combustivel_real_valor");
            if (combustivelRealSpan) {
                combustivelRealSpan.textContent = "0,0";
            }
            const consumoMedioSpan = document.getElementById("consumo_medio");
            if (consumoMedioSpan) {
                consumoMedioSpan.textContent = "2.5";
            }
        }
        
        // Log final para verificar o valor carregado
        console.log(`📊 Valores finais carregados:`);
        console.log(`   - Combustível Real: ${combustivelRealUsuario} L/100km`);
        console.log(`   - Consumo Médio: ${consumoMedioAtualKmPorL} km/L`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar dados de consumo:", error);
        const combustivelRealSpan = document.getElementById("combustivel_real_valor");
        if (combustivelRealSpan) {
            combustivelRealSpan.textContent = "0,0";
        }
        const consumoMedioSpan = document.getElementById("consumo_medio");
        if (consumoMedioSpan) {
            consumoMedioSpan.textContent = "2.5";
        }
    }
}

// Função para carregar custos do Firebase
async function loadCustos() {
    console.log("💰 Carregando custos do Firebase...");
    try {
        if (!window.db) {
            console.error("❌ Firestore não disponível");
            return;
        }
        
        const docRef = window.db.collection("custos").doc("custos_abastecimento");
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            
            // Carregar valor do diesel por km
            const valorStr = data.valor_litro_por_km || "0";
            valorLitroPorKm = parseFloat(valorStr.replace(',', '.'));
            console.log("✅ Valor do Diesel por km carregado: R$", valorLitroPorKm.toFixed(2));
            
            // Carregar custo fixo por km (cf_valor_por_km)
            if (data.cf_valor_por_km) {
                let cfStr = data.cf_valor_por_km;
                if (typeof cfStr === 'string') {
                    cfStr = cfStr.replace(',', '.');
                }
                cfValorPorKm = parseFloat(cfStr);
                console.log("✅ Custo Fixo por km (CF) carregado: R$", cfValorPorKm.toFixed(2));
                
                // Atualizar o valor do CF na tela se o elemento existir
                const cfElement = document.getElementById("cf_valor");
                if (cfElement) {
                    cfElement.textContent = cfValorPorKm.toFixed(2);
                }
            } else {
                console.warn("⚠️ cf_valor_por_km não encontrado, usando padrão 0");
                cfValorPorKm = 0;
                const cfElement = document.getElementById("cf_valor");
                if (cfElement) {
                    cfElement.textContent = "0,00";
                }
            }
            
        } else {
            console.warn("⚠️ Documento custos_abastecimento não encontrado");
        }
    } catch (error) {
        console.error("❌ Erro ao carregar custos:", error);
    }
}

// Função para calcular e atualizar a viabilidade
function calcularViabilidade() {
    console.log("📊 Iniciando cálculo de viabilidade...");
    
    const distanciaTotal = parseFloat(document.getElementById("distancia_total").textContent) || 0;
    
    // Verificar se temos valor real do pedágio
    const pedagioTotalElement = document.getElementById("pedagio_total_valor");
    let valorTotalPedagios = 0;
    let temValorPedagioReal = true;
    let pedagioIndisponivel = false;
    
    if (pedagioTotalElement) {
        let pedagioTexto = pedagioTotalElement.textContent || pedagioTotalElement.innerText || "";
        console.log(`   - Pedágio bruto: "${pedagioTexto}"`);
        
        // Verificar se está marcado como indisponível
        if (pedagioTexto.includes("Indisponível") || pedagioTexto.includes("Indisponivel")) {
            pedagioIndisponivel = true;
            temValorPedagioReal = false;
            console.log("⚠️ Valor do pedágio indisponível - não é possível calcular viabilidade automaticamente");
        } else {
            // Extrair números do texto
            let numeros = pedagioTexto.match(/[\d,\.]+/g);
            if (numeros) {
                let valorNumerico = numeros.join('');
                valorNumerico = valorNumerico.replace(/\./g, '').replace(',', '.');
                valorTotalPedagios = parseFloat(valorNumerico);
            }
            
            if (isNaN(valorTotalPedagios)) {
                valorTotalPedagios = 0;
            }
        }
        
        console.log(`   - Pedágio convertido: R$ ${valorTotalPedagios.toFixed(2)}`);
    }
    
    const valorFreteElement = document.getElementById("valorTotal");
    let valorTotalFrete = 0;
    
    if (valorFreteElement) {
        let valorFreteTexto = valorFreteElement.textContent || valorFreteElement.innerText || "";
        let numeros = valorFreteTexto.match(/[\d,\.]+/g);
        if (numeros) {
            let valorNumerico = numeros.join('');
            valorNumerico = valorNumerico.replace(/\./g, '').replace(',', '.');
            valorTotalFrete = parseFloat(valorNumerico);
        }
        
        if (isNaN(valorTotalFrete)) {
            valorTotalFrete = 0;
        }
    }
    
    const peso = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    const temDistancia = distanciaTotal > 0;
    const temCF = cfValorPorKm > 0;
    const temValorFrete = valorTotalFrete > 0 && !isNaN(valorTotalFrete);
    const temPeso = peso > 0;
    const temValorPorTonelada = valorPorTonelada > 0;
    const temEnderecos = origem && partida && entrega;
    
    const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
    const statusViabilidadeSpan = document.getElementById("status_viabilidade");
    
    // Verificar se temos pedágio indisponível
    if (pedagioIndisponivel) {
        valorViabilidadeSpan.textContent = "---";
        statusViabilidadeSpan.innerHTML = '<span class="badge bg-warning ms-2">⚠️ Pedágio sem valor</span>';
        statusViabilidadeSpan.title = "O valor do pedágio não está disponível. Calcule manualmente e informe no campo de observações.";
        return 0;
    }
    
    const todosDadosPresentes = temDistancia && temCF && temValorFrete && temPeso && temValorPorTonelada && temEnderecos;
    
    if (todosDadosPresentes) {
        const custoOperacional = distanciaTotal * cfValorPorKm;
        const custoTotalViagem = custoOperacional + valorTotalPedagios;
        
        valorViabilidadeSpan.textContent = custoTotalViagem.toLocaleString("pt-BR", { 
            style: "currency", 
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        if (custoTotalViagem <= valorTotalFrete) {
            statusViabilidadeSpan.innerHTML = '<span class="badge bg-success ms-2">✓ Viável</span>';
        } else {
            statusViabilidadeSpan.innerHTML = '<span class="badge bg-danger ms-2">✗ Inviável</span>';
        }
        
        return custoTotalViagem;
    } else {
        valorViabilidadeSpan.textContent = "---";
        
        if (!temEndereços) {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os endereços</span>';
        } else if (!temDistancia) {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Aguardando cálculo da rota</span>';
        } else if (!temCF) {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ CF (Custo Fixo) não configurado</span>';
        } else if (!temPeso || !temValorPorTonelada) {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha toneladas e valor/t</span>';
        } else if (!temValorFrete) {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Aguardando cálculo do frete</span>';
        } else {
            statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os dados</span>';
        }
        
        return 0;
    }
}

// Função para verificar se todos os dados estão prontos
function verificarTodosDados() {
    const enderecosProntos = document.getElementById("origem").value && 
                            document.getElementById("partida").value && 
                            document.getElementById("entrega").value;
    
    const peso = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    const valoresPreenchidos = peso > 0 && valorPorTonelada > 0;
    
    const distancia = parseFloat(document.getElementById("distancia_total").textContent) || 0;
    const distanciaCalculada = distancia > 0 && window.distanciasCalculadas;
    
    // Verificar valor do frete também
    const valorFreteElement = document.getElementById("valorTotal");
    let valorFrete = 0;
    if (valorFreteElement) {
        let valorTexto = valorFreteElement.textContent || valorFreteElement.innerText;
        valorTexto = valorTexto.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        valorFrete = parseFloat(valorTexto);
    }
    const temValorFrete = valorFrete > 0 && !isNaN(valorFrete);
    
    const todosProntos = enderecosProntos && valoresPreenchidos && distanciaCalculada && cfValorPorKm > 0 && temValorFrete;
    
    console.log(`🔍 Verificando todos os dados: ${todosProntos ? 'PRONTOS' : 'PENDENTES'}`);
    console.log(`   - Endereços: ${enderecosProntos}`);
    console.log(`   - Valores (peso+valor/t): ${valoresPreenchidos}`);
    console.log(`   - Distância: ${distanciaCalculada}`);
    console.log(`   - CF: ${cfValorPorKm > 0}`);
    console.log(`   - Valor frete: ${temValorFrete}`);
    
    return todosProntos;
}

// Template HTML da tela de viagens - Versão com seletor de veículo
const viagensTemplate = `
<!-- GPS Status e Botão Atualizar GPS lado a lado -->
<div class="row g-2 mb-3">
    <div class="col-8">
        <div class="alert alert-warning d-flex align-items-center small py-0 mb-0" id="gps-status" style="height: 42px;">
            <i class="fas fa-satellite-dish me-2"></i><span>Aguardando GPS...</span>
        </div>
    </div>
    <div class="col-4">
        <button type="button" id="btn-atualizar-gps" class="btn btn-sm w-100 btn-atualizar-gps" style="height: 42px;">
            <i class="fas fa-sync-alt me-1"></i>Atualizar GPS
        </button>
    </div>
</div>

<!-- NOVO: Mensagem de Status da API obs TEMPORÁRIO DE TESTE -->
<div id="api-status-message" class="alert alert-info alert-dismissible fade show mb-3" style="display: none;">
    <i class="fas fa-info-circle me-2"></i>
    <span id="api-status-text"></span>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>

<div class="card border-0 shadow-sm rounded-4 mb-3">
    <div class="card-body p-3">
        <form id="frete-form">
            <div class="mb-2">
                <label class="form-label small text-secondary mb-1">ONDE ESTOU</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm bg-light" id="origem" readonly>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="view-origem-map">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            
            <!-- Container para o seletor de veículo (será preenchido dinamicamente) -->
            <div id="veiculo-selector-placeholder"></div>
            
            <div class="mb-2">
                <label class="form-label small text-secondary mb-1">CARREGAR</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm" id="partida" placeholder="Endereço de carregamento" required>
                    <button class="btn btn-outline-primary btn-sm" type="button" id="search-partida">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label small text-secondary mb-1">DESCARREGAR</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm" id="entrega" placeholder="Endereço de descarregamento" required>
                    <button class="btn btn-outline-primary btn-sm" type="button" id="search-entrega">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <div class="input-highlight">
                        <label>TONELADAS (t)</label>
                        <input type="number" id="peso" placeholder="Ex: 5.5" step="0.1" min="0" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="input-highlight">
                        <label>VALOR/t (R$)</label>
                        <input type="number" id="valorPorTonelada" placeholder="Ex: 150" step="0.01" min="0" required>
                    </div>
                </div>
            </div>
            
            <!-- Linha 1: Distância Total e Pedágio Total -->
            <div class="bg-light rounded-3 p-2 mb-2">
                <div class="row g-2">
                    <!-- Distância Total - Esquerda -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #f8f9fa; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-road"></i>DISTÂNCIA TOTAL</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="distancia_total">0</span> 
                                <span style="font-size: 0.65rem;">km</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pedágio Total - Direita -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #f8f9fa; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-toll"></i> PEDÁGIO TOTAL</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="pedagio_total_valor">0,00</span> 
                                <span style="font-size: 0.65rem;">R$</span>
                            </div>
                            <!-- Informativo da quantidade de pedágios -->
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-road-barrier me-1"></i>
                                <span><strong id="quantidade_pedagios">0</strong> pedágios</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Linha 2: Combustível Estimado e Valor de Viabilidade -->
            <div class="bg-light rounded-3 p-2 mb-2">
                <div class="row g-2">
                    <!-- Combustível Estimado - Esquerda (com base no consumo médio do motorista) -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #e8f5e9; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative; border-left: 2px solid #2e7d32;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-gas-pump"></i> COMBUSTÍVEL MÉDIO</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="combustivel_estimado_valor">0,0</span> 
                                <span style="font-size: 0.65rem;">L</span>
                            </div>
                            <!-- Informativo do consumo médio do motorista -->
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-chart-line me-1"></i>
                                <span><strong id="consumo_medio"></strong> km/L</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Valor de Viabilidade - Direita -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #fff3e0; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative; border-left: 2px solid #ff9800;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-chart-line"></i> VALOR DE VIABILIDADE</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="valor_viabilidade">R$ 0,00</span>
                                <span id="status_viabilidade" style="font-size: 0.65rem;"></span>
                            </div>
                            <!-- Informativo do CF -->
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-calculator me-1"></i>
                                <span>CF: <strong id="cf_valor">0,00</strong> R$/km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Valor Total do Frete (destaque principal) -->
            <div class="valor-total-destaque" style="background: linear-gradient(135deg, #4158D0 0%, #C850C0 100%); margin-top: 12px; padding: 12px;">
                <span class="label" style="font-size: 0.75rem;"><i class="fas fa-calculator"></i>VALOR TOTAL DO FRETE</span>
                <span class="valor" style="font-size: 1.2rem;" id="valorTotal">R$ 0,00</span>
            </div>
            
            <!-- Botões de ação -->
            <div class="row g-2 mt-3">
                <div class="col-4">
                    <button type="button" id="btn-iniciar-viagem" class="btn btn-primary w-100 py-2">
                        <i class="fas fa-play me-2"></i>Iniciar Viagem
                    </button>
                </div>
                <div class="col-4">
                    <button type="button" id="btn-cancelar-viagem" class="btn btn-danger w-100 py-2" disabled>
                        <i class="fas fa-times me-2"></i>Cancelar Viagem
                    </button>
                </div>
                <div class="col-4">
                    <button type="button" id="btn-finalizar-viagem" class="btn btn-success w-100 py-2" disabled>
                        <i class="fas fa-check me-2"></i>Finalizar Viagem
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3"><i class="fas fa-list me-2"></i>Meus Fretes</h6>
        <div id="fretes-list" class="list-fretes"></div>
    </div>
</div>
`;

// Função para exibir mensagem de status na tela
function mostrarMensagemStatus(tipo, mensagem) {
    const statusDiv = document.getElementById("api-status-message");
    const statusText = document.getElementById("api-status-text");
    
    if (!statusDiv || !statusText) return;
    
    // Remover classes existentes
    statusDiv.classList.remove("alert-info", "alert-success", "alert-warning", "alert-danger");
    
    // Adicionar classe conforme o tipo
    switch(tipo) {
        case "success":
            statusDiv.classList.add("alert-success");
            break;
        case "warning":
            statusDiv.classList.add("alert-warning");
            break;
        case "error":
            statusDiv.classList.add("alert-danger");
            break;
        default:
            statusDiv.classList.add("alert-info");
    }
    
    statusText.innerHTML = mensagem;
    statusDiv.style.display = "block";
    
    // Auto-esconder após 10 segundos
    setTimeout(() => {
        if (statusDiv) statusDiv.style.display = "none";
    }, 10000);
}

// Função principal para calcular rota com estratégia inteligente
async function calcularRotaInteligente(origem, partida, entrega, veiculo) {
    console.log("🚗 Iniciando cálculo de rota inteligente...");
    
    let resultado = {
        distanciaTrecho1: 0,
        distanciaTrecho2: 0,
        distanciaTotal: 0,
        quantidadePedagios: 0,
        valorTotalPedagios: null,
        temValorReal: false,
        detalhesPedagios: [],
        origemDados: "nenhum", // "routes_completo", "routes_parcial", "directions"
        mensagemUsuario: ""
    };
    
    try {
        // PASSO 1: Tentar obter TUDO da Routes API (distância + pedágio)
        console.log("📡 PASSO 1: Tentando Routes API (completo)...");
        
        let routesFuncionou = false;
        let dadosRoutes = null;
        
        try {
            // Obter coordenadas
            const coordsOrigem = await getCoordsFromAddress(origem);
            const coordsPartida = await getCoordsFromAddress(partida);
            const coordsEntrega = await getCoordsFromAddress(entrega);
            
            // Calcular trechos via Routes API
            const trecho1 = await chamarRoutesAPI(coordsOrigem, coordsPartida, veiculo);
            const trecho2 = await chamarRoutesAPI(coordsPartida, coordsEntrega, veiculo);
            
            dadosRoutes = { trecho1, trecho2 };
            routesFuncionou = true;
            
            console.log("✅ Routes API funcionou completamente!");
            
        } catch (routesError) {
            console.warn("⚠️ Routes API falhou completamente:", routesError.message);
            routesFuncionou = false;
        }
        
        if (routesFuncionou && dadosRoutes) {
            // Routes API funcionou - extrair todos os dados
            const distanciaTrecho1 = (dadosRoutes.trecho1.distanceMeters / 1000).toFixed(1);
            const distanciaTrecho2 = (dadosRoutes.trecho2.distanceMeters / 1000).toFixed(1);
            const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
            
            // Extrair pedágios
            let quantidadePedagios = 0;
            let valorTotalPedagios = null;
            let temValorReal = false;
            let detalhesPedagios = [];
            
            function extrairPedagiosRoutes(routeResult) {
                const pedagios = [];
                if (routeResult.travelAdvisory && routeResult.travelAdvisory.tollInfo) {
                    const tollInfo = routeResult.travelAdvisory.tollInfo;
                    if (tollInfo.estimatedPrice) {
                        for (const price of tollInfo.estimatedPrice) {
                            if (price.displayName && price.price) {
                                const valor = (price.price.units || 0) + (price.price.nanos / 1000000000);
                                pedagios.push({
                                    nome: price.displayName.text || "Pedágio",
                                    valor: valor,
                                    moeda: price.price.currencyCode || "BRL"
                                });
                            }
                        }
                    }
                }
                return pedagios;
            }
            
            const pedagios1 = extrairPedagiosRoutes(dadosRoutes.trecho1);
            const pedagios2 = extrairPedagiosRoutes(dadosRoutes.trecho2);
            detalhesPedagios = [...pedagios1, ...pedagios2];
            quantidadePedagios = detalhesPedagios.length;
            
            if (quantidadePedagios > 0 && detalhesPedagios.every(p => p.valor > 0)) {
                temValorReal = true;
                valorTotalPedagios = detalhesPedagios.reduce((sum, p) => sum + p.valor, 0);
                
                resultado.origemDados = "routes_completo";
                resultado.mensagemUsuario = `✅ Rota calculada com sucesso! Foram encontrados ${quantidadePedagios} pedágio(s) no trajeto. Valor total: R$ ${valorTotalPedagios.toFixed(2)}`;
                mostrarMensagemStatus("success", resultado.mensagemUsuario);
                
            } else if (quantidadePedagios > 0) {
                // Routes API detectou pedágios mas sem valores
                temValorReal = false;
                valorTotalPedagios = null;
                
                resultado.origemDados = "routes_parcial";
                resultado.mensagemUsuario = `⚠️ A API detectou ${quantidadePedagios} pedágio(s) no trajeto, mas não conseguiu obter os valores reais. Por favor, informe o valor total dos pedágios manualmente.`;
                mostrarMensagemStatus("warning", resultado.mensagemUsuario);
                
            } else {
                // Sem pedágios
                temValorReal = true;
                valorTotalPedagios = 0;
                
                resultado.origemDados = "routes_completo";
                resultado.mensagemUsuario = `✅ Rota calculada com sucesso! Nenhum pedágio encontrado no trajeto.`;
                mostrarMensagemStatus("success", resultado.mensagemUsuario);
            }
            
            resultado.distanciaTrecho1 = parseFloat(distanciaTrecho1);
            resultado.distanciaTrecho2 = parseFloat(distanciaTrecho2);
            resultado.distanciaTotal = parseFloat(distanciaTotal);
            resultado.quantidadePedagios = quantidadePedagios;
            resultado.valorTotalPedagios = valorTotalPedagios;
            resultado.temValorReal = temValorReal;
            resultado.detalhesPedagios = detalhesPedagios;
            
        } else {
            // PASSO 2: Routes API falhou - usar Directions API para distância
            console.log("📡 PASSO 2: Routes API falhou, usando Directions API para distância...");
            
            const directionsService = new google.maps.DirectionsService();
            
            // Calcular 1º trecho via Directions API
            const resultTrecho1 = await new Promise((resolve, reject) => {
                directionsService.route(
                    { origin: origem, destination: partida, travelMode: google.maps.TravelMode.DRIVING },
                    (result, status) => {
                        if (status === "OK") resolve(result);
                        else reject(new Error(`Directions API erro: ${status}`));
                    }
                );
            });
            
            // Calcular 2º trecho via Directions API
            const resultTrecho2 = await new Promise((resolve, reject) => {
                directionsService.route(
                    { origin: partida, destination: entrega, travelMode: google.maps.TravelMode.DRIVING },
                    (result, status) => {
                        if (status === "OK") resolve(result);
                        else reject(new Error(`Directions API erro: ${status}`));
                    }
                );
            });
            
            // Extrair distâncias
            const route1 = resultTrecho1.routes[0].legs[0];
            const route2 = resultTrecho2.routes[0].legs[0];
            
            const distanciaTrecho1 = (route1.distance.value / 1000).toFixed(1);
            const distanciaTrecho2 = (route2.distance.value / 1000).toFixed(1);
            const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
            
            // Tentar detectar pedágios pelas instruções
            let quantidadePedagios = 0;
            
            function contarPedagiosInstrucoes(routeResult) {
                let qtd = 0;
                if (routeResult.routes && routeResult.routes[0] && routeResult.routes[0].legs) {
                    for (const leg of routeResult.routes[0].legs) {
                        if (leg.steps) {
                            for (const step of leg.steps) {
                                const instruction = step.instructions || "";
                                if (instruction.toLowerCase().includes("pedágio") || 
                                    instruction.toLowerCase().includes("toll")) {
                                    qtd++;
                                }
                            }
                        }
                    }
                }
                return qtd;
            }
            
            const qtd1 = contarPedagiosInstrucoes(resultTrecho1);
            const qtd2 = contarPedagiosInstrucoes(resultTrecho2);
            quantidadePedagios = qtd1 + qtd2;
            
            resultado.distanciaTrecho1 = parseFloat(distanciaTrecho1);
            resultado.distanciaTrecho2 = parseFloat(distanciaTrecho2);
            resultado.distanciaTotal = parseFloat(distanciaTotal);
            resultado.quantidadePedagios = quantidadePedagios;
            resultado.valorTotalPedagios = null;
            resultado.temValorReal = false;
            resultado.origemDados = "directions";
            
            if (quantidadePedagios > 0) {
                resultado.mensagemUsuario = `⚠️ Não foi possível conectar à API de pedágios. Foram identificados ${quantidadePedagios} pedágio(s) no trajeto. Por favor, informe o valor total dos pedágios manualmente.`;
                mostrarMensagemStatus("warning", resultado.mensagemUsuario);
            } else {
                resultado.mensagemUsuario = `⚠️ Não foi possível conectar à API de pedágios, mas a rota foi calculada. Nenhum pedágio identificado nas instruções. Caso haja pedágios, informe manualmente.`;
                mostrarMensagemStatus("warning", resultado.mensagemUsuario);
            }
        }
        
        return resultado;
        
    } catch (error) {
        console.error("❌ Erro fatal no cálculo de rota:", error);
        resultado.origemDados = "nenhum";
        resultado.mensagemUsuario = `❌ Erro ao calcular rota: ${error.message}. Verifique os endereços e tente novamente.`;
        mostrarMensagemStatus("error", resultado.mensagemUsuario);
        throw error;
    }
}

// Função para calcular o combustível estimado usando o consumo médio do motorista
function calcularCombustivelEstimado(distanciaTotalKm) {
    // Usar o consumo médio atual do motorista (km/L)
    // Fórmula: litros = distância / consumo (km/L)
    
    console.log(`📊 Calculando combustível estimado:`);
    console.log(`   - Distância total: ${distanciaTotalKm} km`);
    console.log(`   - Consumo médio do motorista: ${consumoMedioAtualKmPorL} km/L`);
    
    const litrosEstimados = distanciaTotalKm / consumoMedioAtualKmPorL;
    
    console.log(`   - Resultado: ${litrosEstimados.toFixed(2)} L`);
    
    const combustivelEstimadoSpan = document.getElementById("combustivel_estimado_valor");
    if (combustivelEstimadoSpan) {
        combustivelEstimadoSpan.textContent = litrosEstimados.toLocaleString("pt-BR", { 
            minimumFractionDigits: 1, 
            maximumFractionDigits: 1 
        });
    }
    
    return litrosEstimados;
}

function initViagens(container) {
    console.log("🚚 Inicializando tela de Viagens");
    
    if (container) {
        container.innerHTML = viagensTemplate;
    }
    
    loadCustos();
    loadCombustivelReal();
    setupViagensListeners();
    
    setTimeout(async () => {
        stopGPS();
        startGPS();
        
        // Carregar veículos vinculados ao usuário
        await carregarVeiculosVinculados();
        
        loadMotoristaFretes();
        verificarViagemEmAndamento();
        
        // Atualizar o valor do CF na tela
        const cfSpan = document.getElementById("cf_valor");
        if (cfSpan) {
            cfSpan.textContent = cfValorPorKm.toFixed(2);
        }
    }, 200);
}

function setupViagensListeners() {
    // Botão Iniciar Viagem
    const btnIniciar = document.getElementById("btn-iniciar-viagem");
    if (btnIniciar) {
        btnIniciar.removeEventListener("click", handleIniciarViagem);
        btnIniciar.addEventListener("click", handleIniciarViagem);
    }
    
    // Botão Cancelar Viagem
    const btnCancelar = document.getElementById("btn-cancelar-viagem");
    if (btnCancelar) {
        btnCancelar.removeEventListener("click", handleCancelarViagem);
        btnCancelar.addEventListener("click", handleCancelarViagem);
    }
    
    // Botão Finalizar Viagem
    const btnFinalizar = document.getElementById("btn-finalizar-viagem");
    if (btnFinalizar) {
        btnFinalizar.removeEventListener("click", handleFinalizarViagem);
        btnFinalizar.addEventListener("click", handleFinalizarViagem);
    }
    
    // Botão Atualizar GPS
    const btnAtualizarGPS = document.getElementById("btn-atualizar-gps");
    if (btnAtualizarGPS) {
        btnAtualizarGPS.removeEventListener("click", handleAtualizarGPS);
        btnAtualizarGPS.addEventListener("click", handleAtualizarGPS);
    }
    
    // Listeners para os campos de endereço (para calcular automaticamente)
    const origemInput = document.getElementById("origem");
    const partidaInput = document.getElementById("partida");
    const entregaInput = document.getElementById("entrega");
    
    // Função que será chamada quando qualquer campo mudar
    const onEnderecoChange = () => {
        // Pequeno delay para garantir que o valor foi atualizado
        setTimeout(() => {
            verificarCamposEndereco();
        }, 100);
    };
    
    if (origemInput) {
        origemInput.removeEventListener("change", onEnderecoChange);
        origemInput.addEventListener("change", onEnderecoChange);
    }
    
    if (partidaInput) {
        partidaInput.removeEventListener("change", onEnderecoChange);
        partidaInput.addEventListener("change", onEnderecoChange);
    }
    
    if (entregaInput) {
        entregaInput.removeEventListener("change", onEnderecoChange);
        entregaInput.addEventListener("change", onEnderecoChange);
    }
    
    // Também observar mudanças via JavaScript (como autocomplete)
    const observer = new MutationObserver(() => {
        verificarCamposEndereco();
    });
    
    if (origemInput) observer.observe(origemInput, { attributes: true, attributeFilter: ['value'] });
    if (partidaInput) observer.observe(partidaInput, { attributes: true, attributeFilter: ['value'] });
    if (entregaInput) observer.observe(entregaInput, { attributes: true, attributeFilter: ['value'] });
    
    const viewMapBtn = document.getElementById("view-origem-map");
    if (viewMapBtn) {
        viewMapBtn.removeEventListener("click", () => openMapForSearch("origem", true));
        viewMapBtn.addEventListener("click", () => openMapForSearch("origem", true));
    }
    
    const searchPartida = document.getElementById("search-partida");
    if (searchPartida) {
        searchPartida.removeEventListener("click", () => openMapForSearch("partida"));
        searchPartida.addEventListener("click", () => openMapForSearch("partida"));
    }
    
    const searchEntrega = document.getElementById("search-entrega");
    if (searchEntrega) {
        searchEntrega.removeEventListener("click", () => openMapForSearch("entrega"));
        searchEntrega.addEventListener("click", () => openMapForSearch("entrega"));
    }
    
    const pesoInput = document.getElementById("peso");
    if (pesoInput) {
        pesoInput.removeEventListener("input", calcularValorTotal);
        pesoInput.addEventListener("input", function() {
            calcularValorTotal();
        });
    }
    
    const valorInput = document.getElementById("valorPorTonelada");
    if (valorInput) {
        valorInput.removeEventListener("input", calcularValorTotal);
        valorInput.addEventListener("input", function() {
            calcularValorTotal();
        });
    }
}

// Função para verificar se existe viagem em andamento
async function verificarViagemEmAndamento() {
    if (!window.db || !window.currentUser) return;
    
    try {
        const snapshot = await window.db.collection("fretes")
            .where("id", "==", window.currentUser.id)
            .where("status", "==", "em_andamento")
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            viagemEmAndamento = doc.id;
            const viagem = doc.data();
            
            // Preencher formulário com dados da viagem em andamento
            document.getElementById("origem").value = viagem.origem || "";
            document.getElementById("partida").value = viagem.partida || "";
            document.getElementById("entrega").value = viagem.entrega || "";
            document.getElementById("peso").value = viagem.toneladas || "";
            document.getElementById("valorPorTonelada").value = viagem.valorPorTonelada || "";
            
            // Atualizar os cálculos
            window.distanciasCalculadas = {
                distanciaTrecho1: viagem.distancia_trecho1 || 0,
                distanciaTrecho2: viagem.distancia_trecho2 || 0,
                distanciaTotal: viagem.distancia_total || 0,
                quantidadePedagios: viagem.quantidade_pedagios || 0,
                valorTotalPedagios: viagem.valor_total_pedagios || 0
            };
            
            document.getElementById("distancia_total").textContent = viagem.distancia_total || 0;
            document.getElementById("pedagio_total_valor").textContent = (viagem.valor_total_pedagios || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById("quantidade_pedagios").textContent = viagem.quantidade_pedagios || 0;
            document.getElementById("combustivel_estimado_valor").textContent = (viagem.combustivel_estimado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            
            // Calcular valor total
            calcularValorTotal();
            
            // Aguardar um momento para o DOM atualizar e depois calcular viabilidade
            setTimeout(() => {
                console.log("🔄 Calculando viabilidade para viagem em andamento...");
                calcularViabilidade();
            }, 100);
            
            // Desabilitar formulário e botões
            setFormEnabled(false);
            document.getElementById("btn-iniciar-viagem").disabled = true;
            document.getElementById("btn-cancelar-viagem").disabled = false;
            document.getElementById("btn-finalizar-viagem").disabled = false;
            
            console.log("✅ Viagem em andamento carregada:", viagemEmAndamento);
        } else {
            // Habilitar formulário
            setFormEnabled(true);
            document.getElementById("btn-iniciar-viagem").disabled = false;
            document.getElementById("btn-cancelar-viagem").disabled = true;
            document.getElementById("btn-finalizar-viagem").disabled = true;
        }
    } catch (error) {
        console.error("Erro ao verificar viagem em andamento:", error);
    }
}

// Função para lidar com o botão Iniciar Viagem
async function handleIniciarViagem() {
    if (!window.currentUser) return alert("Usuário não logado!");
    
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    const toneladas = parseFloat(document.getElementById("peso").value);
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value);
    
    if (!origem || !partida || !entrega || !toneladas || !valorPorTonelada) {
        return alert("Preencha todos os campos!");
    }
    
    // Verificar se um veículo foi selecionado
    if (!veiculoSelecionado) {
        return alert("Selecione um veículo vinculado ao seu perfil!");
    }
    
    // Verificar se as distâncias já foram calculadas
    if (!window.distanciasCalculadas) {
        return alert("Aguardando cálculo da rota. Verifique os endereços e aguarde alguns segundos.");
    }
    
    const valorTotal = toneladas * valorPorTonelada;
    
    // Calcular combustíveis usando o consumo médio do motorista
    const combustivelEstimado = window.distanciasCalculadas.distanciaTotal / consumoMedioAtualKmPorL;
    const custoViagem = window.distanciasCalculadas.distanciaTotal * cfValorPorKm;
    const viabilidade = (custoViagem + window.distanciasCalculadas.valorTotalPedagios) <= valorTotal;
    
    const frete = {
        nome: window.currentUser.nome,
        login: window.currentUser.login,
        id: window.currentUser.id,
        perfil: window.currentUser.perfil,
        origem,
        partida,
        entrega,
        toneladas,
        valorPorTonelada,
        valorTotal,
        distancia_trecho1: window.distanciasCalculadas.distanciaTrecho1,
        distancia_trecho2: window.distanciasCalculadas.distanciaTrecho2,
        distancia_total: window.distanciasCalculadas.distanciaTotal,
        quantidade_pedagios: window.distanciasCalculadas.quantidadePedagios,
        valor_total_pedagios: window.distanciasCalculadas.valorTotalPedagios,
        combustivel_estimado: combustivelEstimado,
        consumo_medio_motorista: consumoMedioAtualKmPorL,
        cf_valor_por_km: cfValorPorKm,
        valor_viabilidade: custoViagem + window.distanciasCalculadas.valorTotalPedagios,
        viabilidade: viabilidade,
        veiculo_utilizado: {
            placa: veiculoSelecionado.placa,
            tipo: veiculoSelecionado.caracteristica_tipo_de_veiculo,
            eixos: veiculoSelecionado.caracteristica_axleCount,
            peso: veiculoSelecionado.caracteristica_weightKg,
            dimensoes: {
                altura: veiculoSelecionado.caracteristica_heightCm,
                largura: veiculoSelecionado.caracteristica_widthCm,
                comprimento: veiculoSelecionado.caracteristica_lengthCm
            }
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: "em_andamento"
    };
    
    try {
        let docRef;
        if (viagemEditando) {
            // Atualizar viagem existente
            await window.db.collection("fretes").doc(viagemEditando).update(frete);
            docRef = { id: viagemEditando };
            alert("Viagem atualizada com sucesso!");
            viagemEditando = null;
        } else {
            // Criar nova viagem
            docRef = await window.db.collection("fretes").add(frete);
            alert("Viagem iniciada com sucesso!");
        }
        
        viagemEmAndamento = docRef.id;
        
        // Desabilitar formulário e botões
        setFormEnabled(false);
        document.getElementById("btn-iniciar-viagem").disabled = true;
        document.getElementById("btn-cancelar-viagem").disabled = false;
        document.getElementById("btn-finalizar-viagem").disabled = false;
        
        loadMotoristaFretes();
        
    } catch (error) {
        console.error("Erro ao salvar viagem:", error);
        alert(`Erro ao salvar: ${error.message}`);
    }
}

// Função para lidar com o botão Cancelar Viagem
async function handleCancelarViagem() {
    if (!viagemEmAndamento) {
        alert("Nenhuma viagem em andamento para cancelar.");
        return;
    }
    
    if (!confirm("Tem certeza que deseja cancelar esta viagem? Esta ação não pode ser desfeita.")) {
        return;
    }
    
    try {
        // Excluir a viagem do Firestore
        await window.db.collection("fretes").doc(viagemEmAndamento).delete();
        
        alert("Viagem cancelada com sucesso!");
        
        // Limpar formulário
        limparFormulario();
        
        // Resetar estado
        viagemEmAndamento = null;
        viagemEditando = null;
        
        // Habilitar formulário
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = false;
        document.getElementById("btn-cancelar-viagem").disabled = true;
        document.getElementById("btn-finalizar-viagem").disabled = true;
        
        // Recarregar lista
        loadMotoristaFretes();
        
    } catch (error) {
        console.error("Erro ao cancelar viagem:", error);
        alert(`Erro ao cancelar: ${error.message}`);
    }
}

// Função para lidar com o botão Finalizar Viagem
async function handleFinalizarViagem() {
    if (!viagemEmAndamento) {
        alert("Nenhuma viagem em andamento para finalizar.");
        return;
    }
    
    if (!confirm("Confirmar finalização da viagem?")) {
        return;
    }
    
    try {
        // Atualizar status da viagem para finalizada
        await window.db.collection("fretes").doc(viagemEmAndamento).update({
            status: "finalizada",
            data_finalizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Viagem finalizada com sucesso!");
        
        // Limpar formulário
        limparFormulario();
        
        // Resetar estado
        viagemEmAndamento = null;
        viagemEditando = null;
        
        // Habilitar formulário para nova viagem
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = false;
        document.getElementById("btn-cancelar-viagem").disabled = true;
        document.getElementById("btn-finalizar-viagem").disabled = true;
        
        // Recarregar lista
        loadMotoristaFretes();
        
    } catch (error) {
        console.error("Erro ao finalizar viagem:", error);
        alert(`Erro ao finalizar: ${error.message}`);
    }
}

// Função para editar uma viagem
async function editarViagem(viagemId, viagemData) {
    if (viagemEmAndamento && viagemEmAndamento !== viagemId) {
        alert("Você já tem uma viagem em andamento. Finalize ou cancele antes de editar outra.");
        return;
    }
    
    // Preencher formulário com dados da viagem
    document.getElementById("origem").value = viagemData.origem || "";
    document.getElementById("partida").value = viagemData.partida || "";
    document.getElementById("entrega").value = viagemData.entrega || "";
    document.getElementById("peso").value = viagemData.toneladas || "";
    document.getElementById("valorPorTonelada").value = viagemData.valorPorTonelada || "";
    
    // Atualizar os cálculos
    window.distanciasCalculadas = {
        distanciaTrecho1: viagemData.distancia_trecho1 || 0,
        distanciaTrecho2: viagemData.distancia_trecho2 || 0,
        distanciaTotal: viagemData.distancia_total || 0,
        quantidadePedagios: viagemData.quantidade_pedagios || 0,
        valorTotalPedagios: viagemData.valor_total_pedagios || 0
    };
    
    document.getElementById("distancia_total").textContent = viagemData.distancia_total || 0;
    document.getElementById("pedagio_total_valor").textContent = (viagemData.valor_total_pedagios || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("quantidade_pedagios").textContent = viagemData.quantidade_pedagios || 0;
    document.getElementById("combustivel_estimado_valor").textContent = (viagemData.combustivel_estimado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    
    // Calcular valor total e viabilidade
    calcularValorTotal();
    console.log("🔄 Calculando viabilidade para edição de viagem...");
    calcularViabilidade();
    
    // Se a viagem está em andamento, permitir edição mantendo os botões de cancelar/finalizar
    if (viagemData.status === "em_andamento") {
        viagemEmAndamento = viagemId;
        viagemEditando = viagemId;
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = true;
        document.getElementById("btn-cancelar-viagem").disabled = false;
        document.getElementById("btn-finalizar-viagem").disabled = false;
    } else {
        // Se é uma viagem finalizada, permitir edição como nova viagem
        viagemEditando = viagemId;
        viagemEmAndamento = null;
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = false;
        document.getElementById("btn-cancelar-viagem").disabled = true;
        document.getElementById("btn-finalizar-viagem").disabled = true;
        
        // Mudar texto do botão para "Atualizar Viagem"
        const btnIniciar = document.getElementById("btn-iniciar-viagem");
        btnIniciar.innerHTML = '<i class="fas fa-save me-2"></i>Atualizar Viagem';
        
        // Adicionar evento temporário para restaurar texto após salvar
        const originalClick = btnIniciar.onclick;
        btnIniciar.onclick = async (e) => {
            await handleIniciarViagem(e);
            btnIniciar.innerHTML = '<i class="fas fa-play me-2"></i>Iniciar Viagem';
            btnIniciar.onclick = originalClick;
        };
    }
    
    // Scroll para o topo do formulário
    document.querySelector(".card").scrollIntoView({ behavior: "smooth" });
}

// Função para excluir uma viagem
async function excluirViagem(viagemId, viagemData) {
    if (viagemEmAndamento === viagemId) {
        alert("Não é possível excluir uma viagem em andamento. Finalize ou cancele primeiro.");
        return;
    }
    
    if (!confirm("Tem certeza que deseja excluir esta viagem permanentemente?")) {
        return;
    }
    
    try {
        await window.db.collection("fretes").doc(viagemId).delete();
        alert("Viagem excluída com sucesso!");
        loadMotoristaFretes();
        
        // Se estava editando esta viagem, limpar formulário
        if (viagemEditando === viagemId) {
            limparFormulario();
            viagemEditando = null;
        }
    } catch (error) {
        console.error("Erro ao excluir viagem:", error);
        alert(`Erro ao excluir: ${error.message}`);
    }
}

// Função para calcular a distância total e pedágios usando a API do Google Maps
async function calcularDistanciaTotal(origem, partida, entrega) {
    console.log("🚗 Calculando rota via Google Maps API...");
    
    // Verificar se há veículo selecionado
    if (!veiculoSelecionado) {
        console.error("❌ Nenhum veículo selecionado!");
        throw new Error("Selecione um veículo antes de calcular a rota");
    }
    
    // Usar a função com veículo que obtém valores REAIS da API
    return await calcularDistanciaTotalComVeiculo(origem, partida, entrega, veiculoSelecionado);
}

// Função para verificar se todos os campos de endereço estão preenchidos e calcular
async function verificarCamposEndereco() {
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    if (origem && partida && entrega) {
        console.log("✅ Todos os endereços preenchidos, calculando rota...");
        
        const distanciaSpan = document.getElementById("distancia_total");
        const pedagioSpan = document.getElementById("pedagio_total_valor");
        const combustivelEstimadoSpan = document.getElementById("combustivel_estimado_valor");
        const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
        const statusViabilidadeSpan = document.getElementById("status_viabilidade");
        
        if (distanciaSpan) distanciaSpan.textContent = "...";
        if (pedagioSpan) pedagioSpan.textContent = "...";
        if (combustivelEstimadoSpan) combustivelEstimadoSpan.textContent = "...";
        if (valorViabilidadeSpan) valorViabilidadeSpan.textContent = "---";
        if (statusViabilidadeSpan) statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Aguardando cálculo da rota</span>';
        
        try {
            // Usar o novo sistema de cálculo inteligente
            const resultado = await calcularRotaInteligente(origem, partida, entrega, veiculoSelecionado);
            
            window.distanciasCalculadas = resultado;
            
            // Atualizar distância na tela
            if (distanciaSpan) {
                distanciaSpan.textContent = resultado.distanciaTotal;
            }
            
            // Atualizar quantidade de pedágios
            const quantidadePedagiosSpan = document.getElementById("quantidade_pedagios");
            if (quantidadePedagiosSpan) {
                quantidadePedagiosSpan.textContent = resultado.quantidadePedagios;
            }
            
            // ATUALIZAR PEDÁGIO NA INTERFACE
            const pedagioTotalSpan = document.getElementById("pedagio_total_valor");
            
            // Remover ícones antigos
            const parentDiv = pedagioTotalSpan.parentElement;
            const oldIcons = parentDiv.querySelectorAll(".real-value-icon, .warning-value-icon, .manual-value-icon");
            oldIcons.forEach(icon => icon.remove());
            
            // Verificar se temos valor real de pedágio
            if (resultado.temValorReal && resultado.valorTotalPedagios !== null && resultado.valorTotalPedagios > 0) {
                // Valor real da API
                pedagioTotalSpan.textContent = resultado.valorTotalPedagios.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
                pedagioTotalSpan.style.color = "";
                pedagioTotalSpan.title = "Valor real obtido da API Google Maps";
                
                const infoIcon = document.createElement("i");
                infoIcon.className = "fas fa-check-circle text-success ms-1 real-value-icon";
                infoIcon.style.fontSize = "0.65rem";
                infoIcon.title = "Valor real obtido da API";
                parentDiv.appendChild(infoIcon);
                
            } else if (resultado.quantidadePedagios > 0) {
                // Tem pedágios mas sem valor - mostrar valor indisponível
                pedagioTotalSpan.textContent = "Valor Indisponível";
                pedagioTotalSpan.style.color = "#dc3545";
                pedagioTotalSpan.title = "Não foi possível obter o valor real dos pedágios. Informe manualmente.";
                
                const warningIcon = document.createElement("i");
                warningIcon.className = "fas fa-exclamation-triangle text-warning ms-1 warning-value-icon";
                warningIcon.style.fontSize = "0.65rem";
                warningIcon.title = "Valor indisponível - calcular manualmente";
                parentDiv.appendChild(warningIcon);
                
                // Abrir modal para informar manualmente
                const resultadoManual = await mostrarModalPedagioManual(resultado.quantidadePedagios, false);
                
                if (resultadoManual && resultadoManual.quantidade > 0) {
                    // Atualizar com dados manuais
                    resultado.valorTotalPedagios = resultadoManual.valorTotal;
                    resultado.temValorReal = true;
                    resultado.informadoManualmente = true;
                    resultado.obsPedagio = resultadoManual.obs;
                    window.distanciasCalculadas = resultado;
                    
                    // Atualizar interface
                    pedagioTotalSpan.textContent = resultadoManual.valorTotal.toLocaleString("pt-BR", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    });
                    pedagioTotalSpan.style.color = "#856404";
                    pedagioTotalSpan.title = "Valor informado manualmente pelo motorista";
                    
                    // Remover ícone de alerta
                    warningIcon.remove();
                    
                    // Adicionar ícone de manual
                    const manualIcon = document.createElement("i");
                    manualIcon.className = "fas fa-user-edit text-warning ms-1 manual-value-icon";
                    manualIcon.style.fontSize = "0.65rem";
                    manualIcon.title = "Valor informado manualmente";
                    parentDiv.appendChild(manualIcon);
                    
                    mostrarMensagemStatus("success", `✅ Pedágio informado manualmente: ${resultadoManual.quantidade} pedágio(s) - Total: R$ ${resultadoManual.valorTotal.toFixed(2)}`);
                }
            } else {
                // Sem pedágios
                pedagioTotalSpan.textContent = "R$ 0,00";
                pedagioTotalSpan.style.color = "";
            }
            
            // Recalcular combustível
            const combustivelEstimado = calcularCombustivelEstimado(resultado.distanciaTotal);
            
            // Verificar se os valores de frete estão preenchidos
            const peso = parseFloat(document.getElementById("peso").value) || 0;
            const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
            const valoresPreenchidos = peso > 0 && valorPorTonelada > 0;
            const cfConfigurado = cfValorPorKm > 0;
            
            if (valoresPreenchidos && cfConfigurado) {
                console.log("✅ Valores de frete e CF prontos, calculando viabilidade...");
                calcularViabilidade();
            } else {
                console.log("⏳ Aguardando valores para calcular viabilidade");
                if (!valoresPreenchidos) {
                    const statusSpan = document.getElementById("status_viabilidade");
                    if (statusSpan) statusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha toneladas e valor/t</span>';
                } else if (!cfConfigurado) {
                    const statusSpan = document.getElementById("status_viabilidade");
                    if (statusSpan) statusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ CF (Custo Fixo) não configurado</span>';
                }
            }
            
        } catch (error) {
            console.error("❌ Erro ao calcular rota:", error);
            const distanciaSpan = document.getElementById("distancia_total");
            const pedagioSpan = document.getElementById("pedagio_total_valor");
            
            if (distanciaSpan) distanciaSpan.textContent = "Erro";
            if (pedagioSpan) pedagioSpan.textContent = "Erro";
            
            window.distanciasCalculadas = null;
            
            if (error.message !== "Cálculo de pedágio cancelado pelo usuário") {
                mostrarMensagemStatus("error", `❌ Erro ao calcular rota: ${error.message}`);
                alert("Erro ao calcular a rota. Verifique os endereços e tente novamente.");
            }
        }
    } else {
        console.log("⚠️ Endereços incompletos, aguardando preenchimento...");
        const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
        const statusViabilidadeSpan = document.getElementById("status_viabilidade");
        
        if (valorViabilidadeSpan) valorViabilidadeSpan.textContent = "---";
        if (statusViabilidadeSpan) statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os endereços</span>';
    }
}

// Função para lidar com o botão Atualizar GPS
async function handleAtualizarGPS() {
    const btn = document.getElementById("btn-atualizar-gps");
    
    if (confirm("Isso irá limpar os dados do formulário e atualizar sua localização. Deseja continuar?")) {
        // Mudar para estado de loading
        btn.classList.add("loading");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Atualizando...';
        
        try {
            // Limpar formulário
            limparFormulario();
            
            // Aguardar o GPS atualizar
            await new Promise((resolve) => {
                restartGPS();
                // Aguardar 2 segundos para o GPS atualizar
                setTimeout(resolve, 2000);
            });
            
        } catch (error) {
            console.error("Erro ao atualizar:", error);
        } finally {
            btn.classList.remove("loading");
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Atualizar GPS';
        }
    }
}

// Função para calcular o valor total do frete
function calcularValorTotal() {
    const toneladas = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    const valorTotal = toneladas * valorPorTonelada;
    const valorSpan = document.getElementById("valorTotal");
    
    if (valorSpan) {
        valorSpan.textContent = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        console.log(`💰 Valor do frete calculado: R$ ${valorTotal.toFixed(2)} (${toneladas} t × R$ ${valorPorTonelada}/t)`);
        
        // Verificar se todos os dados estão prontos antes de calcular viabilidade
        if (verificarTodosDados()) {
            console.log("✅ Todos os dados prontos, calculando viabilidade...");
            setTimeout(() => {
                calcularViabilidade();
            }, 50);
        } else {
            console.log("⏳ Dados incompletos, viabilidade não calculada");
            // Atualizar mensagem de dados incompletos
            const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
            const statusViabilidadeSpan = document.getElementById("status_viabilidade");
            if (valorViabilidadeSpan) valorViabilidadeSpan.textContent = "---";
            if (statusViabilidadeSpan) statusViabilidadeSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os dados</span>';
        }
    }
    
    return valorTotal;
}

async function getAddressFromCoords(lat, lng) {
    if (!window.google?.maps) throw new Error("Google Maps não disponível");
    return new Promise((resolve, reject) => {
        new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) resolve(results[0].formatted_address);
            else reject(new Error(`Erro na geocodificação: ${status}`));
        });
    });
}

async function getCoordsFromAddress(address) {
    if (!window.google?.maps) throw new Error("Google Maps não disponível");
    return new Promise((resolve, reject) => {
        new google.maps.Geocoder().geocode({ address }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng(), display_name: results[0].formatted_address });
            } else reject(new Error(`Endereço não encontrado`));
        });
    });
}

function setupAutocomplete() {
    if (!window.google?.maps?.places) {
        setTimeout(setupAutocomplete, 500);
        return;
    }
    
    const partidaInput = document.getElementById("partida");
    if (partidaInput && !autocompletePartida) {
        autocompletePartida = new google.maps.places.Autocomplete(partidaInput, {
            componentRestrictions: { country: "BR" },
            types: ["geocode", "establishment"],
            fields: ["geometry", "formatted_address", "name", "types"]
        });
        autocompletePartida.addListener("place_changed", () => {
            const place = autocompletePartida.getPlace();
            if (place.geometry) {
                partidaInput.value = place.formatted_address || place.name;
                partidaInput.dataset.lat = place.geometry.location.lat();
                partidaInput.dataset.lng = place.geometry.location.lng();
            }
        });
    }
    
    const entregaInput = document.getElementById("entrega");
    if (entregaInput && !autocompleteEntrega) {
        autocompleteEntrega = new google.maps.places.Autocomplete(entregaInput, {
            componentRestrictions: { country: "BR" },
            types: ["geocode", "establishment"],
            fields: ["geometry", "formatted_address", "name", "types"]
        });
        autocompleteEntrega.addListener("place_changed", () => {
            const place = autocompleteEntrega.getPlace();
            if (place.geometry) {
                entregaInput.value = place.formatted_address || place.name;
                entregaInput.dataset.lat = place.geometry.location.lat();
                entregaInput.dataset.lng = place.geometry.location.lng();
            }
        });
    }
}

function setupMapSearchBox() {
    if (!map || !window.google?.maps?.places) return;
    
    const searchBoxDiv = document.createElement("div");
    searchBoxDiv.className = "map-search-box";
    searchBoxDiv.innerHTML = `<input type="text" id="map-search-input" class="form-control" placeholder="Pesquisar endereço no mapa..." style="width: 300px; margin: 10px; border-radius: 30px; border: 1px solid #ddd; padding: 10px 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">`;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBoxDiv);
    
    const searchInput = document.getElementById("map-search-input");
    searchBox = new google.maps.places.SearchBox(searchInput);
    map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
    
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        const place = places[0];
        if (!place.geometry) return;
        
        if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
        else { map.setCenter(place.geometry.location); map.setZoom(17); }
        
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({ position: place.geometry.location, map: map, animation: google.maps.Animation.DROP });
        const address = place.formatted_address || place.name;
        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="route-info-window"><h6>Local encontrado</h6><p><i class="fas fa-map-marker-alt"></i> ${address}</p><button class="btn btn-primary btn-sm w-100 mt-2" onclick="window.selectMapLocation('${address.replace(/'/g, "\\'")}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()})"><i class="fas fa-check me-2"></i>Usar este local</button></div>`
        });
        infoWindow.open(map, marker);
        marker.address = address;
        marker.lat = place.geometry.location.lat();
        marker.lng = place.geometry.location.lng();
    });
}

function startGPS() {
    console.log("Iniciando GPS...");
    const gpsStatus = document.getElementById("gps-status");
    if (!gpsStatus) return;
    if (!navigator.geolocation) {
        gpsStatus.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> GPS não suportado';
        gpsStatus.className = "alert alert-danger d-flex align-items-center";
        return;
    }
    if (watchPositionId) navigator.geolocation.clearWatch(watchPositionId);
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            watchPositionId = navigator.geolocation.watchPosition(
                async (position) => {
                    currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentLocation = currentLocation;
                    try {
                        if (window.google?.maps) {
                            const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
                            currentAddress = address;
                            window.currentAddress = address;
                            const origemInput = document.getElementById("origem");
                            if (origemInput) origemInput.value = address;
                            // GPS Status simplificado
                            gpsStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i><span>GPS Online</span>`;
                            gpsStatus.className = "alert alert-success d-flex align-items-center";
                        }
                    } catch (error) { console.error("Erro ao obter endereço:", error); }
                },
                (error) => handleGPSError(error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        },
        (error) => handleGPSError(error)
    );
}

function handleGPSError(error) {
    const gpsStatus = document.getElementById("gps-status");
    if (!gpsStatus) return;
    
    let mensagem = "";
    if (error.code === 1) {
        mensagem = "Permissão negada. Ative a localização nas configurações.";
    } else if (error.code === 2) {
        mensagem = "Sinal indisponível. Tente em um local aberto.";
    } else if (error.code === 3) {
        mensagem = "Tempo excedido. Tente novamente.";
    } else {
        mensagem = error.message;
    }
    
    gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i><span>Erro GPS: ${mensagem}</span>`;
    gpsStatus.className = "alert alert-danger d-flex align-items-center";
}

async function loadGoogleMapsWithFirebaseKey() {
    if (googleMapsPromise) return googleMapsPromise;
    if (window.google?.maps) { setupAutocomplete(); return Promise.resolve(window.google.maps); }
    
    googleMapsPromise = new Promise(async (resolve, reject) => {
        try {
            if (!window.db) {
                throw new Error("Firestore não disponível para carregar chave do Google Maps");
            }
            const docRef = window.db.collection("config").doc("api_googlemaps");
            const docSnap = await docRef.get();
            if (!docSnap.exists) throw new Error("Configuração do Google Maps não encontrada");
            const apiKey = docSnap.data().key;
            if (!apiKey) throw new Error("Chave da API não configurada");
            googleMapsApiKey = apiKey;
            
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMapsCallback`;
            script.async = true;
            window.initGoogleMapsCallback = function() { setupAutocomplete(); resolve(window.google.maps); };
            script.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
            document.head.appendChild(script);
        } catch (error) { reject(error); }
    });
    return googleMapsPromise;
}

async function openMapForSearch(fieldId, isReadonly = false) {
    if (!window.google?.maps) return alert("Google Maps não disponível");
    currentField = fieldId;
    const modalEl = document.getElementById("map-modal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    
    modalEl.addEventListener("shown.bs.modal", function onModalShown() {
        modalEl.removeEventListener("shown.bs.modal", onModalShown);
        setTimeout(async () => {
            const mapElement = document.getElementById("map");
            if (!mapElement) return;
            
            if (!mapInitialized) {
                const mapOptions = {
                    center: currentLocation || { lat: -23.5505, lng: -46.6333 },
                    zoom: 15,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: true, streetViewControl: true, fullscreenControl: true, zoomControl: true
                };
                map = new google.maps.Map(mapElement, mapOptions);
                window.map = map;
                setupMapSearchBox();
                
                map.addListener("click", async (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    if (marker) marker.setMap(null);
                    marker = new google.maps.Marker({ position: { lat, lng }, map: map, animation: google.maps.Animation.DROP });
                    try {
                        const address = await getAddressFromCoords(lat, lng);
                        const infoWindow = new google.maps.InfoWindow({
                            content: `<div class="route-info-window"><h6>Local selecionado</h6><p><i class="fas fa-map-marker-alt"></i> ${address}</p><button class="btn btn-primary btn-sm w-100 mt-2" onclick="window.selectMapLocation('${address.replace(/'/g, "\\'")}', ${lat}, ${lng})"><i class="fas fa-check me-2"></i>Confirmar</button></div>`
                        });
                        infoWindow.open(map, marker);
                        marker.address = address;
                        marker.lat = lat;
                        marker.lng = lng;
                    } catch (error) { alert(`Erro ao buscar endereço: ${error.message}`); }
                });
                mapInitialized = true;
            } else { google.maps.event.trigger(map, "resize"); }
            
            const existingAddress = document.getElementById(fieldId).value;
            if (existingAddress && !isReadonly) {
                try {
                    const coords = await getCoordsFromAddress(existingAddress);
                    map.setCenter({ lat: coords.lat, lng: coords.lng });
                    map.setZoom(15);
                    if (marker) marker.setMap(null);
                    marker = new google.maps.Marker({ position: { lat: coords.lat, lng: coords.lng }, map: map, animation: google.maps.Animation.DROP });
                    marker.address = existingAddress;
                } catch (error) { console.warn("Endereço não encontrado no mapa:", error.message); }
            }
        }, 300);
    });
    
    document.getElementById("confirm-map-location").onclick = () => {
        if (marker && marker.address) {
            document.getElementById(currentField).value = marker.address;
            bootstrap.Modal.getInstance(modalEl).hide();
        } else { alert("Clique no mapa ou pesquise para selecionar um local"); }
    };
}

window.selectMapLocation = (address, lat, lng) => {
    document.getElementById(currentField).value = address;
    const modal = bootstrap.Modal.getInstance(document.getElementById("map-modal"));
    modal.hide();
};

function showLocationOnMap(location) {
    if (!location) return alert("Localização não disponível");
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank");
}

function calculateFuel(distance, pesoKg) {
    const consumoBase = { vazio: 3.2, carregado: 2.1 };
    const pesoEmToneladas = pesoKg / 1000;
    const capacidadeMedia = 15;
    const fatorCarga = pesoEmToneladas / capacidadeMedia;
    const consumoReal = consumoBase.vazio - fatorCarga * (consumoBase.vazio - consumoBase.carregado);
    return Math.ceil(distance / consumoReal);
}

async function loadMotoristaFretes() {
    const fretesList = document.getElementById("fretes-list");
    if (!fretesList) return;
    
    if (!window.db) {
        console.error("❌ Firestore não disponível");
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro de conexão</p></div>';
        return;
    }
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';
    
    try {
        const snapshot = await window.db.collection("fretes").where("id", "==", window.currentUser.id).limit(50).get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete ainda</p></div>';
            return;
        }
        
        let fretes = [];
        snapshot.forEach(doc => fretes.push({ id: doc.id, ...doc.data() }));
        fretes.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        
        let html = "";
        fretes.slice(0, 20).forEach(f => {
            const data = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : "Data não disponível";
            const statusBadge = f.status === "em_andamento" 
                ? '<span class="badge bg-warning text-dark ms-2">Em Andamento</span>' 
                : '<span class="badge bg-success ms-2">Finalizada</span>';
            
            const viabilidadeBadge = f.viabilidade ? 
                '<span class="badge bg-success ms-1">✓ Viável</span>' : 
                '<span class="badge bg-danger ms-1">✗ Inviável</span>';
            
            const veiculoInfo = f.veiculo_utilizado ? 
                `<div class="mt-1 small text-muted"><i class="fas fa-truck"></i> ${f.veiculo_utilizado.placa} (${f.veiculo_utilizado.tipo})</div>` : '';
            
            html += `
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista">${f.nome}${statusBadge}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${f.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> ${(f.valorTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        <div><i class="fas fa-road"></i> ${f.distancia_total || 0} km</div>
                        <div><i class="fas fa-chart-line"></i> ${(f.valor_viabilidade || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ${viabilidadeBadge}</div>
                    </div>
                    ${veiculoInfo}
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${f.origem ? f.origem.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${f.partida ? f.partida.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${f.entrega ? f.entrega.substring(0, 30) : "..."}...</p>
                    </div>
                    <div class="frete-acoes mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarViagem('${f.id}', ${JSON.stringify(f).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="excluirViagem('${f.id}', ${JSON.stringify(f).replace(/'/g, "\\'")})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        });
        fretesList.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar fretes:", error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao carregar</p></div>';
    }
}

function cleanupViagens() {
    console.log("🧹 Limpando recursos da tela de Viagens");
    stopGPS();
    
    if (autocompletePartida) {
        google.maps.event.clearInstanceListeners(autocompletePartida);
        autocompletePartida = null;
    }
    if (autocompleteEntrega) {
        google.maps.event.clearInstanceListeners(autocompleteEntrega);
        autocompleteEntrega = null;
    }
    
    if (map) {
        google.maps.event.clearInstanceListeners(map);
        map = null;
    }
    
    mapInitialized = false;
}

// Tornar funções globais para acesso via onclick
window.editarViagem = editarViagem;
window.excluirViagem = excluirViagem;
window.cleanupViagens = cleanupViagens;
window.initViagens = initViagens;
window.loadGoogleMapsWithFirebaseKey = loadGoogleMapsWithFirebaseKey;
