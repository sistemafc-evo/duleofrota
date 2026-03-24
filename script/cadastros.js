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

<!-- MODAL USUÁRIO -->
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
                            <option value="operador">Operador</option>
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

<!-- MODAL RESET SENHA -->
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
let configEmpresa = null;

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE LIMITE
// ============================================

async function carregarConfigEmpresa() {
    try {
        const configDoc = await window.db.collection("config").doc("plano").get();
        if (configDoc.exists) {
            configEmpresa = configDoc.data();
            console.log("📋 Configuração da empresa carregada:", configEmpresa);
            return true;
        } else {
            console.error("❌ Documento de configuração não encontrado");
            return false;
        }
    } catch (error) {
        console.error("❌ Erro ao carregar configuração:", error);
        return false;
    }
}

async function verificarLimiteLogins() {
    if (!configEmpresa) {
        await carregarConfigEmpresa();
    }
    
    if (!configEmpresa) {
        throw new Error("Configuração da empresa não encontrada");
    }
    
    // Verificar se a empresa está ativa
    if (configEmpresa.empresa_vigencia_ativo !== true) {
        throw new Error("Empresa inativa. Contate o administrador.");
    }
    
    const loginsAtuais = parseInt(configEmpresa.qtd_logins_atual) || 0;
    const loginsMax = parseInt(configEmpresa.qtd_logins_max) || 0;
    
    if (loginsAtuais >= loginsMax && loginsMax > 0) {
        throw new Error(`Limite de logins atingido (${loginsAtuais}/${loginsMax}). Contate o administrador.`);
    }
    
    return true;
}

async function verificarLimiteCaminhoes() {
    if (!configEmpresa) {
        await carregarConfigEmpresa();
    }
    
    if (!configEmpresa) {
        throw new Error("Configuração da empresa não encontrada");
    }
    
    const carrosAtuais = parseInt(configEmpresa.qtd_carros_atual) || 0;
    const carrosMax = parseInt(configEmpresa.qtd_carros_max) || 0;
    
    if (carrosAtuais >= carrosMax && carrosMax > 0) {
        throw new Error(`Limite de caminhões atingido (${carrosAtuais}/${carrosMax}). Contate o administrador.`);
    }
    
    return true;
}

async function atualizarContadorLogins(incrementar = true) {
    if (!configEmpresa) {
        await carregarConfigEmpresa();
    }
    
    if (!configEmpresa) return;
    
    const loginsAtuais = parseInt(configEmpresa.qtd_logins_atual) || 0;
    const novoValor = incrementar ? loginsAtuais + 1 : Math.max(0, loginsAtuais - 1);
    
    try {
        await window.db.collection("config").doc("plano").update({
            qtd_logins_atual: novoValor.toString()
        });
        configEmpresa.qtd_logins_atual = novoValor.toString();
        console.log(`✅ Contador de logins atualizado: ${novoValor}`);
    } catch (error) {
        console.error("❌ Erro ao atualizar contador de logins:", error);
    }
}

async function atualizarContadorCaminhoes(incrementar = true) {
    if (!configEmpresa) {
        await carregarConfigEmpresa();
    }
    
    if (!configEmpresa) return;
    
    const carrosAtuais = parseInt(configEmpresa.qtd_carros_atual) || 0;
    const novoValor = incrementar ? carrosAtuais + 1 : Math.max(0, carrosAtuais - 1);
    
    try {
        await window.db.collection("config").doc("plano").update({
            qtd_carros_atual: novoValor.toString()
        });
        configEmpresa.qtd_carros_atual = novoValor.toString();
        console.log(`✅ Contador de caminhões atualizado: ${novoValor}`);
    } catch (error) {
        console.error("❌ Erro ao atualizar contador de caminhões:", error);
    }
}

async function getProximoIdLogin() {
    try {
        const docRef = window.db.collection("logins").doc("funcionarios_logins");
        const docSnap = await docRef.get();
        
        let maiorNumero = 0;
        
        if (docSnap.exists) {
            const dados = docSnap.data();
            for (const key of Object.keys(dados)) {
                if (key.startsWith("login_")) {
                    const numero = parseInt(key.split("_")[1]);
                    if (!isNaN(numero) && numero > maiorNumero) {
                        maiorNumero = numero;
                    }
                }
            }
        }
        
        const proximoNumero = maiorNumero + 1;
        const idFormatado = `login_${proximoNumero.toString().padStart(3, '0')}`;
        console.log(`📝 Próximo ID de login: ${idFormatado}`);
        return idFormatado;
    } catch (error) {
        console.error("Erro ao gerar próximo ID:", error);
        return `login_${Date.now()}`;
    }
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

async function carregarUsuarios() {
    const tabelaCorpo = document.getElementById("tabela-usuarios-corpo");
    if (!tabelaCorpo) return;

    tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando usuários...</td></tr>';

    try {
        const docRef = window.db.collection("logins").doc("funcionarios_logins");
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum usuário cadastrado</td></tr>';
            return;
        }

        const dados = docSnap.data();
        usuarios = [];

        for (const [key, value] of Object.entries(dados)) {
            if (key === "criado_por" || key === "criado_em" || key === "ultima_atualizacao") continue;
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
        tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum usuário cadastrado</td></tr>';
        return;
    }

    let html = "";
    usuarios.forEach((usuario) => {
        const dataCriacao = usuario.criado_data?.toDate ? usuario.criado_data.toDate().toLocaleDateString("pt-BR") : usuario.criado_data || "-";
        const statusClass = usuario.status_ativo === true ? "bg-success" : "bg-secondary";
        const statusText = usuario.status_ativo === true ? "Ativo" : "Inativo";

        let perfilClass = "bg-info";
        if (usuario.perfil === "gerente") perfilClass = "bg-danger";
        else if (usuario.perfil === "supervisor") perfilClass = "bg-warning text-dark";

        html += `
            <tr>
                <td class="small fw-semibold">${escapeHtml(usuario.nome) || "-"}</td>
                <td class="small">${escapeHtml(usuario.login) || "-"}</td>
                <td class="small">${escapeHtml(usuario.email) || "-"}</td>
                <td class="small"><span class="badge ${perfilClass}">${usuario.perfil || "operador"}</span></td>
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
    document.getElementById("usuario-perfil").value = "operador";
    document.getElementById("usuario-status").value = "true";
    document.getElementById("modal-usuario-titulo").innerHTML = '<i class="fas fa-user-plus me-2"></i>Novo Usuário';
    document.getElementById("campo-senha").style.display = "block";
    document.getElementById("usuario-senha").required = true;

    if (modalUsuario) modalUsuario.show();
}

window.editarUsuario = function(usuarioId) {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return;

    usuarioEditando = usuario;
    document.getElementById("modal-usuario-titulo").innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Usuário';
    document.getElementById("usuario-id").value = usuario.id;
    document.getElementById("usuario-nome").value = usuario.nome || "";
    document.getElementById("usuario-login").value = usuario.login || "";
    document.getElementById("usuario-email").value = usuario.email || "";
    document.getElementById("usuario-perfil").value = usuario.perfil || "operador";
    document.getElementById("usuario-status").value = usuario.status_ativo === true ? "true" : "false";
    document.getElementById("campo-senha").style.display = "none";
    document.getElementById("usuario-senha").required = false;

    if (modalUsuario) modalUsuario.show();
};

async function salvarUsuario() {
    const usuarioId = document.getElementById("usuario-id").value;
    const nome = document.getElementById("usuario-nome").value.trim();
    const login = document.getElementById("usuario-login").value.trim().toLowerCase();
    const email = document.getElementById("usuario-email").value.trim().toLowerCase();
    const senha = document.getElementById("usuario-senha").value;
    const perfil = document.getElementById("usuario-perfil").value;
    const status = document.getElementById("usuario-status").value === "true";

    if (!nome || !login || !email) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    if (!usuarioId && (!senha || senha.length < 6)) {
        alert("A senha deve ter no mínimo 6 caracteres!");
        return;
    }

    const btn = document.getElementById("btn-salvar-usuario");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
    btn.disabled = true;

    try {
        if (!usuarioId) {
            // Verificar limite de logins
            await verificarLimiteLogins();
            
            const docRef = window.db.collection("logins").doc("funcionarios_logins");
            const docSnap = await docRef.get();
            
            let dadosAtuais = {};
            if (docSnap.exists) {
                dadosAtuais = docSnap.data();
            }
            
            // Verificar se login já existe
            for (const [key, value] of Object.entries(dadosAtuais)) {
                if (value.login === login) {
                    throw new Error(`Login "${login}" já existe!`);
                }
            }
            
            // Gerar próximo ID no formato login_XXX
            const novoId = await getProximoIdLogin();
            
            // Criar usuário no Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
            const firebaseUser = userCredential.user;
            
            // Dados do usuário
            const novoUsuario = {
                criado_data: new Date(),
                criado_por_login: window.currentUser?.login || "sistema",
                email: email,
                login: login,
                nome: nome,
                perfil: perfil,
                status_ativo: status,
                ultimo_login: null
            };
            
            dadosAtuais[novoId] = novoUsuario;
            await docRef.set(dadosAtuais);
            
            // Atualizar contador de logins
            await atualizarContadorLogins(true);
            
            alert("Usuário criado com sucesso!");
        } else {
            // Editar usuário existente
            const docRef = window.db.collection("logins").doc("funcionarios_logins");
            const docSnap = await docRef.get();
            const dadosAtuais = docSnap.data();
            
            dadosAtuais[usuarioId] = {
                ...dadosAtuais[usuarioId],
                nome: nome,
                email: email,
                perfil: perfil,
                status_ativo: status,
                ultima_atualizacao: new Date(),
                atualizado_por: window.currentUser?.login || "sistema"
            };
            
            await docRef.set(dadosAtuais);
            alert("Usuário atualizado com sucesso!");
        }
        
        if (modalUsuario) modalUsuario.hide();
        await carregarUsuarios();
        await carregarMotoristasParaSelect();
        
    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        alert(`Erro ao salvar usuário: ${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.toggleStatusUsuario = async function(usuarioId) {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return;
    
    const novoStatus = !usuario.status_ativo;
    const acao = novoStatus ? "ativar" : "inativar";
    
    if (!confirm(`Deseja ${acao} o usuário ${usuario.nome}?`)) return;
    
    try {
        const docRef = window.db.collection("logins").doc("funcionarios_logins");
        const docSnap = await docRef.get();
        const dadosAtuais = docSnap.data();
        
        dadosAtuais[usuarioId] = {
            ...dadosAtuais[usuarioId],
            status_ativo: novoStatus,
            ultima_atualizacao: new Date(),
            atualizado_por: window.currentUser?.login || "sistema"
        };
        
        await docRef.set(dadosAtuais);
        alert(`Usuário ${acao}do com sucesso!`);
        await carregarUsuarios();
        await carregarMotoristasParaSelect();
    } catch (error) {
        console.error("Erro ao alterar status:", error);
        alert(`Erro ao alterar status: ${error.message}`);
    }
};

window.resetarSenha = function(usuarioId) {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return;
    
    usuarioResetando = usuario;
    const novaSenha = Math.random().toString(36).slice(-8);
    
    document.getElementById("reset-usuario-nome").textContent = usuario.nome;
    document.getElementById("nova-senha-temporaria").textContent = novaSenha;
    
    if (modalResetSenha) modalResetSenha.show();
    
    // Armazenar a nova senha para uso na confirmação
    window.novaSenhaTemporaria = novaSenha;
};

async function confirmarResetSenha() {
    if (!usuarioResetando) return;
    
    const btn = document.getElementById("btn-confirmar-reset");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Resetando...';
    btn.disabled = true;
    
    try {
        // Atualizar senha no Firebase Auth
        const user = await firebase.auth().getUserByEmail(usuarioResetando.email);
        await firebase.auth().updateUser(user.uid, {
            password: window.novaSenhaTemporaria
        });
        
        // Registrar no Firestore
        const docRef = window.db.collection("logins").doc("funcionarios_logins");
        const docSnap = await docRef.get();
        const dadosAtuais = docSnap.data();
        
        dadosAtuais[usuarioResetando.id] = {
            ...dadosAtuais[usuarioResetando.id],
            senha_resetada_em: new Date(),
            senha_resetada_por: window.currentUser?.login || "sistema"
        };
        
        await docRef.set(dadosAtuais);
        
        alert(`Senha resetada com sucesso!\nNova senha: ${window.novaSenhaTemporaria}`);
        
        if (modalResetSenha) modalResetSenha.hide();
        usuarioResetando = null;
        window.novaSenhaTemporaria = null;
        
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        alert(`Erro ao resetar senha: ${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ============================================
// FUNÇÕES DE CAMINHÕES
// ============================================

async function carregarCaminhoes() {
    const tabelaCorpo = document.getElementById("tabela-caminhoes-corpo");
    if (!tabelaCorpo) return;

    tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando caminhões...</td></tr>';

    try {
        const snapshot = await window.db.collection("caminhoes").orderBy("placa").get();

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
        tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum caminhão cadastrado</td></tr>';
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
            if (key === "criado_por" || key === "criado_em" || key === "ultima_atualizacao") continue;
            if (value.perfil === "operador" && value.status_ativo === true) {
                motoristas.push({
                    id: key,
                    nome: value.nome,
                    login: value.login,
                });
            }
        }

        motoristas.sort((a, b) => a.nome.localeCompare(b.nome));

        const selectMotorista = document.getElementById("caminhao-motorista");
        if (selectMotorista) {
            selectMotorista.innerHTML = '<option value="">Selecione um motorista</option>';
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
    document.getElementById("modal-caminhao-titulo").innerHTML = '<i class="fas fa-truck-plus me-2"></i>Novo Caminhão';

    if (modalCaminhao) modalCaminhao.show();
}

window.editarCaminhao = function(caminhaoId) {
    const caminhao = caminhoes.find((c) => c.id === caminhaoId);
    if (!caminhao) return;

    caminhaoEditando = caminhao;
    document.getElementById("modal-caminhao-titulo").innerHTML = '<i class="fas fa-truck-edit me-2"></i>Editar Caminhão';
    document.getElementById("caminhao-id").value = caminhao.id;
    document.getElementById("caminhao-placa").value = caminhao.placa || "";
    document.getElementById("caminhao-modelo").value = caminhao.modelo || "";
    document.getElementById("caminhao-marca").value = caminhao.marca || "";
    document.getElementById("caminhao-ano").value = caminhao.ano || "";
    document.getElementById("caminhao-capacidade").value = caminhao.capacidade || "";
    document.getElementById("caminhao-motorista").value = caminhao.motoristaId || "";
    document.getElementById("caminhao-status").value = caminhao.status || "ativo";
    document.getElementById("caminhao-obs").value = caminhao.obs || "";

    if (modalCaminhao) modalCaminhao.show();
};

async function salvarCaminhao() {
    const caminhaoId = document.getElementById("caminhao-id").value;
    const placa = document.getElementById("caminhao-placa").value.trim().toUpperCase();
    const modelo = document.getElementById("caminhao-modelo").value.trim();
    const marca = document.getElementById("caminhao-marca").value.trim();
    const ano = parseInt(document.getElementById("caminhao-ano").value);
    const capacidade = parseFloat(document.getElementById("caminhao-capacidade").value);
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

        // Verificar placa duplicada
        const placaExistente = caminhoes.find(c => c.placa === placaNormalizada && c.id !== caminhaoId);
        if (placaExistente) {
            throw new Error(`Placa ${placaNormalizada} já está cadastrada!`);
        }

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
            // Verificar limite de caminhões
            await verificarLimiteCaminhoes();
            
            // Novo caminhão
            caminhaoData.criado_data = new Date();
            caminhaoData.criado_por = window.currentUser?.login || "sistema";
            await window.db.collection("caminhoes").add(caminhaoData);
            
            // Atualizar contador de caminhões
            await atualizarContadorCaminhoes(true);
            
            alert("Caminhão cadastrado com sucesso!");
        } else {
            // Editar caminhão
            await window.db.collection("caminhoes").doc(caminhaoId).update(caminhaoData);
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

window.excluirCaminhao = async function(caminhaoId) {
    const caminhao = caminhoes.find((c) => c.id === caminhaoId);
    if (!caminhao) return;

    if (!confirm(`Deseja excluir o caminhão ${caminhao.placa} - ${caminhao.modelo}?`)) return;

    try {
        await window.db.collection("caminhoes").doc(caminhaoId).delete();
        
        // Atualizar contador de caminhões
        await atualizarContadorCaminhoes(false);
        
        alert("Caminhão excluído com sucesso!");
        await carregarCaminhoes();
    } catch (error) {
        console.error("Erro ao excluir caminhão:", error);
        alert(`Erro ao excluir caminhão: ${error.message}`);
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function initCadastros(container) {
    console.log("👥 Inicializando tela de Cadastros");

    if (container) {
        container.innerHTML = cadastrosTemplate;
    }

    setTimeout(async () => {
        await carregarConfigEmpresa();
        inicializarModais();
        setupCadastrosListeners();
        await carregarUsuarios();
        await carregarCaminhoes();
        await carregarMotoristasParaSelect();
    }, 100);
}

function inicializarModais() {
    const modalUsuarioEl = document.getElementById("modal-usuario");
    const modalCaminhaoEl = document.getElementById("modal-caminhao");
    const modalResetEl = document.getElementById("modal-reset-senha");

    if (modalUsuarioEl) modalUsuario = new bootstrap.Modal(modalUsuarioEl);
    if (modalCaminhaoEl) modalCaminhao = new bootstrap.Modal(modalCaminhaoEl);
    if (modalResetEl) modalResetSenha = new bootstrap.Modal(modalResetEl);
}

function setupCadastrosListeners() {
    const btnNovoUsuario = document.getElementById("btn-novo-usuario");
    const btnSalvarUsuario = document.getElementById("btn-salvar-usuario");
    const btnConfirmarReset = document.getElementById("btn-confirmar-reset");
    const btnNovoCaminhao = document.getElementById("btn-novo-caminhao");
    const btnSalvarCaminhao = document.getElementById("btn-salvar-caminhao");

    if (btnNovoUsuario) btnNovoUsuario.addEventListener("click", () => abrirModalNovoUsuario());
    if (btnSalvarUsuario) btnSalvarUsuario.addEventListener("click", salvarUsuario);
    if (btnConfirmarReset) btnConfirmarReset.addEventListener("click", confirmarResetSenha);
    if (btnNovoCaminhao) btnNovoCaminhao.addEventListener("click", () => abrirModalNovoCaminhao());
    if (btnSalvarCaminhao) btnSalvarCaminhao.addEventListener("click", salvarCaminhao);
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

window.initCadastros = initCadastros;
