// ============================================
// INDEX.JS - Versão completa com todas as telas
// ============================================

console.log("🔵 INDEX.JS CARREGADO");

let currentUser = null;
let telaAtual = "";

// Variáveis globais para as telas
window.currentUser = null;
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

// Aguardar Firebase
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.db && window.auth) {
      resolve();
    } else {
      document.addEventListener("firebase-ready", resolve, { once: true });
      setTimeout(() => {
        if (window.db && window.auth) resolve();
      }, 3000);
    }
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM carregado");

  await waitForFirebase();
  console.log("✅ Firebase disponível");

  window.db = db;
  window.auth = auth;

  // VERIFICAR LOCALSTORAGE PRIMEIRO
  const savedUser = localStorage.getItem("frotatrack_user");
  console.log("📦 localStorage:", savedUser ? "tem usuário" : "vazio");

  if (savedUser) {
    const user = JSON.parse(savedUser);
    console.log("👤 Usuário do localStorage:", user.nome, "Perfil:", user.perfil);
    
    // Verificar se o Firebase Auth está consistente
    const firebaseUser = firebase.auth().currentUser;
    if (firebaseUser && firebaseUser.email !== user.email) {
      console.log("⚠️ Inconsistência, limpando...");
      localStorage.removeItem("frotatrack_user");
      firebase.auth().signOut();
      window.location.href = "login.html";
      return;
    }
    
    currentUser = user;
    window.currentUser = user;
    renderScreen();
    return;
  }

  // VERIFICAR FIREBASE AUTH
  const firebaseUser = firebase.auth().currentUser;
  console.log("🔥 Firebase user:", firebaseUser ? firebaseUser.email : "nenhum");

  if (firebaseUser) {
    console.log("✅ Firebase autenticado, buscando dados...");
    try {
      let userData = null;
      
      // Buscar admin_logins
      const adminDoc = await db.collection("logins").doc("admin_logins").get();
      if (adminDoc.exists) {
        const admins = adminDoc.data();
        for (const [key, value] of Object.entries(admins)) {
          if (value.email === firebaseUser.email && value.status_ativo === true) {
            userData = value;
            userData.isAdmin = true;
            break;
          }
        }
      }
      
      // Buscar funcionarios_logins
      if (!userData) {
        const funcDoc = await db.collection("logins").doc("funcionarios_logins").get();
        if (funcDoc.exists) {
          const funcs = funcDoc.data();
          for (const [key, value] of Object.entries(funcs)) {
            if (value.email === firebaseUser.email && value.status_ativo === true) {
              userData = value;
              userData.isAdmin = false;
              break;
            }
          }
        }
      }
      
      if (userData) {
        let perfil = userData.perfil;
        if (perfil === "motorista") perfil = "operador";
        
        const appUser = {
          id: firebaseUser.uid,
          login: userData.login,
          nome: userData.nome,
          perfil: perfil,
          email: firebaseUser.email,
          isAdmin: userData.isAdmin || perfil === "admin",
          loginTimestamp: Date.now()
        };
        
        localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
        console.log("✅ Usuário salvo:", appUser.nome, "Perfil:", appUser.perfil);
        
        currentUser = appUser;
        window.currentUser = appUser;
        renderScreen();
        return;
      } else {
        console.error("❌ Usuário não encontrado no Firestore");
        handleLogout();
        return;
      }
    } catch (error) {
      console.error("❌ Erro ao buscar dados:", error);
      handleLogout();
      return;
    }
  }

  // NENHUM USUÁRIO - REDIRECIONAR
  console.log("❌ Nenhum usuário, redirecionando para login");
  window.location.href = "login.html";
});

// ========== RENDERIZAÇÃO COMPLETA ==========

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
  
  // Limpar app
  app.innerHTML = "";
  
  if (perfil === "operador" || perfil === "motorista") {
    // Template do operador
    const template = document.getElementById("template-operador");
    if (template) {
      const content = template.content.cloneNode(true);
      const nomeSpan = content.querySelector("#operador-nome");
      if (nomeSpan) nomeSpan.textContent = currentUser.nome;
      app.appendChild(content);
      
      // Adicionar modal do mapa
      const modalTemplate = document.getElementById("template-modal-mapa");
      if (modalTemplate) app.appendChild(modalTemplate.content.cloneNode(true));
      
      telaAtual = "viagens";
      setupMenuOperador();
      carregarTela("viagens");
      
      setTimeout(() => {
        if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
        if (typeof loadGoogleMapsWithFirebaseKey === "function") loadGoogleMapsWithFirebaseKey();
      }, 100);
    } else {
      console.error("❌ Template operador não encontrado");
      fallbackScreen();
    }
  } 
  else if (perfil === "gerente" || perfil === "supervisor") {
    // Template do gestor
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
  else if (isAdmin) {
    // Template do admin
    const template = document.getElementById("template-gestor");
    if (template) {
      const content = template.content.cloneNode(true);
      const nomeSpan = content.querySelector("#gestor-nome");
      if (nomeSpan) nomeSpan.textContent = `${currentUser.nome} (Admin)`;
      app.appendChild(content);
      
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
        <p>Modo de fallback - contate o administrador</p>
        <button id="fallback-logout" class="btn btn-danger mt-3">Sair</button>
      </div>
    `;
    document.getElementById("fallback-logout")?.addEventListener("click", () => {
      handleLogout();
    });
  }
}

// ========== CARREGAMENTO DE TELAS ==========

function carregarTela(tela) {
  telaAtual = tela;
  
  // Atualizar badge
  const badgeTela = document.getElementById("tela-atual");
  if (badgeTela) {
    const icones = {
      viagens: "fa-road", manutencao: "fa-tools", abastecimento: "fa-gas-pump",
      relatorios: "fa-chart-bar", cadastros: "fa-address-card", custos: "fa-coins",
      "gerenciar-usuarios": "fa-users"
    };
    const textos = {
      viagens: "Viagens", manutencao: "Manutenção", abastecimento: "Abastecimento",
      relatorios: "Relatórios", cadastros: "Gestão de Cadastros", custos: "Custos Fixos",
      "gerenciar-usuarios": "Gerenciar Usuários"
    };
    badgeTela.innerHTML = `<i class="fas ${icones[tela] || 'fa-circle'} me-1"></i>${textos[tela] || tela}`;
  }
  
  // Carregar template da tela
  const container = document.getElementById("tela-container");
  if (!container) {
    console.error("❌ Container tela-container não encontrado");
    return;
  }
  
  const templateId = `template-tela-${tela}`;
  const template = document.getElementById(templateId);
  
  if (template) {
    container.innerHTML = "";
    container.appendChild(template.content.cloneNode(true));
    console.log(`✅ Tela "${tela}" carregada`);
    
    // Inicializar script específico da tela
    const scriptMap = {
      viagens: "initViagens",
      manutencao: "initManutencao",
      abastecimento: "initAbastecimento",
      relatorios: "initRelatorios",
      cadastros: "initCadastros",
      custos: "initCustosFixos"
    };
    
    const initFn = scriptMap[tela];
    if (initFn && typeof window[initFn] === "function") {
      setTimeout(() => window[initFn](), 100);
    }
  } else {
    console.error(`❌ Template "${templateId}" não encontrado`);
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
    { icone: "fa-gas-pump", texto: "Abastecimento", tela: "abastecimento" },
    { icone: "fa-users", texto: "Gerenciar Usuários", tela: "gerenciar-usuarios" }
  ];
  
  opcoes.forEach(op => {
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

// ========== UTILIDADES ==========

function initBootstrapHelpers() {
  // Popovers
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
