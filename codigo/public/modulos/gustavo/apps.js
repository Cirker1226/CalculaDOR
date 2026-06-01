const resposta = await fetch('http://localhost:3000/despesas');

 async function displayMessage(mensagem) {
    const msgEl = document.getElementById('msg');
    if (msgEl) {
        msgEl.innerHTML = `<div class="alert alert-warning">${mensagem}</div>`;
    }
}

function readDespesa(processaDados) {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => processaDados(data))
        .catch(error => {
            console.error('Erro ao ler as despesas:', error);
            displayMessage("Erro ao ler despesas");
        });
}

function createDespesa(despesa, refreshFunction) {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa), 
    })
    .then(response => response.json())
    .then(() => {
        displayMessage("Despesa criada com sucesso");
        if (refreshFunction) refreshFunction();
    })
    .catch(error => {
        console.error('Erro ao criar despesa:', error);
        displayMessage("Erro ao criar despesa");
    });
}
function updateDespesa(id, despesa, refreshFunction) {
    
    fetch(`${apiUrl}/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa), 
    })
    .then(response => response.json())
    .then(() => {
        displayMessage("Despesa alterada com sucesso");
        if (refreshFunction) refreshFunction();
    })
    .catch(error => {
        console.error('Erro ao atualizar despesa:', error);
        displayMessage("Erro ao atualizar despesa");
    });
}

function deleteDespesa(id, refreshFunction) {
    fetch(`${apiUrl}/${id}`, { 
        method: 'DELETE' 
    })
    .then(response => response.json())
    .then(() => {
        displayMessage("Despesa removida com sucesso");
        if (refreshFunction) refreshFunction();
    })
    .catch(error => {
        console.error('Erro ao remover despesa:', error);
        displayMessage("Erro ao remover despesa");
    });
}