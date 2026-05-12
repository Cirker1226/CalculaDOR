const GITHUB_USER = 'Lucasasth3';
const REPO_NAME = 'projeto-sprint-1';
const apiUrl = `https://my-json-server.typicode.com/${GITHUB_USER}/${REPO_NAME}/contatos`;

function displayMessage(mensagem) {
    let msg = document.getElementById('msg');
    msg.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function readContato(processaDados) {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => processaDados(data))
        .catch(error => displayMessage("Erro ao ler dados do servidor. Verifique o JSON Server."));
}

function createContato(contato, refreshFunction) {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contato),
    })
    .then(response => response.json())
    .then(() => {
        displayMessage("Inserido com sucesso!");
        if (refreshFunction) refreshFunction();
    });
}

function updateContato(id, contato, refreshFunction) {
    fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contato),
    })
    .then(() => {
        displayMessage("Alterado com sucesso!");
        if (refreshFunction) refreshFunction();
    });
}

function deleteContato(id, refreshFunction) {
    fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
    .then(() => {
        displayMessage("Removido com sucesso!");
        if (refreshFunction) refreshFunction();
    });
}
