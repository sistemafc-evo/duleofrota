// Configuração do Firebase de Produção
const firebaseConfig = {
    apiKey: "AIzaSyCr6kaqGWnwGzvExRdVF0NwEaV1D_1BwIE",
    authDomain: "duleo-frota-producao.firebaseapp.com",
    projectId: "duleo-frota-producao",
    storageBucket: "duleo-frota-producao.firebasestorage.app",
    messagingSenderId: "1052422226412",
    appId: "1:1052422226412:web:928b8f179030f52ec8c0c9"
};

// Inicializar Firebase com segurança
try {
    // Verificar se o Firebase está disponível
    if (typeof firebase !== 'undefined' && firebase.app) {
        // Inicializar se não houver app
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado com sucesso!");
            
            // ATIVAR APP CHECK com reCAPTCHA v3
            const SITE_KEY = "6Lc4mZIsAAAAAMxIMaiYnBGnreuLczw1UHsECtME";
            
            try {
                const appCheck = firebase.appCheck();
                appCheck.activate(
                    SITE_KEY,
                    true // Is token auto refresh enabled
                );
                console.log("✅ App Check ativado com reCAPTCHA v3");
            } catch (appCheckError) {
                console.warn("⚠️ App Check já estava ativado ou erro:", appCheckError.message);
            }
        } else {
            console.log("✅ Firebase já estava inicializado");
        }

        // Obter Firestore e Auth
        const db = firebase.firestore();
        const auth = firebase.auth();
        
        // Configurar Firestore
        try {
            db.settings({
                timestampsInSnapshots: true,
                ignoreUndefinedProperties: true
            });
        } catch (e) {
            console.log("Configurações do Firestore já definidas");
        }
        
        // Tornar db e auth globais (window)
        window.db = db;
        window.auth = auth;
        
        // IMPORTANTE: Também criar variáveis globais sem window para compatibilidade
        // Isso permite que outros scripts usem 'db' diretamente
        if (typeof globalDb === 'undefined') {
            var globalDb = db;
        }
        if (typeof globalAuth === 'undefined') {
            var globalAuth = auth;
        }
        
        console.log("✅ Firestore e Auth prontos para uso");
        console.log("🌐 window.db disponível:", !!window.db);
        console.log("🌐 window.auth disponível:", !!window.auth);
        
        // Verificar App Check token (para debug)
        if (firebase.appCheck) {
            firebase.appCheck().getToken().then(token => {
                console.log("✅ App Check token obtido com sucesso");
            }).catch(error => {
                console.warn("⚠️ Erro ao obter App Check token:", error);
            });
        }
        
        // Disparar evento personalizado com delay para garantir que tudo está pronto
        setTimeout(() => {
            // Disparar evento no document
            document.dispatchEvent(new Event('firebase-ready'));
            
            // Também disparar no window para garantir
            window.dispatchEvent(new Event('firebase-ready'));
            
            console.log("📡 Evento firebase-ready disparado (document e window)");
        }, 100);
        
    } else {
        console.error("❌ Firebase SDK não foi carregado corretamente");
        console.log("Verifique se os scripts do Firebase estão sendo carregados antes deste arquivo");
        
        // Tentar carregar novamente após um tempo
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.app && !firebase.apps.length) {
                console.log("🔄 Tentando inicializar Firebase novamente...");
                firebase.initializeApp(firebaseConfig);
                const db = firebase.firestore();
                const auth = firebase.auth();
                window.db = db;
                window.auth = auth;
                console.log("✅ Firebase inicializado na segunda tentativa");
                document.dispatchEvent(new Event('firebase-ready'));
                window.dispatchEvent(new Event('firebase-ready'));
            }
        }, 500);
    }
} catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
}

// Função de utilidade para verificar se o Firebase está pronto
window.isFirebaseReady = function() {
    return !!(window.db && window.auth);
};

// Função para aguardar Firebase ficar pronto
window.waitForFirebaseReady = function() {
    return new Promise((resolve) => {
        if (window.isFirebaseReady()) {
            resolve();
        } else {
            const handler = () => {
                resolve();
                document.removeEventListener('firebase-ready', handler);
                window.removeEventListener('firebase-ready', handler);
            };
            document.addEventListener('firebase-ready', handler);
            window.addEventListener('firebase-ready', handler);
            
            // Timeout de segurança
            setTimeout(() => {
                if (!window.isFirebaseReady()) {
                    console.warn("⚠️ Timeout aguardando Firebase, continuando mesmo assim...");
                    resolve();
                }
                document.removeEventListener('firebase-ready', handler);
                window.removeEventListener('firebase-ready', handler);
            }, 5000);
        }
    });
};

console.log("📦 Arquivo 0_config_firebaseprod.js carregado");
