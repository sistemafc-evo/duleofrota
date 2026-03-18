// Usuários fixos para teste (compatível com o index.js)
const users = {
    'motorista': { 
        password: '123', 
        role: 'motorista', 
        name: 'João Motorista' 
    },
    'gestor': { 
        password: '123', 
        role: 'gestor', 
        name: 'Maria Gestora' 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tela de login carregada');
    
    // Adicionar listener ao botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Adicionar listener para tecla Enter no campo de senha
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Adicionar listener para tecla Enter no campo de usuário
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Verificar se já está logado
    const savedUser = localStorage.getItem('frotatrack_user');
    if (savedUser) {
        console.log('Usuário já logado, redirecionando...');
        redirectToApp();
    }
});

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('Tentando login com:', username);
    
    // Validação básica
    if (!username || !password) {
        alert('Preencha usuário e senha!');
        return;
    }
    
    // Verificar credenciais
    if (users[username] && users[username].password === password) {
        const user = {
            username: username,
            role: users[username].role,
            name: users[username].name
        };
        
        console.log('Login bem-sucedido:', user);
        
        // Salvar no localStorage
        localStorage.setItem('frotatrack_user', JSON.stringify(user));
        
        // Redirecionar para o app
        redirectToApp();
    } else {
        console.log('Credenciais inválidas');
        alert('Usuário ou senha inválidos!\n\nUse:\nMotorista: motorista / 123\nGestor: gestor / 123');
    }
}

function redirectToApp() {
    console.log('Redirecionando para index.html');
    window.location.href = 'index.html';
}
