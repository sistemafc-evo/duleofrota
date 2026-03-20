// Configuração do Firebase de Produção
const firebaseConfig = {
    apiKey: "AIzaSyCr6kaqGWnwGzvExRdVF0NwEaV1D_1BwIE",
    authDomain: "duleo-frota-producao.firebaseapp.com",
    projectId: "duleo-frota-producao",
    storageBucket: "duleo-frota-producao.firebasestorage.app"",
    messagingSenderId: "1052422226412",
    appId: "1:1052422226412:web:928b8f179030f52ec8c0c9"
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
