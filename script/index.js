// ============================================
// INDEX.JS - Versão de teste simplificada
// ============================================

console.log("🔵 INDEX.JS CARREGADO");

let currentUser = null;

// Aguardar Firebase
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.db && window.auth) {
      resolve();
    } else {
      document.addEventListener("firebase-ready", resolve, { once: true });
      setTimeout(() => {
        if (window.db && window.auth) resolve();
      }, 3000);
    }
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM carregado");

  await waitForFirebase();
  console.log("✅ Firebase disponível");

  window.db = db;
  window.auth = auth;

  // VERIFICAR LOCALSTORAGE PRIMEIRO
  const savedUser = localStorage.getItem("frotatrack_user");
  console.log("📦 localStorage:", savedUser ? "tem usuário" : "vazio");

  if (savedUser) {
    const user = JSON.parse(savedUser);
    console.log("👤 Usuário:", user.nome, "Perfil:", user.perfil);
    currentUser = user;
    window.currentUser = user;
    
    // Teste: Mostrar algo simples na tela
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2>Bem-vindo, ${user.nome}!</h2>
          <p>Perfil: ${user.perfil}</p>
          <button id="test-logout" class="btn btn-danger">Sair</button>
        </div>
      `;
      document.getElementById("test-logout")?.addEventListener("click", () => {
        localStorage.removeItem("frotatrack_user");
        firebase.auth().signOut();
        window.location.href = "login.html";
      });
    }
    return;
  }

  // VERIFICAR FIREBASE AUTH
  const firebaseUser = firebase.auth().currentUser;
  console.log("🔥 Firebase user:", firebaseUser ? firebaseUser.email : "nenhum");

  if (firebaseUser) {
    console.log("✅ Firebase autenticado, buscando dados...");
    try {
      let userData = null;
      
      // Buscar admin_logins
      const adminDoc = await db.collection("logins").doc("admin_logins").get();
      if (adminDoc.exists) {
        const admins = adminDoc.data();
        for (const [key, value] of Object.entries(admins)) {
          if (value.email === firebaseUser.email && value.status_ativo === true) {
            userData = value;
            break;
          }
        }
      }
      
      // Buscar funcionarios_logins
      if (!userData) {
        const funcDoc = await db.collection("logins").doc("funcionarios_logins").get();
        if (funcDoc.exists) {
          const funcs = funcDoc.data();
          for (const [key, value] of Object.entries(funcs)) {
            if (value.email === firebaseUser.email && value.status_ativo === true) {
              userData = value;
              break;
            }
          }
        }
      }
      
      if (userData) {
        let perfil = userData.perfil;
        if (perfil === "motorista") perfil = "operador";
        
        const appUser = {
          id: firebaseUser.uid,
          login: userData.login,
          nome: userData.nome,
          perfil: perfil,
          email: firebaseUser.email,
          isAdmin: perfil === "admin",
          loginTimestamp: Date.now()
        };
        
        localStorage.setItem("frotatrack_user", JSON.stringify(appUser));
        console.log("✅ Usuário salvo:", appUser.nome);
        
        // Mostrar tela simples
        const app = document.getElementById("app");
        if (app) {
          app.innerHTML = `
            <div style="padding: 20px; text-align: center;">
              <h2>Bem-vindo, ${appUser.nome}!</h2>
              <p>Perfil: ${appUser.perfil}</p>
              <button id="test-logout" class="btn btn-danger">Sair</button>
            </div>
          `;
          document.getElementById("test-logout")?.addEventListener("click", () => {
            localStorage.removeItem("frotatrack_user");
            firebase.auth().signOut();
            window.location.href = "login.html";
          });
        }
        return;
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  // NENHUM USUÁRIO - REDIRECIONAR
  console.log("❌ Nenhum usuário, redirecionando para login");
  window.location.href = "login.html";
});
