// Usuários fixos para teste
const users = {
    'motorista': { password: '123', role: 'motorista', name: 'João Motorista' },
    'gestor': { password: '123', role: 'gestor', name: 'Maria Gestora' }
};

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Verificar se já está logado
    const savedUser = localStorage.getItem('frotatrack_user');
    if (savedUser) {
        window.location.href = 'index.html';
    }
=======
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
>>>>>>> mateus/front
});

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (users[username] && users[username].password === password) {
        const user = {
            username: username,
            role: users[username].role,
            name: users[username].name
        };
        
        localStorage.setItem('frotatrack_user', JSON.stringify(user));
        window.location.href = 'index.html';
    } else {
        alert('Usuário ou senha inválidos! Use motorista/123 ou gestor/123');
    }
}
