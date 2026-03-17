// Configuração do Firebase
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

// Configurar para usar Timestamps
db.settings({
    timestampsInSnapshots: true
});

// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado');
    checkLoginStatus();
    setupEventListeners();
});

// Verificar login
function checkLoginStatus() {
    const savedUser = localStorage.getItem('frotatrack_user');
    if (!savedUser) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    console.log('Usuário logado:', currentUser);
    renderScreen();
}

// Renderizar tela baseada no role
function renderScreen() {
    const app = document.getElementById('app');
    
    if (currentUser.role === 'motorista') {
        app.innerHTML = getMotoristaTemplate();
        setupMotoristaListeners();
        startGPS();
        loadMotoristaFretes();
    } else if (currentUser.role === 'gestor') {
        app.innerHTML = getGestorTemplate();
        setupGestorListeners();
        loadAllFretes();
    }
}

// Template do Motorista
function getMotoristaTemplate() {
    return `
        <div class="header">
            <div class="header-title">
                <i class="fas fa-truck"></i>
                <h2>Painel do Motorista</h2>
            </div>
            <div class="user-info">
                <span id="motorista-nome">${currentUser.name}</span>
                <button id="logout-btn" class="btn-icon"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        </div>
        
        <div class="content">
            <div class="gps-status" id="gps-status">
                <i class="fas fa-satellite-dish"></i>
                <span>Aguardando GPS...</span>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-plus-circle"></i> Novo Frete</h3>
                </div>
                <div class="card-body">
                    <form id="frete-form">
                        <div class="form-group">
                            <label><i class="fas fa-map-marker-alt"></i> Ponto de Origem</label>
                            <input type="text" id="origem" placeholder="Digite o endereço de origem" required>
                            <button type="button" class="btn-gps" id="get-origem-gps"><i class="fas fa-location-arrow"></i> Usar localização atual</button>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-flag"></i> Ponto de Partida</label>
                            <input type="text" id="partida" placeholder="Local de partida" required>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-map-pin"></i> Ponto de Entrega</label>
                            <input type="text" id="entrega" placeholder="Endereço de entrega" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label><i class="fas fa-weight-hanging"></i> Peso (kg)</label>
                                <input type="number" id="peso" placeholder="Ex: 5000" required>
                            </div>
                            <div class="form-group half">
                                <label><i class="fas fa-boxes"></i> Quantidade de Itens</label>
                                <input type="number" id="itens" placeholder="Ex: 50" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label><i class="fas fa-gas-pump"></i> Combustível (L)</label>
                                <input type="number" id="combustivel" placeholder="Estimado" readonly>
                            </div>
                            <div class="form-group half">
                                <label><i class="fas fa-road"></i> Distância (km)</label>
                                <input type="text" id="distancia" placeholder="0 km" readonly>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary btn-block">
                            <i class="fas fa-save"></i> Salvar Frete
                        </button>
                    </form>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Meus Fretes</h3>
                </div>
                <div class="card-body">
                    <div id="fretes-list" class="fretes-list">
                        <div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Template do Gestor
function getGestorTemplate() {
    return `
        <div class="header">
            <div class="header-title">
                <i class="fas fa-chart-line"></i>
                <h2>Painel do Gestor</h2>
            </div>
            <div class="user-info">
                <span id="gestor-nome">${currentUser.name}</span>
                <button id="logout-btn" class="btn-icon"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-truck"></i>
                    <div class="stat-info">
                        <span class="stat-value" id="total-fretes">0</span>
                        <span class="stat-label">Total de Fretes</span>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-road"></i>
                    <div class="stat-info">
                        <span class="stat-value" id="total-km">0 km</span>
                        <span class="stat-label">KM Total</span>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-weight-hanging"></i>
                    <div class="stat-info">
                        <span class="stat-value" id="total-peso">0 kg</span>
                        <span class="stat-label">Peso Total</span>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-gas-pump"></i>
                    <div class="stat-info">
                        <span class="stat-value" id="total-combustivel">0 L</span>
                        <span class="stat-label">Combustível</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-filter"></i> Filtros</h3>
                </div>
                <div class="card-body">
                    <div class="filter-row">
                        <input type="text" id="filter-motorista" placeholder="Filtrar por motorista">
                        <input type="date" id="filter-data">
                        <button id="filter-btn" class="btn-primary">Filtrar</button>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-clipboard-list"></i> Todos os Fretes</h3>
                </div>
                <div class="card-body">
                    <div id="todos-fretes-list" class="fretes-list">
                        <div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Delegar eventos para elementos que serão criados dinamicamente
    document.addEventListener('click', (e) => {
        if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
            handleLogout();
        }
    });
}

function setupMotoristaListeners() {
    document.getElementById('frete-form')?.addEventListener('submit', handleFreteSubmit);
    document.getElementById('get-origem-gps')?.addEventListener('click', () => getCurrentLocation('origem'));
}

function setupGestorListeners() {
    document.getElementById('filter-btn')?.addEventListener('click', loadAllFretes);
    document.getElementById('filter-motorista')?.addEventListener('input', debounce(loadAllFretes, 500));
    document.getElementById('filter-data')?.addEventListener('change', loadAllFretes);
}

// Logout
function handleLogout() {
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
    }
    localStorage.removeItem('frotatrack_user');
    window.location.href = 'login.html';
}

// GPS Functions (mantidas iguais)
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
    
    const address = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
    document.getElementById(fieldId).value = address;
}

// Calcular consumo de combustível
function calculateFuel(distance, peso) {
    const consumoBase = 2.5;
    const fatorCarga = 1 + (peso / 15000);
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
    
    if (!origem || !partida || !entrega || !peso || !itens) {
        alert('Preencha todos os campos!');
        return;
    }
    
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
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btn.disabled = true;
        
        await db.collection('fretes').add(frete);
        
        alert('Frete salvo com sucesso!');
        e.target.reset();
        document.getElementById('distancia').value = '';
        document.getElementById('combustivel').value = '';
        loadMotoristaFretes();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
    } catch (error) {
        console.error('Erro ao salvar frete:', error);
        alert('Erro ao salvar. Verifique sua conexão.');
        
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
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar</p></div>';
    }
}

// Load All Fretes (Gestor)
async function loadAllFretes() {
    const fretesList = document.getElementById('todos-fretes-list');
    const filterMotorista = document.getElementById('filter-motorista')?.value.toLowerCase() || '';
    
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
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar</p></div>';
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
        await db.collection('teste').doc('teste').get();
        console.log('Firebase conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
    }
}

testFirebaseConnection();
