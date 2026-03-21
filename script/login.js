// login.js - Versão com Firebase Auth usando LOGIN (não e-mail)
document.addEventListener("DOMContentLoaded", async () => {
  // Aguardar Firebase estar pronto
  await waitForFirebase();
  
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
      window.location.href = "index.html";
    } else {
      localStorage.removeItem("frotatrack_user");
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
  }
}

// Salvar credenciais
function saveCredentials(login, password, remember) {
  if (remember) {
    localStorage.setItem("remembered_login", login);
    localStorage.setItem("remembered_password", password);
    localStorage.setItem("remember_checked", "true");
  } else {
    localStorage.removeItem("remembered_login");
    localStorage.removeItem("remembered_password");
    localStorage.setItem("remember_checked", "false");
  }
}

// Função principal de login - usando LOGIN (não e-mail)
async function handleLogin() {
  const login = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const rememberCheckbox = document.getElementById("remember-login");

  if (!login || !password) {
    alert("Preencha login e senha!");
    return;
  }

  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Autenticando...';
  submitBtn.disabled = true;

  try {
    // 1. Buscar dados do usuário no Firestore (coleção "logins") usando o LOGIN
    let userData = null;
    let userEmail = null;
    let userDocPath = null;
    
    // Buscar em admin_logins
    const adminDoc = await db.collection("logins").doc("admin_logins").get();
    if (adminDoc.exists) {
      const adminLogins = adminDoc.data();
      for (const [key, value] of Object.entries(adminLogins)) {
        if (value.login === login && value.status_ativo === true) {
          userData = value;
          userEmail = value.email;
          userDocPath = "admin_logins";
          userData.docId = key;
          userData.isAdmin = true;
          break;
        }
      }
    }
    
    // Se não encontrou em admin_logins, buscar em funcionarios_logins
    if (!userData) {
      const funcionariosDoc = await db.collection("logins").doc("funcionarios_logins").get();
      if (funcionariosDoc.exists) {
        const funcionariosLogins = funcionariosDoc.data();
        for (const [key, value] of Object.entries(funcionariosLogins)) {
          if (value.login === login && value.status_ativo === true) {
            userData = value;
            userEmail = value.email;
            userDocPath = "funcionarios_logins";
            userData.docId = key;
            userData.isAdmin = false;
            break;
          }
        }
      }
    }
    
    if (!userData) {
      throw new Error(`Login "${login}" não encontrado ou usuário inativo. Contate o administrador.`);
    }
    
    if (!userEmail) {
      throw new Error("E-mail não configurado para este login. Contate o administrador.");
    }
    
    console.log("🔍 Login encontrado:", login, "→ E-mail:", userEmail);
    
    // 2. Autenticar com Firebase Auth usando o E-MAIL encontrado
    const userCredential = await firebase.auth().signInWithEmailAndPassword(userEmail, password);
    const firebaseUser = userCredential.user;
    
    console.log("✅ Autenticado com Firebase:", firebaseUser.email);
    
    // Converter perfil "motorista" para "operador"
    let perfilFinal = userData.perfil;
    if (perfilFinal === "motorista") {
      perfilFinal = "operador";
    }
    
    // Preparar objeto do usuário
    const appUser = {
      uid: firebaseUser.uid,
      email: userEmail,
      login: userData.login,
      nome: userData.nome,
      perfil: perfilFinal,
      isAdmin: userData.isAdmin || perfilFinal === "admin",
      docId: userData.docId,
      docPath: userDocPath,
      loginTimestamp: Date.now(),
    };
    
    localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
    saveCredentials(login, password, rememberCheckbox.checked);
    
    console.log("✅ Login bem-sucedido:", appUser);
    window.location.href = "index.html";
    
  } catch (error) {
    console.error("❌ Erro no login:", error);
    
    let errorMessage = "Erro ao fazer login. ";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += "E-mail não encontrado. Verifique se o login está correto.";
        break;
      case 'auth/wrong-password':
        errorMessage += "Senha incorreta.";
        break;
      case 'auth/invalid-email':
        errorMessage += "E-mail inválido. Contate o administrador.";
        break;
      case 'auth/user-disabled':
        errorMessage += "Usuário desativado. Contate o administrador.";
        break;
      case 'auth/too-many-requests':
        errorMessage += "Muitas tentativas. Tente novamente mais tarde.";
        break;
      default:
        if (error.message.includes("não encontrado")) {
          errorMessage = error.message;
        } else {
          errorMessage += error.message;
        }
    }
    
    alert(errorMessage);
    document.getElementById("password").value = "";
    
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}
