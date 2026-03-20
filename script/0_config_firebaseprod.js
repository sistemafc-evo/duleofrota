// Configuração do Firebase de Produção
const firebaseConfig = {
    apiKey: "AIzaSyCr6kaqGWnwGzvExRdVF0NwEaV1D_1BwIE",
    authDomain: "duleo-frota-producao.firebaseapp.com",
    projectId: "duleo-frota-producao",
    storageBucket: "duleo-frota-producao.firebasestorage.app",
    messagingSenderId: "1052422226412",
    appId: "1:1052422226412:web:928b8f179030f52ec8c0c9"
};

// Função para inicializar o Firebase com segurança
function initializeFirebase() {
    // Verificar se o Firebase está disponível
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK não foi carregado!");
        return null;
    }

    try {
        // Inicializar Firebase se ainda não foi inicializado
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase inicializado com sucesso!");
        } else {
            console.log("Firebase já estava inicializado");
        }

        // Obter instância do Firestore
        const db = firebase.firestore();
        
        // Configurar Firestore com tratamento de erro
        try {
            db.settings({
                timestampsInSnapshots: true,
                ignoreUndefinedProperties: true
            });
            console.log("Configurações do Firestore aplicadas");
        } catch (settingsError) {
            // Ignora erro se as configurações já foram aplicadas
            console.log("Configurações do Firestore já definidas");
        }
        
        return db;
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        return null;
    }
}

// Inicializar e tornar db global
window.db = initializeFirebase();

// Se quiser, pode adicionar um evento para quando o Firebase carregar
document.addEventListener('firebase-ready', () => {
    console.log("Firebase está pronto para uso!");
});
