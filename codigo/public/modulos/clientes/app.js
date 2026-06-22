const apiUrl = '/clientes';

function cadastrarCliente() {

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    const tag = document.getElementById('tag').value;

    const dados = {
        nome, cpf, telefone, email, endereco, tag
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    })

    limparInputs()
    carregarTabela()
}

function limparInputs() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach(input => input.value = "");
}

async function carregarTabela() {
    const tabelaClientes = document.getElementById('table-clientes');
    tabelaClientes.innerHTML = "";

    const respostaClientes = await fetch(apiUrl);
    const clientes = await respostaClientes.json();

    document.getElementById('total-clientes').innerText = clientes.length;

    clientes.forEach(cliente => {
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
}

function selecionarLinha(linha) {
    document.querySelectorAll('#table-clientes tr')
        .forEach(tr => tr.classList.remove('table-active'));
    linha.classList.add('table-active');
}

function excluirCliente() {
    const linhaSelecionada = document.querySelector('#table-clientes tr.table-active');

    const id = linhaSelecionada.dataset.id;

    fetch(`${apiUrl}/${id}`, {
        method: 'DELETE'
    })

    carregarTabela()
}

carregarTabela()