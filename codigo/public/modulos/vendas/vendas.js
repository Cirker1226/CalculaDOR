const apiClientes = '/clientes';
const apiProdutos = '/estoques';
const apiVendas = '/vendas';

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

    clientes.forEach((c, i) => {
        select.innerHTML += `<option value="${i}">${c.nome}</option>`;
    });

    select.onchange = () => {

        const cliente = clientes[select.value];

        document.getElementById('cpf').value = cliente?.cpf || '';
        document.getElementById('ultimaCompra').value = cliente?.ultimaCompra || '';
    };
}

function carregarProdutos(produtos) {

    const select = document.getElementById('produto');
    select.innerHTML = `<option value="" disabled selected>Selecione um produto</option>`;

    produtos.forEach((p, i) => {
        select.innerHTML += `<option value="${i}">${p.produto}</option>`;
    });

    select.onchange = () => {
        const produto = produtos[select.value];
        document.getElementById('preco').value = produto?.preco_venda || 0;
        calcularTotal();
    };
}

function calcularTotal() {

    const produtoIndex = document.getElementById('produto').value;
    const quantidade = Number(document.getElementById('quantidade').value);

    const produto = listaProdutos[produtoIndex];

    if (!produto || !quantidade) return;

    const total = produto.preco_venda * quantidade;

    document.getElementById('total').value = total.toFixed(2);
}

async function registrarVenda() {

    const clienteIndex = document.getElementById('cliente').value;
    const produtoIndex = document.getElementById('produto').value;

    const cliente = listaClientes[clienteIndex];
    const produto = listaProdutos[produtoIndex];

    if (!cliente || !produto) return;

    const dataCompra = document.getElementById('dataVenda').value || new Date().toLocaleDateString('pt-BR');

    const dados = {
        cliente: cliente.nome,
        produto: produto.produto,
        quantidade: document.getElementById('quantidade').value,
        total: document.getElementById('total').value,
        pagamento: document.getElementById('pagamento').value,
        status: document.getElementById('status').value,
        data: dataCompra
    };

    await fetch(apiVendas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    await fetch(`${apiClientes}/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ultimaCompra: dataCompra
        })
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

    vendaEditandoId = null;
}

async function carregarVendas() {

    const tabela = document.getElementById('table-vendas');
    tabela.innerHTML = '';

    const res = await fetch(apiVendas);
    const vendas = await res.json();

    document.getElementById('total-vendas').innerText = vendas.length;

    vendas.forEach(v => {

        const tr = document.createElement('tr');
        tr.dataset.id = v.id;

        tr.innerHTML = `
            <td>${v.id || ''}</td>
            <td>${v.cliente}</td>
            <td>${v.produto}</td>
            <td>${v.quantidade}</td>
            <td>${v.total}</td>
            <td>${v.pagamento}</td>
            <td>${v.status}</td>
            <td>${v.data}</td>
        `;

        tr.addEventListener('click', () => selecionarLinha(tr));

        tabela.appendChild(tr);
    });
}

function selecionarLinha(linha) {

    document.querySelectorAll('#table-vendas tr')
        .forEach(tr => tr.classList.remove('table-active'));

    linha.classList.add('table-active');

    const colunas = linha.querySelectorAll('td');

    vendaEditandoId = linha.dataset.id;

    const clienteNome = colunas[1].textContent;
    const produtoNome = colunas[2].textContent;

    const cliente = listaClientes.find(c => c.nome === clienteNome);
    const produto = listaProdutos.find(p => p.produto === produtoNome);

    const clienteIndex = listaClientes.findIndex(c => c.nome === clienteNome);
    const produtoIndex = listaProdutos.findIndex(p => p.produto === produtoNome);

    document.getElementById('cliente').value = clienteIndex;
    document.getElementById('cpf').value = cliente?.cpf || '';
    document.getElementById('ultimaCompra').value = cliente?.ultimaCompra || '';

    document.getElementById('produto').value = produtoIndex;
    document.getElementById('preco').value = produto?.preco_venda || 0;

    document.getElementById('quantidade').value = colunas[3].textContent;
    document.getElementById('total').value = colunas[4].textContent;
    document.getElementById('pagamento').value = colunas[5].textContent;
    document.getElementById('status').value = colunas[6].textContent;
    document.getElementById('dataVenda').value = colunas[7].textContent;

    calcularTotal();
}

async function salvarEdicaoVenda() {

    if (!vendaEditandoId) return;

    const clienteIndex = document.getElementById('cliente').value;
    const produtoIndex = document.getElementById('produto').value;

    const cliente = listaClientes[clienteIndex];
    const produto = listaProdutos[produtoIndex];

    if (!cliente || !produto) return;

    const dadosAtualizados = {
        cliente: cliente.nome,
        produto: produto.produto,
        quantidade: document.getElementById('quantidade').value,
        total: document.getElementById('total').value,
        pagamento: document.getElementById('pagamento').value,
        status: document.getElementById('status').value,
        data: document.getElementById('dataVenda').value
    };

    const res = await fetch(`${apiVendas}/${vendaEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
    });

    if (res.ok) {
        vendaEditandoId = null;
        limparCampos();
        carregarVendas();
    }
}

function excluirVenda() {

    const linhaSelecionada = document.querySelector('#table-vendas tr.table-active');
    if (!linhaSelecionada) return;

    const id = linhaSelecionada.dataset.id;

    fetch(`${apiVendas}/${id}`, {
        method: 'DELETE'
    });

    carregarVendas();
}

carregarDados();
carregarVendas();