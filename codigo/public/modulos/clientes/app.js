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
}

function limparInputs() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach(input => input.value = "");
}