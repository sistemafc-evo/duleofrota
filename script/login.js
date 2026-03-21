// login.js - Versão com Firebase Auth usando LOGIN
// Estrutura do Firestore:
// - logins/admin_logins (documento com maps de admins)
// - logins/funcionarios_logins (documento com maps de funcionários)

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔍 DOM carregado, aguardando Firebase...");
  
  // Aguardar Firebase estar pronto
  await waitForFirebase();
  console.log("✅ Firebase pronto!");
  
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember-login");
  const togglePassword = document.getElementById("toggle-password");

  // Carregar dados salvos se existirem
  loadSavedCredentials();

  // Event listener para mostrar/esconder senha
  if (togglePassword) {
    togglePassword.addEventListener("click", togglePasswordVisibility);
    togglePassword.addEventListener("touchstart", function(e) {
      e.preventDefault();
      togglePasswordVisibility();
    });
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Verificar se já está logado
  const savedUser = localStorage.getItem("frotatrack_user");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    const currentUser = firebase.auth().currentUser;
    
    if (currentUser && currentUser.email === user.email) {
      console.log("✅ Usuário já logado, redirecionando para index.html...");
      window.location.replace("index.html");
    } else {
      console.log("⚠️ Sessão expirada, fazendo logout...");
      localStorage.removeItem("frotatrack_user");
      if (currentUser) {
        firebase.auth().signOut();
      }
    }
  }
});

// Função para aguardar Firebase
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.db && window.auth) {
      resolve();
    } else {
      document.addEventListener("firebase-ready", resolve, { once: true });
    }
  });
}

// Alternar visibilidade da senha
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.querySelector("#toggle-password i");
  
  if (!passwordInput || !toggleIcon) return;
  
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  
  if (type === "text") {
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
}

// Carregar credenciais salvas
function loadSavedCredentials() {
  const savedLogin = localStorage.getItem("remembered_login");
  const savedPassword = localStorage.getItem("remembered_password");
  const rememberChecked = localStorage.getItem("remember_checked") === "true";
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember-login");
  
  if (rememberChecked && savedLogin && savedPassword) {
    usernameInput.value = savedLogin;
    passwordInput.value = savedPassword;
    rememberCheckbox.checked = true;
    console.log("🔐 Credenciais carregadas para:", savedLogin);
  }
}

// Salvar credenciais
function saveCredentials(login, password, remember) {
  if (remember) {
    localStorage.setItem("remembered_login", login);
    localStorage.setItem("remembered_password", password);
    localStorage.setItem("remember_checked", "true");
    console.log("💾 Credenciais salvas para:", login);
  } else {
    localStorage.removeItem("remembered_login");
    localStorage.removeItem("remembered_password");
    localStorage.setItem("remember_checked", "false");
  }
}

// Buscar usuário pelo login na estrutura do Firestore
async function findUserByLogin(login) {
  let userData = null;
  let userDocPath = null;
  let userMapKey = null;
  
  console.log("🔍 Buscando usuário com login:", login);
  
  try {
    // 1. Buscar em admin_logins (documento com maps de admins)
    console.log("📁 Verificando admin_logins...");
    const adminDoc = await db.collection("logins").doc("admin_logins").get();
    
    if (adminDoc.exists) {
      console.log("✅ admin_logins encontrado");
      const adminLogins = adminDoc.data();
      console.log("📋 Admins disponíveis:", Object.keys(adminLogins));
      
      for (const [key, value] of Object.entries(adminLogins)) {
        console.log(`  Verificando ${key}: login=${value.login}, ativo=${value.status_ativo}`);
        if (value.login === login && value.status_ativo === true) {
          userData = value;
          userDocPath = "admin_logins";
          userMapKey = key;
          userData.isAdmin = true;
          console.log(`✅ Usuário ADMIN encontrado: ${key}`);
          break;
        }
      }
    } else {
      console.log("❌ admin_logins NÃO encontrado");
    }
    
    // 2. Se não encontrou, buscar em funcionarios_logins (documento com maps de funcionários)
    if (!userData) {
      console.log("📁 Verificando funcionarios_logins...");
      const funcionariosDoc = await db.collection("logins").doc("funcionarios_logins").get();
      
      if (funcionariosDoc.exists) {
        console.log("✅ funcionarios_logins encontrado");
        const funcionariosLogins = funcionariosDoc.data();
        console.log("📋 Funcionários disponíveis:", Object.keys(funcionariosLogins));
        
        for (const [key, value] of Object.entries(funcionariosLogins)) {
          console.log(`  Verificando ${key}: login=${value.login}, ativo=${value.status_ativo}`);
          if (value.login === login && value.status_ativo === true) {
            userData = value;
            userDocPath = "funcionarios_logins";
            userMapKey = key;
            userData.isAdmin = false;
            console.log(`✅ Usuário FUNCIONÁRIO encontrado: ${key}`);
            break;
          }
        }
      } else {
        console.log("❌ funcionarios_logins NÃO encontrado");
      }
    }
    
    return { userData, userDocPath, userMapKey };
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error);
    throw error;
  }
}

// Função principal de login
async function handleLogin() {
  const login = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const rememberCheckbox = document.getElementById("remember-login");

  console.log("=========================================");
  console.log("🔐 INICIANDO LOGIN");
  console.log("📝 Login digitado:", login);
  console.log("🔑 Senha digitada:", password ? "******" : "vazia");
  console.log("=========================================");

  if (!login || !password) {
    alert("Preencha login e senha!");
    return;
  }

  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Autenticando...';
  submitBtn.disabled = true;

  try {
    // 1. Buscar usuário pelo login no Firestore
    console.log("📡 PASSO 1: Buscando usuário no Firestore...");
    const { userData, userDocPath, userMapKey } = await findUserByLogin(login);
    
    if (!userData) {
      console.log("❌ Usuário NÃO encontrado no Firestore!");
      throw new Error(`Login "${login}" não encontrado ou usuário inativo.`);
    }
    
    const userEmail = userData.email;
    if (!userEmail) {
      console.log("❌ E-mail não configurado!");
      throw new Error("E-mail não configurado para este login. Contate o administrador.");
    }
    
    console.log("✅ PASSO 1 COMPLETO:");
    console.log("   📍 Login:", login);
    console.log("   📧 E-mail associado:", userEmail);
    console.log("   📁 Documento:", userDocPath);
    console.log("   🏷️ Chave:", userMapKey);
    console.log("   👤 Perfil:", userData.perfil);
    console.log("   👤 Nome:", userData.nome);
    
    // 2. Autenticar com Firebase Auth usando o E-MAIL encontrado
    console.log("📡 PASSO 2: Autenticando no Firebase Auth...");
    console.log("   🔐 Tentando login com e-mail:", userEmail);
    
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(userEmail, password);
      const firebaseUser = userCredential.user;
      
      console.log("✅ PASSO 2 COMPLETO:");
      console.log("   🔓 Usuário autenticado no Firebase!");
      console.log("   🆔 UID:", firebaseUser.uid);
      console.log("   📧 E-mail verificado:", firebaseUser.emailVerified);
      
      // 3. Converter perfil "motorista" para "operador" (se necessário)
      let perfilFinal = userData.perfil;
      if (perfilFinal === "motorista") {
        perfilFinal = "operador";
      }
      
      // 4. Preparar objeto do usuário para a aplicação
      const appUser = {
        uid: firebaseUser.uid,
        email: userEmail,
        login: userData.login,
        nome: userData.nome,
        perfil: perfilFinal,
        isAdmin: userData.isAdmin || perfilFinal === "admin",
        docPath: userDocPath,
        docKey: userMapKey,
        loginTimestamp: Date.now(),
      };
      
      console.log("✅ PASSO 3 COMPLETO:");
      console.log("   📦 Objeto do usuário criado:", appUser);
      
      // 5. Salvar no localStorage
      localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
      saveCredentials(login, password, rememberCheckbox.checked);
      
      console.log("✅ LOGIN REALIZADO COM SUCESSO!");
      console.log("🔄 Redirecionando para index.html...");
      
      // 6. Redirecionar usando window.location.replace (mais confiável)
      setTimeout(() => {
        window.location.replace("index.html");
      }, 100);
      
    } catch (authError) {
      console.error("❌ ERRO NA AUTENTICAÇÃO DO FIREBASE AUTH:");
      console.error("   Código do erro:", authError.code);
      console.error("   Mensagem:", authError.message);
      
      let errorMessage = "";
      
      if (authError.code === 'auth/user-not-found') {
        errorMessage = `Usuário com e-mail "${userEmail}" não está cadastrado no Firebase Authentication. Contate o administrador para criar este usuário.`;
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta. Verifique e tente novamente.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido. Contate o administrador.";
      } else if (authError.code === 'auth/user-disabled') {
        errorMessage = "Usuário desativado. Contate o administrador.";
      } else {
        errorMessage = `Erro na autenticação: ${authError.message}`;
      }
      
      alert(errorMessage);
      document.getElementById("password").value = "";
      return;
    }
    
  } catch (error) {
    console.error("❌ ERRO GERAL NO LOGIN:");
    console.error("   Mensagem:", error.message);
    
    alert(error.message);
    document.getElementById("password").value = "";
    
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    console.log("=========================================");
  }
}
