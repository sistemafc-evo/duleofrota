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
        } else {
            console.log("✅ Firebase já estava inicializado");
        }

        // Obter Firestore
        const db = firebase.firestore();
        
        // Configurar Firestore (opcional, mas pode ignorar erro)
        try {
            db.settings({
                timestampsInSnapshots: true,
                ignoreUndefinedProperties: true
            });
        } catch (e) {
            // Ignora erro de configuração duplicada
            console.log("Configurações do Firestore já definidas");
        }
        
        // Tornar db global
        window.db = db;
        console.log("✅ Firestore pronto para uso");
        
        // Disparar evento personalizado
        document.dispatchEvent(new Event('firebase-ready'));
    } else {
        console.error("❌ Firebase SDK não foi carregado corretamente");
        console.log("Verifique se os scripts do Firebase estão sendo carregados antes deste arquivo");
    }
} catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
}
