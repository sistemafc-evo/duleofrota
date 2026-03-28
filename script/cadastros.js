// ============================================
// CADASTROS.JS - Gestão de Usuários, Caminhões e Custos Fixos
// ============================================

// Template da tela de cadastros
const cadastrosTemplate = `
<div class="mb-3">
    <div class="alert alert-info d-flex align-items-center small py-2 mb-3">
        <i class="fas fa-address-card me-2"></i>
        <span>Gerencie usuários, caminhões e custos fixos do sistema</span>
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
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="tab-custos" data-bs-toggle="tab" data-bs-target="#conteudo-custos" type="button" role="tab">
            <i class="fas fa-coins me-1"></i>Custos de Viagem
        </button>
    </li>
</ul>

<div class="tab-content">
    <!-- CONTEÚDO USUÁRIOS -->
    <div class="tab-pane fade show active" id="conteudo-usuarios" role="tabpanel">
        <div class="d-flex justify-content-end mb-3">
            <button id="btn-novo-usuario" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-2"></i>Novo Usuário
            </button>
        </div>
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3">
                <h6 class="card-title text-primary fw-semibold mb-3">
                    <i class="fas fa-users me-2"></i>Usuários do Sistema
                    <span id="usuarios-contador" class="badge bg-primary ms-2">0 / 0</span>
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
        <div class="d-flex justify-content-end mb-3">
            <button id="btn-novo-caminhao" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-2"></i>Novo Caminhão
            </button>
        </div>
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
                                <th>Tipo</th>
                                <th>Eixos</th>
                                <th>Status</th>
                                <th>Motoristas</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-caminhoes-corpo">
                            <tr><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando caminhões...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- CONTEÚDO CUSTO DE VIAGEM -->
    <div class="tab-pane fade" id="conteudo-custos" role="tabpanel">
        <div class="row">
            <div class="col-12 col-lg-10 mx-auto">
                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-header bg-gradient-primary text-white border-0 rounded-top-4 py-3">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-coins fa-2x"></i>
                            <div>
                                <h5 class="mb-0 fw-semibold">Custo de Viagem</h5>
                                <small>Gerencie os valores utilizados para cálculo de custos nas viagens</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-4">
                        <form id="form-custos-viagem">
                            <!-- Valor por KM -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label fw-semibold mb-0">
                                        <i class="fas fa-road me-1 text-primary"></i>Custo Fixo por Quilômetro
                                    </label>
                                    <span class="badge bg-primary bg-opacity-10 text-primary">R$ / km</span>
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">R$</span>
                                    <input type="text" class="form-control form-control-lg" 
                                        id="custo-km-valor" 
                                        placeholder="0,00" 
                                        inputmode="decimal"
                                        maxlength="12"
                                        style="font-family: monospace; font-size: 1.2rem;">
                                    <span class="input-group-text bg-light">/ km</span>
                                </div>
                                <small class="text-muted">Valor por quilômetro rodado</small>
                            </div>
                            
                            <!-- Valor do Diesel por Litro -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label fw-semibold mb-0">
                                        <i class="fas fa-gas-pump me-1 text-primary"></i>Valor do Diesel
                                    </label>
                                    <span class="badge bg-primary bg-opacity-10 text-primary">R$ / litro</span>
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-light">R$</span>
                                    <input type="text" class="form-control form-control-lg" 
                                        id="custo-diesel-valor" 
                                        placeholder="0,00" 
                                        inputmode="decimal"
                                        maxlength="12"
                                        style="font-family: monospace; font-size: 1.2rem;">
                                    <span class="input-group-text bg-light">/ litro</span>
                                </div>
                                <small class="text-muted">Valor do litro do diesel (utilizado para cálculo de combustível)</small>
                            </div>
                            
                            <!-- Percentual de Comissão -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label fw-semibold mb-0">
                                        <i class="fas fa-percent me-1 text-primary"></i>Percentual de Comissão
                                    </label>
                                    <span class="badge bg-primary bg-opacity-10 text-primary">%</span>
                                </div>
                                <div class="input-group">
                                    <input type="text" class="form-control form-control-lg" 
                                        id="custo-comissao-valor" 
                                        placeholder="0,00" 
                                        inputmode="decimal"
                                        maxlength="8"
                                        style="font-family: monospace; font-size: 1.2rem;">
                                    <span class="input-group-text bg-light">%</span>
                                </div>
                                <small class="text-muted">Percentual de comissão sobre o valor total do frete</small>
                            </div>
                            
                            <hr class="my-4">
                            
                            <!-- Informações de Última Alteração -->
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <label class="form-label small text-secondary">Última alteração</label>
                                    <div class="border rounded-3 p-2 bg-light">
                                        <i class="fas fa-calendar-alt me-1 text-primary"></i>
                                        <span id="ultima-alteracao-data">--/--/---- --:--</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small text-secondary">Alterado por</label>
                                    <div class="border rounded-3 p-2 bg-light">
                                        <i class="fas fa-user me-1 text-primary"></i>
                                        <span id="ultima-alteracao-por">---</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small text-secondary">Última alteração (todos os campos)</label>
                                    <div class="border rounded-3 p-2 bg-light">
                                        <i class="fas fa-sync-alt me-1 text-primary"></i>
                                        <span id="ultima-alteracao-todos">---</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info mb-4">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Como estes valores são utilizados:</strong>
                                <ul class="mb-0 mt-2 small">
                                    <li><strong>Custo por km:</strong> Multiplicado pela distância total da viagem para calcular o custo de combustível.</li>
                                    <li><strong>Valor do Diesel:</strong> Utilizado para cálculo de custo de combustível por litro.</li>
                                    <li><strong>Percentual de Comissão:</strong> Aplicado sobre o valor total do frete para calcular a comissão do motorista. Exemplo de preenchimento: Para inserir a taxa 12,00%, preencher com "12,00".</li>
                                </ul>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg" id="btn-atualizar-custos">
                                    <i class="fas fa-save me-2"></i>Atualizar Valores
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- MODAL USUÁRIO -->
<div class="modal fade" id="modal-usuario" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
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
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">NOME COMPLETO *</label>
                                <input type="text" class="form-control form-control-sm" id="usuario-nome" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">LOGIN *</label>
                                <input type="text" class="form-control form-control-sm" id="usuario-login" readonly style="background-color: #e9ecef;">
                                <small class="text-muted">Gerado automaticamente a partir do nome</small>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">E-MAIL *</label>
                                <input type="email" class="form-control form-control-sm" id="usuario-email" readonly style="background-color: #e9ecef;">
                                <small class="text-muted">Gerado automaticamente a partir do login</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3" id="campo-senha">
                                <label class="form-label small text-secondary fw-semibold">SENHA *</label>
                                <input type="password" class="form-control form-control-sm" id="usuario-senha">
                                <small class="text-muted" id="senha-ajuda">Mínimo 6 caracteres (preenchido apenas para novo usuário)</small>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">PERFIL *</label>
                                <select class="form-select form-select-sm" id="usuario-perfil" required>
                                    <option value="operador">Operador</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="gerente">Gerente</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">STATUS</label>
                                <select class="form-select form-select-sm" id="usuario-status">
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-secondary fw-semibold">CAMINHÕES VINCULADOS</label>
                        <div id="usuario-caminhoes-lista" class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                            <div class="text-center text-muted small">Carregando caminhões...</div>
                        </div>
                        <small class="text-muted">Selecione os caminhões que este usuário pode operar</small>
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
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h6 class="modal-title" id="modal-caminhao-titulo">
                    <i class="fas fa-truck-plus me-2"></i>Novo Caminhão
                </h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="form-caminhao">
                    <input type="hidden" id="caminhao-placa-antiga">
                    
                    <!-- Informações Básicas -->
                    <div class="card mb-3 border-0 bg-light">
                        <div class="card-header bg-transparent fw-semibold small">
                            <i class="fas fa-info-circle me-1"></i>Informações Básicas
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">PLACA *</label>
                                        <input type="text" class="form-control form-control-sm text-uppercase" id="caminhao-placa" placeholder="ABC1D23" required maxlength="8">
                                        <small class="text-muted">Formato: ABC1D23 ou ABC-1234. A placa será o identificador único.</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">STATUS</label>
                                        <select class="form-select form-select-sm" id="caminhao-status">
                                            <option value="true">Ativo</option>
                                            <option value="false">Inativo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">MODELO *</label>
                                        <input type="text" class="form-control form-control-sm" id="caminhao-modelo" placeholder="Ex: FH 540" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">MARCA *</label>
                                        <input type="text" class="form-control form-control-sm" id="caminhao-marca" placeholder="Ex: Volvo, Scania" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">ANO *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-ano" placeholder="2020" min="1990" max="2026" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">CAPACIDADE (toneladas) *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-capacidade" placeholder="Ex: 15" step="0.5" required>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Características Técnicas -->
                    <div class="card mb-3 border-0 bg-light">
                        <div class="card-header bg-transparent fw-semibold small">
                            <i class="fas fa-cog me-1"></i>Características Técnicas
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">TIPO DE VEÍCULO *</label>
                                        <select class="form-select form-select-sm" id="caminhao-tipo" required>
                                            <option value="">Selecione o tipo</option>
                                            <option value="TRUCK">TRUCK (Caminhão truck)</option>
                                            <option value="BITREM">BITREM (Bitrem)</option>
                                            <option value="CARRETA">CARRETA (Carreta)</option>
                                            <option value="VAN">VAN (Van/Furgão)</option>
                                            <option value="TOCO">TOCO (Caminhão toco)</option>
                                            <option value="3_4">3/4 (Caminhão 3/4)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">NÚMERO DE EIXOS *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-eixos" placeholder="Ex: 3" min="2" max="9" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">PESO DO VEÍCULO (kg) *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-peso" placeholder="Ex: 15000" step="100" required>
                                        <small class="text-muted">Peso do caminhão vazio em quilogramas</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">ALTURA (cm) *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-altura" placeholder="Ex: 400" step="1" required>
                                        <small class="text-muted">Altura total em centímetros</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">LARGURA (cm) *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-largura" placeholder="Ex: 260" step="1" required>
                                        <small class="text-muted">Largura total em centímetros</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label small text-secondary fw-semibold">COMPRIMENTO (cm) *</label>
                                        <input type="number" class="form-control form-control-sm" id="caminhao-comprimento" placeholder="Ex: 1400" step="1" required>
                                        <small class="text-muted">Comprimento total em centímetros</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vínculos e Observações -->
                    <div class="card mb-3 border-0 bg-light">
                        <div class="card-header bg-transparent fw-semibold small">
                            <i class="fas fa-users me-1"></i>Vínculos e Observações
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">MOTORISTAS VINCULADOS</label>
                                <div id="caminhao-motoristas-lista" class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
                                    <div class="text-center text-muted small">Carregando motoristas...</div>
                                </div>
                                <small class="text-muted">Selecione os motoristas que podem operar este caminhão</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-secondary fw-semibold">OBSERVAÇÕES</label>
                                <textarea class="form-control form-control-sm" id="caminhao-obs" rows="2" placeholder="Informações adicionais..."></textarea>
                            </div>
                        </div>
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

// ============================================
// FUNÇÕES COMPLEMENTARES DO LOGIN
// ============================================

// Função para gerar login a partir do nome completo - tratativa de acentos
function gerarLoginPorNome(nomeCompleto) {
    if (!nomeCompleto) return "";
    
    // Remove acentos
    const nomeSemAcentos = nomeCompleto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const partes = nomeSemAcentos.trim().split(/\s+/);
    const primeiroNome = partes[0].toLowerCase();
    
    if (partes.length === 1) {
        return primeiroNome;
    }
    
    const ultimoSobrenome = partes[partes.length - 1].toLowerCase();
    return `${primeiroNome}.${ultimoSobrenome}`;
}

// Função para gerar email a partir do login
function gerarEmailPorLogin(login) {
    if (!login) return "";
    return `${login}@frotatrack.com`;
}

// Função para atualizar login e email automaticamente baseado no nome
function atualizarLoginEEmailPorNome() {
    const nomeInput = document.getElementById("usuario-nome");
    const loginInput = document.getElementById("usuario-login");
    const emailInput = document.getElementById("usuario-email");
    
    if (!nomeInput || !loginInput || !emailInput) return;
    
    const nomeCompleto = nomeInput.value;
    const login = gerarLoginPorNome(nomeCompleto);
    
    if (login) {
        loginInput.value = login;
        emailInput.value = gerarEmailPorLogin(login);
        
        // Disparar evento de validação para verificar disponibilidade em tempo real
        verificarDisponibilidadeTempoReal(login);
    } else {
        loginInput.value = "";
        emailInput.value = "";
    }
}

// Função para verificar disponibilidade em tempo real
async function verificarDisponibilidadeTempoReal(login) {
    if (!login) return;
    
    const loginInput = document.getElementById("usuario-login");
    const emailInput = document.getElementById("usuario-email");
    
    if (!loginInput || !emailInput) return;
    
    const disponivel = await verificarDisponibilidadeLogin(login);
    
    if (!disponivel) {
        loginInput.style.borderColor = "#dc3545";
        emailInput.style.borderColor = "#dc3545";
        // Opcional: adicionar tooltip de erro
    } else {
        loginInput.style.borderColor = "";
        emailInput.style.borderColor = "";
    }
}

// Função para gerar as variantes de login baseado no nome completo
function gerarVariantesLogin(nomeCompleto) {
    if (!nomeCompleto) return { loginA: "", loginB: null };
    
    const partes = nomeCompleto.trim().split(/\s+/);
    const primeiroNome = partes[0].toLowerCase();
    
    if (partes.length === 1) {
        // Apenas um nome
        return { loginA: primeiroNome, loginB: null };
    }
    
    const ultimoSobrenome = partes[partes.length - 1].toLowerCase();
    const loginA = `${primeiroNome}.${ultimoSobrenome}`;
    
    let loginB = null;
    if (partes.length >= 3) {
        // Tem pelo menos 2 sobrenomes
        const penultimoSobrenome = partes[partes.length - 2].toLowerCase();
        loginB = `${primeiroNome}.${penultimoSobrenome}`;
    }
    
    return { loginA, loginB };
}

// Função para verificar disponibilidade de login no Firestore
async function verificarDisponibilidadeLoginFirestore(login) {
    try {
        const docRef = window.db.collection("logins").doc("funcionarios_logins");
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) return true; // Disponível
        
        const dados = docSnap.data();
        
        // Verificar se o login já existe
        for (const [key, value] of Object.entries(dados)) {
            if (key === "criado_por" || key === "criado_em" || key === "ultima_atualizacao") continue;
            if (value.login === login) {
                return false; // Login já existe
            }
        }
        
        return true; // Disponível
    } catch (error) {
        console.error("Erro ao verificar login no Firestore:", error);
        return false;
    }
}

// Função para verificar disponibilidade de email no Auth
async function verificarDisponibilidadeEmailAuth(email) {
    try {
        // Método correto para verificar se email já existe no Firebase Auth (Client SDK)
        const signInMethods = await firebase.auth().fetchSignInMethodsForEmail(email);
        
        // Se retornar algum método de login, o email já está cadastrado
        return signInMethods.length === 0; // true = disponível, false = já em uso
    } catch (error) {
        console.error("Erro ao verificar email no Auth:", error);
        // Em caso de erro, retornar true para permitir a tentativa de criação
        // O Firebase Auth vai validar novamente na criação
        return true;
    }
}

// Função completa para verificar disponibilidade de login e email
async function verificarDisponibilidadeLogin(login) {
    if (!login) return false;
    
    const email = gerarEmailPorLogin(login);
    
    // Verificar no Firestore
    const firestoreDisponivel = await verificarDisponibilidadeLoginFirestore(login);
    if (!firestoreDisponivel) return false;
    
    // Verificar no Auth - USANDO O MÉTODO CORRETO
    const authDisponivel = await verificarDisponibilidadeEmailAuth(email);
    if (!authDisponivel) return false;
    
    return true;
}

// Função para verificar disponibilidade das variantes de login
async function verificarDisponibilidadeVariantes(nomeCompleto) {
    const variantes = gerarVariantesLogin(nomeCompleto);
    const resultados = {
        loginA: { login: variantes.loginA, disponivel: false },
        loginB: variantes.loginB ? { login: variantes.loginB, disponivel: false } : null
    };
    
    // Verificar loginA
    if (variantes.loginA) {
        resultados.loginA.disponivel = await verificarDisponibilidadeLogin(variantes.loginA);
    }
    
    // Verificar loginB se existir
    if (variantes.loginB) {
        resultados.loginB.disponivel = await verificarDisponibilidadeLogin(variantes.loginB);
    }
    
    return resultados;
}

// Função para exibir modal de confirmação de cadastro manual
function mostrarModalConfirmacaoManual(mensagem, nomeCompleto, loginSugerido, callback) {
    // Criar modal de confirmação se não existir
    let modalConfirmacao = document.getElementById("modal-confirmacao-manual");
    
    if (!modalConfirmacao) {
        const modalHtml = `
            <div class="modal fade" id="modal-confirmacao-manual" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h6 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>Login Indisponível
                            </h6>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p id="modal-mensagem-confirmacao"></p>
                            <div class="mt-3">
                                <label class="form-label small fw-semibold">Login alternativo:</label>
                                <input type="text" class="form-control" id="login-alternativo" placeholder="Digite um login alternativo" style="text-transform: lowercase;">
                                <small class="text-muted">Digite um login manualmente. O e-mail será gerado automaticamente.</small>
                            </div>
                            <div class="mt-2">
                                <label class="form-label small fw-semibold">E-mail gerado:</label>
                                <input type="email" class="form-control" id="email-gerado" readonly style="background-color: #e9ecef;">
                                <small class="text-muted">O e-mail será gerado automaticamente baseado no login</small>
                            </div>
                            <div id="status-disponibilidade" class="mt-2 small"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-sm btn-primary" id="btn-verificar-manual" disabled>
                                <i class="fas fa-search me-1"></i>Verificar e Cadastrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalConfirmacao = document.getElementById("modal-confirmacao-manual");
    }
    
    // Atualizar mensagem
    const mensagemElement = document.getElementById("modal-mensagem-confirmacao");
    if (mensagemElement) {
        mensagemElement.innerHTML = mensagem;
    }
    
    // Limpar campos
    const loginAlternativo = document.getElementById("login-alternativo");
    const emailGerado = document.getElementById("email-gerado");
    const statusDiv = document.getElementById("status-disponibilidade");
    
    if (loginAlternativo) {
        loginAlternativo.value = "";
        loginAlternativo.style.borderColor = "";
    }
    if (emailGerado) emailGerado.value = "";
    if (statusDiv) statusDiv.innerHTML = "";
    
    // Remover listeners antigos
    const btnVerificar = document.getElementById("btn-verificar-manual");
    const novoBtnVerificar = btnVerificar.cloneNode(true);
    btnVerificar.parentNode.replaceChild(novoBtnVerificar, btnVerificar);
    
    // Adicionar listener para verificar disponibilidade enquanto digita
    if (loginAlternativo) {
        loginAlternativo.removeEventListener("input", verificarLoginManual);
        loginAlternativo.addEventListener("input", verificarLoginManual);
    }
    
    // Função para verificar login manual em tempo real
    async function verificarLoginManual(e) {
        const loginManual = e.target.value.trim().toLowerCase();
        
        if (!loginManual) {
            if (emailGerado) emailGerado.value = "";
            if (statusDiv) statusDiv.innerHTML = "";
            novoBtnVerificar.disabled = true;
            return;
        }
        
        // Validar formato do login (apenas letras, números e pontos)
        const loginRegex = /^[a-z0-9.]+$/;
        if (!loginRegex.test(loginManual)) {
            if (statusDiv) {
                statusDiv.innerHTML = '<span class="text-danger">⚠️ Login deve conter apenas letras minúsculas, números e pontos</span>';
            }
            novoBtnVerificar.disabled = true;
            return;
        }
        
        // Gerar email automaticamente
        const emailGeradoValue = gerarEmailPorLogin(loginManual);
        if (emailGerado) emailGerado.value = emailGeradoValue;
        
        // Verificar disponibilidade
        const disponivel = await verificarDisponibilidadeLogin(loginManual);
        
        if (disponivel) {
            if (statusDiv) {
                statusDiv.innerHTML = '<span class="text-success">✅ Login e e-mail disponíveis para cadastro!</span>';
            }
            novoBtnVerificar.disabled = false;
        } else {
            if (statusDiv) {
                statusDiv.innerHTML = '<span class="text-danger">❌ Login ou e-mail já está em uso. Tente outro.</span>';
            }
            novoBtnVerificar.disabled = true;
        }
    }
    
    // Adicionar listener para o botão verificar
    novoBtnVerificar.addEventListener("click", async () => {
        const loginManual = document.getElementById("login-alternativo").value.trim().toLowerCase();
        const emailManual = gerarEmailPorLogin(loginManual);
        
        if (!loginManual) {
            alert("Por favor, digite um login alternativo!");
            return;
        }
        
        // Verificar disponibilidade novamente antes de prosseguir
        const disponivel = await verificarDisponibilidadeLogin(loginManual);
        
        if (!disponivel) {
            alert(`Login "${loginManual}" ou e-mail "${emailManual}" já está em uso. Tente outro.`);
            return;
        }
        
        // Fechar modal de confirmação
        const modal = bootstrap.Modal.getInstance(modalConfirmacao);
        if (modal) modal.hide();
        
        // Chamar callback com os dados manuais
        if (callback) {
            callback(loginManual, emailManual);
        }
    });
    
    // Abrir modal
    const modal = new bootstrap.Modal(modalConfirmacao);
    modal.show();
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO DE VALORES
// ============================================

// Função para formatar valor monetário em tempo real
function formatarValorMonetario(inputElement) {
  if (!inputElement) return;

  inputElement.removeEventListener("input", handleValorInput);
  inputElement.removeEventListener("blur", handleValorBlur);

  inputElement.addEventListener("input", handleValorInput);
  inputElement.addEventListener("blur", handleValorBlur);
}

function handleValorInput(e) {
  let valor = e.target.value;

  // Remove tudo que não for número ou vírgula
  valor = valor.replace(/[^0-9,]/g, "");

  // Remove vírgulas extras (deixa apenas a primeira)
  const partes = valor.split(",");
  if (partes.length > 2) {
    valor = partes[0] + "," + partes.slice(1).join("");
  }

  // Limita a 2 casas decimais
  if (partes.length === 2 && partes[1].length > 2) {
    valor = partes[0] + "," + partes[1].substring(0, 2);
  }

  // Limitar o número de dígitos da parte inteira (máximo 6 dígitos)
  const parteInteira = valor.split(",")[0].replace(/\D/g, "");
  if (parteInteira.length > 6) {
    const novaParteInteira = parteInteira.substring(0, 6);
    if (valor.includes(",")) {
      valor = novaParteInteira + "," + valor.split(",")[1];
    } else {
      valor = novaParteInteira;
    }
  }

  e.target.value = valor;
}

function handleValorBlur(e) {
  let valor = e.target.value;

  if (!valor) {
    e.target.value = "0,00";
    return;
  }

  valor = valor.replace(/[^\d,]/g, "");

  if (!valor.includes(",")) {
    valor = valor + ",00";
  }

  let partes = valor.split(",");
  let inteiro = partes[0].replace(/^0+/, "") || "0";
  let decimal = partes[1] || "00";

  decimal = decimal.substring(0, 2);
  if (decimal.length === 1) decimal = decimal + "0";
  if (decimal.length === 0) decimal = "00";

  if (inteiro.length > 6) {
    inteiro = inteiro.substring(0, 6);
  }

  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  e.target.value = inteiro + "," + decimal;
}

function converterValorParaNumero(valorFormatado) {
  if (!valorFormatado) return 0;
  let valorLimpo = valorFormatado.replace(/\./g, "").replace(",", ".");
  let numero = parseFloat(valorLimpo);
  return isNaN(numero) ? 0 : numero;
}

function converterNumeroParaValor(numero) {
  if (numero === undefined || numero === null) return "0,00";
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================
// FUNÇÕES DE CUSTOS DE VIAGEM
// ============================================

async function carregarCustosViagem() {
  try {
    const docRef = window.db.collection("custos").doc("custos_abastecimento");
    const docSnap = await docRef.get();

    let valorKm = 0;
    let valorDiesel = 0;
    let valorComissao = 0;
    let dataAtualizacao = null;
    let loginAtualizacao = null;

    if (docSnap.exists) {
      const data = docSnap.data();
      valorKm = data.cf_valor_por_km || 0;
      valorDiesel = data.cf_valor_por_litro_diesel || 0;
      valorComissao = data.cf_percentual_comissao || 0;
      dataAtualizacao = data.ultima_atualizacao_custos;
      loginAtualizacao = data.ultimo_login_atualizacao;
    }

    let valorKmNumerico = 0;
    let valorDieselNumerico = 0;
    let valorComissaoNumerico = 0;

    if (typeof valorKm === "string") {
      valorKmNumerico = parseFloat(valorKm.replace(",", ".")) || 0;
    } else {
      valorKmNumerico = valorKm || 0;
    }

    if (typeof valorDiesel === "string") {
      valorDieselNumerico = parseFloat(valorDiesel.replace(",", ".")) || 0;
    } else {
      valorDieselNumerico = valorDiesel || 0;
    }

    if (typeof valorComissao === "string") {
      valorComissaoNumerico = parseFloat(valorComissao.replace(",", ".")) || 0;
    } else {
      valorComissaoNumerico = valorComissao || 0;
    }

    const inputKm = document.getElementById("custo-km-valor");
    const inputDiesel = document.getElementById("custo-diesel-valor");
    const inputComissao = document.getElementById("custo-comissao-valor");
    const dataDisplay = document.getElementById("ultima-alteracao-data");
    const loginDisplay = document.getElementById("ultima-alteracao-por");
    const todosDisplay = document.getElementById("ultima-alteracao-todos");

    if (inputKm) {
      inputKm.value = converterNumeroParaValor(valorKmNumerico);
      formatarValorMonetario(inputKm);
    }

    if (inputDiesel) {
      inputDiesel.value = converterNumeroParaValor(valorDieselNumerico);
      formatarValorMonetario(inputDiesel);
    }

    if (inputComissao) {
      inputComissao.value = converterNumeroParaValor(valorComissaoNumerico);
      formatarValorMonetario(inputComissao);
    }

    if (dataDisplay && dataAtualizacao) {
      const dataObj = dataAtualizacao.toDate
        ? dataAtualizacao.toDate()
        : new Date(dataAtualizacao);
      dataDisplay.innerHTML =
        dataObj.toLocaleDateString("pt-BR") +
        " " +
        dataObj.toLocaleTimeString("pt-BR");
    } else if (dataDisplay) {
      dataDisplay.innerHTML = "--/--/---- --:--";
    }

    if (loginDisplay) {
      loginDisplay.innerHTML = loginAtualizacao || "sistema";
    }

    if (todosDisplay && dataAtualizacao) {
      const dataObj = dataAtualizacao.toDate
        ? dataAtualizacao.toDate()
        : new Date(dataAtualizacao);
      todosDisplay.innerHTML =
        dataObj.toLocaleDateString("pt-BR") +
        " " +
        dataObj.toLocaleTimeString("pt-BR");
    } else if (todosDisplay) {
      todosDisplay.innerHTML = "--/--/---- --:--";
    }
  } catch (error) {
    console.error("Erro ao carregar custos de viagem:", error);
  }
}

async function atualizarCustosViagem(e) {
  e.preventDefault();

  const inputKm = document.getElementById("custo-km-valor");
  const inputDiesel = document.getElementById("custo-diesel-valor");
  const inputComissao = document.getElementById("custo-comissao-valor");

  let valorKmFormatado = inputKm.value.trim();
  let valorDieselFormatado = inputDiesel.value.trim();
  let valorComissaoFormatado = inputComissao.value.trim();

  if (!valorKmFormatado) {
    alert("Por favor, insira um valor válido para Custo por KM (ex: 6,89)");
    inputKm.focus();
    return;
  }

  if (!valorDieselFormatado) {
    alert("Por favor, insira um valor válido para Valor do Diesel (ex: 5,49)");
    inputDiesel.focus();
    return;
  }

  if (!valorComissaoFormatado) {
    alert(
      "Por favor, insira um valor válido para Percentual de Comissão (ex: 5,00)",
    );
    inputComissao.focus();
    return;
  }

  const regexValor = /^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$/;
  if (
    !regexValor.test(valorKmFormatado) &&
    !/^\d+,\d{2}$/.test(valorKmFormatado)
  ) {
    alert(
      "Formato inválido para Custo por KM! Use o formato: 0,74 ou 10,21 ou 1.234,56",
    );
    inputKm.focus();
    return;
  }

  if (
    !regexValor.test(valorDieselFormatado) &&
    !/^\d+,\d{2}$/.test(valorDieselFormatado)
  ) {
    alert(
      "Formato inválido para Valor do Diesel! Use o formato: 0,74 ou 10,21 ou 1.234,56",
    );
    inputDiesel.focus();
    return;
  }

  if (
    !/^\d+,\d{2}$/.test(valorComissaoFormatado) &&
    !/^\d+,\d{2}$/.test(valorComissaoFormatado.replace(".", ""))
  ) {
    valorComissaoFormatado = valorComissaoFormatado.replace(/\./g, "");
    if (!/^\d+,\d{2}$/.test(valorComissaoFormatado)) {
      alert(
        "Formato inválido para Percentual de Comissão! Use o formato: 5,00 ou 10,50",
      );
      inputComissao.focus();
      return;
    }
  }

  const valorKmNumerico = converterValorParaNumero(valorKmFormatado);
  const valorDieselNumerico = converterValorParaNumero(valorDieselFormatado);
  const valorComissaoNumerico = converterValorParaNumero(
    valorComissaoFormatado,
  );

  if (isNaN(valorKmNumerico) || valorKmNumerico <= 0) {
    alert(
      "Por favor, insira um valor válido maior que zero para Custo por KM (ex: 6,89)",
    );
    inputKm.focus();
    return;
  }

  if (isNaN(valorDieselNumerico) || valorDieselNumerico <= 0) {
    alert(
      "Por favor, insira um valor válido maior que zero para Valor do Diesel (ex: 5,49)",
    );
    inputDiesel.focus();
    return;
  }

  if (
    isNaN(valorComissaoNumerico) ||
    valorComissaoNumerico < 0 ||
    valorComissaoNumerico > 100
  ) {
    alert(
      "Por favor, insira um valor válido para Percentual de Comissão (entre 0 e 100)",
    );
    inputComissao.focus();
    return;
  }

  const btn = document.getElementById("btn-atualizar-custos");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
  btn.disabled = true;

  try {
    const docRef = window.db.collection("custos").doc("custos_abastecimento");
    const dataAtual = new Date();
    const loginAtual = window.currentUser?.login || "sistema";

    const dadosAtualizados = {
      cf_valor_por_km: valorKmNumerico,
      cf_valor_por_litro_diesel: valorDieselNumerico,
      cf_percentual_comissao: valorComissaoNumerico,
      ultima_atualizacao_custos: dataAtual,
      ultimo_login_atualizacao: loginAtual,
    };

    await docRef.set(dadosAtualizados, { merge: true });

    alert(
      `Valores atualizados com sucesso!\n\n` +
        `Custo por KM: R$ ${converterNumeroParaValor(valorKmNumerico)}\n` +
        `Diesel: R$ ${converterNumeroParaValor(valorDieselNumerico)}/L\n` +
        `Comissão: ${converterNumeroParaValor(valorComissaoNumerico)}%`,
    );

    await carregarCustosViagem();
  } catch (error) {
    console.error("Erro ao atualizar custos:", error);
    alert(`Erro ao atualizar valores: ${error.message}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================
// FUNÇÕES EXISTENTES (mantidas)
// ============================================

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

async function carregarConfigEmpresa() {
    try {
        const configDoc = await window.db.collection("config").doc("plano").get();
        if (configDoc.exists) {
            configEmpresa = configDoc.data();
            // Garantir que os valores são números
            configEmpresa.qtd_logins_atual = parseInt(configEmpresa.qtd_logins_atual) || 0;
            configEmpresa.qtd_logins_max = parseInt(configEmpresa.qtd_logins_max) || 0;
            configEmpresa.qtd_carros_atual = parseInt(configEmpresa.qtd_carros_atual) || 0;
            configEmpresa.qtd_carros_max = parseInt(configEmpresa.qtd_carros_max) || 0;
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
    if (!configEmpresa) await carregarConfigEmpresa();
    if (!configEmpresa) throw new Error("Configuração da empresa não encontrada");
    if (configEmpresa.empresa_vigencia_ativo !== true) throw new Error("Empresa inativa. Contate o administrador.");

    const loginsAtuais = parseInt(configEmpresa.qtd_logins_atual) || 0;
    const loginsMax = parseInt(configEmpresa.qtd_logins_max) || 0;

    if (loginsAtuais >= loginsMax && loginsMax > 0) {
        throw new Error(`Limite de usuários atingido (${loginsAtuais}/${loginsMax}). Contate o administrador.`);
    }
    return true;
}

async function verificarLimiteCaminhoes() {
  if (!configEmpresa) await carregarConfigEmpresa();
  if (!configEmpresa) throw new Error("Configuração da empresa não encontrada");

  const carrosAtuais = parseInt(configEmpresa.qtd_carros_atual) || 0;
  const carrosMax = parseInt(configEmpresa.qtd_carros_max) || 0;

  if (carrosAtuais >= carrosMax && carrosMax > 0) {
    throw new Error(
      `Limite de caminhões atingido (${carrosAtuais}/${carrosMax}). Contate o administrador.`,
    );
  }
  return true;
}

async function atualizarContadorLogins(incrementar = true) {
  if (!configEmpresa) await carregarConfigEmpresa();
  if (!configEmpresa) return;

  const loginsAtuais = parseInt(configEmpresa.qtd_logins_atual) || 0;
  const novoValor = incrementar
    ? loginsAtuais + 1
    : Math.max(0, loginsAtuais - 1);

  try {
    await window.db
      .collection("config")
      .doc("plano")
      .update({ qtd_logins_atual: novoValor.toString() });
    configEmpresa.qtd_logins_atual = novoValor.toString();
    console.log(`✅ Contador de logins atualizado: ${novoValor}`);
  } catch (error) {
    console.error("❌ Erro ao atualizar contador de logins:", error);
  }
}

async function atualizarContadorCaminhoes(incrementar = true) {
  if (!configEmpresa) await carregarConfigEmpresa();
  if (!configEmpresa) return;

  const carrosAtuais = parseInt(configEmpresa.qtd_carros_atual) || 0;
  const novoValor = incrementar
    ? carrosAtuais + 1
    : Math.max(0, carrosAtuais - 1);

  try {
    await window.db
      .collection("config")
      .doc("plano")
      .update({ qtd_carros_atual: novoValor.toString() });
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
          if (!isNaN(numero) && numero > maiorNumero) maiorNumero = numero;
        }
      }
    }

    const proximoNumero = maiorNumero + 1;
    const idFormatado = `login_${proximoNumero.toString().padStart(3, "0")}`;
    console.log(`📝 Próximo ID de login: ${idFormatado}`);
    return idFormatado;
  } catch (error) {
    console.error("Erro ao gerar próximo ID:", error);
    return `login_${Date.now()}`;
  }
}

// Funções de Usuários
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

function formatarUltimoLogin(ultimoLogin) {
  if (!ultimoLogin) return "-";
  if (typeof ultimoLogin === "object" && ultimoLogin.toDate) {
    try {
      const data = ultimoLogin.toDate();
      return (
        data.toLocaleDateString("pt-BR") +
        " " +
        data.toLocaleTimeString("pt-BR")
      );
    } catch (e) {
      return "-";
    }
  }
  if (typeof ultimoLogin === "string") {
    try {
      const data = new Date(ultimoLogin);
      if (!isNaN(data.getTime()))
        return (
          data.toLocaleDateString("pt-BR") +
          " " +
          data.toLocaleTimeString("pt-BR")
        );
    } catch (e) {}
    return ultimoLogin;
  }
  if (ultimoLogin instanceof Date)
    return (
      ultimoLogin.toLocaleDateString("pt-BR") +
      " " +
      ultimoLogin.toLocaleTimeString("pt-BR")
    );
  return "-";
}

function renderizarTabelaUsuarios() {
    const tabelaCorpo = document.getElementById("tabela-usuarios-corpo");
    if (!tabelaCorpo) return;

    // Atualizar contador de usuários
    const contadorUsuarios = usuarios.length;
    const loginsMax = parseInt(configEmpresa?.qtd_logins_max) || 0;
    const contadorSpan = document.getElementById("usuarios-contador");
    if (contadorSpan) {
        const statusClass = contadorUsuarios >= loginsMax && loginsMax > 0 ? "bg-danger" : "bg-primary";
        contadorSpan.innerHTML = `${contadorUsuarios} / ${loginsMax}`;
        contadorSpan.className = `badge ${statusClass} ms-2`;
    }

    if (usuarios.length === 0) {
        tabelaCorpo.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum usuário cadastrado</td></tr>';
        return;
    }

    let html = "";
    usuarios.forEach((usuario) => {
        const dataCriacao = usuario.criado_data?.toDate
            ? usuario.criado_data.toDate().toLocaleDateString("pt-BR")
            : typeof usuario.criado_data === "string"
                ? usuario.criado_data
                : "-";

        const ultimoLogin = formatarUltimoLogin(usuario.ultimo_login);
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
                <td class="small"><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="small">${dataCriacao}</td>
                <td class="small">${ultimoLogin}</td>
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

function renderizarCaminhoesCheckbox() {
  const container = document.getElementById("usuario-caminhoes-lista");
  if (!container) return;

  if (caminhoes.length === 0) {
    container.innerHTML =
      '<div class="text-center text-muted small">Nenhum caminhão cadastrado</div>';
    return;
  }

  let html = "";
  caminhoes.forEach((caminhao) => {
    const isChecked = usuarioEditando?.placas_caminhoes_vinculados?.[
      caminhao.id
    ]
      ? "checked"
      : "";
    html += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${caminhao.id}" id="caminhao_${caminhao.id}" ${isChecked}>
                <label class="form-check-label small" for="caminhao_${caminhao.id}">
                    <strong>${caminhao.id}</strong> - ${caminhao.modelo} ${caminhao.marca} (${caminhao.capacidade_toneladas}t)
                </label>
            </div>
        `;
  });

  container.innerHTML = html;
}

function renderizarMotoristasCheckbox() {
  const container = document.getElementById("caminhao-motoristas-lista");
  if (!container) return;

  const motoristasAtivos = usuarios.filter(
    (u) => u.perfil === "operador" && u.status_ativo === true,
  );

  if (motoristasAtivos.length === 0) {
    container.innerHTML =
      '<div class="text-center text-muted small">Nenhum motorista disponível</div>';
    return;
  }

  let html = "";
  motoristasAtivos.forEach((motorista) => {
    const isChecked = caminhaoEditando?.id_motoristas_vinculados?.includes(
      motorista.id,
    )
      ? "checked"
      : "";
    html += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${motorista.id}" id="motorista_${motorista.id}" ${isChecked}>
                <label class="form-check-label small" for="motorista_${motorista.id}">
                    ${motorista.nome} (${motorista.login})
                </label>
            </div>
        `;
  });

  container.innerHTML = html;
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
    
    // Limpar estilos de erro
    const loginInput = document.getElementById("usuario-login");
    const emailInput = document.getElementById("usuario-email");
    if (loginInput) loginInput.style.borderColor = "";
    if (emailInput) emailInput.style.borderColor = "";
    
    // Adicionar listener para gerar login e email automaticamente
    const nomeInput = document.getElementById("usuario-nome");
    if (nomeInput) {
        nomeInput.removeEventListener("input", atualizarLoginEEmailPorNome);
        nomeInput.addEventListener("input", atualizarLoginEEmailPorNome);
    }
    
    renderizarCaminhoesCheckbox();
    
    // Verificar limite de logins antes de abrir o modal
    const loginsAtuais = parseInt(configEmpresa?.qtd_logins_atual) || 0;
    const loginsMax = parseInt(configEmpresa?.qtd_logins_max) || 0;
    
    if (loginsAtuais >= loginsMax && loginsMax > 0) {
        alert(`Limite de usuários atingido (${loginsAtuais}/${loginsMax}). Não é possível criar novos usuários.`);
        return;
    }
    
    if (modalUsuario) modalUsuario.show();
}

async function salvarUsuario() {
    const usuarioId = document.getElementById("usuario-id").value;
    const nome = document.getElementById("usuario-nome").value.trim();
    // Login e email são readonly, pegamos os valores gerados
    const loginInput = document.getElementById("usuario-login").value.trim().toLowerCase();
    const emailInput = document.getElementById("usuario-email").value.trim().toLowerCase();
    const senha = document.getElementById("usuario-senha").value;
    const perfil = document.getElementById("usuario-perfil").value;
    const status = document.getElementById("usuario-status").value === "true";
    
    // Se é edição, permitir salvar com os dados atuais (que são readonly)
    if (usuarioId) {
        await salvarUsuarioExistente(usuarioId, nome, loginInput, emailInput, senha, perfil, status);
        return;
    }
    
    // NOVO USUÁRIO - Verificar disponibilidade automática
    
    if (!nome) {
        alert("Preencha o nome completo!");
        return;
    }
    
    // Gerar variantes de login
    const variantes = gerarVariantesLogin(nome);
    const loginA = variantes.loginA;
    const loginB = variantes.loginB;
    
    if (!loginA) {
        alert("Não foi possível gerar um login a partir do nome informado!");
        return;
    }
    
    // Verificar disponibilidade
    const disponibilidade = await verificarDisponibilidadeVariantes(nome);
    
    // Caso 1: Login A está disponível
    if (disponibilidade.loginA.disponivel) {
        const emailA = gerarEmailPorLogin(loginA);
        await finalizarCadastroUsuario(null, nome, loginA, emailA, senha, perfil, status);
        return;
    }
    
    // Caso 2: Login A indisponível, mas tem Login B e está disponível
    if (disponibilidade.loginB && disponibilidade.loginB.disponivel) {
        const mensagem = `O login "${loginA}" já está em uso.\n\nO login "${loginB}" está disponível.\n\nDeseja usar este login?`;
        
        // Perguntar se quer usar o login B
        if (confirm(mensagem)) {
            const emailB = gerarEmailPorLogin(loginB);
            await finalizarCadastroUsuario(null, nome, loginB, emailB, senha, perfil, status);
            return;
        } else {
            // Usuário optou por cadastro manual
            const mensagemManual = `Os logins "${loginA}" e "${loginB}" estão indisponíveis.\n\nDeseja cadastrar um login manualmente?`;
            mostrarModalConfirmacaoManual(mensagemManual, nome, "", (loginManual, emailManual) => {
                finalizarCadastroUsuario(null, nome, loginManual, emailManual, senha, perfil, status);
            });
            return;
        }
    }
    
    // Caso 3: Login A indisponível e não tem Login B (apenas 1 sobrenome) ou Login B também indisponível
    let mensagemManual = "";
    if (disponibilidade.loginB === null) {
        mensagemManual = `O login "${loginA}" já está em uso e não há outra variante disponível.\n\nDeseja cadastrar um login manualmente?`;
    } else {
        mensagemManual = `Os logins "${loginA}" e "${loginB}" já estão em uso.\n\nDeseja cadastrar um login manualmente?`;
    }
    
    mostrarModalConfirmacaoManual(mensagemManual, nome, loginA, (loginManual, emailManual) => {
        finalizarCadastroUsuario(null, nome, loginManual, emailManual, senha, perfil, status);
    });
}

// Função para finalizar o cadastro do usuário
async function finalizarCadastroUsuario(usuarioId, nome, login, email, senha, perfil, status) {
    if (!usuarioId && (!senha || senha.length < 6)) {
        alert("A senha deve ter no mínimo 6 caracteres!");
        return false;
    }
    
    // Coletar caminhões vinculados
    const checkboxes = document.querySelectorAll("#usuario-caminhoes-lista input[type='checkbox']");
    const placasVinculadas = {};
    
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            const placa = checkbox.value;
            const caminhao = caminhoes.find((c) => c.id === placa);
            if (caminhao) {
                placasVinculadas[placa] = {
                    capacidade_toneladas: caminhao.capacidade_toneladas,
                    caracteristica_axleCount: caminhao.caracteristica_axleCount,
                    caracteristica_heightCm: caminhao.caracteristica_heightCm,
                    caracteristica_lengthCm: caminhao.caracteristica_lengthCm,
                    caracteristica_tipo_de_veiculo: caminhao.caracteristica_tipo_de_veiculo,
                    caracteristica_weightKg: caminhao.caracteristica_weightKg,
                    caracteristica_widthCm: caminhao.caracteristica_widthCm,
                };
            }
        }
    });
    
    const btn = document.getElementById("btn-salvar-usuario");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
    btn.disabled = true;
    
    try {
        if (!usuarioId) {
            // NOVO USUÁRIO
            await verificarLimiteLogins();
            
            const docRef = window.db.collection("logins").doc("funcionarios_logins");
            const docSnap = await docRef.get();
            
            let dadosAtuais = {};
            if (docSnap.exists) {
                dadosAtuais = docSnap.data();
            }
            
            // Verificar se login já existe (última verificação)
            for (const [key, value] of Object.entries(dadosAtuais)) {
                if (value.login === login) {
                    throw new Error(`Login "${login}" já existe!`);
                }
            }
            
            // Verificar se email já existe
            for (const [key, value] of Object.entries(dadosAtuais)) {
                if (value.email === email) {
                    throw new Error(`E-mail "${email}" já está cadastrado!`);
                }
            }
            
            // Criar usuário no Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
            
            const novoId = await getProximoIdLogin();
            
            const novoUsuario = {
                criado_data: new Date(),
                criado_por_login: window.currentUser?.login || "sistema",
                email: email,
                login: login,
                nome: nome,
                perfil: perfil,
                status_ativo: status,
                ultimo_login: null,
                placas_caminhoes_vinculados: placasVinculadas,
            };
            
            dadosAtuais[novoId] = novoUsuario;
            await docRef.set(dadosAtuais);
            
            await atualizarIdMotoristasVinculados(placasVinculadas, novoId, null);
            await atualizarContadorLogins(true);
            
            alert("Usuário criado com sucesso!");
        } else {
            // EDIÇÃO DE USUÁRIO
            const docRef = window.db.collection("logins").doc("funcionarios_logins");
            const docSnap = await docRef.get();
            const dadosAtuais = docSnap.data();
            
            const placasAntigas = dadosAtuais[usuarioId]?.placas_caminhoes_vinculados || {};
            
            dadosAtuais[usuarioId] = {
                ...dadosAtuais[usuarioId],
                nome: nome,
                email: email,
                login: login,
                perfil: perfil,
                status_ativo: status,
                placas_caminhoes_vinculados: placasVinculadas,
                ultima_atualizacao: new Date(),
                atualizado_por: window.currentUser?.login || "sistema",
            };
            
            await docRef.set(dadosAtuais);
            
            await atualizarIdMotoristasVinculados(placasVinculadas, usuarioId, placasAntigas);
            
            alert("Usuário atualizado com sucesso!");
        }
        
        if (modalUsuario) modalUsuario.hide();
        await carregarUsuarios();
        await carregarMotoristasParaSelect();
        return true;
    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        alert(`Erro ao salvar usuário: ${error.message}`);
        return false;
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Função separada para salvar usuário existente (edição)
async function salvarUsuarioExistente(usuarioId, nome, login, email, senha, perfil, status) {
    // Na edição, login e email são readonly e não devem ser alterados manualmente
    // Apenas validamos se o usuário existe e salvamos as alterações permitidas
    
    const usuarioExistente = usuarios.find(u => u.id === usuarioId);
    
    if (!usuarioExistente) {
        alert("Usuário não encontrado!");
        return;
    }
    
    // Verificar se o login/email foi alterado por algum motivo (não deveria, mas validamos)
    if (login !== usuarioExistente.login) {
        const disponivel = await verificarDisponibilidadeLogin(login);
        if (!disponivel) {
            alert(`Login "${login}" já está em uso por outro usuário! Não é possível alterar.`);
            return;
        }
    }
    
    if (email !== usuarioExistente.email) {
        const emailDisponivel = await verificarDisponibilidadeEmailAuth(email);
        if (!emailDisponivel) {
            alert(`E-mail "${email}" já está em uso por outro usuário! Não é possível alterar.`);
            return;
        }
    }
    
    // Prosseguir com o salvamento
    await finalizarCadastroUsuario(usuarioId, nome, login, email, senha, perfil, status);
}

async function atualizarIdMotoristasVinculados(
  novasPlacas,
  usuarioId,
  placasAntigas = {},
) {
  try {
    const placasAntigasArray = Object.keys(placasAntigas);
    const novasPlacasArray = Object.keys(novasPlacas);

    for (const placa of placasAntigasArray) {
      if (!novasPlacasArray.includes(placa)) {
        const caminhaoRef = window.db.collection("caminhoes").doc(placa);
        const caminhaoDoc = await caminhaoRef.get();
        if (caminhaoDoc.exists) {
          const dados = caminhaoDoc.data();
          const motoristasVinculados = dados.id_motoristas_vinculados || [];
          const novaLista = motoristasVinculados.filter(
            (id) => id !== usuarioId,
          );
          await caminhaoRef.update({ id_motoristas_vinculados: novaLista });
        }
      }
    }

    for (const placa of novasPlacasArray) {
      const caminhaoRef = window.db.collection("caminhoes").doc(placa);
      const caminhaoDoc = await caminhaoRef.get();
      if (caminhaoDoc.exists) {
        const dados = caminhaoDoc.data();
        const motoristasVinculados = dados.id_motoristas_vinculados || [];
        if (!motoristasVinculados.includes(usuarioId)) {
          motoristasVinculados.push(usuarioId);
          await caminhaoRef.update({
            id_motoristas_vinculados: motoristasVinculados,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar vínculos dos caminhões:", error);
  }
}

window.toggleStatusUsuario = async function (usuarioId) {
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
      atualizado_por: window.currentUser?.login || "sistema",
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

window.resetarSenha = function (usuarioId) {
  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (!usuario) return;

  usuarioResetando = usuario;
  const novaSenha = Math.random().toString(36).slice(-8);

  document.getElementById("reset-usuario-nome").textContent = usuario.nome;
  document.getElementById("nova-senha-temporaria").textContent = novaSenha;

  if (modalResetSenha) modalResetSenha.show();

  window.novaSenhaTemporaria = novaSenha;
};

async function confirmarResetSenha() {
  if (!usuarioResetando) return;

  const btn = document.getElementById("btn-confirmar-reset");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Resetando...';
  btn.disabled = true;

  try {
    const user = await firebase.auth().getUserByEmail(usuarioResetando.email);
    await firebase.auth().updateUser(user.uid, {
      password: window.novaSenhaTemporaria,
    });

    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();
    const dadosAtuais = docSnap.data();

    dadosAtuais[usuarioResetando.id] = {
      ...dadosAtuais[usuarioResetando.id],
      senha_resetada_em: new Date(),
      senha_resetada_por: window.currentUser?.login || "sistema",
    };

    await docRef.set(dadosAtuais);

    alert(
      `Senha resetada com sucesso!\nNova senha: ${window.novaSenhaTemporaria}`,
    );

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

  tabelaCorpo.innerHTML =
    '<td><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Carregando caminhões...</td></tr>';

  try {
    const snapshot = await window.db.collection("caminhoes").get();

    caminhoes = [];
    snapshot.forEach((doc) => {
      caminhoes.push({ id: doc.id, ...doc.data() });
    });

    renderizarTabelaCaminhoes();
  } catch (error) {
    console.error("Erro ao carregar caminhões:", error);
    tabelaCorpo.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-danger">Erro ao carregar caminhões: ${error.message}</td></tr>`;
  }
}

function renderizarTabelaCaminhoes() {
  const tabelaCorpo = document.getElementById("tabela-caminhoes-corpo");
  if (!tabelaCorpo) return;

  if (caminhoes.length === 0) {
    tabelaCorpo.innerHTML =
      '<tr><td colspan="10" class="text-center py-4"><i class="fas fa-info-circle me-2"></i>Nenhum caminhão cadastrado</td></tr>';
    return;
  }

  let html = "";
  caminhoes.forEach((caminhao) => {
    let statusClass =
      caminhao.status_ativo === true ? "bg-success" : "bg-secondary";
    let statusText = caminhao.status_ativo === true ? "Ativo" : "Inativo";

    let motoristasNomes = [];
    if (
      caminhao.id_motoristas_vinculados &&
      caminhao.id_motoristas_vinculados.length > 0
    ) {
      motoristasNomes = caminhao.id_motoristas_vinculados.map((id) => {
        const motorista = usuarios.find((u) => u.id === id);
        return motorista ? motorista.nome : id;
      });
    }
    const motoristasTexto =
      motoristasNomes.length > 0 ? motoristasNomes.join(", ") : "-";

    html += `
            <tr>
                <td class="small fw-semibold text-uppercase">${escapeHtml(caminhao.id) || "-"}</td>
                <td class="small">${escapeHtml(caminhao.modelo) || "-"}</td>
                <td class="small">${escapeHtml(caminhao.marca) || "-"}</td>
                <td class="small">${caminhao.ano || "-"}</td>
                <td class="small text-end">${caminhao.capacidade_toneladas || 0} t</td>
                <td class="small">${caminhao.caracteristica_tipo_de_veiculo || "-"}</td>
                <td class="small text-center">${caminhao.caracteristica_axleCount || "-"}</td>
                <td class="small"><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="small">${motoristasTexto}</td>
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
      if (value.perfil === "operador" && value.status_ativo === true) {
        motoristas.push({
          id: key,
          nome: value.nome,
          login: value.login,
        });
      }
    }

    motoristas.sort((a, b) => a.nome.localeCompare(b.nome));

    if (caminhaoEditando) {
      renderizarMotoristasCheckbox();
    }
  } catch (error) {
    console.error("Erro ao carregar motoristas:", error);
  }
}

function abrirModalNovoCaminhao() {
  caminhaoEditando = null;
  document.getElementById("caminhao-placa-antiga").value = "";
  document.getElementById("caminhao-placa").value = "";
  document.getElementById("caminhao-modelo").value = "";
  document.getElementById("caminhao-marca").value = "";
  document.getElementById("caminhao-ano").value = "";
  document.getElementById("caminhao-capacidade").value = "";
  document.getElementById("caminhao-tipo").value = "";
  document.getElementById("caminhao-eixos").value = "";
  document.getElementById("caminhao-peso").value = "";
  document.getElementById("caminhao-altura").value = "";
  document.getElementById("caminhao-largura").value = "";
  document.getElementById("caminhao-comprimento").value = "";
  document.getElementById("caminhao-status").value = "true";
  document.getElementById("caminhao-obs").value = "";
  document.getElementById("modal-caminhao-titulo").innerHTML =
    '<i class="fas fa-truck-plus me-2"></i>Novo Caminhão';

  renderizarMotoristasCheckbox();

  if (modalCaminhao) modalCaminhao.show();
}

window.editarCaminhao = function (caminhaoId) {
  const caminhao = caminhoes.find((c) => c.id === caminhaoId);
  if (!caminhao) return;

  caminhaoEditando = caminhao;
  document.getElementById("modal-caminhao-titulo").innerHTML =
    '<i class="fas fa-truck-edit me-2"></i>Editar Caminhão';
  document.getElementById("caminhao-placa-antiga").value = caminhao.id;
  document.getElementById("caminhao-placa").value = caminhao.id || "";
  document.getElementById("caminhao-modelo").value = caminhao.modelo || "";
  document.getElementById("caminhao-marca").value = caminhao.marca || "";
  document.getElementById("caminhao-ano").value = caminhao.ano || "";
  document.getElementById("caminhao-capacidade").value =
    caminhao.capacidade_toneladas || "";
  document.getElementById("caminhao-tipo").value =
    caminhao.caracteristica_tipo_de_veiculo || "";
  document.getElementById("caminhao-eixos").value =
    caminhao.caracteristica_axleCount || "";
  document.getElementById("caminhao-peso").value =
    caminhao.caracteristica_weightKg || "";
  document.getElementById("caminhao-altura").value =
    caminhao.caracteristica_heightCm || "";
  document.getElementById("caminhao-largura").value =
    caminhao.caracteristica_widthCm || "";
  document.getElementById("caminhao-comprimento").value =
    caminhao.caracteristica_lengthCm || "";
  document.getElementById("caminhao-status").value =
    caminhao.status_ativo === true ? "true" : "false";
  document.getElementById("caminhao-obs").value = caminhao.obs || "";

  renderizarMotoristasCheckbox();

  if (modalCaminhao) modalCaminhao.show();
};

async function salvarCaminhao() {
  const placaAntiga = document.getElementById("caminhao-placa-antiga").value;
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
  const tipoVeiculo = document.getElementById("caminhao-tipo").value;
  const eixos = parseInt(document.getElementById("caminhao-eixos").value);
  const peso = parseInt(document.getElementById("caminhao-peso").value);
  const altura = parseInt(document.getElementById("caminhao-altura").value);
  const largura = parseInt(document.getElementById("caminhao-largura").value);
  const comprimento = parseInt(
    document.getElementById("caminhao-comprimento").value,
  );
  const status = document.getElementById("caminhao-status").value === "true";
  const obs = document.getElementById("caminhao-obs").value;

  const motoristasCheckboxes = document.querySelectorAll(
    "#caminhao-motoristas-lista input[type='checkbox']",
  );
  const motoristasVinculados = [];
  motoristasCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      motoristasVinculados.push(checkbox.value);
    }
  });

  if (
    !placa ||
    !modelo ||
    !marca ||
    !ano ||
    !capacidade ||
    !tipoVeiculo ||
    !eixos ||
    !peso ||
    !altura ||
    !largura ||
    !comprimento
  ) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-[0-9]{4}$/;
  if (!placaRegex.test(placa) && !/^[A-Z]{3}[0-9]{4}$/.test(placa)) {
    alert("Formato de placa inválido! Use o formato ABC1D23 ou ABC-1234");
    return;
  }

  const placaNormalizada = placa.replace(/-/g, "");

  const btn = document.getElementById("btn-salvar-caminhao");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
  btn.disabled = true;

  try {
    if (!placaAntiga || placaAntiga !== placaNormalizada) {
      const placaExistente = caminhoes.find((c) => c.id === placaNormalizada);
      if (placaExistente) {
        throw new Error(`Placa ${placaNormalizada} já está cadastrada!`);
      }
    }

    const caminhaoData = {
      ano: ano,
      capacidade_toneladas: capacidade,
      marca: marca,
      modelo: modelo,
      obs: obs,
      status_ativo: status,
      id_motoristas_vinculados: motoristasVinculados,
      caracteristica_tipo_de_veiculo: tipoVeiculo,
      caracteristica_axleCount: eixos,
      caracteristica_weightKg: peso,
      caracteristica_heightCm: altura,
      caracteristica_widthCm: largura,
      caracteristica_lengthCm: comprimento,
      atualizado_em: new Date(),
      atualizado_por: window.currentUser?.login || "sistema",
    };

    if (!placaAntiga) {
      await verificarLimiteCaminhoes();

      caminhaoData.criado_data = new Date();
      caminhaoData.criado_por = window.currentUser?.login || "sistema";
      await window.db
        .collection("caminhoes")
        .doc(placaNormalizada)
        .set(caminhaoData);

      await atualizarContadorCaminhoes(true);

      alert("Caminhão cadastrado com sucesso!");
    } else {
      await window.db
        .collection("caminhoes")
        .doc(placaAntiga)
        .update(caminhaoData);

      if (placaAntiga !== placaNormalizada) {
        caminhaoData.criado_data = new Date();
        caminhaoData.criado_por = window.currentUser?.login || "sistema";
        await window.db
          .collection("caminhoes")
          .doc(placaNormalizada)
          .set(caminhaoData);
        await window.db.collection("caminhoes").doc(placaAntiga).delete();
        await atualizarPlacaEmUsuarios(placaAntiga, placaNormalizada);
      }

      alert("Caminhão atualizado com sucesso!");
    }

    await atualizarVinculosUsuarios(
      motoristasVinculados,
      placaNormalizada,
      placaAntiga,
    );

    if (modalCaminhao) modalCaminhao.hide();
    await carregarCaminhoes();
    if (usuarioEditando) renderizarCaminhoesCheckbox();
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    alert(`Erro ao salvar caminhão: ${error.message}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function atualizarPlacaEmUsuarios(placaAntiga, placaNova) {
  try {
    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();
    const dadosAtuais = docSnap.data();

    let alterado = false;

    for (const [key, value] of Object.entries(dadosAtuais)) {
      if (
        key === "criado_por" ||
        key === "criado_em" ||
        key === "ultima_atualizacao"
      )
        continue;

      const placas = value.placas_caminhoes_vinculados || {};
      if (placas[placaAntiga]) {
        placas[placaNova] = placas[placaAntiga];
        delete placas[placaAntiga];
        dadosAtuais[key].placas_caminhoes_vinculados = placas;
        alterado = true;
      }
    }

    if (alterado) {
      await docRef.set(dadosAtuais);
    }
  } catch (error) {
    console.error("Erro ao atualizar placa nos usuários:", error);
  }
}

async function atualizarVinculosUsuarios(
  novosMotoristas,
  placa,
  motoristasAntigos = [],
) {
  try {
    const caminhaoAtual = caminhoes.find((c) => c.id === placa);
    if (!caminhaoAtual) return;

    const caminhoesInfo = {
      capacidade_toneladas: caminhaoAtual.capacidade_toneladas,
      caracteristica_axleCount: caminhaoAtual.caracteristica_axleCount,
      caracteristica_heightCm: caminhaoAtual.caracteristica_heightCm,
      caracteristica_lengthCm: caminhaoAtual.caracteristica_lengthCm,
      caracteristica_tipo_de_veiculo:
        caminhaoAtual.caracteristica_tipo_de_veiculo,
      caracteristica_weightKg: caminhaoAtual.caracteristica_weightKg,
      caracteristica_widthCm: caminhaoAtual.caracteristica_widthCm,
    };

    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();
    const dadosAtuais = docSnap.data();

    for (const motoristaId of motoristasAntigos) {
      if (!novosMotoristas.includes(motoristaId) && dadosAtuais[motoristaId]) {
        const placasVinculadas =
          dadosAtuais[motoristaId].placas_caminhoes_vinculados || {};
        if (placasVinculadas[placa]) {
          delete placasVinculadas[placa];
          dadosAtuais[motoristaId].placas_caminhoes_vinculados =
            placasVinculadas;
        }
      }
    }

    for (const motoristaId of novosMotoristas) {
      if (dadosAtuais[motoristaId]) {
        const placasVinculadas =
          dadosAtuais[motoristaId].placas_caminhoes_vinculados || {};
        if (!placasVinculadas[placa]) {
          placasVinculadas[placa] = caminhoesInfo;
          dadosAtuais[motoristaId].placas_caminhoes_vinculados =
            placasVinculadas;
        }
      }
    }

    await docRef.set(dadosAtuais);
  } catch (error) {
    console.error("Erro ao atualizar vínculos dos usuários:", error);
  }
}

window.excluirCaminhao = async function (caminhaoId) {
  const caminhao = caminhoes.find((c) => c.id === caminhaoId);
  if (!caminhao) return;

  if (
    !confirm(`Deseja excluir o caminhão ${caminhao.id} - ${caminhao.modelo}?`)
  )
    return;

  try {
    const docRef = window.db.collection("logins").doc("funcionarios_logins");
    const docSnap = await docRef.get();
    const dadosAtuais = docSnap.data();

    let alterado = false;

    for (const [key, value] of Object.entries(dadosAtuais)) {
      if (
        key === "criado_por" ||
        key === "criado_em" ||
        key === "ultima_atualizacao"
      )
        continue;

      const placas = value.placas_caminhoes_vinculados || {};
      if (placas[caminhaoId]) {
        delete placas[caminhaoId];
        dadosAtuais[key].placas_caminhoes_vinculados = placas;
        alterado = true;
      }
    }

    if (alterado) {
      await docRef.set(dadosAtuais);
    }

    await window.db.collection("caminhoes").doc(caminhaoId).delete();
    await atualizarContadorCaminhoes(false);

    alert("Caminhão excluído com sucesso!");
    await carregarCaminhoes();
    if (usuarioEditando) renderizarCaminhoesCheckbox();
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
    await carregarCustosViagem();
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
  const formCustos = document.getElementById("form-custos-viagem");

  if (btnNovoUsuario)
    btnNovoUsuario.addEventListener("click", () => abrirModalNovoUsuario());
  if (btnSalvarUsuario)
    btnSalvarUsuario.addEventListener("click", salvarUsuario);
  if (btnConfirmarReset)
    btnConfirmarReset.addEventListener("click", confirmarResetSenha);
  if (btnNovoCaminhao)
    btnNovoCaminhao.addEventListener("click", () => abrirModalNovoCaminhao());
  if (btnSalvarCaminhao)
    btnSalvarCaminhao.addEventListener("click", salvarCaminhao);
  if (formCustos) formCustos.addEventListener("submit", atualizarCustosViagem);
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// FUNÇÕES DE CUSTOS DE VIAGEM
// ============================================

window.initCadastros = initCadastros;
