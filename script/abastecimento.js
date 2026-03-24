// ============================================
// ABASTECIMENTO.JS - Tela de Abastecimento
// Disponível para: operador, admin
// ============================================

const abastecimentoTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-gas-pump me-2"></i>
        <span>Registre os abastecimentos realizados no veículo</span>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-4 mb-3">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-gas-pump me-2"></i>Registrar Abastecimento
        </h6>
        
        <form id="abastecimento-form">
            <!-- Odômetro Inicial -->
            <div class="input-highlight mb-3">
                <label><i class="fas fa-tachometer-alt me-1"></i> ODÔMETRO INICIAL (km)</label>
                <input type="number" id="km_odometro_inicial" 
                       placeholder="Ex: 45.230" 
                       step="0.1" 
                       min="0" 
                       required>
                <small class="text-muted d-block mt-1">Quilometragem antes do abastecimento</small>
            </div>
            
            <!-- Odômetro Final -->
            <div class="input-highlight mb-3">
                <label><i class="fas fa-tachometer-alt me-1"></i> ODÔMETRO FINAL (km)</label>
                <input type="number" id="km_odometro_final" 
                       placeholder="Ex: 45.730" 
                       step="0.1" 
                       min="0" 
                       required>
                <small class="text-muted d-block mt-1">Quilometragem após o abastecimento</small>
            </div>
            
            <!-- Litros Abastecidos -->
            <div class="input-highlight mb-3">
                <label><i class="fas fa-gas-pump me-1"></i> LITROS ABASTECIDOS (L)</label>
                <input type="number" id="litros_abastecidos" 
                       placeholder="Ex: 150,5" 
                       step="0.1" 
                       min="0" 
                       required>
                <small class="text-muted d-block mt-1">Quantidade de combustível abastecido</small>
            </div>
            
            <!-- Seção de Resultados (calculados automaticamente) -->
            <div class="bg-light rounded-3 p-3 mb-3">
                <h6 class="text-secondary fw-semibold mb-3">
                    <i class="fas fa-calculator me-2"></i>Resultados
                </h6>
                
                <div class="row g-2">
                    <!-- Distância Percorrida -->
                    <div class="col-12 mb-2">
                        <div class="trecho-valor-item" style="background: #e3f2fd; text-align: center; min-height: 70px;">
                            <div class="label" style="font-size: 0.7rem;">
                                <i class="fas fa-road"></i> DISTÂNCIA PERCORRIDA
                            </div>
                            <div class="value" style="font-size: 1.2rem;">
                                <span id="distancia_percorrida">0,0</span>
                                <span style="font-size: 0.7rem;">km</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Consumo Real -->
                    <div class="col-12">
                        <div class="trecho-valor-item" style="background: #e8f5e9; text-align: center; min-height: 70px;">
                            <div class="label" style="font-size: 0.7rem;">
                                <i class="fas fa-chart-line"></i> CONSUMO REAL
                            </div>
                            <div class="value" style="font-size: 1.2rem;">
                                <span id="consumo_real">0,0</span>
                                <span style="font-size: 0.7rem;">km/L</span>
                            </div>
                            <div style="font-size: 0.6rem; color: #6c757d; margin-top: 4px;">
                                <i class="fas fa-info-circle me-1"></i>
                                Quilômetros por litro (km/L)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary w-100 py-2 mt-2">
                <i class="fas fa-save me-2"></i>Registrar Abastecimento
            </button>
        </form>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3">
            <i class="fas fa-history me-2"></i>Histórico de Abastecimentos
        </h6>
        <div id="abastecimentos-list" class="list-abastecimentos"></div>
    </div>
</div>
`;

// Função principal de inicialização
function initAbastecimento(container) {
    console.log("⛽ Inicializando tela de Abastecimento");
    
    if (container) {
        container.innerHTML = abastecimentoTemplate;
    }
    
    setupAbastecimentoListeners();
    loadHistoricoAbastecimentos();
}

// Configurar listeners dos campos
function setupAbastecimentoListeners() {
    console.log("⛽ Configurando listeners de abastecimento...");
    
    const kmInicial = document.getElementById("km_odometro_inicial");
    const kmFinal = document.getElementById("km_odometro_final");
    const litros = document.getElementById("litros_abastecidos");
    
    if (kmInicial) {
        kmInicial.removeEventListener("input", calcularResultados);
        kmInicial.addEventListener("input", calcularResultados);
    }
    
    if (kmFinal) {
        kmFinal.removeEventListener("input", calcularResultados);
        kmFinal.addEventListener("input", calcularResultados);
    }
    
    if (litros) {
        litros.removeEventListener("input", calcularResultados);
        litros.addEventListener("input", calcularResultados);
    }
    
    const form = document.getElementById("abastecimento-form");
    if (form) {
        form.removeEventListener("submit", handleAbastecimentoSubmit);
        form.addEventListener("submit", handleAbastecimentoSubmit);
    }
}

// Função para calcular distância percorrida e consumo real
function calcularResultados() {
    const kmInicial = parseFloat(document.getElementById("km_odometro_inicial")?.value) || 0;
    const kmFinal = parseFloat(document.getElementById("km_odometro_final")?.value) || 0;
    const litros = parseFloat(document.getElementById("litros_abastecidos")?.value) || 0;
    
    // Calcular distância percorrida
    let distanciaPercorrida = 0;
    if (kmFinal > kmInicial) {
        distanciaPercorrida = kmFinal - kmInicial;
    }
    
    // Atualizar campo de distância percorrida
    const distanciaSpan = document.getElementById("distancia_percorrida");
    if (distanciaSpan) {
        distanciaSpan.textContent = distanciaPercorrida.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    }
    
    // Calcular consumo real (km/L)
    let consumoReal = 0;
    if (distanciaPercorrida > 0 && litros > 0) {
        consumoReal = distanciaPercorrida / litros;
    }
    
    // Atualizar campo de consumo real
    const consumoSpan = document.getElementById("consumo_real");
    if (consumoSpan) {
        consumoSpan.textContent = consumoReal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    return { distanciaPercorrida, consumoReal };
}

// Função para obter o ID do documento de login do usuário (ex: "login_001" ou "admin_login_001")
async function getLoginDocId() {
    if (!window.currentUser) return null;
    
    const userLogin = window.currentUser.login;
    console.log(`🔍 Buscando documento de login para: ${userLogin}`);
    
    try {
        // Buscar em admin_logins
        const adminDoc = await window.db.collection("logins").doc("admin_logins").get();
        
        if (adminDoc.exists) {
            const adminLogins = adminDoc.data();
            
            for (const [docId, userData] of Object.entries(adminLogins)) {
                if (userData.login === userLogin) {
                    console.log(`✅ Admin encontrado - Document ID: ${docId}`);
                    return docId;
                }
            }
        }
        
        // Buscar em funcionarios_logins
        const funcionariosDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
        
        if (funcionariosDoc.exists) {
            const funcionariosLogins = funcionariosDoc.data();
            
            for (const [docId, userData] of Object.entries(funcionariosLogins)) {
                if (userData.login === userLogin) {
                    console.log(`✅ Funcionário encontrado - Document ID: ${docId}`);
                    return docId;
                }
            }
        }
        
        console.error(`❌ Login "${userLogin}" não encontrado em nenhum documento!`);
        return null;
        
    } catch (error) {
        console.error("❌ Erro ao buscar documento de login:", error);
        return null;
    }
}

// Função para obter o próximo número de abastecimento
async function getProximoNumeroAbastecimento(loginDocId) {
    try {
        const docRef = window.db.collection("custos").doc("abastecimento_motoristas");
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            const usuarioData = data[loginDocId];
            
            if (usuarioData) {
                // Contar quantos abastecimentos já existem (excluindo os campos de controle)
                let count = 0;
                for (const key in usuarioData) {
                    if (key !== "L_abastecimento_atual" && 
                        key !== "consumo_medio_atual_km_por_L" && 
                        key.startsWith("abastecimento_")) {
                        count++;
                    }
                }
                return count + 1;
            }
        }
        
        return 1;
    } catch (error) {
        console.error("Erro ao obter próximo número:", error);
        return 1;
    }
}

// Função para salvar abastecimento
async function handleAbastecimentoSubmit(e) {
    e.preventDefault();
    
    if (!window.currentUser) {
        alert("Usuário não logado!");
        return;
    }
    
    if (!window.db) {
        alert("Erro de conexão com o banco de dados!");
        return;
    }
    
    // Obter valores do formulário
    const kmInicial = parseFloat(document.getElementById("km_odometro_inicial").value);
    const kmFinal = parseFloat(document.getElementById("km_odometro_final").value);
    const litrosAbastecidos = parseFloat(document.getElementById("litros_abastecidos").value);
    
    // Validações
    if (isNaN(kmInicial) || kmInicial < 0) {
        alert("Informe um valor válido para Odômetro Inicial!");
        return;
    }
    
    if (isNaN(kmFinal) || kmFinal < 0) {
        alert("Informe um valor válido para Odômetro Final!");
        return;
    }
    
    if (kmFinal <= kmInicial) {
        alert("Odômetro Final deve ser maior que Odômetro Inicial!");
        return;
    }
    
    if (isNaN(litrosAbastecidos) || litrosAbastecidos <= 0) {
        alert("Informe uma quantidade válida de litros abastecidos!");
        return;
    }
    
    // Calcular resultados
    const distanciaPercorrida = kmFinal - kmInicial;
    const consumoReal = distanciaPercorrida / litrosAbastecidos;
    
    // Confirmar antes de salvar
    const confirmMessage = `Confirmar registro de abastecimento?\n\n` +
        `📊 Odômetro Inicial: ${kmInicial.toFixed(1)} km\n` +
        `📊 Odômetro Final: ${kmFinal.toFixed(1)} km\n` +
        `📏 Distância: ${distanciaPercorrida.toFixed(1)} km\n` +
        `⛽ Litros: ${litrosAbastecidos.toFixed(1)} L\n` +
        `📈 Consumo: ${consumoReal.toFixed(2)} km/L`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
    btn.disabled = true;
    
    try {
        // Obter ID do documento de login (ex: "login_001" ou "admin_login_001")
        const loginDocId = await getLoginDocId();
        
        if (!loginDocId) {
            throw new Error("Usuário não encontrado no sistema. Contate o administrador.");
        }
        
        console.log(`✅ Usuário identificado: ${loginDocId}`);
        
        // Obter próximo número de abastecimento
        const numeroAbastecimento = await getProximoNumeroAbastecimento(loginDocId);
        const campoAbastecimento = `abastecimento_${numeroAbastecimento}`;
        
        // Preparar dados do abastecimento
        const abastecimentoData = {
            km_odometro_inicial: kmInicial.toFixed(1).replace('.', ','),
            km_odometro_final: kmFinal.toFixed(1).replace('.', ','),
            km_distancia_percorrida: distanciaPercorrida.toFixed(1).replace('.', ','),
            L_abastecimento: litrosAbastecidos.toFixed(1).replace('.', ','),
            consumo_km_por_L: consumoReal.toFixed(2).replace('.', ','),
            data_abastecimento: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log("📝 Dados do abastecimento:", abastecimentoData);
        console.log(`📁 Localização: custos/abastecimento_motoristas/${loginDocId}`);
        
        // Referência ao documento
        const docRef = window.db.collection("custos").doc("abastecimento_motoristas");
        
        // Buscar o documento atual
        const docSnap = await docRef.get();
        
        let usuarioData = {};
        
        if (docSnap.exists) {
            // Se o documento existe, pegar os dados atuais
            usuarioData = docSnap.data();
        }
        
        // Obter ou criar o mapa do usuário
        let userMap = usuarioData[loginDocId] || {};
        
        // Adicionar o novo abastecimento
        userMap[campoAbastecimento] = abastecimentoData;
        
        // Atualizar o L_abastecimento_atual (última quantidade de litros)
        userMap.L_abastecimento_atual = litrosAbastecidos.toFixed(1).replace('.', ',');
        
        // Atualizar o consumo_medio_atual_km_por_L (último consumo médio)
        userMap.consumo_medio_atual_km_por_L = consumoReal.toFixed(2).replace('.', ',');
        
        console.log("📊 Valores atuais armazenados:");
        console.log(`   L_abastecimento_atual: ${userMap.L_abastecimento_atual} L`);
        console.log(`   consumo_medio_atual_km_por_L: ${userMap.consumo_medio_atual_km_por_L} km/L`);
        
        // Atualizar o mapa do usuário no documento principal
        usuarioData[loginDocId] = userMap;
        
        console.log("📤 Salvando estrutura completa:", usuarioData);
        
        // Salvar o documento completo
        await docRef.set(usuarioData);
        
        console.log("✅ Abastecimento salvo com sucesso!");
        alert("Abastecimento registrado com sucesso!");
        
        // Limpar formulário
        document.getElementById("abastecimento-form").reset();
        document.getElementById("distancia_percorrida").textContent = "0,0";
        document.getElementById("consumo_real").textContent = "0,0";
        
        // Recarregar histórico
        await loadHistoricoAbastecimentos();
        
    } catch (error) {
        console.error("❌ Erro ao salvar abastecimento:", error);
        
        let errorMessage = error.message;
        if (error.message.includes("offline") || error.message.includes("network")) {
            errorMessage = "Sem conexão com internet. Verifique sua rede e tente novamente.";
        } else if (error.message.includes("permission")) {
            errorMessage = "Sem permissão para salvar. Contate o administrador.";
        }
        
        alert(`Erro ao salvar: ${errorMessage}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Função para carregar histórico de abastecimentos
async function loadHistoricoAbastecimentos() {
    const abastecimentosList = document.getElementById("abastecimentos-list");
    if (!abastecimentosList) return;
    
    if (!window.db) {
        console.error("❌ Firestore não disponível");
        abastecimentosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i>
                <p>Erro de conexão com banco de dados</p>
            </div>
        `;
        return;
    }
    
    abastecimentosList.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin me-2"></i>Carregando...
        </div>
    `;
    
    try {
        const loginDocId = await getLoginDocId();
        
        if (!loginDocId) {
            abastecimentosList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash fa-3x mb-3 opacity-50"></i>
                    <p>Usuário não identificado</p>
                </div>
            `;
            return;
        }
        
        console.log(`📖 Carregando histórico para: ${loginDocId}`);
        
        const docRef = window.db.collection("custos").doc("abastecimento_motoristas");
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            abastecimentosList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gas-pump fa-3x mb-3 opacity-50"></i>
                    <p>Nenhum registro de abastecimento</p>
                </div>
            `;
            return;
        }
        
        const data = docSnap.data();
        const usuarioData = data[loginDocId];
        
        if (!usuarioData) {
            abastecimentosList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gas-pump fa-3x mb-3 opacity-50"></i>
                    <p>Nenhum registro de abastecimento</p>
                </div>
            `;
            return;
        }
        
        // Coletar todos os abastecimentos
        let abastecimentos = [];
        let litrosAtual = usuarioData.L_abastecimento_atual || "0";
        let consumoAtual = usuarioData.consumo_medio_atual_km_por_L || "0";
        
        for (const [key, value] of Object.entries(usuarioData)) {
            if (key.startsWith("abastecimento_") && value.data_abastecimento) {
                abastecimentos.push({
                    id: key,
                    ...value
                });
            }
        }
        
        // Ordenar por data (mais recente primeiro)
        abastecimentos.sort((a, b) => {
            const dateA = a.data_abastecimento?.seconds || 0;
            const dateB = b.data_abastecimento?.seconds || 0;
            return dateB - dateA;
        });
        
        if (abastecimentos.length === 0) {
            abastecimentosList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gas-pump fa-3x mb-3 opacity-50"></i>
                    <p>Nenhum registro de abastecimento</p>
                </div>
            `;
            return;
        }
        
        // Montar HTML do histórico com informações atualizadas
        let html = `
            <div class="mb-3 p-3 bg-light rounded-3">
                <div class="row g-3">
                    <div class="col-6 text-center">
                        <div class="small text-secondary mb-1">
                            <i class="fas fa-gas-pump me-1"></i>Último Abastecimento
                        </div>
                        <div class="fw-bold text-primary fs-5">${litrosAtual.replace('.', ',')} L</div>
                    </div>
                    <div class="col-6 text-center">
                        <div class="small text-secondary mb-1">
                            <i class="fas fa-chart-line me-1"></i>Último Consumo Médio
                        </div>
                        <div class="fw-bold text-success fs-5">${consumoAtual.replace('.', ',')} km/L</div>
                    </div>
                </div>
            </div>
        `;
        
        abastecimentos.forEach((abast, index) => {
            const dataFormatada = abast.data_abastecimento
                ? new Date(abast.data_abastecimento.seconds * 1000).toLocaleString("pt-BR")
                : "Data não disponível";
            
            const kmInicial = (abast.km_odometro_inicial || "0").replace(',', '.');
            const kmFinal = (abast.km_odometro_final || "0").replace(',', '.');
            const distancia = (abast.km_distancia_percorrida || "0").replace(',', '.');
            const litros = (abast.L_abastecimento || "0").replace(',', '.');
            const consumo = abast.consumo_km_por_L || "0";
            
            // Destacar o registro mais recente
            const isLatest = index === 0;
            const cardClass = isLatest ? 'border-primary' : '';
            
            html += `
                <div class="abastecimento-card ${cardClass}" style="background: #fff; border: 1px solid ${isLatest ? '#0d6efd' : '#e9ecef'}; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                    <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <span class="badge ${isLatest ? 'bg-primary' : 'bg-secondary'}">${abast.id}</span>
                        <span class="small text-secondary">
                            <i class="fas fa-calendar-alt me-1"></i>${dataFormatada}
                        </span>
                    </div>
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="small text-secondary">Odômetro Inicial</div>
                            <div class="fw-semibold">${kmInicial} km</div>
                        </div>
                        <div class="col-6">
                            <div class="small text-secondary">Odômetro Final</div>
                            <div class="fw-semibold">${kmFinal} km</div>
                        </div>
                        <div class="col-6">
                            <div class="small text-secondary">Distância Percorrida</div>
                            <div class="fw-semibold">${distancia} km</div>
                        </div>
                        <div class="col-6">
                            <div class="small text-secondary">Litros Abastecidos</div>
                            <div class="fw-semibold">${litros} L</div>
                        </div>
                        <div class="col-12 mt-2">
                            <div class="bg-light rounded-2 p-2 text-center">
                                <span class="small text-secondary">Consumo Real</span>
                                <span class="fw-bold text-primary ms-2">${consumo.replace('.', ',')} km/L</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        abastecimentosList.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Erro ao carregar histórico:", error);
        abastecimentosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i>
                <p>Erro ao carregar histórico: ${error.message}</p>
            </div>
        `;
    }
}

// Função de cleanup
function cleanupAbastecimento() {
    console.log("🧹 Limpando recursos da tela de Abastecimento");
    
    const kmInicial = document.getElementById("km_odometro_inicial");
    const kmFinal = document.getElementById("km_odometro_final");
    const litros = document.getElementById("litros_abastecidos");
    
    if (kmInicial) kmInicial.removeEventListener("input", calcularResultados);
    if (kmFinal) kmFinal.removeEventListener("input", calcularResultados);
    if (litros) litros.removeEventListener("input", calcularResultados);
    
    const form = document.getElementById("abastecimento-form");
    if (form) form.removeEventListener("submit", handleAbastecimentoSubmit);
}

// Exportar funções globais
window.initAbastecimento = initAbastecimento;
window.cleanupAbastecimento = cleanupAbastecimento;
