// Configuração do Firebase de Produção
const firebaseConfig = {
    apiKey: "AIzaSyBfuqxgjW2KmK9t66-v_Z0SqRuXNB1sYo0",
    authDomain: "frota-caminhao-producao.firebaseapp.com",
    projectId: "frota-caminhao-producao",
    storageBucket: "frota-caminhao-producao.firebasestorage.app",
    messagingSenderId: "470546136795",
    appId: "1:470546136795:web:0beaf096dcf1cfacb2d6fe"
};

// Inicializar Firebase (verificar se já não foi inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Aplicar configurações com tratamento de erro
db.settings({
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true
}).catch(error => {
    // Ignora erro se as configurações já foram aplicadas
    console.log("Configurações do Firestore já definidas");
});

// Tornar db global
window.db = db;
