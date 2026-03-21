// ============================================
// ABASTECIMENTO.JS - Tela de Abastecimento
// Disponível para: operador, admin
// ============================================

const abastecimentoTemplate = `
<div class="text-center py-5">
    <div class="bg-light rounded-circle d-inline-flex p-4 mb-4"><i class="fas fa-gas-pump fa-3x text-primary"></i></div>
    <h4 class="fw-bold mb-2">Abastecimento</h4>
    <p class="text-secondary mb-4">Tela em desenvolvimento</p>
</div>
`;

function initAbastecimento(container) {
    console.log("⛽ Inicializando tela de Abastecimento (em desenvolvimento)");
    
    if (container) {
        container.innerHTML = abastecimentoTemplate;
    }
}

window.initAbastecimento = initAbastecimento;
