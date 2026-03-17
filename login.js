// Usuários fixos para teste
const users = {
    'motorista_teste': { password: '123456', role: 'motorista', name: 'João Motorista' },
    'gestor_teste': { password: '123456', role: 'gestor', name: 'Maria Gestora' }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Verificar se já está logado
    const savedUser = localStorage.getItem('frotatrack_user');
    if (savedUser) {
        redirectToApp();
    }
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
        redirectToApp();
    } else {
        alert('Usuário ou senha inválidos!');
    }
}

function redirectToApp() {
    window.location.href = 'index.html';
}