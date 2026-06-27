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

let todasVendas = [];
let todosClientes = [];

function initRelatorio() {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    document.getElementById('data-inicio').value = primeiroDiaMes.toISOString().substring(0, 10);
    document.getElementById('data-fim').value = hoje.toISOString().substring(0, 10);

    document.getElementById('form-filtros').addEventListener('submit', function(e) {
        e.preventDefault();
        renderizarDados();
    });

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

    const limiteInicio = dataInicioStr ? new Date(dataInicioStr + 'T00:00:00') : null;
    const limiteFim = dataFimStr ? new Date(dataFimStr + 'T23:59:59') : null;

    let faturamentoTotal = 0;
    let totalPedidos = 0;
    let tabelaHTML = "";

    const vendasOrdenadas = [...todasVendas].reverse();

    vendasOrdenadas.forEach((v, idx) => {
        const dataVenda = v.data_hora ? new Date(v.data_hora) : null;

        if (dataVenda) {
            if (limiteInicio && dataVenda < limiteInicio) return;
            if (limiteFim && dataVenda > limiteFim) return;
        }

        const valor = parseFloat(v.valor_total) || 0;
        faturamentoTotal += valor;
        totalPedidos++;

        let itensHTML = "Itens do caixa";
        if (v.itens && Array.isArray(v.itens)) {
            itensHTML = v.itens.map(item => `${item.produto_nome} (${item.quantidade} un)`).join(', ');
        }

        let dataFormatada = "---";
        if (dataVenda && !isNaN(dataVenda.getTime())) {
            dataFormatada = dataVenda.toLocaleDateString('pt-BR') + ' ' + dataVenda.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        }

        let nomeCliente = "Consumidor Final";
        if (v.cliente_id) {
            const clienteEncontrado = todosClientes.find(c => String(c.id) === String(v.cliente_id));
            if (clienteEncontrado && clienteEncontrado.nome) {
                nomeCliente = clienteEncontrado.nome;
            }
        } else if (v.cliente) {
            nomeCliente = v.cliente;
        }

        tabelaHTML += `
            <tr>
                <td class="fw-bold text-dark">#${v.id || idx+1}</td>
                <td><span class="fw-semibold text-dark">${nomeCliente}</span></td>
                <td><span class="text-muted small text-wrap d-block" style="max-width: 450px;"><i class="bi bi-box-seam me-1"></i> ${itensHTML}</span></td>
                <td><span class="text-secondary small">${dataFormatada}</span></td>
                <td class="text-end fw-bold text-dark">R$ ${valor.toFixed(2).replace('.', ',')}</td>
            </tr>`;
    });

    const ticketMedio = totalPedidos > 0 ? (faturamentoTotal / totalPedidos) : 0;

    document.getElementById('rep-total-faturado').innerText = faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('rep-total-pedidos').innerText = totalPedidos;
    document.getElementById('rep-ticket-medio').innerText = ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const corpoTabela = document.getElementById('tabela-relatorio-vendas');
    corpoTabela.innerHTML = tabelaHTML || '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma venda encontrada para o período selecionado.</td></tr>';
}

document.addEventListener("DOMContentLoaded", initRelatorio);