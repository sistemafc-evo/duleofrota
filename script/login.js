// login.js - Versão com Firebase Auth 

// Função para aguardar Firebase (definida antes do uso)
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.db && window.auth) {
            resolve();
        } else {
            document.addEventListener("firebase-ready", resolve, { once: true });
            // Fallback: se o evento não for disparado em 5 segundos, tenta resolver mesmo assim
            setTimeout(() => {
                if (window.db && window.auth) {
                    resolve();
                }
            }, 5000);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔍 Aguardando Firebase...");
    await waitForFirebase();
    console.log("✅ Firebase pronto!");
    
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = document.getElementById("remember-login");
    const togglePassword = document.getElementById("toggle-password");

    loadSavedCredentials();

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
            console.log("✅ Usuário já logado, redirecionando...");
            window.location.href = "index.html";
        } else {
            localStorage.removeItem("frotatrack_user");
        }
    }
});

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

async function findUserByLogin(login) {
    let userData = null;
    let userDocPath = null;
    let userMapKey = null;
    
    try {
        console.log("🔍 Buscando login:", login);
        
        // Buscar em admin_logins
        const adminDoc = await db.collection("logins").doc("admin_logins").get();
        if (adminDoc.exists) {
            const adminLogins = adminDoc.data();
            for (const [key, value] of Object.entries(adminLogins)) {
                if (value.login === login && value.status_ativo === true) {
                    userData = value;
                    userDocPath = "admin_logins";
                    userMapKey = key;
                    userData.isAdmin = true;
                    console.log("✅ Admin encontrado:", key);
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
                    if (value.login === login && value.status_ativo === true) {
                        userData = value;
                        userDocPath = "funcionarios_logins";
                        userMapKey = key;
                        userData.isAdmin = false;
                        console.log("✅ Funcionário encontrado:", key);
                        break;
                    }
                }
            }
        }
        
        return { userData, userDocPath, userMapKey };
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        throw error;
    }
}

async function handleLogin() {
    const login = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const rememberCheckbox = document.getElementById("remember-login");

    console.log("🔐 Tentando login com:", login);

    if (!login || !password) {
        alert("Preencha login e senha!");
        return;
    }

    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Autenticando...';
    submitBtn.disabled = true;

    try {
        // 1. Buscar usuário no Firestore
        const { userData, userDocPath, userMapKey } = await findUserByLogin(login);
        
        if (!userData) {
            throw new Error(`Login "${login}" não encontrado ou inativo.`);
        }
        
        const userEmail = userData.email;
        if (!userEmail) {
            throw new Error("E-mail não configurado para este login.");
        }
        
        console.log("📧 E-mail encontrado:", userEmail);
        
        // 2. Autenticar no Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(userEmail, password);
        const firebaseUser = userCredential.user;
        
        console.log("✅ Autenticado com sucesso!");
        
        // 3. Converter perfil motorista para operador
        let perfilFinal = userData.perfil;
        if (perfilFinal === "motorista") {
            perfilFinal = "operador";
        }
        
        // 4. Preparar objeto do usuário
        const appUser = {
            id: firebaseUser.uid,
            login: userData.login,
            nome: userData.nome,
            perfil: perfilFinal,
            email: userEmail,
            isAdmin: userData.isAdmin || perfilFinal === "admin",
            loginTimestamp: Date.now()
        };
        
        // 5. Salvar no localStorage
        localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
        saveCredentials(login, password, rememberCheckbox.checked);
        
        console.log("✅ Login realizado! Redirecionando...");
        
        // 6. Redirecionar para o index.html
        window.location.href = "index.html";
        
    } catch (error) {
        console.error("❌ Erro no login:", error);
        
        let errorMessage = "";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "Usuário não encontrado no sistema de autenticação. Contate o administrador.";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Senha incorreta. Verifique e tente novamente.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "E-mail inválido. Contate o administrador.";
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = "Usuário desativado. Contate o administrador.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
        } else {
            errorMessage = error.message;
        }
        
        alert(`Erro: ${errorMessage}`);
        document.getElementById("password").value = "";
        
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
