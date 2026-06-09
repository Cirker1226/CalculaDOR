const apiUrl = '/despesas';

function displayMessage(mensagem) {
    const msgEl = document.getElementById('msg');
    if (msgEl) {
        msgEl.innerHTML = `<div class="alert alert-warning">${mensagem}</div>`;
    }
}

async function readDespesa(processaDados) {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    processaDados(data);
}

async function createDespesa(despesa, refreshFunction) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa), 
    });
    await response.json();
    
    displayMessage("Despesa criada com sucesso");
    if (refreshFunction) refreshFunction();
}

async function updateDespesa(id, despesa, refreshFunction) {
    const response = await fetch(`${apiUrl}/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa), 
    });
    await response.json();
    
    displayMessage("Despesa alterada com sucesso");
    if (refreshFunction) refreshFunction();
}

async function deleteDespesa(id, refreshFunction) {
    const response = await fetch(`${apiUrl}/${id}`, { 
        method: 'DELETE' 
    });
    await response.json();
    
    displayMessage("Despesa removida com sucesso");
    if (refreshFunction) refreshFunction();
}