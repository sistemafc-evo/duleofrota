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

// Função para calcular distância e pedágio considerando o veículo
async function calcularDistanciaTotalComVeiculo(origem, partida, entrega, veiculo) {
    console.log("🚗 Calculando rota com veículo específico...");
    
    try {
        const directionsService = new google.maps.DirectionsService();
        
        // Configurar opções de viagem baseadas no veículo
        const travelMode = google.maps.TravelMode.DRIVING;
        
        // Opções adicionais para veículos grandes
        const avoidTolls = false; // Não evitar pedágios, precisamos deles
        const avoidHighways = false;
        
        // Calcular 1º trecho
        const resultTrecho1 = await new Promise((resolve, reject) => {
            directionsService.route(
                { 
                    origin: origem, 
                    destination: partida, 
                    travelMode: travelMode,
                    avoidTolls: avoidTolls,
                    avoidHighways: avoidHighways,
                    provideRouteAlternatives: false,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, 
                (result, status) => {
                    if (status === "OK") {
                        resolve(result);
                    } else {
                        reject(new Error(`Erro no 1º trecho: ${status}`));
                    }
                }
            );
        });
        
        // Calcular 2º trecho
        const resultTrecho2 = await new Promise((resolve, reject) => {
            directionsService.route(
                { 
                    origin: partida, 
                    destination: entrega, 
                    travelMode: travelMode,
                    avoidTolls: avoidTolls,
                    avoidHighways: avoidHighways,
                    provideRouteAlternatives: false,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, 
                (result, status) => {
                    if (status === "OK") {
                        resolve(result);
                    } else {
                        reject(new Error(`Erro no 2º trecho: ${status}`));
                    }
                }
            );
        });
        
        // Extrair distâncias
        const route1 = resultTrecho1.routes[0].legs[0];
        const route2 = resultTrecho2.routes[0].legs[0];
        
        const distanciaTrecho1 = (route1.distance.value / 1000).toFixed(1);
        const distanciaTrecho2 = (route2.distance.value / 1000).toFixed(1);
        const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
        
        // Calcular pedágios com base nas características do veículo
        const pedagios = await calcularPedagiosComVeiculo(resultTrecho1, resultTrecho2, veiculo);
        
        return {
            distanciaTrecho1: parseFloat(distanciaTrecho1),
            distanciaTrecho2: parseFloat(distanciaTrecho2),
            distanciaTotal: parseFloat(distanciaTotal),
            quantidadePedagios: pedagios.quantidade,
            valorTotalPedagios: pedagios.valorTotal
        };
        
    } catch (error) {
        console.error("❌ Erro ao calcular rota com veículo:", error);
        throw error;
    }
}

// Função para calcular pedágios considerando o veículo
async function calcularPedagiosComVeiculo(route1, route2, veiculo) {
    let quantidadePedagios = 0;
    let valorTotalPedagios = 0;
    
    // Tabela de tarifas base por tipo de veículo (valores aproximados em R$)
    // Estes valores podem ser ajustados conforme a realidade da empresa
    const tarifasBase = {
        "TRUCK": 8.50,
        "BITREM": 12.50,
        "CARRETA": 10.50,
        "VAN": 4.50,
        "TOCO": 6.50,
        "3_4": 5.50
    };
    
    // Fator multiplicador baseado no número de eixos
    const fatorEixos = (veiculo.caracteristica_axleCount || 2) / 2;
    
    // Fator multiplicador baseado no peso (kg)
    let fatorPeso = 1.0;
    const pesoKg = veiculo.caracteristica_weightKg || 0;
    if (pesoKg > 30000) fatorPeso = 1.5;
    else if (pesoKg > 20000) fatorPeso = 1.3;
    else if (pesoKg > 10000) fatorPeso = 1.1;
    
    // Fator baseado nas dimensões (para cargas excedentes)
    let fatorDimensoes = 1.0;
    const alturaCm = veiculo.caracteristica_heightCm || 0;
    const larguraCm = veiculo.caracteristica_widthCm || 0;
    const comprimentoCm = veiculo.caracteristica_lengthCm || 0;
    
    if (alturaCm > 450 || larguraCm > 260 || comprimentoCm > 1800) {
        fatorDimensoes = 1.8; // Carga excedente
    } else if (alturaCm > 400 || larguraCm > 250 || comprimentoCm > 1600) {
        fatorDimensoes = 1.4; // Carga especial
    }
    
    // Tarifa base por tipo
    const tipoVeiculo = veiculo.caracteristica_tipo_de_veiculo || "TRUCK";
    const tarifaBase = tarifasBase[tipoVeiculo] || 8.50;
    
    // Calcular tarifa por pedágio
    const tarifaPorPedagio = tarifaBase * fatorEixos * fatorPeso * fatorDimensoes;
    
    console.log(`📊 Cálculo de tarifa de pedágio:`);
    console.log(`   - Tipo: ${tipoVeiculo} (base R$ ${tarifaBase.toFixed(2)})`);
    console.log(`   - Eixos: ${veiculo.caracteristica_axleCount} (fator: ${fatorEixos.toFixed(2)})`);
    console.log(`   - Peso: ${pesoKg} kg (fator: ${fatorPeso.toFixed(2)})`);
    console.log(`   - Dimensões: ${alturaCm}x${larguraCm}x${comprimentoCm} cm (fator: ${fatorDimensoes.toFixed(2)})`);
    console.log(`   - Tarifa por pedágio: R$ ${tarifaPorPedagio.toFixed(2)}`);
    
    // Função para extrair pedágios de uma rota
    function extrairPedagiosDaRota(route) {
        let qtd = 0;
        
        if (route.routes && route.routes[0] && route.routes[0].legs && route.routes[0].legs[0]) {
            const steps = route.routes[0].legs[0].steps;
            for (const step of steps) {
                const instruction = step.instructions || "";
                const isToll = instruction.toLowerCase().includes("pedágio") || 
                               instruction.toLowerCase().includes("toll") ||
                               instruction.toLowerCase().includes("pedagio");
                
                if (isToll) {
                    qtd++;
                }
            }
        }
        return qtd;
    }
    
    // Extrair quantidade de pedágios
    const pedagios1 = extrairPedagiosDaRota(route1);
    const pedagios2 = extrairPedagiosDaRota(route2);
    
    quantidadePedagios = pedagios1 + pedagios2;
    valorTotalPedagios = quantidadePedagios * tarifaPorPedagio;
    
    console.log(`🛣️ Resultado:`);
    console.log(`   - 1º trecho: ${pedagios1} pedágios`);
    console.log(`   - 2º trecho: ${pedagios2} pedágios`);
    console.log(`   - Total: ${quantidadePedagios} pedágios`);
    console.log(`   - Valor total: R$ ${valorTotalPedagios.toFixed(2)}`);
    
    return {
        quantidade: quantidadePedagios,
        valorTotal: valorTotalPedagios
    };
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
    
    // Obter todos os dados necessários
    const distanciaTotal = parseFloat(document.getElementById("distancia_total").textContent) || 0;
    
    // Obter valor total dos pedágios
    const pedagioTotalElement = document.getElementById("pedagio_total_valor");
    let valorTotalPedagios = 0;
    
    if (pedagioTotalElement) {
        let pedagioTexto = pedagioTotalElement.textContent || pedagioTotalElement.innerText || "";
        console.log(`   - Pedágio bruto: "${pedagioTexto}"`);
        
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
        
        console.log(`   - Pedágio convertido: R$ ${valorTotalPedagios.toFixed(2)}`);
    }
    
    // Obter valor do frete corretamente
    const valorFreteElement = document.getElementById("valorTotal");
    let valorTotalFrete = 0;
    
    if (valorFreteElement) {
        let valorFreteTexto = valorFreteElement.textContent || valorFreteElement.innerText || "";
        console.log(`   - Valor frete bruto: "${valorFreteTexto}"`);
        
        let numeros = valorFreteTexto.match(/[\d,\.]+/g);
        if (numeros) {
            let valorNumerico = numeros.join('');
            valorNumerico = valorNumerico.replace(/\./g, '').replace(',', '.');
            valorTotalFrete = parseFloat(valorNumerico);
        }
        
        if (isNaN(valorTotalFrete)) {
            valorTotalFrete = 0;
        }
        
        console.log(`   - Valor frete convertido: R$ ${valorTotalFrete.toFixed(2)}`);
    }
    
    // Obter peso e valor por tonelada
    const peso = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    
    // Verificar endereços
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    // Usar a variável GLOBAL cfValorPorKm
    console.log(`   - CF global: ${cfValorPorKm} R$/km`);
    
    // Verificar todos os dados
    const temDistancia = distanciaTotal > 0;
    const temCF = cfValorPorKm > 0;
    const temValorFrete = valorTotalFrete > 0 && !isNaN(valorTotalFrete);
    const temPeso = peso > 0;
    const temValorPorTonelada = valorPorTonelada > 0;
    const temEnderecos = origem && partida && entrega;
    const temPedagio = true; // Pedágio pode ser zero, então sempre presente
    
    console.log(`   - Endereços: ${temEnderecos ? '✓' : '✗'}`);
    console.log(`   - Distância: ${distanciaTotal} km ${temDistancia ? '✓' : '✗'}`);
    console.log(`   - CF: ${cfValorPorKm} R$/km ${temCF ? '✓' : '✗'}`);
    console.log(`   - Pedágios: R$ ${valorTotalPedagios.toFixed(2)}`);
    console.log(`   - Peso: ${peso} t ${temPeso ? '✓' : '✗'}`);
    console.log(`   - Valor/t: R$ ${valorPorTonelada} ${temValorPorTonelada ? '✓' : '✗'}`);
    console.log(`   - Valor frete: R$ ${valorTotalFrete.toFixed(2)} ${temValorFrete ? '✓' : '✗'}`);
    
    const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
    const statusViabilidadeSpan = document.getElementById("status_viabilidade");
    
    // Verificar se TODOS os dados estão presentes
    const todosDadosPresentes = temDistancia && temCF && temValorFrete && temPeso && temValorPorTonelada && temEnderecos;
    
    if (todosDadosPresentes) {
        // Calcular custo da viagem (distância × CF)
        const custoOperacional = distanciaTotal * cfValorPorKm;
        
        // Custo TOTAL = Custo Operacional + Pedágios
        const custoTotalViagem = custoOperacional + valorTotalPedagios;
        
        console.log(`   📊 CÁLCULO:`);
        console.log(`      - Custo operacional: ${distanciaTotal} km × ${cfValorPorKm} R$/km = R$ ${custoOperacional.toFixed(2)}`);
        console.log(`      - Pedágios: R$ ${valorTotalPedagios.toFixed(2)}`);
        console.log(`      - Custo TOTAL da viagem: R$ ${custoTotalViagem.toFixed(2)}`);
        console.log(`      - Valor do frete: R$ ${valorTotalFrete.toFixed(2)}`);
        console.log(`      - Comparação: R$ ${custoTotalViagem.toFixed(2)} ${custoTotalViagem <= valorTotalFrete ? '≤' : '>'} R$ ${valorTotalFrete.toFixed(2)}`);
        
        // Atualizar valor da viabilidade com o CUSTO TOTAL
        valorViabilidadeSpan.textContent = custoTotalViagem.toLocaleString("pt-BR", { 
            style: "currency", 
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Verificar viabilidade baseado no CUSTO TOTAL
        if (custoTotalViagem <= valorTotalFrete) {
            statusViabilidadeSpan.innerHTML = '<span class="badge bg-success ms-2">✓ Viável</span>';
            console.log(`   🟢 RESULTADO: VIÁVEL - Custo Total (R$ ${custoTotalViagem.toFixed(2)}) ≤ Frete (R$ ${valorTotalFrete.toFixed(2)})`);
        } else {
            statusViabilidadeSpan.innerHTML = '<span class="badge bg-danger ms-2">✗ Inviável</span>';
            console.log(`   🔴 RESULTADO: INVIÁVEL - Custo Total (R$ ${custoTotalViagem.toFixed(2)}) > Frete (R$ ${valorTotalFrete.toFixed(2)})`);
        }
        
        return custoTotalViagem;
    } else {
        // Se faltar algum dado
        valorViabilidadeSpan.textContent = "---";
        
        // Mensagem específica
        if (!temEnderecos) {
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
        console.warn("⚠️ Nenhum veículo selecionado, usando cálculo padrão");
        return await calcularDistanciaTotalPadrao(origem, partida, entrega);
    }
    
    // Usar a função com veículo
    return await calcularDistanciaTotalComVeiculo(origem, partida, entrega, veiculoSelecionado);
}

// Função de cálculo padrão (fallback)
async function calcularDistanciaTotalPadrao(origem, partida, entrega) {
    console.log("🚗 Calculando rota padrão (sem veículo específico)...");
    
    try {
        const directionsService = new google.maps.DirectionsService();
        
        // Calcular 1º trecho (Onde Estou → Carregar)
        const resultTrecho1 = await new Promise((resolve, reject) => {
            directionsService.route(
                { 
                    origin: origem, 
                    destination: partida, 
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: false,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, 
                (result, status) => {
                    if (status === "OK") {
                        resolve(result);
                    } else {
                        reject(new Error(`Erro no 1º trecho: ${status}`));
                    }
                }
            );
        });
        
        // Calcular 2º trecho (Carregar → Descarregar)
        const resultTrecho2 = await new Promise((resolve, reject) => {
            directionsService.route(
                { 
                    origin: partida, 
                    destination: entrega, 
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: false,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, 
                (result, status) => {
                    if (status === "OK") {
                        resolve(result);
                    } else {
                        reject(new Error(`Erro no 2º trecho: ${status}`));
                    }
                }
            );
        });
        
        // Extrair distâncias em km
        const route1 = resultTrecho1.routes[0].legs[0];
        const route2 = resultTrecho2.routes[0].legs[0];
        
        const distanciaTrecho1 = (route1.distance.value / 1000).toFixed(1);
        const distanciaTrecho2 = (route2.distance.value / 1000).toFixed(1);
        const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
        
        // Extrair informações de pedágio (estimativa padrão)
        let quantidadePedagios = 0;
        let valorTotalPedagios = 0;
        
        // Função para extrair pedágios de uma rota
        function extrairPedagiosDaRota(route) {
            let qtd = 0;
            
            if (route.routes && route.routes[0] && route.routes[0].legs && route.routes[0].legs[0]) {
                const steps = route.routes[0].legs[0].steps;
                for (const step of steps) {
                    const instruction = step.instructions || "";
                    const isToll = instruction.toLowerCase().includes("pedágio") || 
                                   instruction.toLowerCase().includes("toll") ||
                                   instruction.toLowerCase().includes("pedagio");
                    
                    if (isToll) {
                        qtd++;
                    }
                }
            }
            return qtd;
        }
        
        // Extrair pedágios de ambos os trechos
        const pedagios1 = extrairPedagiosDaRota(resultTrecho1);
        const pedagios2 = extrairPedagiosDaRota(resultTrecho2);
        
        quantidadePedagios = pedagios1 + pedagios2;
        // Valor padrão por pedágio (R$ 8,00)
        valorTotalPedagios = quantidadePedagios * 8.00;
        
        console.log(`📊 1º trecho: ${distanciaTrecho1} km - Pedágios: ${pedagios1}`);
        console.log(`📊 2º trecho: ${distanciaTrecho2} km - Pedágios: ${pedagios2}`);
        console.log(`📊 Distância total: ${distanciaTotal} km`);
        console.log(`🛣️ Total de pedágios: ${quantidadePedagios} - Valor estimado: R$ ${valorTotalPedagios.toFixed(2)}`);
        
        return {
            distanciaTrecho1: parseFloat(distanciaTrecho1),
            distanciaTrecho2: parseFloat(distanciaTrecho2),
            distanciaTotal: parseFloat(distanciaTotal),
            quantidadePedagios: quantidadePedagios,
            valorTotalPedagios: valorTotalPedagios
        };
        
    } catch (error) {
        console.error("❌ Erro ao calcular distância:", error);
        throw error;
    }
}

// Função para verificar se todos os campos de endereço estão preenchidos e calcular
async function verificarCamposEndereco() {
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    // Se todos os 3 campos estiverem preenchidos
    if (origem && partida && entrega) {
        console.log("✅ Todos os endereços preenchidos, calculando distância via Google Maps...");
        
        // Mostrar status de carregamento
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
            // Calcular distância usando a API
            const distancias = await calcularDistanciaTotal(origem, partida, entrega);
            
            // Armazenar globalmente para uso no submit
            window.distanciasCalculadas = distancias;
            
            // Atualizar distância total na tela
            const distanciaTotalSpan = document.getElementById("distancia_total");
            if (distanciaTotalSpan) {
                distanciaTotalSpan.textContent = distancias.distanciaTotal;
            }
            
            // Atualizar pedágio total na tela
            const pedagioTotalSpan = document.getElementById("pedagio_total_valor");
            if (pedagioTotalSpan) {
                pedagioTotalSpan.textContent = distancias.valorTotalPedagios.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            // Atualizar quantidade de pedágios
            const quantidadePedagiosSpan = document.getElementById("quantidade_pedagios");
            if (quantidadePedagiosSpan) {
                quantidadePedagiosSpan.textContent = distancias.quantidadePedagios;
            }
            
            // RECALCULAR e atualizar combustível estimado usando o consumo médio do motorista
            console.log(`🔄 Recalculando combustível estimado com distância: ${distancias.distanciaTotal} km e consumo: ${consumoMedioAtualKmPorL} km/L`);
            const combustivelEstimado = calcularCombustivelEstimado(distancias.distanciaTotal);
            
            // Verificar se os valores de frete estão preenchidos
            const peso = parseFloat(document.getElementById("peso").value) || 0;
            const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
            const valoresPreenchidos = peso > 0 && valorPorTonelada > 0;
            
            // Verificar se o CF está configurado
            const cfConfigurado = cfValorPorKm > 0;
            
            // Se todos os dados necessários estiverem prontos, calcular viabilidade
            if (valoresPreenchidos && cfConfigurado) {
                console.log("✅ Valores de frete e CF prontos, calculando viabilidade com pedágios...");
                calcularViabilidade(); // Esta função agora inclui os pedágios no cálculo
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
            
            console.log(`✅ Distâncias, pedágios e combustíveis atualizados! Estimado: ${combustivelEstimado.toFixed(1)} L (baseado em ${consumoMedioAtualKmPorL} km/L)`);
            console.log(`🛣️ Pedágios: ${distancias.quantidadePedagios} - Total: R$ ${distancias.valorTotalPedagios.toFixed(2)}`);
            
        } catch (error) {
            console.error("❌ Erro ao calcular distâncias:", error);
            const distanciaSpan = document.getElementById("distancia_total");
            const pedagioSpan = document.getElementById("pedagio_total_valor");
            const combustivelEstimadoSpan = document.getElementById("combustivel_estimado_valor");
            const valorViabilidadeSpan = document.getElementById("valor_viabilidade");
            const statusViabilidadeSpan = document.getElementById("status_viabilidade");
            
            if (distanciaSpan) distanciaSpan.textContent = "Erro";
            if (pedagioSpan) pedagioSpan.textContent = "Erro";
            if (combustivelEstimadoSpan) combustivelEstimadoSpan.textContent = "Erro";
            if (valorViabilidadeSpan) valorViabilidadeSpan.textContent = "---";
            if (statusViabilidadeSpan) statusViabilidadeSpan.innerHTML = '<span class="text-danger ms-2">❌ Erro ao calcular rota</span>';
            
            window.distanciasCalculadas = null;
            alert("Erro ao calcular a rota. Verifique os endereços e tente novamente.");
        }
    } else {
        // Se algum endereço estiver faltando, mostrar mensagem
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
