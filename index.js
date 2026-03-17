// Configuração do Firebase - SEUS DADOS REAIS
const firebaseConfig = {
    apiKey: "AIzaSyBfuqxgjW2KmK9t66-v_Z0SqRuXNB1sYo0",
    authDomain: "frota-caminhao-producao.firebaseapp.com",
    projectId: "frota-caminhao-producao",
    storageBucket: "frota-caminhao-producao.firebasestorage.app",
    messagingSenderId: "470546136795",
    appId: "1:470546136795:web:0beaf096dcf1cfacb2d6fe"
};

// Inicializar Firebase (usando compat para funcionar com a versão que importamos no HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Configurar para usar Timestamps
db.settings({
    timestampsInSnapshots: true
});

// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;

// Usuários fixos para teste (depois migra pro Firebase Auth)
const users = {
    'motorista_teste': { password: '123456', role: 'motorista', name: 'João Motorista' },
    'gestor_teste': { password: '123456', role: 'gestor', name: 'Maria Gestora' }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado');
    checkLoginStatus();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('login-btn')?.addEventListener('click', handleLogin);
    document.getElementById('motorista-logout')?.addEventListener('click', handleLogout);
    document.getElementById('gestor-logout')?.addEventListener('click', handleLogout);
    
    document.getElementById('password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('frete-form')?.addEventListener('submit', handleFreteSubmit);
    document.getElementById('get-origem-gps')?.addEventListener('click', () => getCurrentLocation('origem'));
    document.getElementById('filter-btn')?.addEventListener('click', loadAllFretes);
    document.getElementById('filter-motorista')?.addEventListener('input', debounce(loadAllFretes, 500));
    document.getElementById('filter-data')?.addEventListener('change', loadAllFretes);
}

// Login
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (users[username] && users[username].password === password) {
        currentUser = {
            username: username,
            role: users[username].role,
            name: users[username].name
        };
        
        localStorage.setItem('frotatrack_user', JSON.stringify(currentUser));
        console.log('Login bem-sucedido:', currentUser);
        showScreen(currentUser.role);
    } else {
        alert('Usuário ou senha inválidos!');
    }
}

// Logout
function handleLogout() {
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
    }
    currentUser = null;
    localStorage.removeItem('frotatrack_user');
    showScreen('login');
}

// Verificar login salvo
function checkLoginStatus() {
    const savedUser = localStorage.getItem('frotatrack_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('Usuário recuperado:', currentUser);
        showScreen(currentUser.role);
    }
}

// Mostrar tela apropriada
function showScreen(role) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (role === 'login' || !role) {
        document.getElementById('login-screen').classList.add('active');
    } else if (role === 'motorista') {
        document.getElementById('motorista-screen').classList.add('active');
        document.getElementById('motorista-nome').textContent = currentUser.name;
        startGPS();
        loadMotoristaFretes();
    } else if (role === 'gestor') {
        document.getElementById('gestor-screen').classList.add('active');
        document.getElementById('gestor-nome').textContent = currentUser.name;
        loadAllFretes();
    }
}

// GPS Functions
function startGPS() {
    if (!navigator.geolocation) {
        document.getElementById('gps-status').innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS não suportado';
        return;
    }
    
    const gpsStatus = document.getElementById('gps-status');
    
    watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            gpsStatus.classList.add('active');
            gpsStatus.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>GPS ativo - ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}</span>
            `;
        },
        (error) => {
            gpsStatus.classList.remove('active');
            let msg = 'Erro no GPS';
            if (error.code === 1) msg = 'Permissão negada';
            else if (error.code === 2) msg = 'Sinal indisponível';
            else if (error.code === 3) msg = 'Tempo excedido';
            gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function getCurrentLocation(fieldId) {
    if (!currentLocation) {
        alert('Aguardando sinal GPS...');
        return;
    }
    
    // Formatar coordenadas como endereço simulado
    const address = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
    document.getElementById(fieldId).value = address;
}

// Calcular consumo de combustível
function calculateFuel(distance, peso) {
    const consumoBase = 2.5; // km/l para caminhão
    const fatorCarga = 1 + (peso / 15000); // 15 toneladas dobra consumo
    return Math.ceil(distance / (consumoBase / fatorCarga));
}

// Handle Frete Submit
async function handleFreteSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Usuário não logado!');
        return;
    }
    
    if (!currentLocation) {
        alert('Aguardando sinal GPS...');
        return;
    }
    
    const origem = document.getElementById('origem').value;
    const partida = document.getElementById('partida').value;
    const entrega = document.getElementById('entrega').value;
    const peso = parseFloat(document.getElementById('peso').value);
    const itens = parseInt(document.getElementById('itens').value);
    
    // Validar campos
    if (!origem || !partida || !entrega || !peso || !itens) {
        alert('Preencha todos os campos!');
        return;
    }
    
    // Simular distância (entre 50 e 800 km)
    const distancia = Math.floor(Math.random() * 750) + 50;
    const combustivel = calculateFuel(distancia, peso);
    
    document.getElementById('distancia').value = distancia + ' km';
    document.getElementById('combustivel').value = combustivel;
    
    const frete = {
        motorista: currentUser.name,
        motoristaId: currentUser.username,
        origem: origem,
        partida: partida,
        entrega: entrega,
        peso: peso,
        itens: itens,
        distancia: distancia,
        combustivel: combustivel,
        localizacaoRegistro: {
            lat: currentLocation.lat,
            lng: currentLocation.lng
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'em_andamento'
    };
    
    try {
        // Mostrar loading
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btn.disabled = true;
        
        // Salvar no Firebase
        const docRef = await db.collection('fretes').add(frete);
        console.log('Frete salvo com ID:', docRef.id);
        
        alert('Frete salvo com sucesso!');
        e.target.reset();
        document.getElementById('distancia').value = '';
        document.getElementById('combustivel').value = '';
        loadMotoristaFretes();
        
        // Restaurar botão
        btn.innerHTML = originalText;
        btn.disabled = false;
        
    } catch (error) {
        console.error('Erro ao salvar frete:', error);
        alert('Erro ao salvar. Verifique sua conexão com o Firebase.');
        
        // Restaurar botão
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Frete';
        btn.disabled = false;
    }
}

// Load Motorista Fretes
async function loadMotoristaFretes() {
    const fretesList = document.getElementById('fretes-list');
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    
    try {
        const snapshot = await db.collection('fretes')
            .where('motoristaId', '==', currentUser.username)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><p>Nenhum frete ainda</p></div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const f = doc.data();
            const data = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : 'Data não disponível';
            
            html += `
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista">${f.motorista}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${f.peso} kg</div>
                        <div><i class="fas fa-boxes"></i> ${f.itens} itens</div>
                        <div><i class="fas fa-road"></i> ${f.distancia} km</div>
                        <div><i class="fas fa-gas-pump"></i> ${f.combustivel} L</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> Origem: ${f.origem}</p>
                        <p><i class="fas fa-map-pin"></i> Entrega: ${f.entrega}</p>
                    </div>
                </div>
            `;
        });
        
        fretesList.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar fretes:', error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar com Firebase</p></div>';
    }
}

// Load All Fretes (Gestor)
async function loadAllFretes() {
    const fretesList = document.getElementById('todos-fretes-list');
    const filterMotorista = document.getElementById('filter-motorista').value.toLowerCase();
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    
    try {
        const snapshot = await db.collection('fretes')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><p>Nenhum frete</p></div>';
            updateStats([]);
            return;
        }
        
        let fretes = [];
        let html = '';
        
        snapshot.forEach(doc => {
            const frete = { id: doc.id, ...doc.data() };
            fretes.push(frete);
            
            // Aplicar filtro de motorista
            if (filterMotorista && !frete.motorista.toLowerCase().includes(filterMotorista)) {
                return;
            }
            
            const data = frete.timestamp ? new Date(frete.timestamp.seconds * 1000).toLocaleDateString() : 'Data não disponível';
            
            html += `
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista"><i class="fas fa-user"></i> ${frete.motorista}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${frete.peso} kg</div>
                        <div><i class="fas fa-boxes"></i> ${frete.itens} itens</div>
                        <div><i class="fas fa-road"></i> ${frete.distancia} km</div>
                        <div><i class="fas fa-gas-pump"></i> ${frete.combustivel} L</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> ${frete.origem}</p>
                        <p><i class="fas fa-map-pin"></i> ${frete.entrega}</p>
                    </div>
                </div>
            `;
        });
        
        fretesList.innerHTML = html || '<div class="empty-state"><i class="fas fa-filter"></i><p>Nenhum resultado</p></div>';
        updateStats(fretes);
    } catch (error) {
        console.error('Erro ao carregar fretes:', error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar com Firebase</p></div>';
    }
}

// Update Stats
function updateStats(fretes) {
    let totalFretes = fretes.length;
    let totalKm = 0;
    let totalPeso = 0;
    let totalComb = 0;
    
    fretes.forEach(f => {
        totalKm += f.distancia || 0;
        totalPeso += f.peso || 0;
        totalComb += f.combustivel || 0;
    });
    
    document.getElementById('total-fretes').textContent = totalFretes;
    document.getElementById('total-km').textContent = totalKm + ' km';
    document.getElementById('total-peso').textContent = totalPeso + ' kg';
    document.getElementById('total-combustivel').textContent = totalComb + ' L';
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Testar conexão com Firebase
async function testFirebaseConnection() {
    try {
        const testDoc = await db.collection('teste').doc('teste').get();
        console.log('Firebase conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
    }
}

// Chamar teste de conexão
testFirebaseConnection();