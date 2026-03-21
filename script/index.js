// ============================================
// INDEX.JS - Arquivo principal
// Gerencia autenticação, menus e carregamento de telas
// ============================================

// Estado da aplicação
let currentUser = null;
let telaAtual = "";

// Variáveis globais compartilhadas entre telas
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

// Referências globais
window.db = null;
window.auth = null;

// ========== INICIALIZAÇÃO ==========

function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.db && window.auth) {
      resolve();
    } else {
      document.addEventListener("firebase-ready", resolve, { once: true });
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 App inicializado");

  await waitForFirebase();
  console.log("✅ Firebase disponível");

  window.db = db;
  window.auth = auth;

  firebase.auth().onAuthStateChanged(async (firebaseUser) => {
    console.log("🔥 Auth state changed:", firebaseUser ? `Usuário: ${firebaseUser.email}` : "Nenhum usuário");
    
    if (firebaseUser) {
      const savedUser = localStorage.getItem("frotatrack_user");
      
      if (savedUser) {
        const localUser = JSON.parse(savedUser);
        if (localUser.email === firebaseUser.email) {
          console.log("✅ Usuário autenticado via localStorage");
          window.currentUser = localUser;
          currentUser = localUser;
          renderScreen();
          return;
        }
      }
      
      console.log("📡 Buscando dados do usuário no Firestore...");
      try {
        let userData = null;
        let userDocPath = null;
        let userMapKey = null;
        
        const adminDoc = await db.collection("logins").doc("admin_logins").get();
        if (adminDoc.exists) {
          const adminLogins = adminDoc.data();
          for (const [key, value] of Object.entries(adminLogins)) {
            if (value.email === firebaseUser.email && value.status_ativo === true) {
              userData = value;
              userDocPath = "admin_logins";
              userMapKey = key;
              userData.isAdmin = true;
              break;
            }
          }
        }
        
        if (!userData) {
          const funcionariosDoc = await db.collection("logins").doc("funcionarios_logins").get();
          if (funcionariosDoc.exists) {
            const funcionariosLogins = funcionariosDoc.data();
            for (const [key, value] of Object.entries(funcionariosLogins)) {
              if (value.email === firebaseUser.email && value.status_ativo === true) {
                userData = value;
                userDocPath = "funcionarios_logins";
                userMapKey = key;
                userData.isAdmin = false;
                break;
              }
            }
          }
        }
        
        if (userData) {
          let perfilFinal = userData.perfil;
          if (perfilFinal === "motorista") perfilFinal = "operador";
          
          const appUser = {
            id: firebaseUser.uid,
            login: userData.login,
            nome: userData.nome,
            perfil: perfilFinal,
            email: firebaseUser.email,
            isAdmin: userData.isAdmin || perfilFinal === "admin",
            docPath: userDocPath,
            docKey: userMapKey,
            loginTimestamp: Date.now()
          };
          
          localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
          console.log("✅ Dados do usuário salvos");
          console.log("🔍 Perfil:", appUser.perfil);
          
          window.currentUser = appUser;
          currentUser = appUser;
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
    } else {
      const savedUser = localStorage.getItem("frotatrack_user");
      if (savedUser) {
        console.log("⚠️ Limpando dados sem autenticação");
        localStorage.removeItem("frotatrack_user");
      }
      console.log("❌ Redirecionando para login");
      window.location.href = "login.html";
    }
  });
});

// ========== RENDERIZAÇÃO DE TELA ==========

function renderScreen() {
  const app = document.getElementById("app");
  const perfil = currentUser.perfil;
  const isAdmin = currentUser.isAdmin || perfil === "admin";

  console.log("🎨 Renderizando tela para perfil:", perfil);

  if (perfil === "operador" || perfil === "motorista") {
    const template = document.getElementById("template-operador");
    if (template) {
      const content = template.content.cloneNode(true);
      content.querySelector("#operador-nome").textContent = currentUser.nome;
      app.innerHTML = "";
      app.appendChild(content);
    } else {
      const motoristaTemplate = document.getElementById("template-motorista");
      if (motoristaTemplate) {
        const content = motoristaTemplate.content.cloneNode(true);
        content.querySelector("#motorista-nome").textContent = currentUser.nome;
        app.innerHTML = "";
        app.appendChild(content);
      }
    }

    const modalTemplate = document.getElementById("template-modal-mapa");
    if (modalTemplate) app.appendChild(modalTemplate.content.cloneNode(true));

    telaAtual = "viagens";
    setupMenuOperador();
    carregarTela("viagens");

    setTimeout(() => {
      if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
      if (typeof loadGoogleMapsWithFirebaseKey === "function") loadGoogleMapsWithFirebaseKey();
    }, 100);
  } 
  else if (perfil === "gerente" || perfil === "supervisor") {
    const template = document.getElementById("template-gestor");
    if (template) {
      const content = template.content.cloneNode(true);
      content.querySelector("#gestor-nome").textContent = currentUser.nome;
      app.innerHTML = "";
      app.appendChild(content);
    }

    telaAtual = "relatorios";
    setupMenuGestor();
    carregarTela("relatorios");

    setTimeout(() => {
      if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
    }, 100);
  } 
  else if (isAdmin) {
    const template = document.getElementById("template-gestor");
    if (template) {
      const content = template.content.cloneNode(true);
      content.querySelector("#gestor-nome").textContent = `${currentUser.nome} (Admin)`;
      app.innerHTML = "";
      app.appendChild(content);
    }

    telaAtual = "relatorios";
    setupMenuAdmin();
    carregarTela("relatorios");

    setTimeout(() => {
      if (typeof initBootstrapHelpers === "function") initBootstrapHelpers();
    }, 100);
  }
}

// ========== CARREGAMENTO DE TELAS ==========

function carregarTela(tela) {
  telaAtual = tela;

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

  const container = document.getElementById("tela-container");
  if (!container) return;

  const templateId = `template-tela-${tela}`;
  const template = document.getElementById(templateId);

  if (template) {
    container.innerHTML = "";
    container.appendChild(template.content.cloneNode(true));

    // Carregar script específico da tela
    const scriptMap = {
      viagens: "viagens",
      manutencao: "manutencao",
      abastecimento: "abastecimento",
      relatorios: "relatorios",
      cadastros: "cadastros",
      custos: "custos_fixos"
    };

    const scriptName = scriptMap[tela];
    if (scriptName && typeof window[`init${capitalize(scriptName)}`] === "function") {
      window[`init${capitalize(scriptName)}`]();
    } else if (scriptName) {
      console.log(`⏳ Aguardando carregamento do script: ${scriptName}.js`);
      setTimeout(() => {
        if (typeof window[`init${capitalize(scriptName)}`] === "function") {
          window[`init${capitalize(scriptName)}`]();
        }
      }, 100);
    }
  }

  if (tela === "viagens" || tela === "manutencao" || tela === "abastecimento") {
    setupMenuOperador();
  } else {
    setupMenuGestor();
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== MENUS ==========

function setupMenuOperador() {
  const menuOpcoes = document.getElementById("menu-opcoes");
  if (!menuOpcoes) return;
  menuOpcoes.innerHTML = "";

  const opcoes = [];
  if (telaAtual !== "viagens") opcoes.push({ icone: "fa-road", texto: "Viagens", tela: "viagens" });
  if (telaAtual !== "manutencao") opcoes.push({ icone: "fa-tools", texto: "Manutenção", tela: "manutencao" });
  if (telaAtual !== "abastecimento") opcoes.push({ icone: "fa-gas-pump", texto: "Abastecimento", tela: "abastecimento" });

  opcoes.forEach(op => {
    const item = document.createElement("li");
    item.innerHTML = `<a class="dropdown-item" href="#" data-tela="${op.tela}"><i class="fas ${op.icone} me-2"></i>${op.texto}</a>`;
    menuOpcoes.appendChild(item);
  });

  if (opcoes.length > 0) {
    const divider = document.createElement("li");
    divider.innerHTML = '<hr class="dropdown-divider">';
    menuOpcoes.appendChild(divider);
  }

  const logoutItem = document.createElement("li");
  logoutItem.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
  menuOpcoes.appendChild(logoutItem);

  menuOpcoes.querySelectorAll("a[data-tela]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      carregarTela(e.currentTarget.dataset.tela);
      const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
      if (dropdown) dropdown.hide();
    });
  });

  document.getElementById("menu-logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });
}

function setupMenuGestor() {
  const menuOpcoes = document.getElementById("menu-opcoes");
  if (!menuOpcoes) return;
  menuOpcoes.innerHTML = "";

  const opcoes = [];
  if (telaAtual !== "relatorios") opcoes.push({ icone: "fa-chart-bar", texto: "Relatórios", tela: "relatorios" });
  if (telaAtual !== "cadastros") opcoes.push({ icone: "fa-address-card", texto: "Gestão de Cadastros", tela: "cadastros" });
  if (telaAtual !== "custos") opcoes.push({ icone: "fa-coins", texto: "Custos Fixos", tela: "custos" });

  opcoes.forEach(op => {
    const item = document.createElement("li");
    item.innerHTML = `<a class="dropdown-item" href="#" data-tela="${op.tela}"><i class="fas ${op.icone} me-2"></i>${op.texto}</a>`;
    menuOpcoes.appendChild(item);
  });

  if (opcoes.length > 0) {
    const divider = document.createElement("li");
    divider.innerHTML = '<hr class="dropdown-divider">';
    menuOpcoes.appendChild(divider);
  }

  const logoutItem = document.createElement("li");
  logoutItem.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
  menuOpcoes.appendChild(logoutItem);

  menuOpcoes.querySelectorAll("a[data-tela]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      carregarTela(e.currentTarget.dataset.tela);
      const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
      if (dropdown) dropdown.hide();
    });
  });

  document.getElementById("menu-logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });
}

function setupMenuAdmin() {
  const menuOpcoes = document.getElementById("menu-opcoes");
  if (!menuOpcoes) return;
  menuOpcoes.innerHTML = "";

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
    menuOpcoes.appendChild(item);
  });

  const divider = document.createElement("li");
  divider.innerHTML = '<hr class="dropdown-divider">';
  menuOpcoes.appendChild(divider);

  const logoutItem = document.createElement("li");
  logoutItem.innerHTML = `<a class="dropdown-item text-danger" href="#" id="menu-logout"><i class="fas fa-sign-out-alt me-2"></i>Sair</a>`;
  menuOpcoes.appendChild(logoutItem);

  menuOpcoes.querySelectorAll("a[data-tela]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      carregarTela(e.currentTarget.dataset.tela);
      const dropdown = bootstrap.Dropdown.getInstance(document.querySelector('[data-bs-toggle="dropdown"]'));
      if (dropdown) dropdown.hide();
    });
  });

  document.getElementById("menu-logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });
}

// ========== UTILIDADES ==========

function initBootstrapHelpers() {
  const existingPopovers = document.querySelectorAll('[data-bs-toggle="popover"]');
  existingPopovers.forEach(el => {
    const popover = bootstrap.Popover.getInstance(el);
    if (popover) popover.dispose();
  });

  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(element => {
    new bootstrap.Popover(element, { trigger: "click", html: true, sanitize: false });
  });

  document.addEventListener("click", function(e) {
    const isPopoverTrigger = e.target.closest('[data-bs-toggle="popover"]');
    const isPopover = e.target.closest(".popover");
    if (!isPopoverTrigger && !isPopover) {
      document.querySelectorAll(".popover.show").forEach(popoverEl => {
        const triggerEl = document.querySelector(`[aria-describedby="${popoverEl.id}"]`);
        if (triggerEl) bootstrap.Popover.getInstance(triggerEl)?.hide();
      });
    }
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
    new bootstrap.Tooltip(element, { trigger: "hover focus click" });
  });
}

function handleLogout() {
  if (window.watchPositionId) navigator.geolocation.clearWatch(window.watchPositionId);
  if (firebase.auth().currentUser) firebase.auth().signOut();
  localStorage.removeItem("frotatrack_user");
  window.location.href = "login.html";
}
