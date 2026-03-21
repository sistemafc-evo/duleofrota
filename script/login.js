// login.js - Versão com Firebase Auth e App Check
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
  const savedUsername = localStorage.getItem("remembered_username");
  const savedPassword = localStorage.getItem("remembered_password");
  const rememberChecked = localStorage.getItem("remember_checked") === "true";
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember-login");
  
  if (rememberChecked && savedUsername && savedPassword) {
    usernameInput.value = savedUsername;
    passwordInput.value = savedPassword;
    rememberCheckbox.checked = true;
  }
}

// Salvar credenciais
function saveCredentials(username, password, remember) {
  if (remember) {
    localStorage.setItem("remembered_username", username);
    localStorage.setItem("remembered_password", password);
    localStorage.setItem("remember_checked", "true");
  } else {
    localStorage.removeItem("remembered_username");
    localStorage.removeItem("remembered_password");
    localStorage.setItem("remember_checked", "false");
  }
}

// Função principal de login
async function handleLogin() {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const rememberCheckbox = document.getElementById("remember-login");

  if (!email || !password) {
    alert("Preencha e-mail e senha!");
    return;
  }

  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Autenticando...';
  submitBtn.disabled = true;

  try {
    // 1. Autenticar com Firebase Auth
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;
    
    console.log("✅ Autenticado com Firebase:", firebaseUser.email);
    
    // 2. Buscar dados do usuário no Firestore (coleção "logins")
    let userData = null;
    
    // Buscar em admin_logins
    const adminDoc = await db.collection("logins").doc("admin_logins").get();
    if (adminDoc.exists) {
      const adminLogins = adminDoc.data();
      for (const [key, value] of Object.entries(adminLogins)) {
        if (value.email === email && value.status_ativo === true) {
          userData = value;
          userData.docId = key;
          userData.isAdmin = true;
          break;
        }
      }
    }
    
    // Se não encontrou, buscar em funcionarios_logins
    if (!userData) {
      const funcionariosDoc = await db.collection("logins").doc("funcionarios_logins").get();
      if (funcionariosDoc.exists) {
        const funcionariosLogins = funcionariosDoc.data();
        for (const [key, value] of Object.entries(funcionariosLogins)) {
          if (value.email === email && value.status_ativo === true) {
            userData = value;
            userData.docId = key;
            userData.isAdmin = false;
            break;
          }
        }
      }
    }
    
    if (!userData) {
      await firebase.auth().signOut();
      throw new Error("Usuário não autorizado. Contate o administrador.");
    }
    
    // Converter perfil "motorista" para "operador"
    let perfilFinal = userData.perfil;
    if (perfilFinal === "motorista") {
      perfilFinal = "operador";
    }
    
    // Preparar objeto do usuário
    const appUser = {
      uid: firebaseUser.uid,
      email: userData.email,
      login: userData.login,
      nome: userData.nome,
      perfil: perfilFinal,
      isAdmin: userData.isAdmin || perfilFinal === "admin",
      docId: userData.docId,
      loginTimestamp: Date.now(),
    };
    
    localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
    saveCredentials(email, password, rememberCheckbox.checked);
    
    console.log("✅ Login bem-sucedido:", appUser);
    window.location.href = "index.html";
    
  } catch (error) {
    console.error("❌ Erro no login:", error);
    
    let errorMessage = "Erro ao fazer login. ";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += "Usuário não encontrado.";
        break;
      case 'auth/wrong-password':
        errorMessage += "Senha incorreta.";
        break;
      case 'auth/invalid-email':
        errorMessage += "E-mail inválido.";
        break;
      case 'auth/user-disabled':
        errorMessage += "Usuário desativado. Contate o administrador.";
        break;
      case 'auth/too-many-requests':
        errorMessage += "Muitas tentativas. Tente novamente mais tarde.";
        break;
      default:
        errorMessage += error.message;
    }
    
    alert(errorMessage);
    document.getElementById("password").value = "";
    
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}
