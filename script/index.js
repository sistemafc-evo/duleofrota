// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;
let currentAddress = '';
let map = null;
let marker = null;
<<<<<<< HEAD
let currentField = '';
=======
let currentField = "";
let mapModal = null;
let mapInitialized = false;
>>>>>>> mateus/front

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
<<<<<<< HEAD
    const app = document.getElementById('app');
    
    if (currentUser.role === 'motorista') {
        const template = document.getElementById('template-motorista').content.cloneNode(true);
        template.querySelector('#motorista-nome').textContent = currentUser.name;
        app.innerHTML = '';
        app.appendChild(template);
        
        // Adicionar modal do mapa
        const modalTemplate = document.getElementById('template-modal-mapa').content.cloneNode(true);
        app.appendChild(modalTemplate);
        
        setupMotoristaListeners();
        
        // Pequeno delay para garantir DOM pronto
        setTimeout(() => {
            startGPS();
            loadMotoristaFretes();
        }, 100);
        
    } else if (currentUser.role === 'gestor') {
        const template = document.getElementById('template-gestor').content.cloneNode(true);
        template.querySelector('#gestor-nome').textContent = currentUser.name;
        app.innerHTML = '';
        app.appendChild(template);
        
        setupGestorListeners();
        loadAllFretes();
    }
}

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

function setupMotoristaListeners() {
    document.getElementById('frete-form')?.addEventListener('submit', handleFreteSubmit);
    document.getElementById('refresh-location')?.addEventListener('click', () => refreshLocation());
    document.getElementById('view-origem-map')?.addEventListener('click', () => showLocationOnMap(currentLocation, 'origem'));
    document.getElementById('search-partida')?.addEventListener('click', () => openMapForSearch('partida'));
    document.getElementById('search-entrega')?.addEventListener('click', () => openMapForSearch('entrega'));
    
    // Botão para reiniciar GPS
    document.getElementById('restart-gps')?.addEventListener('click', () => {
        if (watchPositionId) {
            navigator.geolocation.clearWatch(watchPositionId);
            watchPositionId = null;
        }
        startGPS();
    });
}

function setupGestorListeners() {
    document.getElementById('filter-btn')?.addEventListener('click', loadAllFretes);
    document.getElementById('filter-motorista')?.addEventListener('input', debounce(loadAllFretes, 500));
    document.getElementById('filter-data')?.addEventListener('change', loadAllFretes);
=======
  const app = document.getElementById("app");

  if (currentUser.role === "motorista") {
    const template = document
      .getElementById("template-motorista")
      .content.cloneNode(true);
    template.querySelector("#motorista-nome").textContent = currentUser.name;
    app.innerHTML = "";
    app.appendChild(template);

    const modalTemplate = document
      .getElementById("template-modal-mapa")
      .content.cloneNode(true);
    app.appendChild(modalTemplate);

    setupMotoristaListeners();

    setTimeout(() => {
      startGPS();
      loadMotoristaFretes();
      initBootstrapHelpers();
    }, 100);
  } else if (currentUser.role === "gestor") {
    const template = document
      .getElementById("template-gestor")
      .content.cloneNode(true);
    template.querySelector("#gestor-nome").textContent = currentUser.name;
    app.innerHTML = "";
    app.appendChild(template);

    setupGestorListeners();
    loadAllFretes();
    setTimeout(() => {
      initBootstrapHelpers();
    }, 100);
  }
}

function setupEventListeners() {
  document.addEventListener("click", (e) => {
    if (e.target.id === "logout-btn" || e.target.closest("#logout-btn")) {
      handleLogout();
    }
  });
}

function setupMotoristaListeners() {
  document
    .getElementById("frete-form")
    ?.addEventListener("submit", handleFreteSubmit);
  document
    .getElementById("refresh-location")
    ?.addEventListener("click", () => refreshLocation());
  document
    .getElementById("view-origem-map")
    ?.addEventListener("click", () =>
      showLocationOnMap(currentLocation, "origem"),
    );
  document
    .getElementById("search-partida")
    ?.addEventListener("click", () => openMapForSearch("partida"));
  document
    .getElementById("search-entrega")
    ?.addEventListener("click", () => openMapForSearch("entrega"));

  // Listeners para calcular valor total
  document
    .getElementById("peso")
    ?.addEventListener("input", calcularValorTotal);
  document
    .getElementById("valorPorTonelada")
    ?.addEventListener("input", calcularValorTotal);
}

function setupGestorListeners() {
  document
    .getElementById("filter-motorista")
    ?.addEventListener("input", debounce(loadAllFretes, 500));
}

// Inicializar tooltips e popovers do Bootstrap
function initBootstrapHelpers() {
  // Destruir popovers existentes para evitar duplicação
  const existingPopovers = document.querySelectorAll(
    '[data-bs-toggle="popover"]',
  );
  existingPopovers.forEach((el) => {
    const popover = bootstrap.Popover.getInstance(el);
    if (popover) {
      popover.dispose();
    }
  });

  // Criar novos popovers
  const popoverTriggerList = document.querySelectorAll(
    '[data-bs-toggle="popover"]',
  );
  popoverTriggerList.forEach((element) => {
    const popover = new bootstrap.Popover(element, {
      trigger: "click",
      html: true,
      sanitize: false,
    });
  });

  // Fechar popover ao clicar fora
  document.addEventListener("click", function (e) {
    const isPopoverTrigger = e.target.closest('[data-bs-toggle="popover"]');
    const isPopover = e.target.closest(".popover");

    if (!isPopoverTrigger && !isPopover) {
      // Fechar todos os popovers abertos
      document.querySelectorAll(".popover.show").forEach((popoverEl) => {
        const triggerEl = document.querySelector(
          `[aria-describedby="${popoverEl.id}"]`,
        );
        if (triggerEl) {
          bootstrap.Popover.getInstance(triggerEl)?.hide();
        }
      });
    }
  });

  // Tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  tooltipTriggerList.forEach((element) => {
    new bootstrap.Tooltip(element, {
      trigger: "hover focus click",
    });
  });
}

// Calcular valor total do frete
function calcularValorTotal() {
  const toneladas = parseFloat(document.getElementById("peso").value) || 0;
  const valorPorTonelada =
    parseFloat(document.getElementById("valorPorTonelada").value) || 0;

  const valorTotal = toneladas * valorPorTonelada;

  const valorFormatado = valorTotal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  document.getElementById("valorTotal").textContent = valorFormatado;

  return valorTotal;
>>>>>>> mateus/front
}

// Função para obter endereço a partir de coordenadas
async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=pt`);
        const data = await response.json();
        
        if (data && data.display_name) {
            return data.display_name;
        }
        return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
        console.error('Erro ao obter endereço:', error);
        return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
}

// Função para buscar coordenadas a partir de endereço
async function getCoordsFromAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=pt`);
        const data = await response.json();
        
        if (data && data.length > 0) {
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

// GPS Functions corrigida
function startGPS() {
<<<<<<< HEAD
    console.log('Iniciando GPS...');
    
    const gpsStatus = document.getElementById('gps-status');
    if (!gpsStatus) {
        console.error('Elemento GPS não encontrado');
        return;
    }
    
    if (!navigator.geolocation) {
        gpsStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS não suportado';
        return;
    }
    
    gpsStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Solicitando permissão...';
    
    // Limpar watch anterior
    if (watchPositionId) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
    }
    
    // Tentar obter posição uma vez (solicita permissão)
    navigator.geolocation.getCurrentPosition(
        // Sucesso - permissão concedida
        (position) => {
            console.log('Permissão concedida, iniciando monitoramento');
            startWatching();
=======
  console.log("Iniciando GPS...");

  const gpsStatus = document.getElementById("gps-status");
  if (!gpsStatus) {
    console.error("Elemento GPS não encontrado");
    return;
  }

  if (!navigator.geolocation) {
    gpsStatus.innerHTML =
      '<i class="fas fa-exclamation-triangle me-2"></i> GPS não suportado';
    return;
  }

  if (watchPositionId) {
    navigator.geolocation.clearWatch(watchPositionId);
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Permissão concedida, iniciando monitoramento");

      watchPositionId = navigator.geolocation.watchPosition(
        async (position) => {
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          try {
            const address = await getAddressFromCoords(
              currentLocation.lat,
              currentLocation.lng,
            );
            currentAddress = address;

            const origemInput = document.getElementById("origem");
            if (origemInput) {
              origemInput.value = address;
            }

            gpsStatus.innerHTML = `
                            <i class="fas fa-check-circle me-2"></i>
                            <span>GPS ativo - ${address.substring(0, 30)}...</span>
                        `;
            gpsStatus.className =
              "alert alert-success d-flex align-items-center";
          } catch (e) {
            const origemInput = document.getElementById("origem");
            if (origemInput) {
              origemInput.value = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
            }

            gpsStatus.innerHTML = `
                            <i class="fas fa-check-circle me-2"></i>
                            <span>GPS ativo - coordenadas obtidas</span>
                        `;
            gpsStatus.className =
              "alert alert-success d-flex align-items-center";
          }
>>>>>>> mateus/front
        },
        // Erro - permissão negada ou timeout
        (error) => {
<<<<<<< HEAD
            console.error('Erro ao solicitar permissão:', error);
            
            if (error.code === 1) {
                gpsStatus.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Permissão negada</strong><br>
                        <small>Ative a localização e clique em "Reiniciar GPS"</small>
                    </div>
                `;
            } else if (error.code === 3) {
                // Timeout - tenta de novo com configuração diferente
                gpsStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Timeout, tentando novamente...';
                setTimeout(() => {
                    startGPS();
                }, 2000);
            } else {
                gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Erro: ${error.message}`;
            }
        },
        { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
    
    function startWatching() {
        gpsStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obtendo localização...';
        
        watchPositionId = navigator.geolocation.watchPosition(
            async (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Tentar obter endereço, mas se falhar, mostrar coordenadas
                try {
                    const address = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
                    currentAddress = address;
                    
                    const origemInput = document.getElementById('origem');
                    if (origemInput) {
                        origemInput.value = address;
                    }
                    
                    gpsStatus.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>GPS ativo - ${address.substring(0, 30)}...</span>
                    `;
                } catch (e) {
                    const origemInput = document.getElementById('origem');
                    if (origemInput) {
                        origemInput.value = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
                    }
                    
                    gpsStatus.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <span>GPS ativo - coordenadas obtidas</span>
                    `;
                }
                
                gpsStatus.classList.add('active');
            },
            (error) => {
                console.error('Erro no watch:', error);
                gpsStatus.classList.remove('active');
                
                if (error.code === 1) {
                    gpsStatus.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Permissão negada</strong><br>
                            <small>Ative a localização e clique em "Reiniciar GPS"</small>
                        </div>
                    `;
                } else if (error.code === 2) {
                    gpsStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sinal indisponível';
                } else if (error.code === 3) {
                    gpsStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Tempo excedido';
                } else {
                    gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Erro: ${error.message}`;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }
=======
          console.error("Erro no watch:", error);
          handleGPSError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    },
    (error) => {
      console.error("Erro ao solicitar permissão:", error);
      handleGPSError(error);

      if (error.code === 1) {
        gpsStatus.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <div>
                        <strong>Permissão negada</strong><br>
                        <small>No celular: Configurações > Apps > FrotaTrack > Permissões > Ativar Localização</small>
                    </div>
                `;
      }
    },
  );
}

function handleGPSError(error) {
  const gpsStatus = document.getElementById("gps-status");
  if (!gpsStatus) return;

  let msg = "Erro no GPS";
  if (error.code === 1) msg = "Permissão negada";
  else if (error.code === 2) msg = "Sinal indisponível";
  else if (error.code === 3) msg = "Tempo excedido";

  gpsStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${msg}`;
  gpsStatus.className = "alert alert-danger d-flex align-items-center";
>>>>>>> mateus/front
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
<<<<<<< HEAD
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
=======
  currentField = fieldId;

  const modalEl = document.getElementById("map-modal");

  document.getElementById("map-modal-title").textContent =
    fieldId === "partida"
      ? "Selecione o local de carregamento"
      : "Selecione o local de descarregamento";

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  const L = await loadLeafletMap();

  modalEl.addEventListener("shown.bs.modal", function onModalShown() {
    modalEl.removeEventListener("shown.bs.modal", onModalShown);

    setTimeout(async () => {
      if (!mapInitialized) {
        map = L.map("map").setView([-23.5505, -46.6333], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        mapInitialized = true;
      } else {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }

      const existingAddress = document.getElementById(fieldId).value;
      if (existingAddress) {
        searchAndCenterMap(existingAddress);
      }

      map.on("click", async (e) => {
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
    }, 200);
  });

  modalEl.addEventListener("hidden.bs.modal", function onModalHidden() {
    modalEl.removeEventListener("hidden.bs.modal", onModalHidden);

    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
  });

  document.getElementById("confirm-map-location").onclick = () => {
    if (marker) {
      document.getElementById(currentField).value = marker.address;
      modal.hide();
    } else {
      alert("Clique no mapa para selecionar um local");
    }
  };
>>>>>>> mateus/front
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

<<<<<<< HEAD
function showLocationOnMap(location, fieldId) {
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

// Calcular consumo de combustível
function calculateFuel(distance, peso) {
    const consumoBase = 2.5;
    const fatorCarga = 1 + (peso / 15000);
    return Math.ceil(distance / (consumoBase / fatorCarga));
=======
function showLocationOnMap(location) {
  if (!location) {
    alert("Localização não disponível");
    return;
  }

  window.open(
    `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`,
    "_blank",
  );
}

// Calcular consumo de combustível
function calculateFuel(distance, pesoKg) {
  const consumoBase = 2.5; // km por litro
  const fatorCarga = 1 + pesoKg / 1000 / 15; // fator baseado em toneladas
  return Math.ceil(distance / (consumoBase / fatorCarga));
>>>>>>> mateus/front
}

// Handle Frete Submit
async function handleFreteSubmit(e) {
<<<<<<< HEAD
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
        document.getElementById('distancia').value = '';
        document.getElementById('combustivel').value = '';
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

// Load Motorista Fretes - SEM orderBy
async function loadMotoristaFretes() {
    const fretesList = document.getElementById('fretes-list');
    if (!fretesList) return;
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    
    try {
        const snapshot = await db.collection('fretes')
            .where('motoristaId', '==', currentUser.username)
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><p>Nenhum frete ainda</p></div>';
            return;
        }
        
        // Converter para array e ordenar manualmente
        let fretes = [];
        snapshot.forEach(doc => {
            fretes.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar manualmente por timestamp (mais recente primeiro)
        fretes.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.seconds - a.timestamp.seconds;
        });
        
        let html = '';
        fretes.forEach(f => {
            const data = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : 'Data não disponível';
            
            html += `
=======
  e.preventDefault();

  if (!currentUser) {
    alert("Usuário não logado!");
    return;
  }

  if (!currentLocation) {
    alert("Aguardando sinal GPS...");
    return;
  }

  const origem = document.getElementById("origem").value;
  const partida = document.getElementById("partida").value;
  const entrega = document.getElementById("entrega").value;
  const toneladas = parseFloat(document.getElementById("peso").value);
  const valorPorTonelada = parseFloat(
    document.getElementById("valorPorTonelada").value,
  );

  if (!origem || !partida || !entrega || !toneladas || !valorPorTonelada) {
    alert("Preencha todos os campos!");
    return;
  }

  const distancia = Math.floor(Math.random() * 750) + 50;
  const combustivel = calculateFuel(distancia, toneladas * 1000);
  const valorTotal = toneladas * valorPorTonelada;

  document.getElementById("distancia").textContent = distancia + " km";
  document.getElementById("combustivel").textContent = combustivel + " L";

  const frete = {
    motorista: currentUser.name,
    motoristaId: currentUser.username,
    origem: origem,
    partida: partida,
    entrega: entrega,
    toneladas: toneladas,
    valorPorTonelada: valorPorTonelada,
    valorTotal: valorTotal,
    distancia: distancia,
    combustivel: combustivel,
    localizacaoRegistro: {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      endereco: origem,
    },
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    status: "em_andamento",
  };

  try {
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
    btn.disabled = true;

    await db.collection("fretes").add(frete);

    alert("Frete salvo com sucesso!");
    e.target.reset();
    document.getElementById("distancia").textContent = "0 km";
    document.getElementById("combustivel").textContent = "0 L";
    document.getElementById("valorTotal").textContent = "R$ 0,00";
    loadMotoristaFretes();

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (currentAddress) {
      document.getElementById("origem").value = currentAddress;
    }
  } catch (error) {
    console.error("Erro ao salvar frete:", error);
    alert("Erro ao salvar. Verifique sua conexão.");

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Frete';
    btn.disabled = false;
  }
}

// Load Motorista Fretes
async function loadMotoristaFretes() {
  const fretesList = document.getElementById("fretes-list");
  if (!fretesList) return;

  fretesList.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

  try {
    const snapshot = await db
      .collection("fretes")
      .where("motoristaId", "==", currentUser.username)
      .limit(20)
      .get();

    if (snapshot.empty) {
      fretesList.innerHTML =
        '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete ainda</p></div>';
      return;
    }

    let fretes = [];
    snapshot.forEach((doc) => {
      fretes.push({ id: doc.id, ...doc.data() });
    });

    fretes.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.seconds - a.timestamp.seconds;
    });

    let html = "";
    fretes.forEach((f) => {
      const data = f.timestamp
        ? new Date(f.timestamp.seconds * 1000).toLocaleDateString()
        : "Data não disponível";

      const valorTotalFormatado =
        f.valorTotal?.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }) || "R$ 0,00";

      html += `
>>>>>>> mateus/front
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista">${f.motorista}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${f.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> ${valorTotalFormatado}</div>
                        <div><i class="fas fa-road"></i> ${f.distancia} km</div>
                        <div><i class="fas fa-gas-pump"></i> ${f.combustivel} L</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${f.origem.substring(0, 30)}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${f.partida.substring(0, 30)}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${f.entrega.substring(0, 30)}...</p>
                    </div>
                </div>
            `;
<<<<<<< HEAD
        });
        
        fretesList.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar fretes:', error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar</p></div>';
    }
}

// Load All Fretes (Gestor) - SEM orderBy
async function loadAllFretes() {
    const fretesList = document.getElementById('todos-fretes-list');
    if (!fretesList) return;
    
    const filterMotorista = document.getElementById('filter-motorista')?.value.toLowerCase() || '';
    
    fretesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    
    try {
        const snapshot = await db.collection('fretes')
            .limit(50)
            .get();
        
        if (snapshot.empty) {
            fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><p>Nenhum frete</p></div>';
            updateStats([]);
            return;
        }
        
        let fretes = [];
        snapshot.forEach(doc => {
            fretes.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar manualmente por timestamp
        fretes.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.seconds - a.timestamp.seconds;
        });
        
        let html = '';
        fretes.forEach(frete => {
            if (filterMotorista && !frete.motorista.toLowerCase().includes(filterMotorista)) {
                return;
            }
            
            const data = frete.timestamp ? new Date(frete.timestamp.seconds * 1000).toLocaleDateString() : 'Data não disponível';
            
            html += `
=======
    });

    fretesList.innerHTML = html;
  } catch (error) {
    console.error("Erro ao carregar fretes:", error);
    fretesList.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao conectar</p></div>';
  }
}

// Load All Fretes (Gestor)
async function loadAllFretes() {
  const fretesList = document.getElementById("todos-fretes-list");
  if (!fretesList) return;

  const filterMotorista =
    document.getElementById("filter-motorista")?.value.toLowerCase() || "";

  fretesList.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>Carregando...</div>';

  try {
    const snapshot = await db.collection("fretes").limit(50).get();

    if (snapshot.empty) {
      fretesList.innerHTML =
        '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete</p></div>';
      updateStats([]);
      return;
    }

    let fretes = [];
    snapshot.forEach((doc) => {
      fretes.push({ id: doc.id, ...doc.data() });
    });

    fretes.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.seconds - a.timestamp.seconds;
    });

    let html = "";
    let fretesFiltrados = [];

    fretes.forEach((frete) => {
      if (
        filterMotorista &&
        !frete.motorista.toLowerCase().includes(filterMotorista)
      ) {
        return;
      }

      fretesFiltrados.push(frete);

      const data = frete.timestamp
        ? new Date(frete.timestamp.seconds * 1000).toLocaleDateString()
        : "Data não disponível";

      const valorTotalFormatado =
        frete.valorTotal?.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }) || "R$ 0,00";

      html += `
>>>>>>> mateus/front
                <div class="frete-item">
                    <div class="frete-header">
                        <span class="frete-motorista"><i class="fas fa-user me-1"></i>${frete.motorista}</span>
                        <span class="frete-data">${data}</span>
                    </div>
                    <div class="frete-detalhes">
                        <div><i class="fas fa-weight-hanging"></i> ${frete.toneladas || 0} t</div>
                        <div><i class="fas fa-dollar-sign"></i> ${valorTotalFormatado}</div>
                        <div><i class="fas fa-road"></i> ${frete.distancia} km</div>
                        <div><i class="fas fa-gas-pump"></i> ${frete.combustivel} L</div>
                    </div>
                    <div class="frete-enderecos">
                        <p><i class="fas fa-map-marker-alt"></i> <small>Onde Estou:</small> ${frete.origem.substring(0, 30)}...</p>
                        <p><i class="fas fa-flag"></i> <small>Carregar:</small> ${frete.partida.substring(0, 30)}...</p>
                        <p><i class="fas fa-map-pin"></i> <small>Descarregar:</small> ${frete.entrega.substring(0, 30)}...</p>
                    </div>
                </div>
            `;
<<<<<<< HEAD
        });
        
        fretesList.innerHTML = html || '<div class="empty-state"><i class="fas fa-filter"></i><p>Nenhum resultado</p></div>';
        updateStats(fretes);
    } catch (error) {
        console.error('Erro ao carregar fretes:', error);
        fretesList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao conectar</p></div>';
    }
=======
    });

    fretesList.innerHTML =
      html ||
      '<div class="empty-state"><i class="fas fa-filter fa-3x mb-3 opacity-50"></i><p>Nenhum resultado</p></div>';
    updateStats(fretesFiltrados);
  } catch (error) {
    console.error("Erro ao carregar fretes:", error);
    fretesList.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao conectar</p></div>';
  }
>>>>>>> mateus/front
}

// Update Stats
function updateStats(fretes) {
<<<<<<< HEAD
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
=======
  let totalFretes = fretes.length;
  let totalKm = 0;
  let totalPeso = 0;
  let totalComb = 0;
  let totalValor = 0;

  fretes.forEach((f) => {
    totalKm += f.distancia || 0;
    totalPeso += f.toneladas || 0;
    totalComb += f.combustivel || 0;
    totalValor += f.valorTotal || 0;
  });

  document.getElementById("total-fretes").textContent = totalFretes;
  document.getElementById("total-km").textContent = totalKm + " km";
  document.getElementById("total-peso").textContent = totalPeso + " t";
  document.getElementById("total-combustivel").textContent = totalComb + " L";
>>>>>>> mateus/front
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
