// login.js
const users = {
  joaosilva: { 
    password: "123", 
    perfil: "motorista", 
    nome: "João Silva",
    id: "motorista_001", // ← Simplificado: apenas id
    login: "joaosilva"
  },
  mariarita: { 
    password: "123", 
    perfil: "gerente",
    nome: "Maria Rita",
    id: "gerente_001", // ← Simplificado: apenas id
    login: "mariarita"
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });

  document.getElementById("password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  document.getElementById("username").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Verificar se já está logado
  const savedUser = localStorage.getItem("frotatrack_user");
  if (savedUser) {
    window.location.href = "index.html";
  }
});

function handleLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (users[username] && users[username].password === password) {
    const user = {
      login: users[username].login,
      perfil: users[username].perfil,
      nome: users[username].nome,
      id: users[username].id, // ← Agora é apenas id para ambos
      loginTimestamp: Date.now(),
    };

    localStorage.setItem("frotatrack_user", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    alert("Usuário ou senha inválidos! Use joaosilva/123 ou mariarita/123");
  }
}
