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
      waitForGoogleMaps();
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

// Função para obter endereço a partir de coordenadas (usando Google Maps)
async function getAddressFromCoords(lat, lng) {
  // Se Google Maps ainda não carregou, usa fallback do Nominatim
  if (!window.google || !window.google.maps) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=pt`,
      );
      const data = await response.json();
      return data?.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        resolve(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      }
    });
  });
}

// Função para buscar coordenadas a partir de endereço (usando Google Maps)
async function getCoordsFromAddress(address) {
  // Se Google Maps ainda não carregou, usa fallback do Nominatim
  if (!window.google || !window.google.maps) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=pt`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  return new Promise((resolve) => {
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
        resolve(null);
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
            gpsStatus.className = "alert alert-success d-flex align-items-center";
          } catch (e) {
            const origemInput = document.getElementById("origem");
            if (origemInput) {
              origemInput.value = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
            }

            gpsStatus.innerHTML = `
              <i class="fas fa-check-circle me-2"></i>
              <span>GPS ativo - coordenadas obtidas</span>
            `;
            gpsStatus.className = "alert alert-success d-flex align-items-center";
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
}

async function refreshLocation() {
  if (!currentLocation) {
    alert("Aguardando sinal GPS...");
    return;
  }

  const address = await getAddressFromCoords(
    currentLocation.lat,
    currentLocation.lng,
  );
  document.getElementById("origem").value = address;
  alert("Localização atualizada!");
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
      
      const docRef = db.collection("config").doc("api_googlemaps");
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        throw new Error("Documento api_googlemaps não encontrado no Firebase!");
      }
      
      const apiKey = docSnap.data().key;
      if (!apiKey) {
        throw new Error("Chave da API não encontrada no documento!");
      }
      
      console.log("✅ API Key carregada do Firebase");
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMapsCallback = function() {
        console.log("✅ Google Maps carregado com sucesso!");
        window.googleMapsLoaded = true;
        resolve(window.google.maps);
        document.dispatchEvent(new Event('googleMapsLoaded'));
      };
      
      script.onerror = (error) => {
        console.error("❌ Erro ao carregar Google Maps:", error);
        reject(new Error("Falha ao carregar Google Maps"));
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error("❌ Erro ao carregar chave do Firebase:", error);
      
      const gpsStatus = document.getElementById("gps-status");
      if (gpsStatus) {
        gpsStatus.innerHTML = `
          <i class="fas fa-exclamation-triangle me-2"></i>
          <div>
            <strong>Erro no mapa</strong><br>
            <small>Não foi possível carregar o Google Maps. Usando mapa de fallback.</small>
          </div>
        `;
        gpsStatus.className = "alert alert-warning d-flex align-items-center";
      }
      
      reject(error);
    }
  });
  
  return googleMapsPromise;
}

function waitForGoogleMaps() {
  loadGoogleMapsWithFirebaseKey()
    .then(() => {
      console.log("Google Maps pronto!");
    })
    .catch((error) => {
      console.error("Falha ao carregar Google Maps:", error);
      setTimeout(waitForGoogleMaps, 5000);
    });
}

// Funções do Mapa com Google Maps
async function openMapForSearch(fieldId) {
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

      // Se Google Maps não carregou, usa Leaflet como fallback
      if (!window.google || !window.google.maps) {
        initializeLeafletFallback(mapElement, fieldId);
        return;
      }

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
        });

        mapInitialized = true;
      } else {
        google.maps.event.trigger(map, 'resize');
      }

      // Centralizar em endereço existente
      const existingAddress = document.getElementById(fieldId).value;
      if (existingAddress) {
        const coords = await getCoordsFromAddress(existingAddress);
        if (coords) {
          map.setCenter({ lat: coords.lat, lng: coords.lng });
          map.setZoom(15);
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

// Função de fallback com Leaflet (caso Google Maps falhe)
function initializeLeafletFallback(mapElement, fieldId) {
  if (!mapInitialized) {
    map = L.map(mapElement).setView(
      currentLocation ? [currentLocation.lat, currentLocation.lng] : [-23.5505, -46.6333], 
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

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

      marker.bindPopup(`
        <div class="route-info-window">
          <h6>Local selecionado</h6>
          <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
          <button class="btn btn-primary btn-sm w-100 mt-2" onclick="selectMapLocation('${address.replace(/'/g, "\\'")}', ${lat}, ${lng})">
            <i class="fas fa-check me-2"></i>Confirmar
          </button>
        </div>
      `).openPopup();
    });

    mapInitialized = true;
  } else {
    setTimeout(() => map.invalidateSize(), 100);
  }

  const existingAddress = document.getElementById(fieldId).value;
  if (existingAddress) {
    searchAndCenterMap(existingAddress);
  }
}

// Função global para selecionar local no mapa
window.selectMapLocation = (address, lat, lng) => {
  document.getElementById(currentField).value = address;
  const modal = bootstrap.Modal.getInstance(document.getElementById("map-modal"));
  modal.hide();
};

// Função de busca para fallback do Leaflet
async function searchAndCenterMap(query) {
  if (!query || !map || !map.setView) return;
  
  const result = await getCoordsFromAddress(query);
  if (result) {
    map.setView([result.lat, result.lng], 15);
    if (marker) {
      if (map.removeLayer) {
        map.removeLayer(marker);
      } else {
        marker.setMap(null);
      }
    }
    marker = L ? L.marker([result.lat, result.lng]).addTo(map) : 
                new google.maps.Marker({ position: result, map: map });
    marker.address = result.display_name;
  }
}

function showLocationOnMap(location) {
  if (!location) {
    alert("Localização não disponível");
    return;
  }

  window.open(
    `https://www.google.com/maps?q=${location.lat},${location.lng}`,
    "_blank",
  );
}

// Calcular consumo de combustível
function calculateFuel(distance, pesoKg) {
  const consumoBase = 2.5; // km por litro
  const fatorCarga = 1 + pesoKg / 1000 / 15; // fator baseado em toneladas
  return Math.ceil(distance / (consumoBase / fatorCarga));
}

// Handle Frete Submit com Google Maps
async function handleFreteSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("Usuário não logado!");
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
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculando rota...';
  btn.disabled = true;

  try {
    const [coordsPartida, coordsEntrega] = await Promise.all([
      getCoordsFromAddress(partida),
      getCoordsFromAddress(entrega)
    ]);

    if (!coordsPartida || !coordsEntrega) {
      alert("Não foi possível localizar um dos endereços");
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    let distancia, combustivel;

    // Se Google Maps disponível, usa DirectionsService
    if (window.google && window.google.maps && window.google.maps.DirectionsService) {
      const directionsService = new google.maps.DirectionsService();
      
      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: partida,
            destination: entrega,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (result, status) => {
            if (status === "OK") {
              resolve(result);
            } else {
              reject(status);
            }
          }
        );
      });

      const distanceInMeters = result.routes[0].legs[0].distance.value;
      distancia = (distanceInMeters / 1000).toFixed(1);
      combustivel = calculateFuel(distancia, toneladas * 1000);
    } else {
      // Fallback: cálculo linear aproximado
      const R = 6371; // Raio da Terra em km
      const dLat = (coordsEntrega.lat - coordsPartida.lat) * Math.PI / 180;
      const dLon = (coordsEntrega.lng - coordsPartida.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coordsPartida.lat * Math.PI / 180) * Math.cos(coordsEntrega.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distancia = (R * c * 1.3).toFixed(1); // 30% a mais para rotas reais
      combustivel = calculateFuel(distancia, toneladas * 1000);
    }

    const valorTotal = toneladas * valorPorTonelada;

    document.getElementById("distancia").textContent = distancia + " km";
    document.getElementById("combustivel").textContent = combustivel + " L";
    document.getElementById("valorTotal").textContent = 
      valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
      combustivel: combustivel,
      localizacaoRegistro: currentLocation ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        endereco: origem,
      } : null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "em_andamento",
      rotaCalculada: {
        origem: window.google ? "Google Maps" : "Fallback"
      }
    };

    await db.collection("fretes").add(frete);

    alert("Frete salvo com sucesso!");
    e.target.reset();
    loadMotoristaFretes();

    if (currentAddress) {
      document.getElementById("origem").value = currentAddress;
    }

  } catch (error) {
    console.error("Erro ao salvar frete:", error);
    alert("Erro ao calcular rota. Verifique os endereços e tente novamente.");
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
      '<div class="empty-state"><i class="fas fa-filter fa-3x mb-3 opacity-50"></i><p>Nenhum resultado</p></div>';
    updateStats(fretesFiltrados);
  } catch (error) {
    console.error("Erro ao carregar fretes:", error);
    fretesList.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-50"></i><p>Erro ao conectar</p></div>';
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
  document.getElementById("total-peso").textContent = totalPeso + " t";
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
