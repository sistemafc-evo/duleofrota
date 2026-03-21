// ============================================
// CADASTROS.JS - Tela de Gestão de Cadastros
// Disponível para: gerente, supervisor, admin
// ============================================

const cadastrosTemplate = `
<div class="text-center py-5">
    <div class="bg-light rounded-circle d-inline-flex p-4 mb-4"><i class="fas fa-address-card fa-3x text-primary"></i></div>
    <h4 class="fw-bold mb-2">Gestão de Cadastros</h4>
    <p class="text-secondary mb-4">Tela em desenvolvimento</p>
</div>
`;

function initCadastros(container) {
    console.log("📋 Inicializando tela de Cadastros (em desenvolvimento)");
    
    if (container) {
        container.innerHTML = cadastrosTemplate;
    }
}

window.initCadastros = initCadastros;
