// Configuração do Firebase de Produção
const firebaseConfig = {
    apiKey: "AIzaSyBfuqxgjW2KmK9t66-v_Z0SqRuXNB1sYo0",
    authDomain: "frota-caminhao-producao.firebaseapp.com",
    projectId: "frota-caminhao-producao",
    storageBucket: "frota-caminhao-producao.firebasestorage.app",
    messagingSenderId: "470546136795",
    appId: "1:470546136795:web:0beaf096dcf1cfacb2d6fe"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.settings({
    timestampsInSnapshots: true
});