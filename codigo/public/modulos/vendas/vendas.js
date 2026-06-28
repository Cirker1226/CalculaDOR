const apiClientes = '/clientes';
const apiProdutos = '/estoques';
const apiVendas = '/vendas_pdvs';

let listaClientes = [];
let listaProdutos = [];
let vendaEditandoId = null;

async function carregarDados() {
    const resClientes = await fetch(apiClientes);
    listaClientes = await resClientes.json();

    const resProdutos = await fetch(apiProdutos);
    listaProdutos = await resProdutos.json();

    carregarClientes(listaClientes);
    carregarProdutos(listaProdutos);
}

function carregarClientes(clientes) {
    const select = document.getElementById('cliente');
    select.innerHTML = `<option value="" disabled selected>Selecione um cliente</option>`;

    clientes.forEach((c) => {
        select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });

    select.onchange = () => {
        const cliente = clientes.find(c => String(c.id) === String(select.value));
        document.getElementById('cpf').value = cliente?.cpf || '';
        document.getElementById('ultimaCompra').value = cliente?.ultimaCompra || '';
    };
}

function carregarProdutos(produtos) {
    const select = document.getElementById('produto');
    select.innerHTML = `<option value="" disabled selected>Selecione um produto</option>`;

    produtos.forEach((p) => {
        select.innerHTML += `<option value="${p.id}">${p.produto}</option>`;
    });

    select.onchange = () => {
        const produto = produtos.find(p => String(p.id) === String(select.value));
        document.getElementById('preco').value = produto?.preco_venda || 0;
        calcularTotal();
    };
}

function calcularTotal() {
    const produtoId = document.getElementById('produto').value;
    const quantidade = Number(document.getElementById('quantidade').value);
    const produto = listaProdutos.find(p => String(p.id) === String(produtoId));

    if (!produto || !quantidade) return;

    const total = produto.preco_venda * quantidade;
    document.getElementById('total').value = total.toFixed(2);
}

async function registrarVenda() {
    const clienteId = document.getElementById('cliente').value;
    const produtoId = document.getElementById('produto').value;

    const cliente = listaClientes.find(c => String(c.id) === String(clienteId));
    const produto = listaProdutos.find(p => String(p.id) === String(produtoId));

    if (!cliente || !produto) return;

    const quantidade = Number(document.getElementById('quantidade').value);
    const precoUnitario = produto.preco_venda;
    const subtotal = precoUnitario * quantidade;
    const dataVenda = document.getElementById('dataVenda').value;

    const dataHora = dataVenda ? new Date(dataVenda).toISOString() : new Date().toISOString();
    const dataResuimida = dataVenda
        ? new Date(dataVenda + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const dados = {
        data_hora: dataHora,
        data_resumida: dataResuimida,
        cliente_id: cliente.id,
        vendedor: document.getElementById('nome-usuario')?.innerText || 'Vendedor',
        itens: [
            {
                produto_id: produto.id,
                produto_nome: produto.produto,
                quantidade: quantidade,
                preco_unitario: precoUnitario,
                subtotal: subtotal
            }
        ],
        valor_total: subtotal,
        metodo_pagamento: document.getElementById('pagamento').value,
        status: document.getElementById('status').value,
        observacoes: document.getElementById('observacoes').value
    };

    await fetch(apiVendas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    await fetch(`${apiClientes}/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ultimaCompra: dataResuimida })
    });

    limparCampos();
    carregarVendas();
}

function limparCampos() {
    document.getElementById('quantidade').value = 1;
    document.getElementById('total').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('ultimaCompra').value = '';
    document.getElementById('cliente').value = '';
    document.getElementById('produto').value = '';
    document.getElementById('preco').value = '';
    document.getElementById('dataVenda').value = '';
    document.getElementById('observacoes').value = '';
    document.getElementById('codigoVenda').value = '';
    vendaEditandoId = null;
}

async function carregarVendas() {
    const tabela = document.getElementById('table-vendas');
    tabela.innerHTML = '';

    const res = await fetch(apiVendas);
    const vendas = (await res.json()) || [];

    document.getElementById('total-vendas').innerText = vendas.length;

    const hoje = new Date().toDateString();
    const vendasHoje = vendas.filter(v => new Date(v.data_hora).toDateString() === hoje);
    document.getElementById('vendas-hoje').innerText = vendasHoje.length;

    // Card: faturamento do mês
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const faturamento = vendas
        .filter(v => {
            const d = new Date(v.data_hora);
            return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        })
        .reduce((acc, v) => acc + Number(v.valor_total), 0);

    document.getElementById('faturamento').innerText =
        faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    vendas.forEach(v => {
        const cliente = listaClientes.find(c => String(c.id) === String(v.cliente_id));
        const nomeCliente = cliente?.nome || `Cliente #${v.cliente_id}`;

        const resumoItens = v.itens?.map(i => `${i.produto_nome} (${i.quantidade}x)`).join(', ') || '-';
        const qtdTotal = v.itens?.reduce((acc, i) => acc + i.quantidade, 0) || 0;

        const dataFormatada = v.data_resumida || new Date(v.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const tr = document.createElement('tr');
        tr.dataset.id = v.id;

        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${nomeCliente}</td>
            <td title="${resumoItens}">${resumoItens.length > 40 ? resumoItens.slice(0, 40) + '…' : resumoItens}</td>
            <td>${qtdTotal}</td>
            <td>R$ ${Number(v.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${v.metodo_pagamento}</td>
            <td>${v.status}</td>
            <td>${dataFormatada}</td>
        `;

        tr.addEventListener('click', () => selecionarLinha(tr, v));
        tabela.appendChild(tr);
    });
}

function selecionarLinha(linha, venda) {
    document.querySelectorAll('#table-vendas tr').forEach(tr => tr.classList.remove('table-active'));
    linha.classList.add('table-active');

    vendaEditandoId = venda.id;

    const cliente = listaClientes.find(c => String(c.id) === String(venda.cliente_id));
    document.getElementById('cliente').value = cliente?.id || '';
    document.getElementById('cpf').value = cliente?.cpf || '';
    document.getElementById('ultimaCompra').value = cliente?.ultimaCompra || '';

    // Carrega o primeiro item no formulário
    const primeiroItem = venda.itens?.[0];
    if (primeiroItem) {
        const produto = listaProdutos.find(p => String(p.id) === String(primeiroItem.produto_id));
        document.getElementById('produto').value = produto?.id || '';
        document.getElementById('preco').value = primeiroItem.preco_unitario;
        document.getElementById('quantidade').value = primeiroItem.quantidade;
        document.getElementById('total').value = Number(venda.valor_total).toFixed(2);
    }

    document.getElementById('pagamento').value = venda.metodo_pagamento;
    document.getElementById('status').value = venda.status;
    document.getElementById('codigoVenda').value = venda.id;
    document.getElementById('observacoes').value = venda.observacoes || '';

    if (venda.data_hora) {
        const d = new Date(venda.data_hora);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        document.getElementById('dataVenda').value = `${yyyy}-${mm}-${dd}`;
    }
}

async function salvarEdicaoVenda() {
    if (!vendaEditandoId) return;

    const clienteId = document.getElementById('cliente').value;
    const produtoId = document.getElementById('produto').value;

    const cliente = listaClientes.find(c => String(c.id) === String(clienteId));
    const produto = listaProdutos.find(p => String(p.id) === String(produtoId));

    if (!cliente || !produto) return;

    const quantidade = Number(document.getElementById('quantidade').value);
    const precoUnitario = produto.preco_venda;
    const subtotal = precoUnitario * quantidade;
    const dataVenda = document.getElementById('dataVenda').value;

    const dataHora = dataVenda ? new Date(dataVenda).toISOString() : new Date().toISOString();
    const dataResuimida = dataVenda
        ? new Date(dataVenda + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : '';

    const dadosAtualizados = {
        data_hora: dataHora,
        data_resumida: dataResuimida,
        cliente_id: cliente.id,
        vendedor: document.getElementById('nome-usuario')?.innerText || 'Vendedor',
        itens: [
            {
                produto_id: produto.id,
                produto_nome: produto.produto,
                quantidade: quantidade,
                preco_unitario: precoUnitario,
                subtotal: subtotal
            }
        ],
        valor_total: subtotal,
        metodo_pagamento: document.getElementById('pagamento').value,
        status: document.getElementById('status').value,
        observacoes: document.getElementById('observacoes').value
    };

    const res = await fetch(`${apiVendas}/${vendaEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
    });

    if (res.ok) {
        limparCampos();
        carregarVendas();
    }
}

async function excluirVenda() {
    const linhaSelecionada = document.querySelector('#table-vendas tr.table-active');
    if (!linhaSelecionada) return;

    const id = linhaSelecionada.dataset.id;

    await fetch(`${apiVendas}/${id}`, { method: 'DELETE' });
    carregarVendas();
}

carregarDados();
carregarVendas();