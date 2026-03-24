// login.js

// Função para aguardar Firebase
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        if (window.db && window.auth) {
            resolve();
        } else {
            const timeout = setTimeout(() => {
                reject(new Error("Timeout: Firebase não inicializou em 5 segundos"));
            }, 5000);
            
            document.addEventListener("firebase-ready", () => {
                clearTimeout(timeout);
                if (window.db && window.auth) {
                    resolve();
                } else {
                    reject(new Error("Firebase inicializado mas db/auth não disponíveis"));
                }
            }, { once: true });
        }
    });
}

// Função para validar se a empresa está ativa e não bloqueada
async function validarEmpresa() {
    try {
        console.log("🔍 Validando configuração da empresa...");
        
        // Buscar documento de configuração
        const configDoc = await window.db.collection("config").doc("plano").get();
        
        if (!configDoc.exists) {
            console.error("❌ Documento de configuração não encontrado!");
            throw new Error("Configuração da empresa não encontrada. Contate o administrador.");
        }
        
        const configData = configDoc.data();
        console.log("📋 Dados da configuração:", configData);
        
        // Validar se a empresa está ativa
        if (configData.empresa_vigencia_ativo !== true) {
            console.error("❌ Empresa está inativa!");
            const motivo = configData.empresa_vigencia_motivo || "Empresa desativada";
            throw new Error(`Empresa inativa: ${motivo}`);
        }
        
        // Validar data de bloqueio
        if (!configData.empresa_vigencia_databloq) {
            console.error("❌ Data de bloqueio não configurada!");
            throw new Error("Data de bloqueio não configurada. Contate o administrador.");
        }
        
        const dataBloqueio = configData.empresa_vigencia_databloq.toDate();
        const agora = new Date();
        
        console.log(`📅 Data atual: ${agora.toLocaleString()}`);
        console.log(`📅 Data bloqueio: ${dataBloqueio.toLocaleString()}`);
        
        if (agora >= dataBloqueio) {
            console.error("❌ Empresa bloqueada! Data de bloqueio atingida.");
            const motivo = configData.empresa_vigencia_motivo || "Período de uso expirado";
            throw new Error(`Acesso bloqueado: ${motivo}`);
        }
        
        // Calcular dias restantes para aviso
        const diffTime = dataBloqueio - agora;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(`⏰ Dias restantes até bloqueio: ${diffDays} dias`);
        
        console.log("✅ Empresa validada com sucesso!");
        return { valido: true, configData, diasRestantes: diffDays };
        
    } catch (error) {
        console.error("❌ Erro na validação da empresa:", error);
        throw error;
    }
}

// Função para atualizar o último login do usuário
async function atualizarUltimoLogin(login, userDocPath, userMapKey) {
    try {
        console.log(`🕐 Atualizando último login para: ${login}`);
        
        let docRef = null;
        
        // Determinar qual documento atualizar
        if (userDocPath === "admin_logins") {
            docRef = window.db.collection("logins").doc("admin_logins");
        } else if (userDocPath === "funcionarios_logins") {
            docRef = window.db.collection("logins").doc("funcionarios_logins");
        } else {
            console.error("❌ Caminho do documento não identificado:", userDocPath);
            return;
        }
        
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const dadosAtuais = docSnap.data();
            
            if (dadosAtuais[userMapKey]) {
                // Atualizar o campo ultimo_login
                dadosAtuais[userMapKey] = {
                    ...dadosAtuais[userMapKey],
                    ultimo_login: new Date()
                };
                
                // Salvar de volta no Firestore
                await docRef.set(dadosAtuais);
                console.log(`✅ Último login atualizado para ${login} em ${new Date().toLocaleString()}`);
            } else {
                console.warn(`⚠️ Usuário ${userMapKey} não encontrado no documento`);
            }
        } else {
            console.warn(`⚠️ Documento ${userDocPath} não encontrado`);
        }
        
    } catch (error) {
        console.error("❌ Erro ao atualizar último login:", error);
        // Não interrompe o login se falhar ao atualizar o último login
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔍 Aguardando Firebase...");
    
    try {
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
            try {
                const user = JSON.parse(savedUser);
                const currentUser = firebase.auth().currentUser;
                
                if (currentUser && currentUser.email === user.email) {
                    // Validar empresa mesmo para usuário já logado
                    await validarEmpresa();
                    console.log("✅ Usuário já logado e empresa válida, redirecionando...");
                    window.location.href = "index.html";
                } else {
                    localStorage.removeItem("frotatrack_user");
                    if (firebase.auth().currentUser) {
                        await firebase.auth().signOut();
                    }
                }
            } catch (error) {
                console.error("❌ Erro ao validar usuário já logado:", error);
                localStorage.removeItem("frotatrack_user");
                if (firebase.auth().currentUser) {
                    await firebase.auth().signOut();
                }
                alert(`Sessão inválida: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error("❌ Erro fatal ao inicializar Firebase:", error);
        // Mostrar erro na tela sem fallback
        const app = document.getElementById("app") || document.body;
        app.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8f9fa; padding: 20px;">
                <div style="text-align: center; max-width: 400px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                    <h2 style="color: #dc3545;">Erro de Conexão</h2>
                    <p style="color: #6c757d; margin-bottom: 20px;">Não foi possível conectar ao sistema de autenticação.</p>
                    <p style="color: #6c757d; font-size: 14px;">${error.message}</p>
                    <button onclick="location.reload()" style="background: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-sync-alt me-2"></i>Tentar Novamente
                    </button>
                </div>
            </div>
        `;
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
        const adminDoc = await window.db.collection("logins").doc("admin_logins").get();
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
            const funcionariosDoc = await window.db.collection("logins").doc("funcionarios_logins").get();
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
        
        if (!userData) {
            throw new Error(`Login "${login}" não encontrado ou inativo.`);
        }
        
        // Validar se o perfil é válido
        const perfisValidos = ["operador", "gerente", "supervisor", "admin"];
        if (!perfisValidos.includes(userData.perfil)) {
            console.error(`❌ Perfil inválido: ${userData.perfil}`);
            throw new Error(`Perfil "${userData.perfil}" não é válido. Contate o administrador.`);
        }
        
        return { userData, userDocPath, userMapKey };
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        throw error;
    }
}

// Função para mostrar aviso de dias restantes
function mostrarAvisoDiasRestantes(diasRestantes) {
    if (diasRestantes && diasRestantes <= 7) {
        let mensagem = "";
        if (diasRestantes <= 0) {
            mensagem = "⚠️ ATENÇÃO: O acesso será bloqueado HOJE!";
        } else if (diasRestantes === 1) {
            mensagem = "⚠️ ATENÇÃO: Resta apenas 1 dia de acesso!";
        } else {
            mensagem = `⚠️ ATENÇÃO: Restam apenas ${diasRestantes} dias de acesso!`;
        }
        
        setTimeout(() => {
            alert(mensagem);
        }, 500);
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
        // 1. Validar Firebase disponível
        if (!window.db || !window.auth) {
            throw new Error("Sistema de autenticação indisponível. Tente recarregar a página.");
        }
        
        // 2. Validar a empresa/configuração
        console.log("🔍 Validando empresa...");
        const validacaoEmpresa = await validarEmpresa();
        
        if (!validacaoEmpresa.valido) {
            throw new Error(validacaoEmpresa.error);
        }
        
        const configData = validacaoEmpresa.configData;
        
        // 3. Buscar usuário no Firestore
        const { userData, userDocPath, userMapKey } = await findUserByLogin(login);
        
        const userEmail = userData.email;
        if (!userEmail) {
            throw new Error("E-mail não configurado para este login. Contate o administrador.");
        }
        
        console.log("📧 E-mail encontrado:", userEmail);
        console.log("👤 Perfil do usuário:", userData.perfil);
        console.log("🆔 ID do usuário no documento:", userMapKey);
        console.log("📁 Documento:", userDocPath);
        
        // 4. Autenticar no Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(userEmail, password);
        const firebaseUser = userCredential.user;
        
        console.log("✅ Autenticado com sucesso!");
        
        // 5. Atualizar último login no Firestore
        await atualizarUltimoLogin(login, userDocPath, userMapKey);
        
        // 6. Preparar objeto do usuário
        const appUser = {
            id: firebaseUser.uid,
            login: userData.login,
            nome: userData.nome,
            perfil: userData.perfil,
            email: userEmail,
            isAdmin: userData.isAdmin || userData.perfil === "admin",
            loginTimestamp: Date.now(),
            ultimoLogin: new Date(),
            empresaConfig: {
                plano: configData.empresa_plano || "basic_1",
                vigenciaAtivo: configData.empresa_vigencia_ativo,
                dataBloqueio: configData.empresa_vigencia_databloq?.toDate(),
                dataVencimento: configData.empresa_vigencia_datavenc?.toDate(),
                qtdCarrosMax: configData.qtd_carros_max || "0",
                qtdLoginsMax: configData.qtd_logins_max || "0"
            }
        };
        
        console.log("📝 Usuário logado com perfil:", appUser.perfil);
        
        // 7. Salvar no localStorage
        localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
        saveCredentials(login, password, rememberCheckbox.checked);
        
        // 8. Mostrar aviso se estiver próximo do bloqueio
        if (validacaoEmpresa.diasRestantes !== undefined) {
            mostrarAvisoDiasRestantes(validacaoEmpresa.diasRestantes);
        }
        
        console.log("✅ Login realizado! Redirecionando...");
        
        // 9. Redirecionar para o index.html
        window.location.href = "index.html";
        
    } catch (error) {
        console.error("❌ Erro no login:", error);
        
        let errorMessage = "";
        
        // Tratamento de erros da validação da empresa
        if (error.message.includes("Empresa inativa") || 
            error.message.includes("Acesso bloqueado") ||
            error.message.includes("Configuração da empresa") ||
            error.message.includes("Data de bloqueio")) {
            errorMessage = error.message;
        }
        // Tratamento de erros de perfil inválido
        else if (error.message.includes("não é válido")) {
            errorMessage = error.message;
        }
        // Tratamento de erros do Firebase Auth
        else if (error.code === 'auth/user-not-found') {
            errorMessage = "Usuário não encontrado no sistema de autenticação. Contate o administrador.";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Senha incorreta. Verifique e tente novamente.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "E-mail inválido. Contate o administrador.";
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = "Usuário desativado. Contate o administrador.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
        } 
        // Erro de usuário não encontrado no Firestore
        else if (error.message.includes("não encontrado ou inativo")) {
            errorMessage = error.message;
        }
        // Erro genérico
        else {
            errorMessage = `Erro no login: ${error.message}`;
        }
        
        alert(errorMessage);
        document.getElementById("password").value = "";
        
        // Limpar localStorage se houver erro
        localStorage.removeItem("frotatrack_user");
        
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
