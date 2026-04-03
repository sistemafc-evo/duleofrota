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

// Variáveis para caminhão e pedágio
let loginDocIdAtual = null;
let placaSelecionada = null;
let eixosCaminhao = 0;
let valorPedagioOriginal = 0;
let pedagioFoiAlterado = false;

// Debug para cliques
document.addEventListener('click', function(e) {
    if (e.target.id === 'confirm-pending-point') {
        console.log("🔍 Clique detectado no botão Confirmar via delegate");
    }
    if (e.target.id === 'cancel-pending-point') {
        console.log("🔍 Clique detectado no botão Cancelar via delegate");
    }
});

// Função para carregar dados do caminhão (adaptada para perfis)
async function loadDadosCaminhao() {
    console.log("🚛 Carregando dados do caminhão...");
    try {
        if (!window.db || !window.currentUser) return;
        
        const userLogin = window.currentUser.login;
        const userPerfil = window.currentUser.perfil;
        
        // Verificar se é perfil de gestão
        const isGestao = userPerfil === "admin" || userPerfil === "gerente" || userPerfil === "supervisor";
        
        if (isGestao) {
            console.log(`👔 Perfil de gestão: ${userPerfil} - Carregando todos os caminhões`);
            await loadCaminhoesGestao();
        } else {
            console.log(`🚛 Perfil motorista: ${userPerfil} - Carregando caminhões vinculados`);
            await loadCaminhoesMotorista();
        }
        
    } catch (error) {
        console.error("❌ Erro ao carregar dados do caminhão:", error);
    }
}

// Função para carregar caminhões de motorista (funcionarios_logins)
async function loadCaminhoesMotorista() {
    const userLogin = window.currentUser.login;
    
    // Buscar o id do documento de login do usuário atual
    let loginDocId = null;
    
    const funcionariosDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
    if (funcionariosDoc.exists) {
        const funcionariosLogins = funcionariosDoc.data();
        for (const [docId, userData] of Object.entries(funcionariosLogins)) {
            if (userData.login === userLogin) {
                loginDocId = docId;
                loginDocIdAtual = docId;
                console.log(`✅ Funcionário encontrado - Document ID: ${loginDocId}`);
                break;
            }
        }
    }
    
    if (!loginDocId) {
        console.warn(`⚠️ Não foi possível encontrar o documento de login para: ${userLogin}`);
        return;
    }
    
    const loginDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
    if (loginDoc.exists) {
        const data = loginDoc.data();
        const userData = data[loginDocId];
        
        if (userData && userData.placas_caminhoes_vinculados) {
            const placasVinculadas = userData.placas_caminhoes_vinculados;
            
            // Obter placa selecionada
            placaSelecionada = placasVinculadas.placa_selecionada || null;
            
            const placaSelect = document.getElementById("placa_select");
            
            if (placaSelect) {
                placaSelect.innerHTML = '';
                
                let primeiraPlaca = null;
                for (const [placa, dados] of Object.entries(placasVinculadas)) {
                    if (placa !== "placa_selecionada" && dados.caracteristica_axleCount) {
                        const option = document.createElement("option");
                        option.value = placa;
                        option.textContent = `${placa} (${dados.caracteristica_axleCount} eixos)`;
                        if (placa === placaSelecionada) {
                            option.selected = true;
                            primeiraPlaca = placa;
                        }
                        placaSelect.appendChild(option);
                    }
                }
                
                if (!placaSelecionada && placaSelect.options.length > 0) {
                    placaSelect.selectedIndex = 0;
                    primeiraPlaca = placaSelect.options[0].value;
                }
                
                if (primeiraPlaca && placasVinculadas[primeiraPlaca]) {
                    placaSelecionada = primeiraPlaca;
                    eixosCaminhao = placasVinculadas[primeiraPlaca].caracteristica_axleCount || 0;
                    placaSelect.value = placaSelecionada;
                    
                    console.log(`✅ Caminhão motorista carregado: Placa ${placaSelecionada}, Eixos: ${eixosCaminhao}`);
                }
                
                placaSelect.removeEventListener("change", onPlacaChange);
                placaSelect.addEventListener("change", onPlacaChange);
            }
            
            const eixosSpan = document.getElementById("eixos_caminhao");
            if (eixosSpan) {
                eixosSpan.textContent = eixosCaminhao;
            }
        }
    }
}

// Função para carregar caminhões para perfis de gestão (coleção caminhoes)
async function loadCaminhoesGestao() {
    try {
        // Buscar todos os caminhões ativos na coleção "caminhoes"
        const snapshot = await window.db.collection("caminhoes")
            .where("status_ativo", "==", true)
            .get();
        
        const placaSelect = document.getElementById("placa_select");
        
        if (placaSelect) {
            placaSelect.innerHTML = '';
            
            let caminhoes = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                caminhoes.push({
                    placa: doc.id,
                    eixos: data.caracteristica_axleCount || 0,
                    capacidade: data.capacidade_toneladas || 0,
                    tipo: data.caracteristica_tipo_de_veiculo || "N/A",
                    marca: data.marca || "N/A",
                    modelo: data.modelo || "N/A"
                });
            });
            
            // Ordenar por placa
            caminhoes.sort((a, b) => a.placa.localeCompare(b.placa));
            
            if (caminhoes.length === 0) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "Nenhum caminhão cadastrado";
                option.disabled = true;
                placaSelect.appendChild(option);
                console.warn("⚠️ Nenhum caminhão encontrado na coleção");
                return;
            }
            
            // Adicionar opção padrão
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Selecionar";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            placaSelect.appendChild(defaultOption);
            
            // Adicionar cada caminhão como opção
            caminhoes.forEach(caminhao => {
                const option = document.createElement("option");
                option.value = caminhao.placa;
                option.textContent = `${caminhao.placa} - ${caminhao.marca} ${caminhao.modelo} (${caminhao.eixos} eixos, ${caminhao.capacidade}t)`;
                option.dataset.eixos = caminhao.eixos;
                option.dataset.capacidade = caminhao.capacidade;
                option.dataset.tipo = caminhao.tipo;
                placaSelect.appendChild(option);
            });
            
            // Não há placa selecionada previamente para gestão
            placaSelecionada = null;
            eixosCaminhao = 0;
            
            // Evento de change para gestão
            placaSelect.removeEventListener("change", onPlacaChangeGestao);
            placaSelect.addEventListener("change", onPlacaChangeGestao);
            
            console.log(`✅ Carregados ${caminhoes.length} caminhões para perfil de gestão`);
        }
        
        const eixosSpan = document.getElementById("eixos_caminhao");
        if (eixosSpan) {
            eixosSpan.textContent = "0";
        }
        
    } catch (error) {
        console.error("❌ Erro ao carregar caminhões para gestão:", error);
    }
}

// Função para quando a placa é alterada (para gestão)
async function onPlacaChangeGestao(event) {
    const placaSelecionadaOption = event.target.value;
    const selectedOption = event.target.options[event.target.selectedIndex];
    
    if (placaSelecionadaOption) {
        placaSelecionada = placaSelecionadaOption;
        eixosCaminhao = parseInt(selectedOption.dataset.eixos) || 0;
        
        console.log(`✅ Caminhão selecionado (gestão): Placa ${placaSelecionada}, Eixos: ${eixosCaminhao}`);
        
        // Atualizar eixos na tela
        const eixosSpan = document.getElementById("eixos_caminhao");
        if (eixosSpan) {
            eixosSpan.textContent = eixosCaminhao;
        }
        
        // Opcional: atualizar capacidade máxima sugerida
        const capacidade = parseInt(selectedOption.dataset.capacidade) || 0;
        const pesoInput = document.getElementById("peso");
        if (pesoInput && capacidade > 0) {
            pesoInput.placeholder = `Máx: ${capacidade}t`;
            pesoInput.max = capacidade;
        }
        
        // Recalcular pedágio se houver rota calculada
        if (window.distanciasCalculadas && window.distanciasCalculadas.quantidadePedagios > 0) {
            recalcularPedagio();
        }
    } else {
        placaSelecionada = null;
        eixosCaminhao = 0;
        
        const eixosSpan = document.getElementById("eixos_caminhao");
        if (eixosSpan) {
            eixosSpan.textContent = "0";
        }
    }
}



// Função para atualizar a placa selecionada no banco (apenas para motoristas)
async function atualizarPlacaSelecionada(novaPlaca) {
    const userPerfil = window.currentUser.perfil;
    const isGestao = userPerfil === "admin" || userPerfil === "gerente" || userPerfil === "supervisor";
    
    // Para perfis de gestão, não salvar no banco
    if (isGestao) {
        console.log("👔 Perfil de gestão - placa não será salva no banco");
        return;
    }
    
    if (!loginDocIdAtual || !novaPlaca) return;
    
    try {
        // Buscar dados atuais
        const loginDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
        if (loginDoc.exists) {
            const data = loginDoc.data();
            const userData = data[loginDocIdAtual];
            
            if (userData && userData.placas_caminhoes_vinculados && userData.placas_caminhoes_vinculados[novaPlaca]) {
                const novoEixos = userData.placas_caminhoes_vinculados[novaPlaca].caracteristica_axleCount || 0;
                
                // Atualizar no banco
                const updateData = {};
                updateData[`${loginDocIdAtual}.placas_caminhoes_vinculados.placa_selecionada`] = novaPlaca;
                
                await window.db.collection("logins").doc("funcionarios_logins").update(updateData);
                
                // Atualizar variáveis locais
                placaSelecionada = novaPlaca;
                eixosCaminhao = novoEixos;
                
                console.log(`✅ Placa alterada para: ${novaPlaca} (${eixosCaminhao} eixos) - Salva no banco`);
                
                // Recalcular pedágio se houver rota calculada
                if (window.distanciasCalculadas && window.distanciasCalculadas.quantidadePedagios > 0) {
                    recalcularPedagio();
                }
            }
        }
    } catch (error) {
        console.error("❌ Erro ao atualizar placa:", error);
    }
}

// Função para recalcular o pedágio com base nos eixos
function recalcularPedagio() {
    if (!window.distanciasCalculadas || eixosCaminhao === 0) return;
    
    // Valor base do pedágio por eixo (R$ 8,00 por eixo)
    const valorPorEixo = 8.00;
    const quantidadePedagios = window.distanciasCalculadas.quantidadePedagios;
    const novoValorPedagio = quantidadePedagios * eixosCaminhao * valorPorEixo;
    
    // Salvar valor original se ainda não foi salvo
    if (valorPedagioOriginal === 0) {
        valorPedagioOriginal = window.distanciasCalculadas.valorTotalPedagios;
    }
    
    // Atualizar valor na tela
    const pedagioTotalSpan = document.getElementById("pedagio_total_valor");
    if (pedagioTotalSpan) {
        pedagioTotalSpan.textContent = novoValorPedagio.toLocaleString("pt-BR", { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
    
    // Atualizar no objeto global
    window.distanciasCalculadas.valorTotalPedagios = novoValorPedagio;
    
    console.log(`🛣️ Pedágio recalculado: ${quantidadePedagios} pedágios × ${eixosCaminhao} eixos × R$ ${valorPorEixo} = R$ ${novoValorPedagio.toFixed(2)}`);
    
    // Recalcular viabilidade
    calcularViabilidade();
}

// Função para editar manualmente o valor do pedágio
function editarPedagioManualmente() {
    const valorAtual = document.getElementById("pedagio_total_valor").textContent;
    const valorNumerico = parseFloat(valorAtual.replace(/\./g, '').replace(',', '.').replace('R$', '').trim());
    
    const novoValor = prompt("Digite o valor total do pedágio (R$):", valorNumerico.toFixed(2));
    if (novoValor !== null) {
        const novoValorNumerico = parseFloat(novoValor.replace(',', '.'));
        if (!isNaN(novoValorNumerico)) {
            // Atualizar valor na tela
            const pedagioTotalSpan = document.getElementById("pedagio_total_valor");
            if (pedagioTotalSpan) {
                pedagioTotalSpan.textContent = novoValorNumerico.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            // Marcar que foi alterado e salvar valor original se necessário
            pedagioFoiAlterado = true;
            if (valorPedagioOriginal === 0) {
                valorPedagioOriginal = window.distanciasCalculadas?.valorTotalPedagios || 0;
            }
            
            // Atualizar no objeto global
            if (window.distanciasCalculadas) {
                window.distanciasCalculadas.valorTotalPedagios = novoValorNumerico;
                window.distanciasCalculadas.pedagio_alterado = true;
                window.distanciasCalculadas.pedagio_valor_sugerido = valorPedagioOriginal;
            }
            
            // Adicionar indicação de alteração
            const pedagioContainer = document.querySelector(".trecho-valor-item:has(#pedagio_total_valor)");
            if (pedagioContainer) {
                let indicator = pedagioContainer.querySelector(".pedagio-alterado-indicator");
                if (!indicator) {
                    indicator = document.createElement("div");
                    indicator.className = "pedagio-alterado-indicator";
                    indicator.style.cssText = "position: absolute; right: 6px; bottom: 4px; font-size: 0.5rem; color: #ff9800;";
                    indicator.innerHTML = '<i class="fas fa-edit me-1"></i>Valor alterado manualmente';
                    pedagioContainer.appendChild(indicator);
                }
            }
            
            console.log(`✏️ Pedágio alterado manualmente para: R$ ${novoValorNumerico.toFixed(2)} (original: R$ ${valorPedagioOriginal.toFixed(2)})`);
            
            // Recalcular viabilidade
            calcularViabilidade();
        }
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
    console.log("🧹 Iniciando limpeza do formulário...");
    
    const elementos = {
        inputs: ["partida", "entrega", "peso", "valorPorTonelada"],
        texts: ["distancia_total", "pedagio_total_valor", "quantidade_pedagios", 
                "combustivel_estimado_valor", "valor_liquido", "status_viabilidade", 
                "valorTotal", "viabilidade_valor", "viabilidade_status"]
    };
    
    elementos.inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            console.log(`✅ Campo ${id} limpo`);
        } else {
            console.warn(`⚠️ Campo ${id} não encontrado`);
        }
    });
    
    elementos.texts.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = id === "valor_liquido" || id === "valorTotal" || id === "viabilidade_valor" 
                ? "R$ 0,00" 
                : id === "combustivel_estimado_valor" 
                    ? "0,0" 
                    : id === "pedagio_total_valor" 
                        ? "0,00" 
                        : "0";
            console.log(`✅ Texto ${id} limpo`);
        } else {
            console.warn(`⚠️ Texto ${id} não encontrado`);
        }
    });
    
    console.log("✅ Limpeza do formulário concluída");
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

// Função para carregar custos do Firebase (CORRIGIDA)
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
            
            // Carregar valor do custo fixo por km (cf_valor_por_km)
            if (data.cf_valor_por_km !== undefined) {
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
            }

            // Carregar valor do diesel por litro (cf_valor_por_litro_diesel)
            // Nota: A variável valorLitroPorKm não é mais usada para o cálculo do combustível.
            // Mantemos apenas para compatibilidade, mas o cálculo agora usa cf_valor_por_litro_diesel.
            if (data.cf_valor_por_litro_diesel !== undefined) {
                let valorStr = data.cf_valor_por_litro_diesel;
                if (typeof valorStr === 'string') {
                    valorStr = valorStr.replace(',', '.');
                }
                valorLitroPorKm = parseFloat(valorStr);
                console.log("✅ Valor do Diesel por litro carregado: R$", valorLitroPorKm.toFixed(2));
            } else {
                console.warn("⚠️ cf_valor_por_litro_diesel não encontrado");
            }
            
        } else {
            console.warn("⚠️ Documento custos_abastecimento não encontrado");
        }
    } catch (error) {
        console.error("❌ Erro ao carregar custos:", error);
    }
}

// Função para calcular e atualizar a viabilidade (CORRIGIDA)
async function calcularViabilidade() {
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
    
    // Obter dados do Firestore usando os NOMES CORRETOS
    let percentualComissao = 0;
    let valorLDiesel = 0;
    if (window.db) {
        try {
            const docRef = window.db.collection("custos").doc("custos_abastecimento");
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                // CORREÇÃO AQUI: Usando cf_percentual_comissao
                percentualComissao = docSnap.data().cf_percentual_comissao || 0;
                // CORREÇÃO AQUI: Usando cf_valor_por_litro_diesel
                valorLDiesel = docSnap.data().cf_valor_por_litro_diesel || 0;
                console.log(`   - Percentual de Comissão (cf_percentual_comissao): ${percentualComissao}%`);
                console.log(`   - Valor do Diesel (cf_valor_por_litro_diesel): R$ ${valorLDiesel.toFixed(2)}`);
            }
        } catch (error) {
            console.error("Erro ao carregar dados de custos:", error);
        }
    }
    
    // Obter peso e valor por tonelada
    const peso = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    
    // Verificar endereços
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    
    // Usar a variável GLOBAL cfValorPorKm
    console.log(`   - CF global (cf_valor_por_km): ${cfValorPorKm} R$/km`);
    
    // Calcular combustível médio em litros (distância / consumo médio em km/L)
    const combustivelMedioLitros = distanciaTotal / consumoMedioAtualKmPorL;
    
    // Verificar todos os dados
    const temDistancia = distanciaTotal > 0;
    const temCF = cfValorPorKm > 0;
    const temValorFrete = valorTotalFrete > 0 && !isNaN(valorTotalFrete);
    const temPeso = peso > 0;
    const temValorPorTonelada = valorPorTonelada > 0;
    const temEnderecos = origem && partida && entrega;
    
    console.log(`   - Endereços: ${temEnderecos ? '✓' : '✗'}`);
    console.log(`   - Distância: ${distanciaTotal} km ${temDistancia ? '✓' : '✗'}`);
    console.log(`   - CF: ${cfValorPorKm} R$/km ${temCF ? '✓' : '✗'}`);
    console.log(`   - Pedágios: R$ ${valorTotalPedagios.toFixed(2)}`);
    console.log(`   - Peso: ${peso} t ${temPeso ? '✓' : '✗'}`);
    console.log(`   - Valor/t: R$ ${valorPorTonelada} ${temValorPorTonelada ? '✓' : '✗'}`);
    console.log(`   - Valor frete: R$ ${valorTotalFrete.toFixed(2)} ${temValorFrete ? '✓' : '✗'}`);
    console.log(`   - Percentual Comissão: ${percentualComissao}%`);
    console.log(`   - Eixos caminhão: ${eixosCaminhao}`);
    console.log(`   - Combustível médio (litros): ${combustivelMedioLitros.toFixed(2)} L`);
    console.log(`   - Valor do Diesel: R$ ${valorLDiesel.toFixed(2)} / L`);
    
    const valorLiquidoSpan = document.getElementById("valor_liquido");
    const viabilidadeValorSpan = document.getElementById("viabilidade_valor");
    const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
    
    // Verificar se TODOS os dados estão presentes
    const todosDadosPresentes = temDistancia && temCF && temValorFrete && temPeso && temValorPorTonelada && temEnderecos && valorLDiesel > 0;
    
    if (todosDadosPresentes) {
        // CÁLCULO DA VIABILIDADE (R$):
        // Viabilidade = ((Percentual de Comissão/100) x VALOR TOTAL DO FRETE) + PEDÁGIO TOTAL + (Coeficiente Custo Fixo x DISTÂNCIA TOTAL) + (COMBUSTÍVEL MÉDIO x Valor do Litro do Diesel)
        
        // 1. Calcular comissão
        const comissao = (percentualComissao / 100) * valorTotalFrete;
        
        // 2. Calcular custo fixo
        const custoFixo = cfValorPorKm * distanciaTotal;
        
        // 3. Calcular custo do combustível (combustível médio em litros * valor do litro do diesel)
        const custoCombustivel = combustivelMedioLitros * valorLDiesel;
        
        // 4. Somar todos os custos para obter a Viabilidade
        const valorViabilidade = comissao + valorTotalPedagios + custoFixo + custoCombustivel;
        
        // 5. Calcular Valor Líquido (Frete - Viabilidade)
        const valorLiquido = valorTotalFrete - valorViabilidade;
        
        console.log(`   📊 CÁLCULO DETALHADO DA VIABILIDADE:`);
        console.log(`      - Comissão (${percentualComissao}% de R$ ${valorTotalFrete.toFixed(2)}): R$ ${comissao.toFixed(2)}`);
        console.log(`      - Pedágios: R$ ${valorTotalPedagios.toFixed(2)}`);
        console.log(`      - Custo Fixo (${cfValorPorKm} × ${distanciaTotal} km): R$ ${custoFixo.toFixed(2)}`);
        console.log(`      - Combustível (${combustivelMedioLitros.toFixed(1)} L × R$ ${valorLDiesel}/L): R$ ${custoCombustivel.toFixed(2)}`);
        console.log(`      =========================================`);
        console.log(`      - VIABILIDADE (Total de Custos): R$ ${valorViabilidade.toFixed(2)}`);
        console.log(`      - VALOR LÍQUIDO (Frete - Viabilidade): R$ ${valorLiquido.toFixed(2)}`);
        
        // Atualizar VALOR LÍQUIDO no local principal
        if (valorLiquidoSpan) {
            valorLiquidoSpan.textContent = valorLiquido.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Atualizar VALOR DE VIABILIDADE no rodapé
        if (viabilidadeValorSpan) {
            viabilidadeValorSpan.textContent = valorViabilidade.toLocaleString("pt-BR", { 
                style: "currency", 
                currency: "BRL",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Verificar viabilidade baseado no VALOR DE VIABILIDADE vs VALOR DO FRETE
        if (valorViabilidade <= valorTotalFrete) {
            if (viabilidadeStatusSpan) {
                viabilidadeStatusSpan.innerHTML = '<span class="badge bg-success">✓ Viável</span>';
            }
            console.log(`   🟢 RESULTADO: VIÁVEL - Viabilidade (R$ ${valorViabilidade.toFixed(2)}) ≤ Frete (R$ ${valorTotalFrete.toFixed(2)})`);
        } else {
            if (viabilidadeStatusSpan) {
                viabilidadeStatusSpan.innerHTML = '<span class="badge bg-danger">✗ Inviável</span>';
            }
            console.log(`   🔴 RESULTADO: INVIÁVEL - Viabilidade (R$ ${valorViabilidade.toFixed(2)}) > Frete (R$ ${valorTotalFrete.toFixed(2)})`);
        }
        
        return valorLiquido;
    } else {
        // Se faltar algum dado
        if (valorLiquidoSpan) valorLiquidoSpan.textContent = "---";
        
        // Mensagem específica
        if (!temEnderecos) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os endereços</span>';
        } else if (!temDistancia) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Aguardando cálculo da rota</span>';
        } else if (!temCF) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ CF (Custo Fixo) não configurado</span>';
        } else if (!temPeso || !temValorPorTonelada) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha toneladas e valor/t</span>';
        } else if (!temValorFrete) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Aguardando cálculo do frete</span>';
        } else if (valorLDiesel === 0) {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Valor do diesel não configurado</span>';
        } else {
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os dados</span>';
        }
        
        // Limpar o valor de viabilidade se os dados estiverem incompletos
        if (viabilidadeValorSpan) viabilidadeValorSpan.textContent = "R$ 0,00";
        
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

// Template HTML da tela de viagens - Seção do GPS e Placa
const viagensTemplate = `
<!-- GPS Status, Seletor de Placa e Botão Atualizar GPS -->
<div class="row g-2 mb-3">
    <div class="col-5">
        <div class="alert alert-success d-flex align-items-center small py-0 mb-0" id="gps-status" style="height: 42px;">
            <i class="fas fa-satellite-dish me-2"></i><span>Aguardando GPS...</span>
        </div>
    </div>
    <div class="col-4">
        <div class="placa-selector" style="background: #f8f9fa; border-radius: 6px; height: 42px; display: flex; flex-direction: column; justify-content: center; padding: 0 8px;">
            <div style="font-size: 0.55rem; color: #6c757d; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                <i class="fas fa-truck" style="font-size: 0.7rem;"></i>
                <span>PLACA</span>
            </div>
            <div>
                <select id="placa_select" class="form-select form-select-sm" style="width: 100%; font-size: 0.75rem; font-weight: bold; padding: 2px 4px; border-radius: 4px; background-color: #fff; cursor: pointer;">
                    <option value="">Selecionar</option>
                </select>
            </div>
        </div>
    </div>
    <div class="col-3">
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
                    
                    <!-- Pedágio Total - Direita (com opção de edição manual) -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #f8f9fa; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative; cursor: pointer;" onclick="editarPedagioManualmente()">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-toll"></i> PEDÁGIO TOTAL <i class="fas fa-edit ms-1" style="font-size: 0.5rem; opacity: 0.6;"></i></div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="pedagio_total_valor">0,00</span> 
                                <span style="font-size: 0.65rem;">R$</span>
                            </div>
                            <!-- Informativo da quantidade de pedágios e eixos -->
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-road-barrier me-1"></i>
                                <span><strong id="quantidade_pedagios">0</strong> pedágios</span>
                                <span class="ms-2"><i class="fas fa-truck me-1"></i><strong id="eixos_caminhao">0</strong> eixos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Linha 2: Combustível Estimado e VALOR LÍQUIDO -->
            <div class="bg-light rounded-3 p-2 mb-2">
                <div class="row g-2">
                    <!-- Combustível Estimado - Esquerda -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #e8f5e9; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative; border-left: 2px solid #2e7d32;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-gas-pump"></i> COMBUSTÍVEL MÉDIO</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="combustivel_estimado_valor">0,0</span> 
                                <span style="font-size: 0.65rem;">L</span>
                            </div>
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-chart-line me-1"></i>
                                <span><strong id="consumo_medio"></strong> km/L</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- VALOR LÍQUIDO - Direita -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #fff3e0; text-align: center; min-height: 70px; display: flex; flex-direction: column; justify-content: center; position: relative; border-left: 2px solid #ff9800;">
                            <div class="label" style="font-size: 0.65rem;"><i class="fas fa-chart-line"></i> VALOR LÍQUIDO</div>
                            <div class="value" style="font-size: 1rem;">
                                <span id="valor_liquido">R$ 0,00</span>
                            </div>
                            <div style="position: absolute; left: 6px; bottom: 4px; font-size: 0.5rem; color: #6c757d;">
                                <i class="fas fa-calculator me-1"></i>
                                <span>Viabilidade: <strong id="viabilidade_valor">R$ 0,00</strong> <span id="viabilidade_status"></span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Valor Total do Frete -->
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

// Função para calcular o combustível estimado
function calcularCombustivelEstimado(distanciaTotalKm) {
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
    
    // Tornar função global para edição manual
    window.editarPedagioManualmente = editarPedagioManualmente;
    
    loadCustos();
    loadCombustivelReal();
    loadDadosCaminhao();
    setupViagensListeners();
    
    setTimeout(() => {
        stopGPS();
        startGPS();
        loadMotoristaFretes();
        verificarViagemEmAndamento();
        
        // Atualizar o valor do CF na tela
        const cfSpan = document.getElementById("cf_valor");
        if (cfSpan) {
            cfSpan.textContent = cfValorPorKm.toFixed(2);
        }
        
        // Atualizar eixos na tela
        const eixosSpan = document.getElementById("eixos_caminhao");
        if (eixosSpan) {
            eixosSpan.textContent = eixosCaminhao;
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
      
    // Listeners para os campos de endereço
    const origemInput = document.getElementById("origem");
    const partidaInput = document.getElementById("partida");
    const entregaInput = document.getElementById("entrega");
    
    const onEnderecoChange = () => {
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

// Função para quando a placa é alterada (para motorista)
async function onPlacaChange(event) {
    const novaPlaca = event.target.value;
    if (novaPlaca) {
        await atualizarPlacaSelecionada(novaPlaca);
        
        // Atualizar eixos na tela
        const eixosSpan = document.getElementById("eixos_caminhao");
        if (eixosSpan) {
            eixosSpan.textContent = eixosCaminhao;
        }
        
        // Estilizar a opção selecionada
        const select = document.getElementById("placa_select");
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === novaPlaca) {
                select.options[i].style.fontWeight = 'bold';
            } else {
                select.options[i].style.fontWeight = 'normal';
            }
        }
        
        // Recalcular pedágio se houver rota calculada
        if (window.distanciasCalculadas && window.distanciasCalculadas.quantidadePedagios > 0) {
            recalcularPedagio();
        }
    }
}

// Função para verificar se existe viagem em andamento
async function verificarViagemEmAndamento() {
    if (!window.db || !window.currentUser) return;
    
    try {
        // CORREÇÃO: Buscar por usuarioId
        const snapshot = await window.db.collection("fretes")
            .where("usuarioId", "==", window.currentUser.id)  // CORRIGIDO
            .where("status", "==", "em_andamento")
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            viagemEmAndamento = doc.id;
            const viagem = doc.data();
            
            console.log("✅ Viagem em andamento encontrada, ID:", viagemEmAndamento);
            
            // Resto do código permanece igual...
            document.getElementById("origem").value = viagem.origem || "";
            document.getElementById("partida").value = viagem.partida || "";
            document.getElementById("entrega").value = viagem.entrega || "";
            document.getElementById("peso").value = viagem.toneladas || "";
            document.getElementById("valorPorTonelada").value = viagem.valorPorTonelada || "";
            
            window.distanciasCalculadas = {
                distanciaTrecho1: viagem.distancia_trecho1 || 0,
                distanciaTrecho2: viagem.distancia_trecho2 || 0,
                distanciaTotal: viagem.distancia_total || 0,
                quantidadePedagios: viagem.quantidade_pedagios || 0,
                valorTotalPedagios: viagem.valor_total_pedagios || 0,
                pedagio_alterado: viagem.pedagio_alterado || false,
                pedagio_valor_sugerido: viagem.pedagio_valor_sugerido || 0
            };
            
            if (viagem.pedagio_alterado) {
                pedagioFoiAlterado = true;
                valorPedagioOriginal = viagem.pedagio_valor_sugerido || 0;
                
                const pedagioContainer = document.querySelector(".trecho-valor-item:has(#pedagio_total_valor)");
                if (pedagioContainer && !pedagioContainer.querySelector(".pedagio-alterado-indicator")) {
                    const indicator = document.createElement("div");
                    indicator.className = "pedagio-alterado-indicator";
                    indicator.style.cssText = "position: absolute; right: 6px; bottom: 4px; font-size: 0.5rem; color: #ff9800;";
                    indicator.innerHTML = '<i class="fas fa-edit me-1"></i>Valor alterado manualmente';
                    pedagioContainer.appendChild(indicator);
                }
            }
            
            document.getElementById("distancia_total").textContent = viagem.distancia_total || 0;
            document.getElementById("pedagio_total_valor").textContent = (viagem.valor_total_pedagios || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById("quantidade_pedagios").textContent = viagem.quantidade_pedagios || 0;
            document.getElementById("combustivel_estimado_valor").textContent = (viagem.combustivel_estimado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            
            calcularValorTotal();
            
            setTimeout(() => {
                console.log("🔄 Calculando viabilidade para viagem em andamento...");
                calcularViabilidade();
            }, 100);
            
            setFormEnabled(false);
            document.getElementById("btn-iniciar-viagem").disabled = true;
            document.getElementById("btn-cancelar-viagem").disabled = false;
            document.getElementById("btn-finalizar-viagem").disabled = false;
            
            console.log("✅ Viagem em andamento carregada:", viagemEmAndamento);
        } else {
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
    
    if (!window.distanciasCalculadas) {
        return alert("Aguardando cálculo da rota. Verifique os endereços e aguarde alguns segundos.");
    }
    
    const valorTotal = toneladas * valorPorTonelada;
    
    const combustivelEstimado = window.distanciasCalculadas.distanciaTotal / consumoMedioAtualKmPorL;
    const custoFixo = window.distanciasCalculadas.distanciaTotal * cfValorPorKm;
    
    let percentualComissao = 0;
    let valorLDiesel = 0;
    
    try {
        const docRef = window.db.collection("custos").doc("custos_abastecimento");
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            percentualComissao = docSnap.data().cf_percentual_comissao || 0;
            valorLDiesel = docSnap.data().cf_valor_por_litro_diesel || 0;
        }
    } catch (error) {
        console.error("Erro ao carregar dados de custos:", error);
    }
    
    const comissao = (percentualComissao / 100) * valorTotal;
    const custoCombustivel = combustivelEstimado * valorLDiesel;
    const valorTotalPedagios = window.distanciasCalculadas.valorTotalPedagios || 0;
    
    const valorLiquido = valorTotal - comissao - valorTotalPedagios - custoFixo - custoCombustivel;
    const valorViabilidade = comissao + valorTotalPedagios + custoFixo + custoCombustivel;
    const viabilidade = valorViabilidade <= valorTotal;
    
    // CORREÇÃO: NÃO use window.currentUser.id como ID da viagem!
    // O Firebase gera um ID automático quando usamos .add()
    const frete = {
        nome: window.currentUser.nome,
        login: window.currentUser.login,
        usuarioId: window.currentUser.id,  // Renomeado para usuarioId
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
        valor_total_pedagios: valorTotalPedagios,
        combustivel_estimado: combustivelEstimado,
        consumo_medio_motorista: consumoMedioAtualKmPorL,
        cf_valor_por_km: cfValorPorKm,
        percentual_comissao: percentualComissao,
        valor_l_diesel: valorLDiesel,
        comissao_valor: comissao,
        custo_combustivel: custoCombustivel,
        custo_fixo: custoFixo,
        valor_liquido: valorLiquido,
        valor_viabilidade: valorViabilidade,
        viabilidade: viabilidade,
        placa_utilizada: placaSelecionada,
        eixos_caminhao: eixosCaminhao,
        pedagio_alterado: pedagioFoiAlterado,
        pedagio_valor_sugerido: valorPedagioOriginal,
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
            // Criar nova viagem - Firebase gera ID automaticamente
            docRef = await window.db.collection("fretes").add(frete);
            console.log("✅ Nova viagem criada com ID:", docRef.id);
            alert("Viagem iniciada com sucesso!");
        }
        
        viagemEmAndamento = docRef.id;
        
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
        await window.db.collection("fretes").doc(viagemEmAndamento).delete();
        
        alert("Viagem cancelada com sucesso!");
        
        limparFormulario();
        
        viagemEmAndamento = null;
        viagemEditando = null;
        
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = false;
        document.getElementById("btn-cancelar-viagem").disabled = true;
        document.getElementById("btn-finalizar-viagem").disabled = true;
        
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
        await window.db.collection("fretes").doc(viagemEmAndamento).update({
            status: "finalizada",
            data_finalizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Viagem finalizada com sucesso!");
        
        limparFormulario();
        
        viagemEmAndamento = null;
        viagemEditando = null;
        
        setFormEnabled(true);
        document.getElementById("btn-iniciar-viagem").disabled = false;
        document.getElementById("btn-cancelar-viagem").disabled = true;
        document.getElementById("btn-finalizar-viagem").disabled = true;
        
        loadMotoristaFretes();
        
    } catch (error) {
        console.error("Erro ao finalizar viagem:", error);
        alert(`Erro ao finalizar: ${error.message}`);
    }
}

// Função para editar uma viagem
async function editarViagem(viagemId) {
    console.log("✏️ Editando viagem:", viagemId);
    
    if (!viagemId) {
        alert("ID da viagem não informado!");
        return;
    }
    
    if (viagemEmAndamento && viagemEmAndamento !== viagemId) {
        alert("Você já tem uma viagem em andamento. Finalize ou cancele antes de editar outra.");
        return;
    }
    
    try {
        // Buscar dados da viagem diretamente do Firebase
        const doc = await window.db.collection("fretes").doc(viagemId).get();
        
        if (!doc.exists) {
            alert("Viagem não encontrada!");
            return;
        }
        
        const f = doc.data();
        
        // Preencher formulário
        document.getElementById("origem").value = f.origem || "";
        document.getElementById("partida").value = f.partida || "";
        document.getElementById("entrega").value = f.entrega || "";
        document.getElementById("peso").value = f.toneladas || "";
        document.getElementById("valorPorTonelada").value = f.valorPorTonelada || "";
        
        window.distanciasCalculadas = {
            distanciaTrecho1: f.distancia_trecho1 || 0,
            distanciaTrecho2: f.distancia_trecho2 || 0,
            distanciaTotal: f.distancia_total || 0,
            quantidadePedagios: f.quantidade_pedagios || 0,
            valorTotalPedagios: f.valor_total_pedagios || 0,
            pedagio_alterado: f.pedagio_alterado || false,
            pedagio_valor_sugerido: f.pedagio_valor_sugerido || 0
        };
        
        if (f.pedagio_alterado) {
            pedagioFoiAlterado = true;
            valorPedagioOriginal = f.pedagio_valor_sugerido || 0;
            
            const pedagioContainer = document.querySelector(".trecho-valor-item:has(#pedagio_total_valor)");
            if (pedagioContainer && !pedagioContainer.querySelector(".pedagio-alterado-indicator")) {
                const indicator = document.createElement("div");
                indicator.className = "pedagio-alterado-indicator";
                indicator.style.cssText = "position: absolute; right: 6px; bottom: 4px; font-size: 0.5rem; color: #ff9800;";
                indicator.innerHTML = '<i class="fas fa-edit me-1"></i>Valor alterado manualmente';
                pedagioContainer.appendChild(indicator);
            }
        }
        
        document.getElementById("distancia_total").textContent = f.distancia_total || 0;
        document.getElementById("pedagio_total_valor").textContent = (f.valor_total_pedagios || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById("quantidade_pedagios").textContent = f.quantidade_pedagios || 0;
        document.getElementById("combustivel_estimado_valor").textContent = (f.combustivel_estimado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        
        calcularValorTotal();
        console.log("🔄 Calculando viabilidade para edição de viagem...");
        calcularViabilidade();
        
        if (f.status === "em_andamento") {
            viagemEmAndamento = viagemId;
            viagemEditando = viagemId;
            setFormEnabled(true);
            document.getElementById("btn-iniciar-viagem").disabled = true;
            document.getElementById("btn-cancelar-viagem").disabled = false;
            document.getElementById("btn-finalizar-viagem").disabled = false;
        } else {
            viagemEditando = viagemId;
            viagemEmAndamento = null;
            setFormEnabled(true);
            document.getElementById("btn-iniciar-viagem").disabled = false;
            document.getElementById("btn-cancelar-viagem").disabled = true;
            document.getElementById("btn-finalizar-viagem").disabled = true;
            
            const btnIniciar = document.getElementById("btn-iniciar-viagem");
            btnIniciar.innerHTML = '<i class="fas fa-save me-2"></i>Atualizar Viagem';
            
            const originalClick = btnIniciar.onclick;
            btnIniciar.onclick = async (e) => {
                await handleIniciarViagem(e);
                btnIniciar.innerHTML = '<i class="fas fa-play me-2"></i>Iniciar Viagem';
                btnIniciar.onclick = originalClick;
            };
        }
        
        document.querySelector(".card")?.scrollIntoView({ behavior: "smooth" });
        
    } catch (error) {
        console.error("Erro ao buscar viagem:", error);
        alert("Erro ao carregar dados da viagem: " + error.message);
    }
}

// Função para excluir uma viagem
async function excluirViagem(viagemId) {
    console.log("🗑️ Excluindo viagem. ID recebido:", viagemId);
    
    if (!viagemId) {
        alert("ID da viagem não informado!");
        return;
    }
    
    if (viagemEmAndamento === viagemId) {
        alert("Não é possível excluir uma viagem em andamento. Finalize ou cancele primeiro.");
        return;
    }
    
    if (!confirm("Tem certeza que deseja excluir esta viagem permanentemente?")) {
        return;
    }
    
    try {
        console.log(`📡 Tentando excluir documento: fretes/${viagemId}`);
        
        const docRef = window.db.collection("fretes").doc(viagemId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            console.error("❌ Documento não encontrado:", viagemId);
            alert("Viagem não encontrada no banco de dados!");
            return;
        }
        
        await docRef.delete();
        console.log("✅ Viagem excluída com sucesso!");
        alert("Viagem excluída com sucesso!");
        
        await loadMotoristaFretes();
        
        if (viagemEditando === viagemId) {
            limparFormulario();
            viagemEditando = null;
        }
        
    } catch (error) {
        console.error("❌ Erro ao excluir viagem:", error);
        alert(`Erro ao excluir: ${error.message}`);
    }
}

// Função para calcular a distância total e pedágios usando a API do Google Maps
async function calcularDistanciaTotal(origem, partida, entrega) {
    console.log("🚗 Calculando rota via Google Maps API...");
    
    try {
        const directionsService = new google.maps.DirectionsService();
        
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
        
        const route1 = resultTrecho1.routes[0].legs[0];
        const route2 = resultTrecho2.routes[0].legs[0];
        
        const distanciaTrecho1 = (route1.distance.value / 1000).toFixed(1);
        const distanciaTrecho2 = (route2.distance.value / 1000).toFixed(1);
        const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
        
        let quantidadePedagios = 0;
        let valorBasePedagios = 0;
        
        function extrairPedagiosDaRota(route) {
            let qtd = 0;
            let valor = 0;
            
            if (route.legs && route.legs[0]) {
                const steps = route.legs[0].steps;
                for (const step of steps) {
                    const instruction = step.instructions || "";
                    const isToll = instruction.toLowerCase().includes("pedágio") || 
                                   instruction.toLowerCase().includes("toll") ||
                                   instruction.toLowerCase().includes("pedagio");
                    
                    if (isToll) {
                        qtd++;
                        valor += 8.00; // Valor base por pedágio (carro convencional)
                    }
                }
            }
            return { qtd, valor };
        }
        
        const pedagios1 = extrairPedagiosDaRota(resultTrecho1.routes[0]);
        const pedagios2 = extrairPedagiosDaRota(resultTrecho2.routes[0]);
        
        quantidadePedagios = pedagios1.qtd + pedagios2.qtd;
        valorBasePedagios = pedagios1.valor + pedagios2.valor;
        
        // Calcular valor real com base nos eixos do caminhão
        let valorTotalPedagios = valorBasePedagios;
        if (eixosCaminhao > 0 && quantidadePedagios > 0) {
            // Valor real = quantidade de pedágios × eixos × R$ 8,00
            valorTotalPedagios = quantidadePedagios * eixosCaminhao * 8.00;
        }
        
        console.log(`📊 1º trecho: ${distanciaTrecho1} km - Pedágios: ${pedagios1.qtd}`);
        console.log(`📊 2º trecho: ${distanciaTrecho2} km - Pedágios: ${pedagios2.qtd}`);
        console.log(`📊 Distância total: ${distanciaTotal} km`);
        console.log(`🛣️ Total de pedágios: ${quantidadePedagios}`);
        console.log(`🚛 Caminhão com ${eixosCaminhao} eixos`);
        console.log(`💰 Valor calculado: ${quantidadePedagios} × ${eixosCaminhao} × R$ 8,00 = R$ ${valorTotalPedagios.toFixed(2)}`);
        
        return {
            distanciaTrecho1: parseFloat(distanciaTrecho1),
            distanciaTrecho2: parseFloat(distanciaTrecho2),
            distanciaTotal: parseFloat(distanciaTotal),
            quantidadePedagios: quantidadePedagios,
            valorTotalPedagios: valorTotalPedagios,
            valorBasePedagios: valorBasePedagios
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
    
    if (origem && partida && entrega) {
        console.log("✅ Todos os endereços preenchidos, calculando distância via Google Maps...");
        
        const distanciaSpan = document.getElementById("distancia_total");
        const pedagioSpan = document.getElementById("pedagio_total_valor");
        const combustivelEstimadoSpan = document.getElementById("combustivel_estimado_valor");
        const valorLiquidoSpan = document.getElementById("valor_liquido");
        const viabilidadeValorSpan = document.getElementById("viabilidade_valor");
        const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
        
        if (distanciaSpan) distanciaSpan.textContent = "...";
        if (pedagioSpan) pedagioSpan.textContent = "...";
        if (combustivelEstimadoSpan) combustivelEstimadoSpan.textContent = "...";
        if (valorLiquidoSpan) valorLiquidoSpan.textContent = "---";
        if (viabilidadeValorSpan) viabilidadeValorSpan.textContent = "---";
        if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '';
        
        try {
            const distancias = await calcularDistanciaTotal(origem, partida, entrega);
            
            window.distanciasCalculadas = distancias;
            
            const distanciaTotalSpan = document.getElementById("distancia_total");
            if (distanciaTotalSpan) {
                distanciaTotalSpan.textContent = distancias.distanciaTotal;
            }
            
            const pedagioTotalSpan = document.getElementById("pedagio_total_valor");
            if (pedagioTotalSpan) {
                pedagioTotalSpan.textContent = distancias.valorTotalPedagios.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            const quantidadePedagiosSpan = document.getElementById("quantidade_pedagios");
            if (quantidadePedagiosSpan) {
                quantidadePedagiosSpan.textContent = distancias.quantidadePedagios;
            }
            
            console.log(`🔄 Recalculando combustível estimado com distância: ${distancias.distanciaTotal} km e consumo: ${consumoMedioAtualKmPorL} km/L`);
            const combustivelEstimado = calcularCombustivelEstimado(distancias.distanciaTotal);
            
            const peso = parseFloat(document.getElementById("peso").value) || 0;
            const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
            const valoresPreenchidos = peso > 0 && valorPorTonelada > 0;
            const cfConfigurado = cfValorPorKm > 0;
            
            if (valoresPreenchidos && cfConfigurado) {
                console.log("✅ Valores de frete e CF prontos, calculando viabilidade com pedágios...");
                calcularViabilidade();
            } else {
                console.log("⏳ Aguardando valores para calcular viabilidade");
                if (!valoresPreenchidos) {
                    const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
                    if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha toneladas e valor/t</span>';
                } else if (!cfConfigurado) {
                    const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
                    if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ CF (Custo Fixo) não configurado</span>';
                }
            }
            
            console.log(`✅ Distâncias, pedágios e combustíveis atualizados! Estimado: ${combustivelEstimado.toFixed(1)} L (baseado em ${consumoMedioAtualKmPorL} km/L)`);
            console.log(`🛣️ Pedágios: ${distancias.quantidadePedagios} - Total: R$ ${distancias.valorTotalPedagios.toFixed(2)}`);
            
        } catch (error) {
            console.error("❌ Erro ao calcular distâncias:", error);
            const distanciaSpan = document.getElementById("distancia_total");
            const pedagioSpan = document.getElementById("pedagio_total_valor");
            const combustivelEstimadoSpan = document.getElementById("combustivel_estimado_valor");
            const valorLiquidoSpan = document.getElementById("valor_liquido");
            const viabilidadeValorSpan = document.getElementById("viabilidade_valor");
            const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
            
            if (distanciaSpan) distanciaSpan.textContent = "Erro";
            if (pedagioSpan) pedagioSpan.textContent = "Erro";
            if (combustivelEstimadoSpan) combustivelEstimadoSpan.textContent = "Erro";
            if (valorLiquidoSpan) valorLiquidoSpan.textContent = "---";
            if (viabilidadeValorSpan) viabilidadeValorSpan.textContent = "---";
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-danger ms-2">❌ Erro ao calcular rota</span>';
            
            window.distanciasCalculadas = null;
            alert("Erro ao calcular a rota. Verifique os endereços e tente novamente.");
        }
    } else {
        console.log("⚠️ Endereços incompletos, aguardando preenchimento...");
        const valorLiquidoSpan = document.getElementById("valor_liquido");
        const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
        
        if (valorLiquidoSpan) valorLiquidoSpan.textContent = "---";
        if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os endereços</span>';
    }
}

// Função para lidar com o botão Atualizar GPS
async function handleAtualizarGPS() {
    const btn = document.getElementById("btn-atualizar-gps");
    
    if (confirm("Isso irá limpar os dados do formulário e atualizar sua localização. Deseja continuar?")) {
        btn.classList.add("loading");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Atualizando...';
        
        try {
            limparFormulario();
            
            await new Promise((resolve) => {
                restartGPS();
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
        
        if (verificarTodosDados()) {
            console.log("✅ Todos os dados prontos, calculando viabilidade...");
            setTimeout(() => {
                calcularViabilidade();
            }, 50);
        } else {
            console.log("⏳ Dados incompletos, viabilidade não calculada");
            const valorLiquidoSpan = document.getElementById("valor_liquido");
            const viabilidadeStatusSpan = document.getElementById("viabilidade_status");
            if (valorLiquidoSpan) valorLiquidoSpan.textContent = "---";
            if (viabilidadeStatusSpan) viabilidadeStatusSpan.innerHTML = '<span class="text-muted ms-2">⚠️ Preencha todos os dados</span>';
        }
    }
    
    return valorTotal;
}

async function getAddressFromCoords(lat, lng) {
    if (!window.google?.maps) throw new Error("Google Maps não disponível");
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }, 5000);
        
        new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            clearTimeout(timeout);
            if (status === "OK" && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
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
                    
                    const origemInput = document.getElementById("origem");
                    if (origemInput && !origemInput.value) {
                        try {
                            if (window.google?.maps) {
                                const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
                                currentAddress = address;
                                window.currentAddress = address;
                                origemInput.value = address;
                                gpsStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i><span>GPS Online</span>`;
                                gpsStatus.className = "alert alert-success d-flex align-items-center";
                            }
                        } catch (error) { 
                            console.warn("⚠️ Não foi possível obter endereço do GPS, mas localização capturada");
                            gpsStatus.innerHTML = `<i class="fas fa-map-marker-alt me-2"></i><span>Localização obtida</span>`;
                            gpsStatus.className = "alert alert-info d-flex align-items-center";
                        }
                    } else {
                        gpsStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i><span>GPS Online</span>`;
                        gpsStatus.className = "alert alert-success d-flex align-items-center";
                    }
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

// Função responsável pela navegação no mapa
async function openMapForSearch(fieldId, isReadonly = false) {
    if (!window.google?.maps) return alert("Google Maps não disponível");
    
    currentField = fieldId;
    const modalEl = document.getElementById("map-modal");
    const modal = new bootstrap.Modal(modalEl);
    
    let selectionMode = false;
    let tempMarker = null;
    let pendingPoint = null;
    let currentInfoWindow = null;
    let mapClickHandler = null;
    
    // Configuração de cada campo
    const fieldConfig = {
        origem: {
            inputId: "origem",
            markerColor: "blue",
            markerUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            title: "Ponto de Origem",
            canEdit: true,
            canDelete: true,
            showMarcarBotao: true,
            useGpsButton: true
        },
        partida: {
            inputId: "partida",
            markerColor: "red",
            markerUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            title: "Ponto de Carregamento",
            canEdit: true,
            canDelete: true,
            showMarcarBotao: true,
            useGpsButton: false
        },
        entrega: {
            inputId: "entrega",
            markerColor: "green",
            markerUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            title: "Ponto de Descarregamento",
            canEdit: true,
            canDelete: true,
            showMarcarBotao: true,
            useGpsButton: false
        }
    };
    
    const config = fieldConfig[fieldId];
    if (!config) {
        console.error("Campo inválido:", fieldId);
        return;
    }
    
    // Atualizar título do modal
    const modalTitle = document.getElementById("map-modal-title");
    if (modalTitle) {
        if (fieldId === "origem") {
            modalTitle.innerHTML = '<i class="fas fa-location-dot me-2"></i>📍 Ponto de ORIGEM';
        } else if (fieldId === "partida") {
            modalTitle.innerHTML = '<i class="fas fa-flag-checkered me-2"></i>🚚 Ponto de CARREGAMENTO';
        } else if (fieldId === "entrega") {
            modalTitle.innerHTML = '<i class="fas fa-map-pin me-2"></i>🏁 Ponto de DESCARREGAMENTO';
        }
    }
    
    // ============================================
    // ARMAZENAMENTO GLOBAL DOS MARCADORES (ÚNICOS)
    // ============================================
    if (!window.mapMarkers) {
        window.mapMarkers = {
            origem: null,
            partida: null,
            entrega: null,
            gps: null
        };
    }
    
    let currentMarker = null;
    let myLocationMarker = null;
    let circle = null;
    
    // Função para carregar ponto existente (APENAS UM)
    async function carregarPontoExistente() {
        const existingAddress = document.getElementById(config.inputId).value;
        
        // Remover marcador existente deste tipo ANTES de criar novo
        if (window.mapMarkers[fieldId]) {
            window.mapMarkers[fieldId].setMap(null);
            window.mapMarkers[fieldId] = null;
        }
        
        if (existingAddress && config.canEdit) {
            try {
                const coords = await getCoordsFromAddress(existingAddress);
                
                currentMarker = new google.maps.Marker({
                    position: { lat: coords.lat, lng: coords.lng },
                    map: map,
                    icon: {
                        url: config.markerUrl,
                        scaledSize: new google.maps.Size(40, 40)
                    },
                    title: config.title,
                    draggable: false
                });
                
                // Armazenar no objeto global
                window.mapMarkers[fieldId] = currentMarker;
                
                // Adicionar listener para excluir
                if (config.canDelete) {
                    currentMarker.addListener("click", () => {
                        if (currentInfoWindow) currentInfoWindow.close();
                        
                        currentInfoWindow = new google.maps.InfoWindow({
                            content: `
                                <div style="min-width: 200px; padding: 5px;">
                                    <div style="margin-bottom: 12px;">
                                        <strong><i class="fas fa-map-marker-alt text-${config.markerColor} me-2"></i>${config.title}</strong>
                                    </div>
                                    <p style="font-size: 12px; margin-bottom: 12px; word-break: break-word;">${existingAddress.substring(0, 100)}</p>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-danger btn-sm" style="flex: 1; padding: 8px;" id="excluir-ponto-atual">
                                            <i class="fas fa-trash me-1"></i> Excluir
                                        </button>
                                        <button class="btn btn-secondary btn-sm" style="flex: 1; padding: 8px;" id="fechar-info-window">
                                            <i class="fas fa-times me-1"></i> Fechar
                                        </button>
                                    </div>
                                </div>
                            `
                        });
                        currentInfoWindow.open(map, currentMarker);
                        
                        setTimeout(() => {
                            const excluirBtn = document.getElementById("excluir-ponto-atual");
                            const fecharBtn = document.getElementById("fechar-info-window");
                            if (excluirBtn) {
                                excluirBtn.onclick = () => {
                                    if (window.mapMarkers[fieldId]) {
                                        window.mapMarkers[fieldId].setMap(null);
                                        window.mapMarkers[fieldId] = null;
                                    }
                                    document.getElementById(config.inputId).value = "";
                                    const event = new Event('change', { bubbles: true });
                                    document.getElementById(config.inputId).dispatchEvent(event);
                                    if (currentInfoWindow) currentInfoWindow.close();
                                    alert(`${config.title} removido!`);
                                };
                            }
                            if (fecharBtn) {
                                fecharBtn.onclick = () => {
                                    if (currentInfoWindow) currentInfoWindow.close();
                                };
                            }
                        }, 100);
                    });
                }
                
                map.setCenter({ lat: coords.lat, lng: coords.lng });
                map.setZoom(15);
                return true;
            } catch (error) {
                console.warn("Endereço não encontrado:", error.message);
                return false;
            }
        }
        return false;
    }
    
    // Função para carregar TODOS os pontos existentes no mapa (visualização)
    async function carregarTodosPontos() {
        // Carregar ponto de Origem
        const origemAddress = document.getElementById("origem").value;
        if (origemAddress && fieldId !== "origem") {
            try {
                const coords = await getCoordsFromAddress(origemAddress);
                if (!window.mapMarkers.origem) {
                    window.mapMarkers.origem = new google.maps.Marker({
                        position: { lat: coords.lat, lng: coords.lng },
                        map: map,
                        icon: {
                            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        title: "Ponto de Origem",
                        draggable: false
                    });
                }
            } catch (error) {
                console.warn("Erro ao carregar origem:", error);
            }
        }
        
        // Carregar ponto de Partida (apenas se não for o campo atual)
        const partidaAddress = document.getElementById("partida").value;
        if (partidaAddress && fieldId !== "partida") {
            try {
                const coords = await getCoordsFromAddress(partidaAddress);
                if (!window.mapMarkers.partida) {
                    window.mapMarkers.partida = new google.maps.Marker({
                        position: { lat: coords.lat, lng: coords.lng },
                        map: map,
                        icon: {
                            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        title: "Ponto de Carregamento",
                        draggable: false
                    });
                }
            } catch (error) {
                console.warn("Erro ao carregar partida:", error);
            }
        }
        
        // Carregar ponto de Entrega (apenas se não for o campo atual)
        const entregaAddress = document.getElementById("entrega").value;
        if (entregaAddress && fieldId !== "entrega") {
            try {
                const coords = await getCoordsFromAddress(entregaAddress);
                if (!window.mapMarkers.entrega) {
                    window.mapMarkers.entrega = new google.maps.Marker({
                        position: { lat: coords.lat, lng: coords.lng },
                        map: map,
                        icon: {
                            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        title: "Ponto de Descarregamento",
                        draggable: false
                    });
                }
            } catch (error) {
                console.warn("Erro ao carregar entrega:", error);
            }
        }
    }
    
    // Função para limpar controles do mapa
    function limparControles() {
        const existingContainer = document.querySelector('.map-button-container');
        if (existingContainer) existingContainer.remove();
        
        const existingInstructions = document.querySelectorAll('.map-instruction');
        existingInstructions.forEach(el => el.remove());
        
        const loading = document.getElementById('map-loading');
        if (loading) loading.remove();
        
        if (mapClickHandler && map) {
            google.maps.event.removeListener(mapClickHandler);
            mapClickHandler = null;
        }
    }
    
    modal.show();
    
    modalEl.addEventListener("shown.bs.modal", function onModalShown() {
        modalEl.removeEventListener("shown.bs.modal", onModalShown);
        
        setTimeout(async () => {
            const mapElement = document.getElementById("map");
            if (!mapElement) return;
            
            if (!mapInitialized || !window.map) {
                const mapOptions = {
                    center: currentLocation || { lat: -23.5505, lng: -46.6333 },
                    zoom: 14,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    gestureHandling: "greedy",
                    disableDoubleClickZoom: true
                };
                map = new google.maps.Map(mapElement, mapOptions);
                window.map = map;
                mapInitialized = true;
            } else {
                map = window.map;
                google.maps.event.trigger(map, "resize");
            }
            
            limparControles();
            
            // ============================================
            // MOSTRAR LOCALIZAÇÃO GPS (apenas visualização)
            // ============================================
            if (currentLocation) {
                if (window.mapMarkers.gps) {
                    window.mapMarkers.gps.setMap(null);
                }
                window.mapMarkers.gps = new google.maps.Marker({
                    position: currentLocation,
                    map: map,
                    icon: {
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                        scaledSize: new google.maps.Size(40, 40)
                    },
                    title: "Minha localização atual (GPS)",
                    draggable: false,
                    clickable: false
                });
                
                if (circle) circle.setMap(null);
                circle = new google.maps.Circle({
                    map: map,
                    radius: 50,
                    fillColor: '#4285F4',
                    fillOpacity: 0.1,
                    strokeColor: '#4285F4',
                    strokeOpacity: 0.3,
                    strokeWeight: 1,
                    center: currentLocation
                });
            }
            
            // ============================================
            // CARREGAR PONTO DO CAMPO ATUAL
            // ============================================
            await carregarPontoExistente();
            
            // ============================================
            // CARREGAR OS DEMAIS PONTOS PARA VISUALIZAÇÃO
            // ============================================
            await carregarTodosPontos();
            
            // ============================================
            // CRIAR CONTAINER DE BOTÕES
            // ============================================
            const buttonContainer = document.createElement("div");
            buttonContainer.className = "map-button-container";
            Object.assign(buttonContainer.style, {
                zIndex: "1000",
                margin: "10px",
                display: "flex",
                gap: "10px",
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)"
            });
            
            let marcarBtn = null;
            
            // ============================================
            // BOTÃO "MARCAR PONTO"
            // ============================================
            if (config.showMarcarBotao) {
                marcarBtn = document.createElement("button");
                marcarBtn.id = "activate-select-mode";
                marcarBtn.className = "btn btn-primary";
                Object.assign(marcarBtn.style, {
                    padding: "14px 28px",
                    borderRadius: "50px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    background: "linear-gradient(135deg, #4158D0 0%, #C850C0 100%)",
                    border: "none",
                    cursor: "pointer"
                });
                marcarBtn.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>Marcar Ponto no Mapa';
                buttonContainer.appendChild(marcarBtn);
                
                marcarBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectionMode = !selectionMode;
                    
                    if (selectionMode) {
                        marcarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Clique no mapa...';
                        marcarBtn.style.background = "#ff9800";
                        map.setOptions({ draggableCursor: "crosshair" });
                        console.log("✅ Modo de seleção ATIVADO");
                    } else {
                        marcarBtn.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>Marcar Ponto no Mapa';
                        marcarBtn.style.background = "linear-gradient(135deg, #4158D0 0%, #C850C0 100%)";
                        map.setOptions({ draggableCursor: "" });
                        
                        if (tempMarker) {
                            tempMarker.setMap(null);
                            tempMarker = null;
                        }
                        pendingPoint = null;
                    }
                };
            }
            
            // ============================================
            // BOTÃO "USAR LOCALIZAÇÃO ATUAL" (apenas origem)
            // ============================================
            if (config.useGpsButton && currentLocation) {
                const gpsBtn = document.createElement("button");
                gpsBtn.id = "use-current-location";
                gpsBtn.className = "btn btn-success";
                Object.assign(gpsBtn.style, {
                    padding: "14px 28px",
                    borderRadius: "50px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    background: "linear-gradient(135deg, #34A853 0%, #1E7E34 100%)",
                    border: "none",
                    cursor: "pointer"
                });
                gpsBtn.innerHTML = '<i class="fas fa-location-dot me-2"></i>Usar Localização Atual';
                buttonContainer.appendChild(gpsBtn);
                
                gpsBtn.onclick = async () => {
                    if (!currentLocation) {
                        alert("Localização não disponível.");
                        return;
                    }
                    
                    gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Buscando...';
                    gpsBtn.disabled = true;
                    if (marcarBtn) marcarBtn.disabled = true;
                    
                    try {
                        const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
                        
                        // Remover marcador existente
                        if (window.mapMarkers[fieldId]) {
                            window.mapMarkers[fieldId].setMap(null);
                            window.mapMarkers[fieldId] = null;
                        }
                        
                        // Criar novo marcador
                        window.mapMarkers[fieldId] = new google.maps.Marker({
                            position: currentLocation,
                            map: map,
                            icon: {
                                url: config.markerUrl,
                                scaledSize: new google.maps.Size(40, 40)
                            },
                            title: config.title,
                            draggable: false
                        });
                        
                        document.getElementById(config.inputId).value = address;
                        const event = new Event('change', { bubbles: true });
                        document.getElementById(config.inputId).dispatchEvent(event);
                        
                        map.setCenter(currentLocation);
                        map.setZoom(16);
                        
                        alert(`${config.title} atualizado com sucesso!`);
                        modal.hide();
                        
                    } catch (error) {
                        console.error("Erro:", error);
                        alert("Erro ao obter endereço.");
                    } finally {
                        gpsBtn.innerHTML = '<i class="fas fa-location-dot me-2"></i>Usar Localização Atual';
                        gpsBtn.disabled = false;
                        if (marcarBtn) marcarBtn.disabled = false;
                    }
                };
            }
            
            if (buttonContainer.children.length > 0) {
                mapElement.parentElement.style.position = "relative";
                mapElement.parentElement.appendChild(buttonContainer);
            }
            
            // ============================================
            // CLIQUE NO MAPA
            // ============================================
            if (config.showMarcarBotao) {
                mapClickHandler = map.addListener("click", async (e) => {
                    if (!selectionMode) {
                        const tip = document.createElement("div");
                        tip.style.cssText = "position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; border-radius: 30px; font-size: 13px; z-index: 10000; white-space: nowrap;";
                        tip.innerHTML = '🔘 Clique em "Marcar Ponto no Mapa" primeiro';
                        document.body.appendChild(tip);
                        setTimeout(() => tip.remove(), 2000);
                        return;
                    }
                    
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    
                    selectionMode = false;
                    if (marcarBtn) {
                        marcarBtn.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>Marcar Ponto no Mapa';
                        marcarBtn.style.background = "linear-gradient(135deg, #4158D0 0%, #C850C0 100%)";
                    }
                    map.setOptions({ draggableCursor: "" });
                    
                    if (tempMarker) {
                        tempMarker.setMap(null);
                        tempMarker = null;
                    }
                    
                    tempMarker = new google.maps.Marker({
                        position: { lat, lng },
                        map: map,
                        icon: {
                            url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        title: "Novo ponto (aguardando confirmação)"
                    });
                    
                    const loadingDiv = document.createElement("div");
                    loadingDiv.id = "map-loading";
                    loadingDiv.innerHTML = '<div style="background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 30px;"><i class="fas fa-spinner fa-spin me-2"></i>Buscando endereço...</div>';
                    Object.assign(loadingDiv.style, {
                        position: "absolute",
                        bottom: "80px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: "1000",
                        whiteSpace: "nowrap"
                    });
                    mapElement.parentElement.appendChild(loadingDiv);
                    
                    try {
                        const address = await getAddressFromCoords(lat, lng);
                        loadingDiv.remove();
                        
                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div style="min-width: 250px; padding: 5px;">
                                    <div style="margin-bottom: 12px;">
                                        <strong><i class="fas fa-map-marker-alt text-warning me-2"></i>Novo ${config.title}</strong>
                                    </div>
                                    <p style="font-size: 12px; margin-bottom: 12px; word-break: break-word;">${address.substring(0, 100)}</p>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-success btn-sm" style="flex: 1; padding: 8px;" id="confirm-pending-point">
                                            <i class="fas fa-check me-1"></i> Confirmar
                                        </button>
                                        <button class="btn btn-secondary btn-sm" style="flex: 1; padding: 8px;" id="cancel-pending-point">
                                            <i class="fas fa-times me-1"></i> Cancelar
                                        </button>
                                    </div>
                                </div>
                            `
                        });
                        infoWindow.open(map, tempMarker);
                        
                        setTimeout(() => {
                            const confirmBtn = document.getElementById("confirm-pending-point");
                            const cancelBtn = document.getElementById("cancel-pending-point");
                            
                            if (confirmBtn) {
                                confirmBtn.onclick = () => {
                                    infoWindow.close();
                                    
                                    // REMOVER marcador antigo deste tipo
                                    if (window.mapMarkers[fieldId]) {
                                        window.mapMarkers[fieldId].setMap(null);
                                        window.mapMarkers[fieldId] = null;
                                    }
                                    
                                    // CRIAR novo marcador
                                    window.mapMarkers[fieldId] = new google.maps.Marker({
                                        position: { lat, lng },
                                        map: map,
                                        icon: {
                                            url: config.markerUrl,
                                            scaledSize: new google.maps.Size(40, 40)
                                        },
                                        title: config.title,
                                        draggable: false
                                    });
                                    
                                    document.getElementById(config.inputId).value = address;
                                    const event = new Event('change', { bubbles: true });
                                    document.getElementById(config.inputId).dispatchEvent(event);
                                    
                                    if (tempMarker) {
                                        tempMarker.setMap(null);
                                        tempMarker = null;
                                    }
                                    
                                    modal.hide();
                                    alert(`${config.title} marcado com sucesso!`);
                                };
                            }
                            
                            if (cancelBtn) {
                                cancelBtn.onclick = () => {
                                    infoWindow.close();
                                    if (tempMarker) {
                                        tempMarker.setMap(null);
                                        tempMarker = null;
                                    }
                                };
                            }
                        }, 200);
                        
                    } catch (error) {
                        loadingDiv.remove();
                        if (tempMarker) tempMarker.setMap(null);
                        alert(`Erro: ${error.message}`);
                    }
                });
            }
            
            // ============================================
            // INSTRUÇÕES
            // ============================================
            const instructionDiv = document.createElement("div");
            instructionDiv.className = "map-instruction";
            instructionDiv.innerHTML = `
                <div style="background: rgba(0,0,0,0.75); color: white; padding: 8px 16px; border-radius: 30px; font-size: 12px; margin: 10px;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 14px; height: 14px; background: #4285F4; border-radius: 50%;"></div>
                            <span>📍 GPS</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 14px; height: 14px; background: #0d6efd; border-radius: 50%;"></div>
                            <span>🔵 Origem</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 14px; height: 14px; background: #dc3545; border-radius: 50%;"></div>
                            <span>🔴 Carregamento</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 14px; height: 14px; background: #198754; border-radius: 50%;"></div>
                            <span>🟢 Descarregamento</span>
                        </div>
                        <div><i class="fas fa-trash-alt me-1"></i>Clique p/ excluir</div>
                    </div>
                </div>
            `;
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(instructionDiv);
            
            // Ajustar zoom
            const bounds = new google.maps.LatLngBounds();
            let hasPoints = false;
            
            if (currentLocation) {
                bounds.extend(currentLocation);
                hasPoints = true;
            }
            if (window.mapMarkers.origem && window.mapMarkers.origem.getPosition()) {
                bounds.extend(window.mapMarkers.origem.getPosition());
                hasPoints = true;
            }
            if (window.mapMarkers.partida && window.mapMarkers.partida.getPosition()) {
                bounds.extend(window.mapMarkers.partida.getPosition());
                hasPoints = true;
            }
            if (window.mapMarkers.entrega && window.mapMarkers.entrega.getPosition()) {
                bounds.extend(window.mapMarkers.entrega.getPosition());
                hasPoints = true;
            }
            
            if (hasPoints) {
                map.fitBounds(bounds);
                google.maps.event.addListenerOnce(map, 'idle', () => {
                    if (map.getZoom() > 16) map.setZoom(16);
                });
            }
            
        }, 300);
    });
    
    modalEl.addEventListener("hidden.bs.modal", function onHidden() {
        limparControles();
        if (mapClickHandler && map) {
            google.maps.event.removeListener(mapClickHandler);
            mapClickHandler = null;
        }
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
    });
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

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function loadMotoristaFretes() {
    const fretesList = document.getElementById("fretes-list");
    if (!fretesList) return;
    
    if (!window.db) {
        console.error("❌ Firestore não disponível");
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro de conexão</p></div>';
        return;
    }
    
    if (!window.currentUser || !window.currentUser.id) {
        console.error("❌ Usuário não identificado");
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Usuário não identificado</p></div>';
        return;
    }
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';
    
    try {
        // CORREÇÃO: Buscar por usuarioId, não por "id"
        console.log("🔍 Buscando viagens para o usuário:", window.currentUser.id);
        
        const snapshot = await window.db.collection("fretes")
            .where("usuarioId", "==", window.currentUser.id)  // CORRIGIDO: usar usuarioId
            .limit(50)
            .get();
        
        console.log(`📊 Encontradas ${snapshot.size} viagens`);
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete ainda</p></div>';
            return;
        }
        
        let fretes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📄 Documento ID: ${doc.id}`, data);
            fretes.push({ 
                id: doc.id,  // ID CORRETO do documento Firebase
                ...data 
            });
        });
        
        fretes.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        
        let html = "";
        fretes.slice(0, 20).forEach(f => {
            const viagemId = f.id;
            if (!viagemId) {
                console.error("❌ Viagem sem ID:", f);
                return;
            }
            
            console.log(`✅ Renderizando viagem ID: ${viagemId}`);
            
            const data = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : "Data não disponível";
            const statusBadge = f.status === "em_andamento" 
                ? '<span class="badge bg-warning text-dark ms-2">Em Andamento</span>' 
                : '<span class="badge bg-success ms-2">Finalizada</span>';
            
            let viabilidadeBadge = '';
            let valorLiquidoExibido = '';
            let valorViabilidadeExibido = '';
            let placaInfo = '';
            
            if (f.valor_liquido !== undefined && f.valor_viabilidade !== undefined) {
                valorLiquidoExibido = (f.valor_liquido || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                valorViabilidadeExibido = (f.valor_viabilidade || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                viabilidadeBadge = f.viabilidade ? 
                    '<span class="badge bg-success ms-1">✓ Viável</span>' : 
                    '<span class="badge bg-danger ms-1">✗ Inviável</span>';
            } else {
                const custoFixo = (f.distancia_total || 0) * (f.cf_valor_por_km || 0);
                const viabilidadeCalculada = custoFixo <= (f.valorTotal || 0);
                valorLiquidoExibido = "---";
                valorViabilidadeExibido = (custoFixo || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                viabilidadeBadge = viabilidadeCalculada ? 
                    '<span class="badge bg-success ms-1">✓ Viável</span>' : 
                    '<span class="badge bg-danger ms-1">✗ Inviável</span>';
            }
            
            if (f.placa_utilizada) {
                placaInfo = `<div><i class="fas fa-truck"></i> Placa: ${escapeHtml(f.placa_utilizada)} (${f.eixos_caminhao || 0} eixos)</div>`;
            }
            
            html += `
                <div class="frete-item" data-viagem-id="${viagemId}">
                    <div class="frete-header">
                        <span class="frete-motorista">${escapeHtml(f.nome)}${statusBadge}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${f.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> Frete: ${(f.valorTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        <div><i class="fas fa-road"></i> ${f.distancia_total || 0} km</div>
                        <div><i class="fas fa-chart-line"></i> Viabilidade: ${valorViabilidadeExibido} ${viabilidadeBadge}</div>
                        <div><i class="fas fa-money-bill-wave text-success"></i> Líquido: ${valorLiquidoExibido}</div>
                        ${placaInfo}
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${f.origem ? escapeHtml(f.origem.substring(0, 30)) : "..."}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${f.partida ? escapeHtml(f.partida.substring(0, 30)) : "..."}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${f.entrega ? escapeHtml(f.entrega.substring(0, 30)) : "..."}...</p>
                    </div>
                    <div class="frete-acoes mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarViagem('${viagemId}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="excluirViagem('${viagemId}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        });
        fretesList.innerHTML = html;
        
        console.log("✅ Lista de viagens renderizada com sucesso");
        
    } catch (error) {
        console.error("❌ Erro ao carregar fretes:", error);
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
window.editarPedagioManualmente = editarPedagioManualmente;
