// Estado da aplicação
let currentUser = null;
let watchPositionId = null;
let currentLocation = null;
let currentAddress = "";
let map = null;
let marker = null;
let currentField = "";
let mapModal = null;
let mapInitialized = false
let graphHopperApiKey = null; // Variável global para armazenar a chave da API do Mapa graphhopper

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
      loadGraphHopperKey();
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

// Função para obter endereço a partir de coordenadas
async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=pt`,
    );
    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    }
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  } catch (error) {
    console.error("Erro ao obter endereço:", error);
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  }
}

// Função para buscar coordenadas a partir de endereço
async function getCoordsFromAddress(address) {
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
    console.error("Erro ao buscar endereço:", error);
    return null;
  }
}

// GPS Functions corrigida
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
        },
        // Erro - permissão negada ou timeout
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

// Funções do Mapa
async function openMapForSearch(fieldId) {
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
}

// Handle Frete Submit
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

    // Mostra loading
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculando rota...';
    btn.disabled = true;

    try {
        // Obter coordenadas dos endereços
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

        // Calcular rota real
        const rota = await calcularRotaGraphHopper(coordsPartida, coordsEntrega, toneladas);
        
        if (!rota) {
            alert("Erro ao calcular rota. Tente novamente.");
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const distancia = rota.distancia;
        const combustivel = rota.combustivel;
        const valorTotal = toneladas * valorPorTonelada;

        // Atualiza interface
        document.getElementById("distancia").textContent = distancia + " km";
        document.getElementById("combustivel").textContent = combustivel + " L";
        document.getElementById("valorTotal").textContent = 
            valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        // Prepara objeto do frete
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
                origem: rota.origem || "GraphHopper"
            }
        };

        // Salva no Firebase
        await db.collection("fretes").add(frete);

        alert("Frete salvo com sucesso!");
        e.target.reset();
        loadMotoristaFretes();

        if (currentAddress) {
            document.getElementById("origem").value = currentAddress;
        }

    } catch (error) {
        console.error("Erro ao salvar frete:", error);
        alert("Erro ao salvar. Verifique sua conexão.");
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

// Função para carregar a chave do Firebase
async function loadGraphHopperKey() {
    try {
        // Verifica se já tem em cache
        if (graphHopperApiKey) {
            return graphHopperApiKey;
        }
        
        // Busca do Firestore
        const docRef = db.collection("config").doc("api_graphhopper");
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            graphHopperApiKey = docSnap.data().key;
            console.log("✅ API Key carregada do Firebase");
            return graphHopperApiKey;
        } else {
            console.error("❌ Documento api_graphhopper não encontrado!");
            return null;
        }
    } catch (error) {
        console.error("❌ Erro ao carregar API Key:", error);
        return null;
    }
}

// Função para calcular rota usando GraphHopper
async function calcularRotaGraphHopper(origemCoords, destinoCoords, toneladas) {
    const apiKey = await loadGraphHopperKey();
    
    if (!apiKey) {
        console.error("API Key não disponível");
        // Fallback para OSRM público
        return calcularRotaOSRM(origemCoords, destinoCoords, toneladas);
    }
    
    // Perfil para caminhão com base no peso
    const perfil = toneladas > 10 ? "truck" : "car"; // Se >10t usa perfil caminhão
    
    const url = `https://graphhopper.com/api/1/route?point=${origemCoords.lat},${origemCoords.lng}&point=${destinoCoords.lat},${destinoCoords.lng}&vehicle=${perfil}&locale=pt-BR&key=${apiKey}&points_encoded=false`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.paths && data.paths[0]) {
            const distanciaMetros = data.paths[0].distance;
            const distanciaKm = (distanciaMetros / 1000).toFixed(1);
            const duracaoSegundos = data.paths[0].time / 1000;
            const duracaoHoras = (duracaoSegundos / 3600).toFixed(1);
            
            // Cálculo de combustível (baseado na distância e peso)
            const combustivel = calculateFuel(distanciaKm, toneladas * 1000);
            
            return {
                distancia: distanciaKm,
                duracao: duracaoHoras,
                combustivel: combustivel,
                rawData: data.paths[0] // Dados completos se precisar
            };
        } else {
            throw new Error("Rota não encontrada");
        }
    } catch (error) {
        console.error("Erro GraphHopper:", error);
        // Fallback automático
        return calcularRotaOSRM(origemCoords, destinoCoords, toneladas);
    }
}

// Função de fallback usando OSRM (público, sem chave)
async function calcularRotaOSRM(origemCoords, destinoCoords, toneladas) {
    const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origemCoords.lng},${origemCoords.lat};${destinoCoords.lng},${destinoCoords.lat}?overview=false`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok') {
            const distanciaMetros = data.routes[0].distance;
            const distanciaKm = (distanciaMetros / 1000).toFixed(1);
            const combustivel = calculateFuel(distanciaKm, toneladas * 1000);
            
            return {
                distancia: distanciaKm,
                combustivel: combustivel,
                origem: "OSRM (fallback)"
            };
        }
    } catch (error) {
        console.error("Erro OSRM:", error);
        return null;
    }
}

