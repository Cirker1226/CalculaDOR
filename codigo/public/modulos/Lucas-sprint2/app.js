let produtosOriginais = [];

async function carregarDados() {
    try {
        const res = await fetch('http://localhost:3000/estoques');
        produtosOriginais = await res.json();
        renderizar(produtosOriginais);
    } catch (e) { console.error("Erro:", e); }
}

function renderizar(lista) {
    const tbody = document.getElementById('tabela-produtos');
    tbody.innerHTML = '';
    
    
    const produtosAnalise = lista.filter(p => (p.quantidade_movimentada_30d || 0) < 500);
    const totalValor = produtosAnalise.reduce((acc, p) => acc + (p.quantidade_atual * (p.preco_custo || 0)), 0);

    lista.forEach(p => {
        const dias = calcularDias(p.ultima_atualizacao);
        const valorParado = p.quantidade_atual * (p.preco_custo || 0);
        
        tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" class="check-item"></td>
                <td>${p.produto}</td>
                <td>${p.categoria}</td>
                <td>${getStatusMovimentacao(p.quantidade_movimentada_30d || 0)}</td>
                <td>${p.quantidade_movimentada_30d || 0}</td>
                <td>${p.ultima_atualizacao}</td>
                <td>${isNaN(dias) ? 0 : dias}</td>
                <td>R$ ${valorParado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    });

    document.getElementById('total-produtos').innerText = produtosAnalise.length;
    document.getElementById('total-valor').innerText = `R$ ${totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('capital-imobilizado').innerText = `R$ ${totalValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('ticket-medio').innerText = `R$ ${(produtosAnalise.length ? totalValor/produtosAnalise.length : 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}


function alternarTodos(master) {
    document.querySelectorAll('.check-item').forEach(cb => cb.checked = master.checked);
}

function acaoEmLote() {
    const selecionados = Array.from(document.querySelectorAll('.check-item:checked')).map(cb => cb.closest('tr').cells[1].innerText);
    if (!selecionados.length) return alert("Selecione itens na tabela!");
    abrirModal("Relatório de Selecionados", `Itens marcados:<br><ul><li>${selecionados.join('<li>')}</ul>`);
}


function getStatusMovimentacao(mov) {
    if (mov > 500) return '<span class="badge bg-success">Alto Giro</span>';
    if (mov < 10) return '<span class="badge bg-danger">Baixo Giro</span>';
    return '<span class="badge bg-warning text-dark">Médio Giro</span>';
}

function ordenarProdutos(tipo) {
    let lista = [...produtosOriginais];
    if (tipo === 'mais') lista.sort((a, b) => b.quantidade_movimentada_30d - a.quantidade_movimentada_30d);
    else lista.sort((a, b) => a.quantidade_movimentada_30d - b.quantidade_movimentada_30d);
    renderizar(lista);
}

function filtrarPorBusca(termo) {
    renderizar(produtosOriginais.filter(p => p.produto.toLowerCase().includes(termo.toLowerCase())));
}

function resetarFiltros() { renderizar(produtosOriginais); }

function calcularDias(data) {
    return Math.floor((new Date() - new Date(data)) / 86400000);
}


function abrirModal(titulo, html) {
    document.getElementById('tituloModal').innerText = titulo;
    document.getElementById('conteudoModal').innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalGestao')).show();
}

function sugerirCompras() {
    const sugestao = produtosOriginais.filter(p => p.quantidade_atual < 20);
    const html = sugestao.map(p => `<li>${p.produto}: <b>Comprar ${50 - p.quantidade_atual} un</b></li>`).join('');
    abrirModal("Sugestão de Reposição", `<ul class="list-unstyled">${html || 'Estoque equilibrado.'}</ul>`);
}

function gerarListaPromocao() {
    const promocao = produtosOriginais.filter(p => calcularDias(p.ultima_atualizacao) > 90);
    const html = promocao.map(p => `<li>${p.produto} - <b>Preço: R$ ${p.preco_venda.toFixed(2)}</b></li>`).join('');
    abrirModal("Sugestão de Liquidação", `<ul class="list-unstyled">${html || 'Nenhum item parado há mais de 90 dias.'}</ul>`);
}

carregarDados();