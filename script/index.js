// ============================================
// INDEX.JS - Só executa se usuário estiver logado
// ============================================

console.log("🔵 INDEX.JS CARREGADO");

// ========== VERIFICAÇÃO IMEDIATA ==========
const savedUser = localStorage.getItem("frotatrack_user");

if (!savedUser) {
    console.log("❌ Nenhum usuário logado, redirecionando para login.html");
    window.location.href = "login.html";
    throw new Error("Redirecionando para login");
}

// Se chegou aqui, tem usuário no localStorage
let currentUser = null;
let telaAtual = "";

try {
    currentUser = JSON.parse(savedUser);
    console.log("✅ Usuário encontrado:", currentUser.nome, "Perfil:", currentUser.perfil);
} catch (e) {
    console.error("❌ Erro ao parsear usuário:", e);
    localStorage.removeItem("frotatrack_user");
    window.location.href = "login.html";
    throw new Error("Erro no usuário");
}

// Variáveis globais
window.currentUser = currentUser;
window.currentLocation = null;
window.currentAddress = "";
window.watchPositionId = null;
window.map = null;
window.marker = null;
window.currentField = "";
window.mapInitialized = false;
window.googleMapsPromise = null;
window.googleMapsApiKey = null;
window.autocompletePartida = null;
window.autocompleteEntrega = null;
window.searchBox = null;

window.db = null;
window.auth = null;

// ========== CRIAÇÃO DOS TEMPLATES DINÂMICOS ==========

function createTemplates() {
    console.log("📝 Criando templates dinâmicos...");
    
    // Template Operador (para perfil "operador")
    if (!document.getElementById("template-operador")) {
        const templateOperador = document.createElement("template");
        templateOperador.id = "template-operador";
        templateOperador.innerHTML = `
            <div class="bg-gradient-primary px-4 py-3 text-white sticky-top">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="imagens/logo.png" alt="Logo" style="width: 32px; height: 32px; object-fit: contain;" class="me-2" onerror="this.style.display='none'">
                        <span class="fw-semibold" id="operador-nome">Operador</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-white bg-opacity-20 text-white px-3 py-2 rounded-pill" id="tela-atual">
                            <i class="fas fa-road me-1"></i>Viagens
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm bg-opacity-20 border-0 text-white" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-vertical fs-5"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" id="menu-opcoes"></ul>
                        </div>
                    </div>
                </div>
            </div>
            <div id="tela-container" class="px-3 py-3"></div>
        `;
        document.body.appendChild(templateOperador);
    }
    
    // Template Gestor (para perfil "gerente" ou "supervisor")
    if (!document.getElementById("template-gestor")) {
        const templateGestor = document.createElement("template");
        templateGestor.id = "template-gestor";
        templateGestor.innerHTML = `
            <div class="bg-gradient-primary px-4 py-3 text-white sticky-top">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="imagens/logo.png" alt="Logo" style="width: 32px; height: 32px; object-fit: contain;" class="me-2" onerror="this.style.display='none'">
                        <span class="fw-semibold" id="gestor-nome">Gestor</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-white bg-opacity-20 text-white px-3 py-2 rounded-pill" id="tela-atual">
                            <i class="fas fa-chart-bar me-1"></i>Relatórios
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm bg-opacity-20 border-0 text-white" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-vertical fs-5"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" id="menu-opcoes"></ul>
                        </div>
                    </div>
                </div>
            </div>
            <div id="tela-container" class="px-3 py-3"></div>
        `;
        document.body.appendChild(templateGestor);
    }
    
    // Template Modal Mapa (global)
    if (!document.getElementById("template-modal-mapa")) {
        const modalTemplate = document.createElement("template");
        modalTemplate.id = "template-modal-mapa";
        modalTemplate.innerHTML = `
            <div class="modal fade" id="map-modal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white py-2">
                            <h6 class="modal-title" id="map-modal-title"><i class="fas fa-map-marked-alt me-2"></i>Selecione no mapa</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0"><div id="map" style="height: 100%; width: 100%;"></div></div>
                        <div class="modal-footer py-2">
                            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-sm btn-primary" id="confirm-map-location"><i class="fas fa-check me-2"></i>Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalTemplate);
    }
    
    console.log("✅ Templates criados");
}

// ========== AGUARDAR FIREBASE ==========

function waitForFirebase() {
    return new Promise((resolve) => {
        // Verificar se já está disponível
        if ((typeof db !== 'undefined' && db) || window.db) {
            console.log("✅ Firebase já disponível na verificação inicial");
            resolve();
            return;
        }
        
        // Aguardar evento
        const handleReady = () => {
            console.log("📡 Evento firebase-ready recebido");
            resolve();
        };
        
        document.addEventListener("firebase-ready", handleReady, { once: true });
        
        // Fallback: se o evento não for disparado em 3 segundos, tenta resolver mesmo assim
        setTimeout(() => {
            // Verificar novamente se o Firebase está disponível
            if ((typeof db !== 'undefined' && db) || window.db) {
                console.log("✅ Firebase disponível após timeout");
                document.removeEventListener("firebase-ready", handleReady);
                resolve();
            } else {
                console.warn("⚠️ Firebase não detectado após timeout, continuando mesmo assim...");
                document.removeEventListener("firebase-ready", handleReady);
                resolve(); // Resolve mesmo sem Firebase para não travar
            }
        }, 3000);
    });
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM carregado");
    
    // Criar templates primeiro
    createTemplates();
    
    await waitForFirebase();
    console.log("✅ Firebase disponível");
    
    // CORREÇÃO: Atribuir db e auth corretamente
    // Verificar se a variável global db já existe (do arquivo de config)
    if (typeof db !== 'undefined' && db) {
        window.db = db;
        console.log("✅ window.db definido a partir da variável global db");
    } 
    // Se não, tentar obter do firebase
    else if (firebase && firebase.firestore) {
        window.db = firebase.firestore();
        console.log("✅ window.db obtido via firebase.firestore()");
    }
    // Última tentativa: buscar do window
    else if (window.db) {
        console.log("✅ window.db já existente");
    }
    
    // Mesmo processo para auth
    if (typeof auth !== 'undefined' && auth) {
        window.auth = auth;
        console.log("✅ window.auth definido a partir da variável global auth");
    } else if (firebase && firebase.auth) {
        window.auth = firebase.auth();
        console.log("✅ window.auth obtido via firebase.auth()");
    } else if (window.auth) {
        console.log("✅ window.auth já existente");
    }
    
    console.log("📦 db disponível:", !!window.db);
    console.log("📦 auth disponível:", !!window.auth);
    
    // Verificar se o Firestore está disponível
    if (!window.db) {
        console.error("❌ Firestore não disponível! Tentando uma última recuperação...");
        // Tentar obter diretamente
        try {
            window.db = firebase.firestore();
            console.log("✅ Firestore obtido com sucesso na última tentativa");
        } catch (e) {
            console.error("❌ Falha fatal ao obter Firestore:", e);
            // Mostrar mensagem de erro na tela
            const app = document.getElementById("app");
            if (app) {
                app.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h2>Erro de conexão</h2>
                        <p>Não foi possível conectar ao banco de dados.</p>
                        <p class="text-muted">Tente recarregar a página.</p>
                        <button onclick="location.reload()" class="btn btn-primary mt-3">Recarregar</button>
                    </div>
                `;
            }
            return;
        }
    }
    
    // Renderizar a tela
    renderScreen();
});

// ========== RENDERIZAÇÃO ==========

function renderScreen() {
    const app = document.getElementById("app");
    if (!app) {
        console.error("❌ Elemento app não encontrado");
        return;
    }
    
    const perfil = currentUser.perfil;
    const isAdmin = currentUser.isAdmin || perfil === "admin";
    
    console.log("🎨 Renderizando para perfil:", perfil);
    console.log("👤 Usuário:", currentUser.nome);
    
    app.innerHTML = "";
    
    // Perfil OPERADOR
    if (perfil === "operador") {
        const template = document.getElementById("template-operador");
        if (template) {
            const content = template.content.cloneNode(true);
            const nomeSpan = content.querySelector("#operador-nome");
            if (nomeSpan) nomeSpan.textContent = currentUser.nome;
            app.appendChild(content);
            
            // Adicionar modal de mapa
            const modalTemplate = document.getElementById("template-modal-mapa");
            if (modalTemplate) {
                app.appendChild(modalTemplate.content.cloneNode(true));
            }
            
            telaAtual = "viagens";
            setupMenuOperador();
            carregarTela("viagens");
            
            setTimeout(() => {
                if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
                if (typeof loadGoogleMapsWithFirebaseKey === "function") {
                    loadGoogleMapsWithFirebaseKey();
                }
            }, 100);
        } else {
            console.error("❌ Template operador não encontrado");
            fallbackScreen();
        }
    } 
    // Perfil GERENTE ou SUPERVISOR
    else if (perfil === "gerente" || perfil === "supervisor") {
        const template = document.getElementById("template-gestor");
        if (template) {
            const content = template.content.cloneNode(true);
            const nomeSpan = content.querySelector("#gestor-nome");
            if (nomeSpan) nomeSpan.textContent = currentUser.nome;
            app.appendChild(content);
            
            telaAtual = "relatorios";
            setupMenuGestor();
            carregarTela("relatorios");
            
            setTimeout(() => {
                if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
            }, 100);
        } else {
            console.error("❌ Template gestor não encontrado");
            fallbackScreen();
        }
    } 
    // Perfil ADMIN - Pode acessar todas as telas, iniciar com relatórios
    else if (isAdmin || perfil === "admin") {
        const template = document.getElementById("template-gestor");
        if (template) {
            const content = template.content.cloneNode(true);
            const nomeSpan = content.querySelector("#gestor-nome");
            if (nomeSpan) nomeSpan.textContent = `${currentUser.nome} (Admin)`;
            app.appendChild(content);
            
            // Adicionar modal de mapa para o admin também (necessário para tela de viagens)
            const modalTemplate = document.getElementById("template-modal-mapa");
            if (modalTemplate) {
                app.appendChild(modalTemplate.content.cloneNode(true));
            }
            
            telaAtual = "relatorios";
            setupMenuAdmin();
            carregarTela("relatorios");
            
            setTimeout(() => {
                if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
            }, 100);
        } else {
            console.error("❌ Template gestor não encontrado");
            fallbackScreen();
        }
    } else {
        console.error("❌ Perfil inválido:", perfil);
        fallbackScreen();
    }
}

function fallbackScreen() {
    const app = document.getElementById("app");
    if (app) {
        app.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>Bem-vindo, ${currentUser?.nome || "Usuário"}!</h2>
                <p>Perfil: ${currentUser?.perfil || "desconhecido"}</p>
                <p class="text-muted">Modo de fallback - algumas funcionalidades podem não estar disponíveis</p>
                <button id="fallback-logout" class="btn btn-danger mt-3">Sair</button>
            </div>
        `;
        document.getElementById("fallback-logout")?.addEventListener("click", () => handleLogout());
    }
}

// ========== CARREGAMENTO DE TELAS ==========

function carregarTela(tela) {
    telaAtual = tela;
    
    const container = document.getElementById("tela-container");
    if (!container) return;
    
    // Garantir que o modal de mapa existe para telas que precisam dele
    const telasQuePrecisamMapa = ["viagens"];
    if (telasQuePrecisamMapa.includes(tela) && !document.getElementById("map-modal")) {
        const modalTemplate = document.getElementById("template-modal-mapa");
        if (modalTemplate) {
            document.getElementById("app").appendChild(modalTemplate.content.cloneNode(true));
        }
    }
    
    // Chamar a função de inicialização da tela correspondente
    const initMap = {
        viagens: "initViagens",
        manutencao: "initManutencao",
        abastecimento: "initAbastecimento",
        relatorios: "initRelatorios",
        cadastros: "initCadastros",
        custos: "initCustosFixos"
    };
    
    const initFn = initMap[tela];
    if (initFn && typeof window[initFn] === "function") {
        console.log(`🎯 Inicializando tela: ${tela}`);
        container.innerHTML = "";
        window[initFn](container);
        
        // Se for tela de viagens, carregar Google Maps
        if (tela === "viagens" && typeof loadGoogleMapsWithFirebaseKey === "function") {
            setTimeout(() => {
                loadGoogleMapsWithFirebaseKey();
            }, 500);
        }
    } else {
        console.error(`❌ Função ${initFn} não encontrada`);
        container.innerHTML = `<div class="alert alert-danger m-3">Erro: Tela "${tela}" não encontrada</div>`;
    }
}

// ========== MENUS ==========

function setupMenuOperador() {
    const menu = document.getElementById("menu-opcoes");
    if (!menu) return;
    menu.innerHTML = "";
    
    const opcoes = [];
    if (telaAtual !== "viagens") opcoes.push({ icone: "fa-road", texto: "Viagens", tela: "viagens" });
    if (telaAtual !== "manutencao") opcoes.push({ icone: "fa-tools", texto: "Manutenção", tela: "manutencao" });
    if (telaAtual !== "abastecimento") opcoes.push({ icone: "fa-gas-pump", texto: "Abastecimento", tela: "abastecimento" });
    
    opcoes.forEach(op => {
        const item = document.createElement("li");
        item.innerHTML = `<a class="dropdown-item" href="#" data-tela="${op.tela}"><i class="fas ${op.icone} me-2"></i>${op.texto}</a>`;
        menu.appendChild(item);
    });
    
    if (opcoes.length) {
        const div = document.createElement("li");
        div.innerHTML = '<hr class="dropdown-divider">';
        menu.appendChild(div);
    }
    
    const logout = document.createElement("li");
    logout.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
    menu.appendChild(logout);
    
    menu.querySelectorAll("a[data-tela]").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            carregarTela(link.dataset.tela);
            const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
            if (dropdown) dropdown.hide();
        });
    });
    
    document.getElementById("menu-logout")?.addEventListener("click", e => {
        e.preventDefault();
        handleLogout();
    });
}

function setupMenuGestor() {
    const menu = document.getElementById("menu-opcoes");
    if (!menu) return;
    menu.innerHTML = "";
    
    const opcoes = [];
    if (telaAtual !== "relatorios") opcoes.push({ icone: "fa-chart-bar", texto: "Relatórios", tela: "relatorios" });
    if (telaAtual !== "cadastros") opcoes.push({ icone: "fa-address-card", texto: "Gestão de Cadastros", tela: "cadastros" });
    if (telaAtual !== "custos") opcoes.push({ icone: "fa-coins", texto: "Custos Fixos", tela: "custos" });
    
    opcoes.forEach(op => {
        const item = document.createElement("li");
        item.innerHTML = `<a class="dropdown-item" href="#" data-tela="${op.tela}"><i class="fas ${op.icone} me-2"></i>${op.texto}</a>`;
        menu.appendChild(item);
    });
    
    if (opcoes.length) {
        const div = document.createElement("li");
        div.innerHTML = '<hr class="dropdown-divider">';
        menu.appendChild(div);
    }
    
    const logout = document.createElement("li");
    logout.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
    menu.appendChild(logout);
    
    menu.querySelectorAll("a[data-tela]").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            carregarTela(link.dataset.tela);
            const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
            if (dropdown) dropdown.hide();
        });
    });
    
    document.getElementById("menu-logout")?.addEventListener("click", e => {
        e.preventDefault();
        handleLogout();
    });
}

function setupMenuAdmin() {
    const menu = document.getElementById("menu-opcoes");
    if (!menu) return;
    menu.innerHTML = "";
    
    const opcoes = [
        { icone: "fa-chart-bar", texto: "Relatórios", tela: "relatorios" },
        { icone: "fa-address-card", texto: "Gestão de Cadastros", tela: "cadastros" },
        { icone: "fa-coins", texto: "Custos Fixos", tela: "custos" },
        { icone: "fa-road", texto: "Viagens", tela: "viagens" },
        { icone: "fa-tools", texto: "Manutenção", tela: "manutencao" },
        { icone: "fa-gas-pump", texto: "Abastecimento", tela: "abastecimento" }
    ];
    
    // Filtra para não mostrar a tela atual
    const opcoesFiltradas = opcoes.filter(op => op.tela !== telaAtual);
    
    opcoesFiltradas.forEach(op => {
        const item = document.createElement("li");
        item.innerHTML = `<a class="dropdown-item" href="#" data-tela="${op.tela}"><i class="fas ${op.icone} me-2"></i>${op.texto}</a>`;
        menu.appendChild(item);
    });
    
    const div = document.createElement("li");
    div.innerHTML = '<hr class="dropdown-divider">';
    menu.appendChild(div);
    
    const logout = document.createElement("li");
    logout.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
    menu.appendChild(logout);
    
    menu.querySelectorAll("a[data-tela]").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const tela = link.dataset.tela;
            
            // Para telas de operador, precisamos garantir que o modal de mapa está presente
            if (tela === "viagens" || tela === "manutencao" || tela === "abastecimento") {
                // Verificar se o modal de mapa já existe
                if (!document.getElementById("map-modal")) {
                    const modalTemplate = document.getElementById("template-modal-mapa");
                    if (modalTemplate) {
                        document.getElementById("app").appendChild(modalTemplate.content.cloneNode(true));
                    }
                }
            }
            
            // Atualizar o badge da tela atual
            const badgeTela = document.getElementById("tela-atual");
            if (badgeTela) {
                const icones = {
                    viagens: "fa-road", manutencao: "fa-tools", abastecimento: "fa-gas-pump",
                    relatorios: "fa-chart-bar", cadastros: "fa-address-card", custos: "fa-coins"
                };
                const textos = {
                    viagens: "Viagens", manutencao: "Manutenção", abastecimento: "Abastecimento",
                    relatorios: "Relatórios", cadastros: "Gestão de Cadastros", custos: "Custos Fixos"
                };
                badgeTela.innerHTML = `<i class="fas ${icones[tela] || 'fa-circle'} me-1"></i>${textos[tela] || tela}`;
            }
            
            telaAtual = tela;
            carregarTela(tela);
            
            // Recriar o menu com as opções atualizadas (removendo a tela atual)
            setupMenuAdmin();
            
            // Fecha o dropdown
            const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
            if (dropdown) dropdown.hide();
        });
    });
    
    document.getElementById("menu-logout")?.addEventListener("click", e => {
        e.preventDefault();
        handleLogout();
    });
}

// ========== UTILIDADES ==========

function initBootstrapHelpers() {
    // Destruir popovers existentes
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        const popover = bootstrap.Popover.getInstance(el);
        if (popover) popover.dispose();
        new bootstrap.Popover(el, { trigger: "click", html: true, sanitize: false });
    });
    
    // Fechar popover ao clicar fora
    document.addEventListener("click", e => {
        const isTrigger = e.target.closest('[data-bs-toggle="popover"]');
        const isPopover = e.target.closest(".popover");
        if (!isTrigger && !isPopover) {
            document.querySelectorAll(".popover.show").forEach(p => {
                const trigger = document.querySelector(`[aria-describedby="${p.id}"]`);
                if (trigger) bootstrap.Popover.getInstance(trigger)?.hide();
            });
        }
    });
    
    // Tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el, { trigger: "hover focus click" });
    });
}

function handleLogout() {
    if (window.watchPositionId) navigator.geolocation.clearWatch(window.watchPositionId);
    if (firebase.auth().currentUser) firebase.auth().signOut();
    localStorage.removeItem("frotatrack_user");
    window.location.href = "login.html";
}

// Registrar funções globais
window.initBootstrapHelpers = initBootstrapHelpers;
window.handleLogout = handleLogout;
window.carregarTela = carregarTela;
