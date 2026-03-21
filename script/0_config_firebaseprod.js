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
            // SITE KEY GERADA NO RECAPTCHA
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

        // Obter Firestore
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
        
        // Tornar db e auth globais
        window.db = db;
        window.auth = auth;
        console.log("✅ Firestore e Auth prontos para uso");
        
        // Verificar App Check token (para debug)
        if (firebase.appCheck) {
            firebase.appCheck().getToken().then(token => {
                console.log("✅ App Check token obtido com sucesso");
            }).catch(error => {
                console.warn("⚠️ Erro ao obter App Check token:", error);
            });
        }
        
        // Disparar evento personalizado
        document.dispatchEvent(new Event('firebase-ready'));
    } else {
        console.error("❌ Firebase SDK não foi carregado corretamente");
        console.log("Verifique se os scripts do Firebase estão sendo carregados antes deste arquivo");
    }
} catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
}
