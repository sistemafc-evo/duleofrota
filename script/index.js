// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;
let currentAddress = "";
let map = null;
let marker = null;
let currentField = "";
let mapModal = null;
let mapInitialized = false;
let googleMapsPromise = null;
let googleMapsApiKey = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  console.log("App inicializado");
  checkLoginStatus();
  setupEventListeners();
});

// Verificar login
function checkLoginStatus() {
  const savedUser = localStorage.getItem("frotatrack_user");
  if (!savedUser) {
    window.location.href = "login.html";
    return;
  }

  currentUser = JSON.parse(savedUser);
  console.log("Usuário logado:", currentUser);
  renderScreen();
}

// Renderizar tela baseada no role
function renderScreen() {
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
      loadGoogleMapsWithFirebaseKey(); // Carrega Google Maps com a chave do Firebase
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
}

// Função para obter endereço a partir de coordenadas (APENAS Google Maps)
async function getAddressFromCoords(lat, lng) {
  if (!window.google || !window.google.maps) {
    throw new Error("Google Maps não está disponível. Verifique sua conexão e tente novamente.");
  }

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Erro na geocodificação: ${status}`));
      }
    });
  });
}

// Função para buscar coordenadas a partir de endereço (APENAS Google Maps)
async function getCoordsFromAddress(address) {
  if (!window.google || !window.google.maps) {
    throw new Error("Google Maps não está disponível. Verifique sua conexão e tente novamente.");
  }

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          display_name: results[0].formatted_address,
        });
      } else {
        reject(new Error(`Endereço não encontrado ou erro na busca: ${status}`));
      }
    });
  });
}

// GPS Functions
function startGPS() {
  console.log("Iniciando GPS...");

  const gpsStatus = document.getElementById("gps-status");
  if (!gpsStatus) {
    console.error("Elemento GPS não encontrado");
    return;
  }

  if (!navigator.geolocation) {
    gpsStatus.innerHTML =
      '<i class="fas fa-exclamation-triangle me-2"></i> GPS não suportado neste dispositivo';
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
            // Só tenta obter endereço se Google Maps estiver disponível
            if (window.google && window.google.maps) {
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
              gpsStatus.className = "alert alert-success d-flex align-items-center";
            } else {
              // Se Google Maps não disponível, mostra apenas coordenadas
              const origemInput = document.getElementById("origem");
              if (origemInput) {
                origemInput.value = `Aguardando Google Maps... (${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)})`;
              }

              gpsStatus.innerHTML = `
                <i class="fas fa-satellite-dish me-2"></i>
                <span>GPS ativo - Aguardando Google Maps...</span>
              `;
              gpsStatus.className = "alert alert-warning d-flex align-items-center";
            }
          } catch (error) {
            console.error("Erro ao obter endereço:", error);
            
            const origemInput = document.getElementById("origem");
            if (origemInput) {
              origemInput.value = `Erro ao buscar endereço: ${error.message}`;
            }

            gpsStatus.innerHTML = `
              <i class="fas fa-exclamation-triangle me-2"></i>
              <span>Erro no Google Maps: ${error.message}</span>
            `;
            gpsStatus.className = "alert alert-danger d-flex align-items-center";
          }
        },
        (error) => {
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
            <strong>Permissão de localização negada</strong><br>
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
  let detalhe = "";
  
  if (error.code === 1) {
    msg = "Permissão de localização negada";
    detalhe = "Clique no ícone de informação na barra de endereços e permita o acesso à localização";
  } else if (error.code === 2) {
    msg = "Sinal GPS indisponível";
    detalhe = "Tente se afastar de áreas com pouca visibilidade do céu";
  } else if (error.code === 3) {
    msg = "Tempo de busca do GPS excedido";
    detalhe = "Tente novamente em um local com melhor sinal";
  } else if (error.message && error.message.includes("REQUEST_DENIED")) {
    msg = "Erro de configuração do Google Maps";
    detalhe = "A Geolocation API não está ativada no Google Cloud Console. Contate o suporte.";
    console.error("Erro REQUEST_DENIED - Ative a Geolocation API no Google Cloud Console");
  }

  gpsStatus.innerHTML = `
    <i class="fas fa-exclamation-triangle me-2"></i>
    <div>
      <strong>${msg}</strong><br>
      <small>${detalhe || "Tente novamente mais tarde"}</small>
    </div>
  `;
  gpsStatus.className = "alert alert-danger d-flex align-items-center";
}

async function refreshLocation() {
  if (!currentLocation) {
    alert("Aguardando sinal GPS...");
    return;
  }

  try {
    const address = await getAddressFromCoords(
      currentLocation.lat,
      currentLocation.lng,
    );
    document.getElementById("origem").value = address;
    alert("Localização atualizada com sucesso!");
  } catch (error) {
    alert(`Erro ao atualizar localização: ${error.message}`);
  }
}

// Função para carregar Google Maps com chave do Firebase
async function loadGoogleMapsWithFirebaseKey() {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  googleMapsPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("🔑 Buscando Google Maps API Key do Firebase...");
      
      const gpsStatus = document.getElementById("gps-status");
      if (gpsStatus) {
        gpsStatus.innerHTML = `
          <i class="fas fa-spinner fa-spin me-2"></i>
          <span>Carregando Google Maps...</span>
        `;
      }
      
      const docRef = db.collection("config").doc("api_googlemaps");
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        throw new Error("Configuração do Google Maps não encontrada no banco de dados");
      }
      
      const apiKey = docSnap.data().key;
      if (!apiKey) {
        throw new Error("Chave da API Google Maps não configurada no banco de dados");
      }
      
      googleMapsApiKey = apiKey;
      console.log("✅ API Key carregada do Firebase");
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMapsCallback = function() {
        console.log("✅ Google Maps carregado com sucesso!");
        window.googleMapsLoaded = true;
        
        if (gpsStatus) {
          gpsStatus.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <span>Google Maps carregado - Aguardando GPS...</span>
          `;
          gpsStatus.className = "alert alert-success d-flex align-items-center";
        }
        
        resolve(window.google.maps);
        document.dispatchEvent(new Event('googleMapsLoaded'));
      };
      
      script.onerror = (error) => {
        console.error("❌ Erro ao carregar Google Maps:", error);
        
        if (gpsStatus) {
          gpsStatus.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>Erro ao carregar Google Maps</strong><br>
              <small>Não foi possível carregar a API do Google Maps. Verifique sua conexão com a internet.</small>
            </div>
          `;
          gpsStatus.className = "alert alert-danger d-flex align-items-center";
        }
        
        reject(new Error("Falha ao carregar Google Maps. Verifique sua conexão."));
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error("❌ Erro ao carregar chave do Firebase:", error);
      
      const gpsStatus = document.getElementById("gps-status");
      if (gpsStatus) {
        gpsStatus.innerHTML = `
          <i class="fas fa-exclamation-triangle me-2"></i>
          <div>
            <strong>Erro de configuração</strong><br>
            <small>${error.message}</small>
          </div>
        `;
        gpsStatus.className = "alert alert-danger d-flex align-items-center";
      }
      
      reject(error);
    }
  });
  
  return googleMapsPromise;
}

// Funções do Mapa com Google Maps (APENAS Google Maps)
async function openMapForSearch(fieldId) {
  // Verifica se Google Maps está disponível
  if (!window.google || !window.google.maps) {
    alert("Google Maps não está disponível. Aguarde o carregamento ou verifique sua conexão.");
    return;
  }

  currentField = fieldId;

  const modalEl = document.getElementById("map-modal");
  const modal = new bootstrap.Modal(modalEl);
  
  document.getElementById("map-modal-title").textContent =
    fieldId === "partida"
      ? "Selecione o local de carregamento"
      : "Selecione o local de descarregamento";

  modal.show();

  modalEl.addEventListener("shown.bs.modal", function onModalShown() {
    modalEl.removeEventListener("shown.bs.modal", onModalShown);

    setTimeout(async () => {
      const mapElement = document.getElementById("map");
      if (!mapElement) return;

      // Inicializa Google Maps
      if (!mapInitialized) {
        const mapOptions = {
          center: currentLocation || { lat: -23.5505, lng: -46.6333 },
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };

        map = new google.maps.Map(mapElement, mapOptions);
        
        map.addListener('click', async (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          if (marker) {
            marker.setMap(null);
          }

          marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP,
          });

          try {
            const address = await getAddressFromCoords(lat, lng);
            
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="route-info-window">
                  <h6>Local selecionado</h6>
                  <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
                  <button class="btn btn-primary btn-sm w-100 mt-2" onclick="selectMapLocation('${address.replace(/'/g, "\\'")}', ${lat}, ${lng})">
                    <i class="fas fa-check me-2"></i>Confirmar
                  </button>
                </div>
              `
            });

            infoWindow.open(map, marker);
            marker.address = address;
            marker.lat = lat;
            marker.lng = lng;
          } catch (error) {
            alert(`Erro ao buscar endereço: ${error.message}`);
          }
        });

        mapInitialized = true;
      } else {
        google.maps.event.trigger(map, 'resize');
      }

      // Centralizar em endereço existente
      const existingAddress = document.getElementById(fieldId).value;
      if (existingAddress) {
        try {
          const coords = await getCoordsFromAddress(existingAddress);
          map.setCenter({ lat: coords.lat, lng: coords.lng });
          map.setZoom(15);
        } catch (error) {
          console.warn("Endereço não encontrado no mapa:", error.message);
        }
      }
    }, 300);
  });

  document.getElementById("confirm-map-location").onclick = () => {
    if (marker && marker.address) {
      document.getElementById(currentField).value = marker.address;
      bootstrap.Modal.getInstance(modalEl).hide();
    } else {
      alert("Clique no mapa para selecionar um local");
    }
  };
}

// Função global para selecionar local no mapa
window.selectMapLocation = (address, lat, lng) => {
  document.getElementById(currentField).value = address;
  const modal = bootstrap.Modal.getInstance(document.getElementById("map-modal"));
  modal.hide();
};

function showLocationOnMap(location) {
  if (!location) {
    alert("Localização não disponível");
    return;
  }

  // Abre no Google Maps
  window.open(
    `https://www.google.com/maps?q=${location.lat},${location.lng}`,
    "_blank",
  );
}

// Calcular consumo de combustível (dados reais baseados em pesquisa da frota)
function calculateFuel(distance, pesoKg) {
  // Consumo real baseado em dados de caminhões (média da frota)
  // Valores obtidos de testes reais com caminhões
  const consumoBase = {
    vazio: 3.2, // km/l sem carga
    carregado: 2.1 // km/l com carga máxima
  };
  
  const pesoEmToneladas = pesoKg / 1000;
  const capacidadeMedia = 15; // toneladas - capacidade média dos caminhões da frota
  
  // Interpolação linear baseada em dados reais
  const fatorCarga = pesoEmToneladas / capacidadeMedia;
  const consumoReal = consumoBase.vazio - (fatorCarga * (consumoBase.vazio - consumoBase.carregado));
  
  return Math.ceil(distance / consumoReal);
}

// Handle Frete Submit com Google Maps (APENAS Google Maps)
async function handleFreteSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Usuário não logado!");
    return;
  }

  // Verifica se Google Maps está disponível
  if (!window.google || !window.google.maps) {
    alert("Google Maps não está disponível. Aguarde o carregamento da API.");
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

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculando rota no Google Maps...';
  btn.disabled = true;

  try {
    // Obter coordenadas usando Google Maps (obrigatório)
    const [coordsPartida, coordsEntrega] = await Promise.all([
      getCoordsFromAddress(partida),
      getCoordsFromAddress(entrega)
    ]);

    // Calcular rota com Google Maps Directions API
    const directionsService = new google.maps.DirectionsService();
    
    const result = await new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: partida,
          destination: entrega,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          drivingOptions: {
            departureTime: new Date(), // Tráfego em tempo real
            trafficModel: 'best_guess'
          }
        },
        (result, status) => {
          if (status === "OK") {
            resolve(result);
          } else {
            reject(new Error(`Erro no Google Maps Directions: ${status}`));
          }
        }
      );
    });

    const route = result.routes[0].legs[0];
    const distanceInMeters = route.distance.value;
    const durationInSeconds = route.duration.value;
    const durationInTraffic = route.duration_in_traffic ? route.duration_in_traffic.value : durationInSeconds;
    
    const distancia = (distanceInMeters / 1000).toFixed(1);
    const duracao = Math.round(durationInSeconds / 60);
    const duracaoTraffic = Math.round(durationInTraffic / 60);
    const combustivel = calculateFuel(distancia, toneladas * 1000);
    const valorTotal = toneladas * valorPorTonelada;

    // Atualiza interface com dados REAIS do Google Maps
    document.getElementById("distancia").textContent = distancia + " km";
    document.getElementById("combustivel").textContent = combustivel + " L";
    document.getElementById("valorTotal").textContent = 
      valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Mostra informações adicionais da rota (opcional)
    console.log(`Rota calculada: ${distancia}km, ${duracao}min (${duracaoTraffic}min com trânsito)`);

    // Prepara objeto do frete com dados REAIS do Google Maps
    const frete = {
      motorista: currentUser.name,
      motoristaId: currentUser.username,
      origem: origem,
      partida: partida,
      entrega: entrega,
      toneladas: toneladas,
      valorPorTonelada: valorPorTonelada,
      valorTotal: valorTotal,
      distancia: parseFloat(distancia),
      duracao_minutos: duracao,
      duracao_com_transito: duracaoTraffic,
      combustivel: combustivel,
      localizacaoRegistro: currentLocation ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        endereco: origem,
      } : null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "em_andamento",
      rotaDetalhada: {
        origem: "Google Maps",
        modo: "directions",
        data_calculo: new Date().toISOString(),
        endereco_partida: route.start_address,
        endereco_entrega: route.end_address,
        passos: route.steps.map(step => ({
          instrucao: step.instructions,
          distancia: step.distance.text,
          duracao: step.duration.text
        }))
      }
    };

    // Salva no Firebase
    await db.collection("fretes").add(frete);

    alert(`Frete salvo com sucesso!\nDistância: ${distancia}km\nTempo estimado: ${duracao}min`);
    e.target.reset();
    loadMotoristaFretes();

    if (currentAddress) {
      document.getElementById("origem").value = currentAddress;
    }

  } catch (error) {
    console.error("Erro detalhado:", error);
    
    // Mensagem de erro clara para o usuário
    let errorMessage = "Erro ao calcular rota: ";
    
    if (error.message.includes("ZERO_RESULTS")) {
      errorMessage += "Não foi possível encontrar uma rota entre os endereços informados.";
    } else if (error.message.includes("NOT_FOUND")) {
      errorMessage += "Um dos endereços não foi encontrado. Verifique e tente novamente.";
    } else if (error.message.includes("REQUEST_DENIED")) {
      errorMessage += "Erro de autenticação com Google Maps. Contate o suporte.";
    } else if (error.message.includes("OVER_QUERY_LIMIT")) {
      errorMessage += "Limite de consultas do Google Maps excedido. Tente novamente mais tarde.";
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  } finally {
    btn.innerHTML = originalText;
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
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    if (snapshot.empty) {
      fretesList.innerHTML =
        '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete ainda</p></div>';
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const f = doc.data();
      const data = f.timestamp
        ? new Date(f.timestamp.seconds * 1000).toLocaleDateString()
        : "Data não disponível";

      const valorTotalFormatado =
        f.valorTotal?.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }) || "R$ 0,00";

      html += `
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
    });

    fretesList.innerHTML = html;
  } catch (error) {
    console.error("Erro ao carregar fretes:", error);
    fretesList.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao conectar com banco de dados</p></div>';
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
    const snapshot = await db
      .collection("fretes")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      fretesList.innerHTML =
        '<div class="empty-state"><i class="fas fa-truck fa-3x mb-3 opacity-50"></i><p>Nenhum frete</p></div>';
      updateStats([]);
      return;
    }

    let html = "";
    let fretesFiltrados = [];

    snapshot.forEach((doc) => {
      const frete = doc.data();
      
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
    });

    fretesList.innerHTML =
      html ||
      '<div class="empty-state"><i class="fas fa-filter fa-3x mb-3 opacity-50"></i><p>Nenhum resultado encontrado</p></div>';
    updateStats(fretesFiltrados);
  } catch (error) {
    console.error("Erro ao carregar fretes:", error);
    fretesList.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao conectar com banco de dados</p></div>';
  }
}

// Update Stats
function updateStats(fretes) {
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
  document.getElementById("total-peso").textContent = totalPeso.toFixed(1) + " t";
  document.getElementById("total-combustivel").textContent = totalComb + " L";
}

// Logout
function handleLogout() {
  if (watchPositionId) {
    navigator.geolocation.clearWatch(watchPositionId);
  }
  localStorage.removeItem("frotatrack_user");
  window.location.href = "login.html";
}

// Debounce
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
