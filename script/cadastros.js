// ============================================
// CADASTROS.JS - Gestão de Usuários e Caminhões
// Disponível para: gerente, admin
// ============================================

// Template da tela de cadastros
const cadastrosTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-address-card me-2"></i>
        <span>Gerencie usuários e caminhões do sistema</span>
    </div>
</div>

<!-- Abas -->
<ul class="nav nav-tabs mb-4" id="cadastrosTab" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" id="tab-usuarios" data-bs-toggle="tab" data-bs-target="#conteudo-usuarios" type="button" role="tab">
            <i class="fas fa-users me-1"></i>Usuários
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="tab-caminhoes" data-bs-toggle="tab" data-bs-target="#conteudo-caminhoes" type="button" role="tab">
            <i class="fas fa-truck me-1"></i>Caminhões
        </button>
    </li>
</ul>

<div class="tab-content">
    <!-- CONTEÚDO USUÁRIOS -->
    <div class="tab-pane fade show active" id="conteudo-usuarios" role="tabpanel">
        <!-- Botão de Novo Usuário -->
        <div class="d-flex justify-content-end mb-3">
            <button id="btn-novo-usuario" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-2"></i>Novo Usuário
            </button>
        </div>

        <!-- Tabela de Usuários -->
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-users me-2"></i>Usuários do Sistema
                </h6>
                <div class="table-responsive">
                    <table class="table table-hover table-sm" id="tabela-usuarios">
                        <thead class="table-light">
                            <tr>
                                <th>Nome</th>
                                <th>Login</th>
                                <th>Email</th>
                                <th>Perfil</th>
                                <th>Status</th>
                                <th>Data Criação</th>
                                <th>Último Login</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-usuarios-corpo">
                            <tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando usuários...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- CONTEÚDO CAMINHÕES -->
    <div class="tab-pane fade" id="conteudo-caminhoes" role="tabpanel">
        <!-- Botão de Novo Caminhão -->
        <div class="d-flex justify-content-end mb-3">
            <button id="btn-novo-caminhao" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-2"></i>Novo Caminhão
            </button>
        </div>

        <!-- Tabela de Caminhões -->
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-truck me-2"></i>Frota de Caminhões
                </h6>
                <div class="table-responsive">
                    <table class="table table-hover table-sm" id="tabela-caminhoes">
                        <thead class="table-light">
                            <tr>
                                <th>Placa</th>
                                <th>Modelo</th>
                                <th>Marca</th>
                                <th>Ano</th>
                                <th>Capacidade (t)</th>
                                <th>Status</th>
                                <th>Motorista</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-caminhoes-corpo">
                            <tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando caminhões...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- MODAL USUÁRIO (mantido) -->
<div class="modal fade" id="modal-usuario" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h6 class="modal-title" id="modal-usuario-titulo">
                    <i class="fas fa-user-plus me-2"></i>Novo Usuário
                </h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="form-usuario">
                    <input type="hidden" id="usuario-id">
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">NOME COMPLETO</label>
                        <input type="text" class="form-control form-control-sm" id="usuario-nome" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">LOGIN</label>
                        <input type="text" class="form-control form-control-sm" id="usuario-login" required>
                        <small class="text-muted">Usado para acessar o sistema</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">E-MAIL</label>
                        <input type="email" class="form-control form-control-sm" id="usuario-email" required>
                        <small class="text-muted">Usado para login e recuperação de senha</small>
                    </div>
                    <div class="mb-3" id="campo-senha">
                        <label class="form-label small text-secondary fw-semibold">SENHA</label>
                        <input type="password" class="form-control form-control-sm" id="usuario-senha">
                        <small class="text-muted" id="senha-ajuda">Mínimo 6 caracteres (preenchido apenas para novo usuário)</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">PERFIL</label>
                        <select class="form-select form-select-sm" id="usuario-perfil" required>
                            <option value="motorista">Motorista</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="gerente">Gerente</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">STATUS</label>
                        <select class="form-select form-select-sm" id="usuario-status">
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-sm btn-primary" id="btn-salvar-usuario">
                    <i class="fas fa-save me-1"></i>Salvar
                </button>
            </div>
        </div>
    </div>
</div>

<!-- MODAL CAMINHÃO -->
<div class="modal fade" id="modal-caminhao" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h6 class="modal-title" id="modal-caminhao-titulo">
                    <i class="fas fa-truck-plus me-2"></i>Novo Caminhão
                </h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="form-caminhao">
                    <input type="hidden" id="caminhao-id">
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">PLACA</label>
                        <input type="text" class="form-control form-control-sm text-uppercase" id="caminhao-placa" placeholder="ABC1D23" required maxlength="8">
                        <small class="text-muted">Formato: ABC1D23 ou ABC-1234</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">MODELO</label>
                        <input type="text" class="form-control form-control-sm" id="caminhao-modelo" placeholder="Ex: FH 540" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">MARCA</label>
                        <input type="text" class="form-control form-control-sm" id="caminhao-marca" placeholder="Ex: Volvo, Scania, Mercedes" required>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label small text-secondary fw-semibold">ANO</label>
                            <input type="number" class="form-control form-control-sm" id="caminhao-ano" placeholder="2020" min="1990" max="2026" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label small text-secondary fw-semibold">CAPACIDADE (t)</label>
                            <input type="number" class="form-control form-control-sm" id="caminhao-capacidade" placeholder="Ex: 15" step="0.5" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">MOTORISTA RESPONSÁVEL</label>
                        <select class="form-select form-select-sm" id="caminhao-motorista">
                            <option value="">Selecione um motorista</option>
                        </select>
                        <small class="text-muted">Opcional - vincular motorista ao caminhão</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">STATUS</label>
                        <select class="form-select form-select-sm" id="caminhao-status">
                            <option value="ativo">Ativo</option>
                            <option value="manutencao">Em Manutenção</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">OBSERVAÇÕES</label>
                        <textarea class="form-control form-control-sm" id="caminhao-obs" rows="2" placeholder="Informações adicionais..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-sm btn-primary" id="btn-salvar-caminhao">
                    <i class="fas fa-save me-1"></i>Salvar
                </button>
            </div>
        </div>
    </div>
</div>

<!-- MODAL RESET SENHA (mantido) -->
<div class="modal fade" id="modal-reset-senha" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-warning">
                <h6 class="modal-title"><i class="fas fa-key me-2"></i>Resetar Senha</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Deseja resetar a senha do usuário <strong id="reset-usuario-nome"></strong>?</p>
                <p class="text-muted small">Uma nova senha temporária será gerada e o usuário deverá alterá-la no próximo login.</p>
                <div class="alert alert-info mt-2">
                    <i class="fas fa-info-circle me-1"></i>
                    Nova senha: <strong id="nova-senha-temporaria"></strong>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-sm btn-warning" id="btn-confirmar-reset">
                    <i class="fas fa-key me-1"></i>Resetar Senha
                </button>
            </div>
        </div>
    </div>
</div>
`;

// Estado da tela
let usuarios = [];
let caminhoes = [];
let motoristas = [];
let usuarioEditando = null;
let caminhaoEditando = null;
let usuarioResetando = null;
let modalUsuario = null;
let modalCaminhao = null;
let modalResetSenha = null;

// Inicializar tela de cadastros
function initCadastros(container) {
  console.log("👥 Inicializando tela de Cadastros");

  if (container) {
    container.innerHTML = cadastrosTemplate;
  }

  setTimeout(() => {
    inicializarModais();
    setupCadastrosListeners();
    carregarUsuarios();
    carregarCaminhoes();
    carregarMotoristasParaSelect();
  }, 100);
}

// Inicializar modais do Bootstrap
function inicializarModais() {
  const modalUsuarioEl = document.getElementById("modal-usuario");
  const modalCaminhaoEl = document.getElementById("modal-caminhao");
  const modalResetEl = document.getElementById("modal-reset-senha");

  if (modalUsuarioEl) modalUsuario = new bootstrap.Modal(modalUsuarioEl);
  if (modalCaminhaoEl) modalCaminhao = new bootstrap.Modal(modalCaminhaoEl);
  if (modalResetEl) modalResetSenha = new bootstrap.Modal(modalResetEl);
}

// Configurar listeners
function setupCadastrosListeners() {
  // Usuários
  const btnNovoUsuario = document.getElementById("btn-novo-usuario");
  const btnSalvarUsuario = document.getElementById("btn-salvar-usuario");
  const btnConfirmarReset = document.getElementById("btn-confirmar-reset");

  if (btnNovoUsuario) {
    btnNovoUsuario.addEventListener("click", () => abrirModalNovoUsuario());
  }
  if (btnSalvarUsuario) {
    btnSalvarUsuario.addEventListener("click", salvarUsuario);
  }
  if (btnConfirmarReset) {
    btnConfirmarReset.addEventListener("click", confirmarResetSenha);
  }

  // Caminhões
  const btnNovoCaminhao = document.getElementById("btn-novo-caminhao");
  const btnSalvarCaminhao = document.getElementById("btn-salvar-caminhao");

  if (btnNovoCaminhao) {
    btnNovoCaminhao.addEventListener("click", () => abrirModalNovoCaminhao());
  }
  if (btnSalvarCaminhao) {
    btnSalvarCaminhao.addEventListener("click", salvarCaminhao);
  }
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

async function carregarUsuarios() {
  const tabelaCorpo = document.getElementById("tabela-usuarios-corpo");
  if (!tabelaCorpo) return;

  tabelaCorpo.innerHTML =
    '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando usuários...</td></tr>';

  try {
    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      tabelaCorpo.innerHTML =
        '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum usuário cadastrado</td></tr>';
      return;
    }

    const dados = docSnap.data();
    usuarios = [];

    for (const [key, value] of Object.entries(dados)) {
      if (
        key === "criado_por" ||
        key === "criado_em" ||
        key === "ultima_atualizacao"
      )
        continue;
      usuarios.push({ id: key, ...value });
    }

    usuarios.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    renderizarTabelaUsuarios();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    tabelaCorpo.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Erro ao carregar usuários: ${error.message}</td></tr>`;
  }
}

function renderizarTabelaUsuarios() {
  const tabelaCorpo = document.getElementById("tabela-usuarios-corpo");
  if (!tabelaCorpo) return;

  if (usuarios.length === 0) {
    tabelaCorpo.innerHTML =
      '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum usuário cadastrado</td></tr>';
    return;
  }

  let html = "";
  usuarios.forEach((usuario) => {
    const dataCriacao = usuario.criado_data?.toDate
      ? usuario.criado_data.toDate().toLocaleDateString("pt-BR")
      : usuario.criado_data || "-";
    const statusClass =
      usuario.status_ativo === true ? "bg-success" : "bg-secondary";
    const statusText = usuario.status_ativo === true ? "Ativo" : "Inativo";

    let perfilClass = "bg-info";
    if (usuario.perfil === "gerente") perfilClass = "bg-danger";
    else if (usuario.perfil === "supervisor")
      perfilClass = "bg-warning text-dark";

    html += `
            <tr>
                <td class="small fw-semibold">${escapeHtml(usuario.nome) || "-"}</td>
                <td class="small">${escapeHtml(usuario.login) || "-"}</td>
                <td class="small">${escapeHtml(usuario.email) || "-"}</td>
                <td class="small"><span class="badge ${perfilClass}">${usuario.perfil || "motorista"}</span></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="small">${dataCriacao}</td>
                <td class="small">${usuario.ultimo_login || "-"}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="window.editarUsuario('${usuario.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="window.resetarSenha('${usuario.id}')" title="Resetar Senha">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${usuario.status_ativo === true ? "danger" : "success"}" onclick="window.toggleStatusUsuario('${usuario.id}')" title="${usuario.status_ativo === true ? "Inativar" : "Ativar"}">
                        <i class="fas fa-${usuario.status_ativo === true ? "ban" : "check-circle"}"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  tabelaCorpo.innerHTML = html;
}

function abrirModalNovoUsuario() {
  usuarioEditando = null;
  document.getElementById("usuario-id").value = "";
  document.getElementById("usuario-nome").value = "";
  document.getElementById("usuario-login").value = "";
  document.getElementById("usuario-email").value = "";
  document.getElementById("usuario-senha").value = "";
  document.getElementById("usuario-perfil").value = "motorista";
  document.getElementById("usuario-status").value = "true";
  document.getElementById("modal-usuario-titulo").innerHTML =
    '<i class="fas fa-user-plus me-2"></i>Novo Usuário';
  document.getElementById("campo-senha").style.display = "block";
  document.getElementById("usuario-senha").required = true;

  if (modalUsuario) modalUsuario.show();
}

window.editarUsuario = function (usuarioId) {
  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (!usuario) return;

  usuarioEditando = usuario;
  document.getElementById("modal-usuario-titulo").innerHTML =
    '<i class="fas fa-user-edit me-2"></i>Editar Usuário';
  document.getElementById("usuario-id").value = usuario.id;
  document.getElementById("usuario-nome").value = usuario.nome || "";
  document.getElementById("usuario-login").value = usuario.login || "";
  document.getElementById("usuario-email").value = usuario.email || "";
  document.getElementById("usuario-perfil").value =
    usuario.perfil || "motorista";
  document.getElementById("usuario-status").value =
    usuario.status_ativo === true ? "true" : "false";
  document.getElementById("campo-senha").style.display = "none";
  document.getElementById("usuario-senha").required = false;

  if (modalUsuario) modalUsuario.show();
};

async function salvarUsuario() {
  // ... (mantido igual ao anterior)
  // Por brevidade, manter a mesma lógica de salvar usuário
}

window.resetarSenha = function (usuarioId) {
  // ... (mantido igual ao anterior)
};

async function confirmarResetSenha() {
  // ... (mantido igual ao anterior)
}

// ============================================
// FUNÇÕES DE CAMINHÕES
// ============================================

async function carregarCaminhoes() {
  const tabelaCorpo = document.getElementById("tabela-caminhoes-corpo");
  if (!tabelaCorpo) return;

  tabelaCorpo.innerHTML =
    '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando caminhões...</td></tr>';

  try {
    const snapshot = await window.db
      .collection("caminhoes")
      .orderBy("placa")
      .get();

    caminhoes = [];
    snapshot.forEach((doc) => {
      caminhoes.push({ id: doc.id, ...doc.data() });
    });

    renderizarTabelaCaminhoes();
  } catch (error) {
    console.error("Erro ao carregar caminhões:", error);
    tabelaCorpo.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Erro ao carregar caminhões: ${error.message}</td></tr>`;
  }
}

function renderizarTabelaCaminhoes() {
  const tabelaCorpo = document.getElementById("tabela-caminhoes-corpo");
  if (!tabelaCorpo) return;

  if (caminhoes.length === 0) {
    tabelaCorpo.innerHTML =
      '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum caminhão cadastrado</td></tr>';
    return;
  }

  let html = "";
  caminhoes.forEach((caminhao) => {
    let statusClass = "bg-success";
    let statusText = "Ativo";

    if (caminhao.status === "manutencao") {
      statusClass = "bg-warning text-dark";
      statusText = "Manutenção";
    } else if (caminhao.status === "inativo") {
      statusClass = "bg-secondary";
      statusText = "Inativo";
    }

    const motoristaNome = caminhao.motoristaNome || "-";

    html += `
            <tr>
                <td class="small fw-semibold text-uppercase">${escapeHtml(caminhao.placa) || "-"}</td>
                <td class="small">${escapeHtml(caminhao.modelo) || "-"}</td>
                <td class="small">${escapeHtml(caminhao.marca) || "-"}</td>
                <td class="small">${caminhao.ano || "-"}</td>
                <td class="small text-end">${caminhao.capacidade || 0} t</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="small">${motoristaNome}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="window.editarCaminhao('${caminhao.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.excluirCaminhao('${caminhao.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  tabelaCorpo.innerHTML = html;
}

async function carregarMotoristasParaSelect() {
  try {
    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();

    if (!docSnap.exists) return;

    const dados = docSnap.data();
    motoristas = [];

    for (const [key, value] of Object.entries(dados)) {
      if (
        key === "criado_por" ||
        key === "criado_em" ||
        key === "ultima_atualizacao"
      )
        continue;
      if (value.perfil === "motorista" && value.status_ativo === true) {
        motoristas.push({
          id: key,
          nome: value.nome,
          login: value.login,
        });
      }
    }

    motoristas.sort((a, b) => a.nome.localeCompare(b.nome));

    // Atualizar select no modal se ele existir
    const selectMotorista = document.getElementById("caminhao-motorista");
    if (selectMotorista) {
      selectMotorista.innerHTML =
        '<option value="">Selecione um motorista</option>';
      motoristas.forEach((m) => {
        selectMotorista.innerHTML += `<option value="${m.id}">${m.nome} (${m.login})</option>`;
      });
    }
  } catch (error) {
    console.error("Erro ao carregar motoristas:", error);
  }
}

function abrirModalNovoCaminhao() {
  caminhaoEditando = null;
  document.getElementById("caminhao-id").value = "";
  document.getElementById("caminhao-placa").value = "";
  document.getElementById("caminhao-modelo").value = "";
  document.getElementById("caminhao-marca").value = "";
  document.getElementById("caminhao-ano").value = "";
  document.getElementById("caminhao-capacidade").value = "";
  document.getElementById("caminhao-motorista").value = "";
  document.getElementById("caminhao-status").value = "ativo";
  document.getElementById("caminhao-obs").value = "";
  document.getElementById("modal-caminhao-titulo").innerHTML =
    '<i class="fas fa-truck-plus me-2"></i>Novo Caminhão';

  if (modalCaminhao) modalCaminhao.show();
}

window.editarCaminhao = function (caminhaoId) {
  const caminhao = caminhoes.find((c) => c.id === caminhaoId);
  if (!caminhao) return;

  caminhaoEditando = caminhao;
  document.getElementById("modal-caminhao-titulo").innerHTML =
    '<i class="fas fa-truck-edit me-2"></i>Editar Caminhão';
  document.getElementById("caminhao-id").value = caminhao.id;
  document.getElementById("caminhao-placa").value = caminhao.placa || "";
  document.getElementById("caminhao-modelo").value = caminhao.modelo || "";
  document.getElementById("caminhao-marca").value = caminhao.marca || "";
  document.getElementById("caminhao-ano").value = caminhao.ano || "";
  document.getElementById("caminhao-capacidade").value =
    caminhao.capacidade || "";
  document.getElementById("caminhao-motorista").value =
    caminhao.motoristaId || "";
  document.getElementById("caminhao-status").value = caminhao.status || "ativo";
  document.getElementById("caminhao-obs").value = caminhao.obs || "";

  if (modalCaminhao) modalCaminhao.show();
};

async function salvarCaminhao() {
  const caminhaoId = document.getElementById("caminhao-id").value;
  const placa = document
    .getElementById("caminhao-placa")
    .value.trim()
    .toUpperCase();
  const modelo = document.getElementById("caminhao-modelo").value.trim();
  const marca = document.getElementById("caminhao-marca").value.trim();
  const ano = parseInt(document.getElementById("caminhao-ano").value);
  const capacidade = parseFloat(
    document.getElementById("caminhao-capacidade").value,
  );
  const motoristaId = document.getElementById("caminhao-motorista").value;
  const status = document.getElementById("caminhao-status").value;
  const obs = document.getElementById("caminhao-obs").value;

  if (!placa || !modelo || !marca || !ano || !capacidade) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  // Validar formato da placa
  const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-[0-9]{4}$/;
  if (!placaRegex.test(placa) && !/^[A-Z]{3}[0-9]{4}$/.test(placa)) {
    alert("Formato de placa inválido! Use o formato ABC1D23 ou ABC-1234");
    return;
  }

  const btn = document.getElementById("btn-salvar-caminhao");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
  btn.disabled = true;

  try {
    // Normalizar placa (remover traços)
    const placaNormalizada = placa.replace(/-/g, "");

    // Buscar nome do motorista se houver
    let motoristaNome = null;
    if (motoristaId) {
      const motorista = motoristas.find((m) => m.id === motoristaId);
      motoristaNome = motorista ? motorista.nome : null;
    }

    const caminhaoData = {
      placa: placaNormalizada,
      modelo: modelo,
      marca: marca,
      ano: ano,
      capacidade: capacidade,
      status: status,
      obs: obs,
      motoristaId: motoristaId || null,
      motoristaNome: motoristaNome,
      atualizado_em: new Date(),
      atualizado_por: window.currentUser?.login || "sistema",
    };

    if (!caminhaoId) {
      // Novo caminhão
      caminhaoData.criado_data = new Date();
      caminhaoData.criado_por = window.currentUser?.login || "sistema";
      await window.db.collection("caminhoes").add(caminhaoData);
      alert("Caminhão cadastrado com sucesso!");
    } else {
      // Editar caminhão
      await window.db
        .collection("caminhoes")
        .doc(caminhaoId)
        .update(caminhaoData);
      alert("Caminhão atualizado com sucesso!");
    }

    if (modalCaminhao) modalCaminhao.hide();
    await carregarCaminhoes();
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    alert(`Erro ao salvar caminhão: ${error.message}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.excluirCaminhao = async function (caminhaoId) {
  const caminhao = caminhoes.find((c) => c.id === caminhaoId);
  if (!caminhao) return;

  if (
    !confirm(
      `Deseja excluir o caminhão ${caminhao.placa} - ${caminhao.modelo}?`,
    )
  )
    return;

  try {
    await window.db.collection("caminhoes").doc(caminhaoId).delete();
    alert("Caminhão excluído com sucesso!");
    await carregarCaminhoes();
  } catch (error) {
    console.error("Erro ao excluir caminhão:", error);
    alert(`Erro ao excluir caminhão: ${error.message}`);
  }
};

// Função auxiliar
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

window.initCadastros = initCadastros;
