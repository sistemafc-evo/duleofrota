// login.js
const users = {
  joaosilva: { 
    password: "123", 
    perfil: "motorista", 
    nome: "João Silva",
    id: "motorista_001",
    login: "joaosilva"
  },
  mariarita: { 
    password: "123", 
    perfil: "gerente",
    nome: "Maria Rita",
    id: "gerente_001",
    login: "mariarita"
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember-login");
  const togglePassword = document.getElementById("toggle-password");

  // Carregar dados salvos se existirem
  loadSavedCredentials();

  // Event listener para mostrar/esconder senha - VERSÃO MELHORADA PARA CELULAR
  if (togglePassword) {
    // Suporta clique (mouse) e toque (celular)
    togglePassword.addEventListener("click", togglePasswordVisibility);
    togglePassword.addEventListener("touchstart", function(e) {
      e.preventDefault(); // Previne comportamento padrão
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
    window.location.href = "index.html";
  }
});

// Função separada para alternar visibilidade da senha
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.querySelector("#toggle-password i");
  
  if (!passwordInput || !toggleIcon) return;
  
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  
  // Troca o ícone
  if (type === "text") {
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
  
  // Feedback tátil para celular (opcional)
  if (navigator.vibrate) {
    navigator.vibrate(10); // Vibração curta ao mostrar/esconder
  }
  
  console.log("Senha:", type === "text" ? "visível" : "oculta");
}

// Função para carregar credenciais salvas
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
  } else {
    // Campos vazios por padrão
    usernameInput.value = "";
    passwordInput.value = "";
    rememberCheckbox.checked = false;
  }
}

// Função para salvar credenciais se "Lembrar" estiver marcado
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

function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const rememberCheckbox = document.getElementById("remember-login");

  if (!username || !password) {
    alert("Preencha usuário e senha!");
    return;
  }

  if (users[username] && users[username].password === password) {
    const user = {
      login: users[username].login,
      perfil: users[username].perfil,
      nome: users[username].nome,
      id: users[username].id,
      loginTimestamp: Date.now(),
    };

    localStorage.setItem("frotatrack_user", JSON.stringify(user));
    
    // Salvar credenciais se "Lembrar" estiver marcado
    saveCredentials(username, password, rememberCheckbox.checked);
    
    console.log("✅ Login bem-sucedido:", user);
    window.location.href = "index.html";
  } else {
    alert("Usuário ou senha inválidos! Use joaosilva/123 ou mariarita/123");
  }
}
