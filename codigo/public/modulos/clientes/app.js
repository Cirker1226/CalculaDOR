const apiUrl = '/clientes';

let clienteEditandoId = null;

function cadastrarCliente() {
    if (clienteEditandoId) {
        alert("Você está editando um cliente. Use o botão ALTERAR para salvar as mudanças.");
        return;
    }

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    const tag = document.getElementById('tag').value;
    const ultimaCompra = new Date().toLocaleDateString('pt-BR');

    const dados = { nome, cpf, telefone, email, endereco, tag, ultimaCompra };

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    }).then(() => {
        limparInputs();
        carregarTabela();
    });
}

function limparInputs() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach(input => input.value = "");
    clienteEditandoId = null;
}

async function carregarTabela() {
    const tabelaClientes = document.getElementById('table-clientes');
    tabelaClientes.innerHTML = "";

    const resposta = await fetch(apiUrl);
    const clientes = await resposta.json();

    let ativos = 0;
    let inativos = 0;

    clientes.forEach(cliente => {
        // Verifica se a tag existe e se contém a palavra "inativo"
        const tag = cliente.tag ? cliente.tag.toLowerCase() : "";
        if (tag.includes("inativo")) {
            inativos++;
        } else {
            ativos++;
        }

        tabelaClientes.innerHTML += `
            <tr data-id="${cliente.id}" onclick="selecionarLinha(this)">
                <td>${cliente.id}</td>
                <td>${cliente.nome}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.email}</td>
                <td>${cliente.endereco}</td>
                <td>${cliente.tag}</td>
            </tr>`;
    });

    // Atualiza os cartões do dashboard
    document.getElementById('total-clientes').innerText = clientes.length;
    document.getElementById('total-ativos').innerText = ativos;
    document.getElementById('total-inativos').innerText = inativos;
}

function selecionarLinha(linha) {
    document.querySelectorAll('#table-clientes tr')
        .forEach(tr => tr.classList.remove('table-active'));

    linha.classList.add('table-active');

    const colunas = linha.querySelectorAll('td');

    document.getElementById('nome').value = colunas[1].textContent;
    document.getElementById('cpf').value = colunas[2].textContent;
    document.getElementById('telefone').value = colunas[3].textContent;
    document.getElementById('email').value = colunas[4].textContent;
    document.getElementById('endereco').value = colunas[5].textContent;
    document.getElementById('tag').value = colunas[6].textContent;

    clienteEditandoId = linha.dataset.id;
}

function excluirCliente() {
    const linhaSelecionada = document.querySelector('#table-clientes tr.table-active');

    if (!linhaSelecionada) {
        alert("Selecione um cliente para excluir.");
        return;
    }

    const id = linhaSelecionada.dataset.id;

    fetch(`${apiUrl}/${id}`, {
        method: 'DELETE'
    }).then(() => {
        limparInputs();
        carregarTabela();
    });
}

/* BOTÃO ALTERAR (btnUpdate) */
document.getElementById("btnUpdate").addEventListener("click", salvarEdicaoCliente);

function salvarEdicaoCliente() {
    if (!clienteEditandoId) {
        alert("Selecione um cliente para alterar.");
        return;
    }

    const dados = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        endereco: document.getElementById('endereco').value,
        tag: document.getElementById('tag').value,
        ultimaCompra: new Date().toLocaleDateString('pt-BR')
    };

    fetch(`${apiUrl}/${clienteEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    }).then(res => {
        if (res.ok) {
            clienteEditandoId = null;
            limparInputs();
            carregarTabela();
        }
    });
}

carregarTabela();