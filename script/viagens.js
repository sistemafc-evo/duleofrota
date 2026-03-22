// ============================================
// VIAGENS.JS - Tela de Viagens
// Disponível para: operador, admin
// ============================================

let watchPositionId = null;
let currentLocation = null;
let currentAddress = "";
let map = null;
let marker = null;
let currentField = "";
let mapInitialized = false;
let googleMapsPromise = null;
let googleMapsApiKey = null;
let autocompletePartida = null;
let autocompleteEntrega = null;
let searchBox = null;

// Variáveis para custos
let valorLitroPorKm = 0; // R$ por km

// Função para parar o GPS
function stopGPS() {
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
        console.log("🛑 GPS parado");
    }
}

// Função para reiniciar o GPS completamente
function restartGPS() {
    console.log("🔄 Reiniciando GPS...");
    stopGPS();
    setTimeout(() => {
        startGPS();
    }, 500);
}

// Função para limpar todos os campos do formulário
function limparFormulario() {
    document.getElementById("partida").value = "";
    document.getElementById("entrega").value = "";
    document.getElementById("peso").value = "";
    document.getElementById("valorPorTonelada").value = "";
    document.getElementById("distancia_total").textContent = "0";
    document.getElementById("combustivel_total_valor").textContent = "0,00";
    document.getElementById("valorTotal").textContent = "R$ 0,00";
    
    // Manter o endereço atual se disponível
    if (window.currentAddress) {
        document.getElementById("origem").value = window.currentAddress;
    }
}

// Função para carregar custos do Firebase
async function loadCustos() {
    console.log("💰 Carregando custos do Firebase...");
    try {
        if (!window.db) {
            console.error("❌ Firestore não disponível");
            return;
        }
        
        const docRef = window.db.collection("custos").doc("custos_abastecimento");
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            const valorStr = data.valor_litro_por_km || "0";
            valorLitroPorKm = parseFloat(valorStr.replace(',', '.'));
            console.log("✅ Valor do Diesel por km carregado: R$", valorLitroPorKm.toFixed(2));
            
            const dieselKmSpan = document.getElementById("diesel_por_km");
            if (dieselKmSpan) {
                dieselKmSpan.textContent = valorLitroPorKm.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
        } else {
            console.warn("⚠️ Documento custos_abastecimento não encontrado");
            const dieselKmSpan = document.getElementById("diesel_por_km");
            if (dieselKmSpan) {
                dieselKmSpan.textContent = "0,00";
            }
        }
    } catch (error) {
        console.error("❌ Erro ao carregar custos:", error);
        const dieselKmSpan = document.getElementById("diesel_por_km");
        if (dieselKmSpan) {
            dieselKmSpan.textContent = "0,00";
        }
    }
}

// Função para calcular e atualizar o combustível total
function updateCombustivelTotal(distanciaTotalKm) {
    const combustivelTotalSpan = document.getElementById("combustivel_total_valor");
    if (combustivelTotalSpan) {
        const valorTotal = distanciaTotalKm * valorLitroPorKm;
        combustivelTotalSpan.textContent = valorTotal.toLocaleString("pt-BR", { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
}

// Template HTML da tela de viagens
const viagensTemplate = `
<!-- GPS Status e Botão Recarregar lado a lado -->
<div class="row g-2 mb-3">
    <div class="col-8">
        <div class="alert alert-warning d-flex align-items-center small py-2 mb-0" id="gps-status">
            <i class="fas fa-satellite-dish me-2"></i><span>Aguardando GPS...</span>
        </div>
    </div>
    <div class="col-4">
        <button type="button" id="btn-recarregar" class="btn btn-sm btn-outline-primary w-100">
            <i class="fas fa-sync-alt me-1"></i>Recarregar
        </button>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-4 mb-3">
    <div class="card-body p-3">
        <form id="frete-form">
            <div class="mb-2">
                <label class="form-label small text-secondary mb-1">ONDE ESTOU</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm bg-light" id="origem" readonly>
                    <button type="button" class="btn btn-outline-primary btn-sm" id="view-origem-map">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small text-secondary mb-1">CARREGAR</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm" id="partida" placeholder="Endereço de carregamento" required>
                    <button class="btn btn-outline-primary btn-sm" type="button" id="search-partida">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label small text-secondary mb-1">DESCARREGAR</label>
                <div class="d-flex gap-2">
                    <input type="text" class="form-control form-control-sm" id="entrega" placeholder="Endereço de descarregamento" required>
                    <button class="btn btn-outline-primary btn-sm" type="button" id="search-entrega">
                        <i class="fas fa-map"></i>
                    </button>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <div class="input-highlight">
                        <label>TONELADAS (t)</label>
                        <input type="number" id="peso" placeholder="Ex: 5.5" step="0.1" min="0" required>
                    </div>
                </div>
                <div class="col-6">
                    <div class="input-highlight">
                        <label>VALOR/t (R$)</label>
                        <input type="number" id="valorPorTonelada" placeholder="Ex: 150" step="0.01" min="0" required>
                    </div>
                </div>
            </div>
            
            <!-- Versão com dois cards lado a lado -->
            <div class="bg-light rounded-3 p-2 mb-3">
                <div class="row g-2">
                    <!-- Distância Total - Esquerda -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #f8f9fa; text-align: center; min-height: 95px; display: flex; flex-direction: column; justify-content: center;">
                            <div class="label"><i class="fas fa-road"></i>DISTÂNCIA TOTAL</div>
                            <div class="value">
                                <span id="distancia_total">0</span> 
                                <span style="font-size: 0.7rem; font-weight: normal;">km</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Combustível Total - Direita -->
                    <div class="col-6">
                        <div class="trecho-valor-item" style="background: #f8f9fa; text-align: center; min-height: 95px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                            <div class="label"><i class="fas fa-coins"></i> COMBUSTÍVEL TOTAL</div>
                            <div class="value">
                                <span id="combustivel_total_valor">0,00</span> 
                                <span style="font-size: 0.7rem; font-weight: normal;">R$</span>
                            </div>
                            <!-- Informativo do diesel por km -->
                            <div style="position: absolute; left: 8px; bottom: 6px; font-size: 0.55rem; color: #6c757d; font-weight: normal;">
                                <i class="fas fa-gas-pump me-1"></i>
                                <span>Valor L/km: R$ <strong id="diesel_por_km">0,00</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Valor Total do Frete (destaque principal) -->
                <div class="valor-total-destaque" style="background: linear-gradient(135deg, #4158D0 0%, #C850C0 100%); margin-top: 12px;">
                    <span class="label"><i class="fas fa-calculator"></i>VALOR TOTAL DO FRETE</span>
                    <span class="valor" id="valorTotal">R$ 0,00</span>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary w-100 py-2"><i class="fas fa-save me-2"></i>Salvar Frete</button>
        </form>
    </div>
</div>
<div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-3">
        <h6 class="card-title text-primary fw-semibold mb-3"><i class="fas fa-list me-2"></i>Meus Fretes</h6>
        <div id="fretes-list" class="list-fretes"></div>
    </div>
</div>
`;

function initViagens(container) {
    console.log("🚚 Inicializando tela de Viagens");
    
    if (container) {
        container.innerHTML = viagensTemplate;
    }
    
    loadCustos();
    setupViagensListeners();
    
    setTimeout(() => {
        stopGPS();
        startGPS();
        loadMotoristaFretes();
    }, 200);
}

function setupViagensListeners() {
    const form = document.getElementById("frete-form");
    if (form) {
        form.removeEventListener("submit", handleFreteSubmit);
        form.addEventListener("submit", handleFreteSubmit);
    }
    
    // Botão Recarregar
    const btnRecarregar = document.getElementById("btn-recarregar");
    if (btnRecarregar) {
        btnRecarregar.removeEventListener("click", handleRecarregar);
        btnRecarregar.addEventListener("click", handleRecarregar);
    }
    
    const viewMapBtn = document.getElementById("view-origem-map");
    if (viewMapBtn) {
        viewMapBtn.removeEventListener("click", () => openMapForSearch("origem", true));
        viewMapBtn.addEventListener("click", () => openMapForSearch("origem", true));
    }
    
    const searchPartida = document.getElementById("search-partida");
    if (searchPartida) {
        searchPartida.removeEventListener("click", () => openMapForSearch("partida"));
        searchPartida.addEventListener("click", () => openMapForSearch("partida"));
    }
    
    const searchEntrega = document.getElementById("search-entrega");
    if (searchEntrega) {
        searchEntrega.removeEventListener("click", () => openMapForSearch("entrega"));
        searchEntrega.addEventListener("click", () => openMapForSearch("entrega"));
    }
    
    const pesoInput = document.getElementById("peso");
    if (pesoInput) {
        pesoInput.removeEventListener("input", calcularValorTotal);
        pesoInput.addEventListener("input", calcularValorTotal);
    }
    
    const valorInput = document.getElementById("valorPorTonelada");
    if (valorInput) {
        valorInput.removeEventListener("input", calcularValorTotal);
        valorInput.addEventListener("input", calcularValorTotal);
    }
}

// Função para lidar com o botão Recarregar
function handleRecarregar() {
    if (confirm("Deseja limpar os dados e recarregar o GPS?")) {
        limparFormulario();
        restartGPS();
    }
}

function calcularValorTotal() {
    const toneladas = parseFloat(document.getElementById("peso").value) || 0;
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value) || 0;
    const valorTotal = toneladas * valorPorTonelada;
    const valorSpan = document.getElementById("valorTotal");
    if (valorSpan) {
        valorSpan.textContent = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
    return valorTotal;
}

async function getAddressFromCoords(lat, lng) {
    if (!window.google?.maps) throw new Error("Google Maps não disponível");
    return new Promise((resolve, reject) => {
        new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) resolve(results[0].formatted_address);
            else reject(new Error(`Erro na geocodificação: ${status}`));
        });
    });
}

async function getCoordsFromAddress(address) {
    if (!window.google?.maps) throw new Error("Google Maps não disponível");
    return new Promise((resolve, reject) => {
        new google.maps.Geocoder().geocode({ address }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng(), display_name: results[0].formatted_address });
            } else reject(new Error(`Endereço não encontrado`));
        });
    });
}

function setupAutocomplete() {
    if (!window.google?.maps?.places) {
        setTimeout(setupAutocomplete, 500);
        return;
    }
    
    const partidaInput = document.getElementById("partida");
    if (partidaInput && !autocompletePartida) {
        autocompletePartida = new google.maps.places.Autocomplete(partidaInput, {
            componentRestrictions: { country: "BR" },
            types: ["geocode", "establishment"],
            fields: ["geometry", "formatted_address", "name", "types"]
        });
        autocompletePartida.addListener("place_changed", () => {
            const place = autocompletePartida.getPlace();
            if (place.geometry) {
                partidaInput.value = place.formatted_address || place.name;
                partidaInput.dataset.lat = place.geometry.location.lat();
                partidaInput.dataset.lng = place.geometry.location.lng();
            }
        });
    }
    
    const entregaInput = document.getElementById("entrega");
    if (entregaInput && !autocompleteEntrega) {
        autocompleteEntrega = new google.maps.places.Autocomplete(entregaInput, {
            componentRestrictions: { country: "BR" },
            types: ["geocode", "establishment"],
            fields: ["geometry", "formatted_address", "name", "types"]
        });
        autocompleteEntrega.addListener("place_changed", () => {
            const place = autocompleteEntrega.getPlace();
            if (place.geometry) {
                entregaInput.value = place.formatted_address || place.name;
                entregaInput.dataset.lat = place.geometry.location.lat();
                entregaInput.dataset.lng = place.geometry.location.lng();
            }
        });
    }
}

function setupMapSearchBox() {
    if (!map || !window.google?.maps?.places) return;
    
    const searchBoxDiv = document.createElement("div");
    searchBoxDiv.className = "map-search-box";
    searchBoxDiv.innerHTML = `<input type="text" id="map-search-input" class="form-control" placeholder="Pesquisar endereço no mapa..." style="width: 300px; margin: 10px; border-radius: 30px; border: 1px solid #ddd; padding: 10px 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">`;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBoxDiv);
    
    const searchInput = document.getElementById("map-search-input");
    searchBox = new google.maps.places.SearchBox(searchInput);
    map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
    
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        const place = places[0];
        if (!place.geometry) return;
        
        if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
        else { map.setCenter(place.geometry.location); map.setZoom(17); }
        
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({ position: place.geometry.location, map: map, animation: google.maps.Animation.DROP });
        const address = place.formatted_address || place.name;
        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="route-info-window"><h6>Local encontrado</h6><p><i class="fas fa-map-marker-alt"></i> ${address}</p><button class="btn btn-primary btn-sm w-100 mt-2" onclick="window.selectMapLocation('${address.replace(/'/g, "\\'")}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()})"><i class="fas fa-check me-2"></i>Usar este local</button></div>`
        });
        infoWindow.open(map, marker);
        marker.address = address;
        marker.lat = place.geometry.location.lat();
        marker.lng = place.geometry.location.lng();
    });
}

function startGPS() {
    console.log("Iniciando GPS...");
    const gpsStatus = document.getElementById("gps-status");
    if (!gpsStatus) return;
    if (!navigator.geolocation) {
        gpsStatus.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> GPS não suportado';
        return;
    }
    if (watchPositionId) navigator.geolocation.clearWatch(watchPositionId);
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            watchPositionId = navigator.geolocation.watchPosition(
                async (position) => {
                    currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    window.currentLocation = currentLocation;
                    try {
                        if (window.google?.maps) {
                            const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
                            currentAddress = address;
                            window.currentAddress = address;
                            const origemInput = document.getElementById("origem");
                            if (origemInput) origemInput.value = address;
                            // GPS Status simplificado
                            gpsStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i><span>GPS Online</span>`;
                            gpsStatus.className = "alert alert-success d-flex align-items-center";
                        }
                    } catch (error) { console.error("Erro ao obter endereço:", error); }
                },
                (error) => handleGPSError(error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        },
        (error) => handleGPSError(error)
    );
}

function handleGPSError(error) {
    const gpsStatus = document.getElementById("gps-status");
    if (!gpsStatus) return;
    
    let mensagem = "";
    if (error.code === 1) {
        mensagem = "Permissão negada. Ative a localização nas configurações.";
    } else if (error.code === 2) {
        mensagem = "Sinal indisponível. Tente em um local aberto.";
    } else if (error.code === 3) {
        mensagem = "Tempo excedido. Tente novamente.";
    } else {
        mensagem = error.message;
    }
    
    gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i><span>Erro GPS: ${mensagem}</span>`;
    gpsStatus.className = "alert alert-danger d-flex align-items-center";
}

async function loadGoogleMapsWithFirebaseKey() {
    if (googleMapsPromise) return googleMapsPromise;
    if (window.google?.maps) { setupAutocomplete(); return Promise.resolve(window.google.maps); }
    
    googleMapsPromise = new Promise(async (resolve, reject) => {
        try {
            if (!window.db) {
                throw new Error("Firestore não disponível para carregar chave do Google Maps");
            }
            const docRef = window.db.collection("config").doc("api_googlemaps");
            const docSnap = await docRef.get();
            if (!docSnap.exists) throw new Error("Configuração do Google Maps não encontrada");
            const apiKey = docSnap.data().key;
            if (!apiKey) throw new Error("Chave da API não configurada");
            googleMapsApiKey = apiKey;
            
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMapsCallback`;
            script.async = true;
            window.initGoogleMapsCallback = function() { setupAutocomplete(); resolve(window.google.maps); };
            script.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
            document.head.appendChild(script);
        } catch (error) { reject(error); }
    });
    return googleMapsPromise;
}

async function openMapForSearch(fieldId, isReadonly = false) {
    if (!window.google?.maps) return alert("Google Maps não disponível");
    currentField = fieldId;
    const modalEl = document.getElementById("map-modal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    
    modalEl.addEventListener("shown.bs.modal", function onModalShown() {
        modalEl.removeEventListener("shown.bs.modal", onModalShown);
        setTimeout(async () => {
            const mapElement = document.getElementById("map");
            if (!mapElement) return;
            
            if (!mapInitialized) {
                const mapOptions = {
                    center: currentLocation || { lat: -23.5505, lng: -46.6333 },
                    zoom: 15,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: true, streetViewControl: true, fullscreenControl: true, zoomControl: true
                };
                map = new google.maps.Map(mapElement, mapOptions);
                window.map = map;
                setupMapSearchBox();
                
                map.addListener("click", async (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    if (marker) marker.setMap(null);
                    marker = new google.maps.Marker({ position: { lat, lng }, map: map, animation: google.maps.Animation.DROP });
                    try {
                        const address = await getAddressFromCoords(lat, lng);
                        const infoWindow = new google.maps.InfoWindow({
                            content: `<div class="route-info-window"><h6>Local selecionado</h6><p><i class="fas fa-map-marker-alt"></i> ${address}</p><button class="btn btn-primary btn-sm w-100 mt-2" onclick="window.selectMapLocation('${address.replace(/'/g, "\\'")}', ${lat}, ${lng})"><i class="fas fa-check me-2"></i>Confirmar</button></div>`
                        });
                        infoWindow.open(map, marker);
                        marker.address = address;
                        marker.lat = lat;
                        marker.lng = lng;
                    } catch (error) { alert(`Erro ao buscar endereço: ${error.message}`); }
                });
                mapInitialized = true;
            } else { google.maps.event.trigger(map, "resize"); }
            
            const existingAddress = document.getElementById(fieldId).value;
            if (existingAddress && !isReadonly) {
                try {
                    const coords = await getCoordsFromAddress(existingAddress);
                    map.setCenter({ lat: coords.lat, lng: coords.lng });
                    map.setZoom(15);
                    if (marker) marker.setMap(null);
                    marker = new google.maps.Marker({ position: { lat: coords.lat, lng: coords.lng }, map: map, animation: google.maps.Animation.DROP });
                    marker.address = existingAddress;
                } catch (error) { console.warn("Endereço não encontrado no mapa:", error.message); }
            }
        }, 300);
    });
    
    document.getElementById("confirm-map-location").onclick = () => {
        if (marker && marker.address) {
            document.getElementById(currentField).value = marker.address;
            bootstrap.Modal.getInstance(modalEl).hide();
        } else { alert("Clique no mapa ou pesquise para selecionar um local"); }
    };
}

window.selectMapLocation = (address, lat, lng) => {
    document.getElementById(currentField).value = address;
    const modal = bootstrap.Modal.getInstance(document.getElementById("map-modal"));
    modal.hide();
};

function showLocationOnMap(location) {
    if (!location) return alert("Localização não disponível");
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank");
}

function calculateFuel(distance, pesoKg) {
    const consumoBase = { vazio: 3.2, carregado: 2.1 };
    const pesoEmToneladas = pesoKg / 1000;
    const capacidadeMedia = 15;
    const fatorCarga = pesoEmToneladas / capacidadeMedia;
    const consumoReal = consumoBase.vazio - fatorCarga * (consumoBase.vazio - consumoBase.carregado);
    return Math.ceil(distance / consumoReal);
}

async function handleFreteSubmit(e) {
    e.preventDefault();
    if (!window.currentUser) return alert("Usuário não logado!");
    
    const origem = document.getElementById("origem").value;
    const partida = document.getElementById("partida").value;
    const entrega = document.getElementById("entrega").value;
    const toneladas = parseFloat(document.getElementById("peso").value);
    const valorPorTonelada = parseFloat(document.getElementById("valorPorTonelada").value);
    
    if (!origem || !partida || !entrega || !toneladas || !valorPorTonelada) return alert("Preencha todos os campos!");
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculando...';
    btn.disabled = true;
    
    try {
        const directionsService = new google.maps.DirectionsService();
        const resultTrecho1 = await new Promise((resolve, reject) => {
            directionsService.route({ origin: origem, destination: partida, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
                status === "OK" ? resolve(result) : reject(new Error(`Erro no 1º trecho: ${status}`));
            });
        });
        
        const resultTrecho2 = await new Promise((resolve, reject) => {
            directionsService.route({ origin: partida, destination: entrega, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
                status === "OK" ? resolve(result) : reject(new Error(`Erro no 2º trecho: ${status}`));
            });
        });
        
        const route1 = resultTrecho1.routes[0].legs[0];
        const route2 = resultTrecho2.routes[0].legs[0];
        const distanciaTrecho1 = (route1.distance.value / 1000).toFixed(1);
        const distanciaTrecho2 = (route2.distance.value / 1000).toFixed(1);
        const distanciaTotal = (parseFloat(distanciaTrecho1) + parseFloat(distanciaTrecho2)).toFixed(1);
        const combustivel = calculateFuel(distanciaTotal, toneladas * 1000);
        const valorTotal = toneladas * valorPorTonelada;
        const valorPorKm = valorTotal / distanciaTotal;
        const valorTrecho1 = (parseFloat(distanciaTrecho1) * valorPorKm).toFixed(2);
        const valorTrecho2 = (parseFloat(distanciaTrecho2) * valorPorKm).toFixed(2);
        
        const distanciaTotalSpan = document.getElementById("distancia_total");
        if (distanciaTotalSpan) {
            distanciaTotalSpan.textContent = distanciaTotal;
        }
        
        updateCombustivelTotal(parseFloat(distanciaTotal));
        document.getElementById("valorTotal").textContent = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        
        const frete = {
            nome: window.currentUser.nome, login: window.currentUser.login, id: window.currentUser.id,
            perfil: window.currentUser.perfil, origem, partida, entrega, toneladas,
            valorPorTonelada, valorTotal, 
            distancia_trecho1: parseFloat(distanciaTrecho1),
            distancia_trecho2: parseFloat(distanciaTrecho2), 
            distancia_total: parseFloat(distanciaTotal),
            valor_trecho1: parseFloat(valorTrecho1), 
            valor_trecho2: parseFloat(valorTrecho2),
            combustivel, 
            combustivel_total_reais: parseFloat(distanciaTotal) * valorLitroPorKm,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            status: "em_andamento"
        };
        
        await window.db.collection("fretes").add(frete);
        alert("Frete salvo com sucesso!");
        limparFormulario();
        loadMotoristaFretes();
        if (window.currentAddress) document.getElementById("origem").value = window.currentAddress;
        
    } catch (error) { alert(`Erro: ${error.message}`); }
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}

async function loadMotoristaFretes() {
    const fretesList = document.getElementById("fretes-list");
    if (!fretesList) return;
    
    if (!window.db) {
        console.error("❌ Firestore não disponível");
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro de conexão</p></div>';
        return;
    }
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';
    
    try {
        const snapshot = await window.db.collection("fretes").where("id", "==", window.currentUser.id).limit(50).get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete ainda</p></div>';
            return;
        }
        
        let fretes = [];
        snapshot.forEach(doc => fretes.push({ id: doc.id, ...doc.data() }));
        fretes.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        
        let html = "";
        fretes.slice(0, 20).forEach(f => {
            const data = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : "Data não disponível";
            const combustivelTotal = f.combustivel_total_reais || 0;
            html += `
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista">${f.nome}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${f.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> ${(f.valorTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        <div><i class="fas fa-road"></i> ${f.distancia_total || 0} km</div>
                        <div><i class="fas fa-coins"></i> ${combustivelTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${f.origem ? f.origem.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${f.partida ? f.partida.substring(0, 30) : "..."}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${f.entrega ? f.entrega.substring(0, 30) : "..."}...</p>
                    </div>
                </div>
            `;
        });
        fretesList.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar fretes:", error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao carregar</p></div>';
    }
}

function cleanupViagens() {
    console.log("🧹 Limpando recursos da tela de Viagens");
    stopGPS();
    
    if (autocompletePartida) {
        google.maps.event.clearInstanceListeners(autocompletePartida);
        autocompletePartida = null;
    }
    if (autocompleteEntrega) {
        google.maps.event.clearInstanceListeners(autocompleteEntrega);
        autocompleteEntrega = null;
    }
    
    if (map) {
        google.maps.event.clearInstanceListeners(map);
        map = null;
    }
    
    mapInitialized = false;
}

window.cleanupViagens = cleanupViagens;
window.initViagens = initViagens;
window.loadGoogleMapsWithFirebaseKey = loadGoogleMapsWithFirebaseKey;
