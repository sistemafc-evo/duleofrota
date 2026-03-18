// index.js

// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;
let currentAddress = '';
let map = null;
let marker = null;
let currentField = '';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado');
    setupTemplates();
    checkLoginStatus();
    setupEventListeners();
});

// Configurar templates
function setupTemplates() {
    // Os templates já estão no HTML, só precisamos garantir que estão disponíveis
}

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
    const template = document.getElementById(currentUser.role === 'motorista' ? 'template-motorista' : 'template-gestor');
    const clone = template.content.cloneNode(true);
    
    app.innerHTML = '';
    app.appendChild(clone);
    
    // Adicionar modal do mapa
    const modalTemplate = document.getElementById('template-modal-mapa');
    const modalClone = modalTemplate.content.cloneNode(true);
    app.appendChild(modalClone);
    
    // Atualizar nome do usuário
    if (currentUser.role === 'motorista') {
        document.getElementById('motorista-nome').textContent = currentUser.name;
        setupMotoristaListeners();
        startGPS();
        loadMotoristaFretes();
    } else {
        document.getElementById('gestor-nome').textContent = currentUser.name;
        setupGestorListeners();
        loadAllFretes();
    }
}

// Setup event listeners globais
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
            handleLogout();
        }
        if (e.target.id === 'close-map-modal' || e.target.closest('#close-map-modal')) {
            closeMapModal();
        }
    });
}

// Setup listeners do motorista
function setupMotoristaListeners() {
    document.getElementById('frete-form')?.addEventListener('submit', handleFreteSubmit);
    document.getElementById('refresh-location')?.addEventListener('click', refreshLocation);
    document.getElementById('view-origem-map')?.addEventListener('click', () => showLocationOnMap(currentLocation));
    document.getElementById('search-partida')?.addEventListener('click', () => openMapForSearch('partida'));
    document.getElementById('search-entrega')?.addEventListener('click', () => openMapForSearch('entrega'));
}

// Setup listeners do gestor
function setupGestorListeners() {
    document.getElementById('filter-btn')?.addEventListener('click', loadAllFretes);
    document.getElementById('filter-motorista')?.addEventListener('input', debounce(loadAllFretes, 500));
    document.getElementById('filter-data')?.addEventListener('change', loadAllFretes);
}

// Funções de endereço e geocodificação
async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=pt`);
        const data = await response.json();
        return data?.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
        console.error('Erro ao obter endereço:', error);
        return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
}

async function getCoordsFromAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=pt`);
        const data = await response.json();
        
        if (data?.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        return null;
    }
}

// GPS Functions
function startGPS() {
    if (!navigator.geolocation) {
        updateGPSStatus('GPS não suportado', false);
        return;
    }
    
    watchPositionId = navigator.geolocation.watchPosition(
        async (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            currentAddress = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
            
            const origemInput = document.getElementById('origem');
            if (origemInput) {
                origemInput.value = currentAddress;
            }
            
            updateGPSStatus(`GPS ativo - ${currentAddress.substring(0, 50)}...`, true);
        },
        (error) => {
            let msg = 'Erro no GPS';
            if (error.code === 1) msg = 'Permissão negada';
            else if (error.code === 2) msg = 'Sinal indisponível';
            else if (error.code === 3) msg = 'Tempo excedido';
            updateGPSStatus(msg, false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

function updateGPSStatus(message, isActive) {
    const gpsStatus = document.getElementById('gps-status');
    if (!gpsStatus) return;
    
    gpsStatus.className = `gps-status ${isActive ? 'active' : ''}`;
    gpsStatus.innerHTML = `<i class="fas ${isActive ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> <span>${message}</span>`;
}

async function refreshLocation() {
    if (!currentLocation) {
        alert('Aguardando sinal GPS...');
        return;
    }
    
    const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
    document.getElementById('origem').value = address;
    alert('Localização atualizada!');
}

// Funções do Mapa
async function openMapForSearch(fieldId) {
    currentField = fieldId;
    
    const modal = document.getElementById('map-modal');
    modal.style.display = 'block';
    
    document.getElementById('map-modal-title').textContent = 
        fieldId === 'partida' ? 'Selecione o local de carregamento' : 'Selecione o local de descarregamento';
    
    setTimeout(() => {
        if (!map) {
            map = L.map('map').setView([-23.5505, -46.6333], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }
        
        const existingAddress = document.getElementById(fieldId).value;
        if (existingAddress) {
            searchAndCenterMap(existingAddress);
        }
        
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            
            if (marker) {
                map.removeLayer(marker);
            }
            
            marker = L.marker([lat, lng]).addTo(map);
            
            const address = await getAddressFromCoords(lat, lng);
            marker.address = address;
            marker.lat = lat;
            marker.lng = lng;
        });
    }, 100);
    
    document.getElementById('confirm-map-location').onclick = () => {
        if (marker) {
            document.getElementById(currentField).value = marker.address;
            closeMapModal();
        } else {
            alert('Clique no mapa para selecionar um local');
        }
    };
}

async function searchAndCenterMap(query) {
    const result = await getCoordsFromAddress(query);
    if (result && map) {
        map.setView([result.lat, result.lng], 15);
        
        if (marker) {
            map.removeLayer(marker);
        }
        
        marker = L.marker([result.lat, result.lng]).addTo(map);
        marker.address = result.display_name;
        marker.lat = result.lat;
        marker.lng = result.lng;
    }
}

function showLocationOnMap(location) {
    if (!location) {
        alert('Localização não disponível');
        return;
    }
    window.open(`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`, '_blank');
}

function closeMapModal() {
    const modal = document.getElementById('map-modal');
    modal.style.display = 'none';
    
    if (marker && map) {
        map.removeLayer(marker);
        marker = null;
    }
}

// Calcular consumo
function calculateFuel(distance, peso) {
    const consumoBase = 2.5;
    const fatorCarga = 1 + (peso / 15000);
    return Math.ceil(distance / (consumoBase / fatorCarga));
}

// Handle Frete Submit
async function handleFreteSubmit(e) {
    e.preventDefault();
    
    if (!currentUser || !currentLocation) {
        alert('Usuário não logado ou GPS indisponível!');
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
        origem, partida, entrega, peso, itens,
        distancia, combustivel,
        localizacaoRegistro: {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            endereco: origem
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
        loadMotoristaFretes();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (currentAddress) {
            document.getElementById('origem').value = currentAddress;
        }
        
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
    if (!fretesList) return;
    
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
                        <p><i class="fas fa-map-marker-alt"></i> Onde Estou: ${f.origem}</p>
                        <p><i class="fas fa-flag"></i> Carregar: ${f.partida}</p>
                        <p><i class="fas fa-map-pin"></i> Descarregar: ${f.entrega}</p>
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
    if (!fretesList) return;
    
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
                        <p><i class="fas fa-map-marker-alt"></i> Onde Estou: ${frete.origem}</p>
                        <p><i class="fas fa-flag"></i> Carregar: ${frete.partida}</p>
                        <p><i class="fas fa-map-pin"></i> Descarregar: ${frete.entrega}</p>
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
    const totalFretes = fretes.length;
    let totalKm = 0, totalPeso = 0, totalComb = 0;
    
    fretes.forEach(f => {
        totalKm += f.distancia || 0;
        totalPeso += f.peso || 0;
        totalComb += f.combustivel || 0;
    });
    
    const totalFretesEl = document.getElementById('total-fretes');
    const totalKmEl = document.getElementById('total-km');
    const totalPesoEl = document.getElementById('total-peso');
    const totalCombEl = document.getElementById('total-combustivel');
    
    if (totalFretesEl) totalFretesEl.textContent = totalFretes;
    if (totalKmEl) totalKmEl.textContent = totalKm + ' km';
    if (totalPesoEl) totalPesoEl.textContent = totalPeso + ' kg';
    if (totalCombEl) totalCombEl.textContent = totalComb + ' L';
}

// Logout
function handleLogout() {
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
    }
    localStorage.removeItem('frotatrack_user');
    window.location.href = 'login.html';
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
