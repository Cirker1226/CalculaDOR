// Segurança: Impede acesso direto sem estar logado
(function verificarAutenticacao() {
    let usuarioLogado = sessionStorage.getItem('usuarioCorrente');
    if (!usuarioLogado) {
        window.location.href = "/modulos/login/login.html"; 
    }
})();

const rotas = {
    vendas: '/vendas_pdvs',
    clientes: '/clientes'
};

// Guarda o escopo global dos dados para não precisar refazer o fetch no filtro
let todasVendas = [];
let todosClientes = [];

function initRelatorio() {
    // Define datas padrão nos inputs (Início do mês atual até o dia de hoje)
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    document.getElementById('data-inicio').value = primeiroDiaMes.toISOString().substring(0, 10);
    document.getElementById('data-fim').value = hoje.toISOString().substring(0, 10);

    // Ouvinte do formulário de filtros
    document.getElementById('form-filtros').addEventListener('submit', function(e) {
        e.preventDefault();
        renderizarDados();
    });

    // Busca inicial do banco de dados
    Promise.all([
        fetch(rotas.vendas).then(res => res.json()).catch(() => []),
        fetch(rotas.clientes).then(res => res.json()).catch(() => [])
    ])
    .then(([vendas, clientes]) => {
        todasVendas = vendas;
        todosClientes = clientes;
        renderizarDados();
    })
    .catch(err => {
        console.error("Erro ao carregar dados do relatório:", err);
        document.getElementById('tabela-relatorio-vendas').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger py-3">Erro ao carregar dados do servidor.</td></tr>';
    });
}

function renderizarDados() {
    const dataInicioStr = document.getElementById('data-inicio').value;
    const dataFimStr = document.getElementById('data-fim').value;

    // Converte os inputs para objetos Date (zerando as horas para comparação justa)
    const limiteInicio = dataInicioStr ? new Date(dataInicioStr + 'T00:00:00') : null;
    const limiteFim = dataFimStr ? new Date(dataFimStr + 'T23:59:59') : null;

    let faturamentoTotal = 0;
    let totalPedidos = 0;
    let tabelaHTML = "";

    // Ordena as vendas das mais recentes para as mais antigas
    const vendasOrdenadas = [...todasVendas].reverse();

    vendasOrdenadas.forEach((v, idx) => {
        const dataVenda = v.data_hora ? new Date(v.data_hora) : null;

        // Aplicação do Filtro por Data
        if (dataVenda) {
            if (limiteInicio && dataVenda < limiteInicio) return;
            if (limiteFim && dataVenda > limiteFim) return;
        }

        // Se passou pelo filtro, processa os valores
        const valor = parseFloat(v.valor_total) || 0;
        faturamentoTotal += valor;
        totalPedidos++;

        // Processa String de itens
        let itensHTML = "Itens do caixa";
        if (v.itens && Array.isArray(v.itens)) {
            itensHTML = v.itens.map(item => `${item.produto_nome} (${item.quantidade} un)`).join(', ');
        }

        // Formata data
        let dataFormatada = "---";
        if (dataVenda && !isNaN(dataVenda.getTime())) {
            dataFormatada = dataVenda.toLocaleDateString('pt-BR') + ' ' + dataVenda.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        }

        // Relacionamento com tabela de Clientes
        let nomeCliente = "Consumidor Final";
        if (v.cliente_id) {
            const clienteEncontrado = todosClientes.find(c => String(c.id) === String(v.cliente_id));
            if (clienteEncontrado && clienteEncontrado.nome) {
                nomeCliente = clienteEncontrado.nome;
            }
        } else if (v.cliente) {
            nomeCliente = v.cliente;
        }

        // Monta a linha da tabela
        tabelaHTML += `
            <tr>
                <td class="fw-bold text-primary">#${v.id || idx+1}</td>
                <td><span class="fw-semibold text-dark">${nomeCliente}</span></td>
                <td><small class="text-muted text-wrap d-block" style="max-width: 450px;"><i class="bi bi-box-seam me-1"></i> ${itensHTML}</small></td>
                <td><small class="text-dark">${dataFormatada}</small></td>
                <td class="text-end fw-bold text-dark">R$ ${valor.toFixed(2)}</td>
            </tr>`;
    });

    // Cálculos de Resumo
    const ticketMedio = totalPedidos > 0 ? (faturamentoTotal / totalPedidos) : 0;

    // Atualiza os Cards na tela
    document.getElementById('rep-total-faturado').innerText = faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('rep-total-pedidos').innerText = totalPedidos;
    document.getElementById('rep-ticket-medio').innerText = ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Atualiza a tabela
    const corpoTabela = document.getElementById('tabela-relatorio-vendas');
    corpoTabela.innerHTML = tabelaHTML || '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma venda encontrada para o período selecionado.</td></tr>';
}

// Inicializa o script quando o HTML terminar de carregar
document.addEventListener("DOMContentLoaded", initRelatorio);