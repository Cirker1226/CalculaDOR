const apiUrl = '/contatos';

// Exibe alertas para o usuário
function displayMessage(mensagem) {
    let msg = document.getElementById('msg');
    msg.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;

    setTimeout(() => {
        msg.innerHTML = '';
    }, 3000);
}

// LÊ dados do servidor
function readContato(processaDados) {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => processaDados(data))
        .catch(error => {
            console.error(error);
            displayMessage("Erro ao ler dados do servidor. Verifique o JSON Server.");
        });
}

// CRIA novo contato
function createContato(contato, refreshFunction) {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contato),
    })
    .then(response => response.json())
    .then(() => {
        displayMessage("Registro inserido com sucesso!");
        if (refreshFunction) refreshFunction();
    })
    .catch(error => {
        console.error(error);
        displayMessage("Erro ao salvar o registro no servidor.");
    });
}

// ATUALIZA contato existente
function updateContato(id, contato, refreshFunction) {
    fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contato),
    })
    .then(() => {
        displayMessage("Registro alterado com sucesso!");
        if (refreshFunction) refreshFunction();
    })
    .catch(error => {
        console.error(error);
        displayMessage("Erro ao atualizar o registro.");
    });
}

// DELETA contato
function deleteContato(id, refreshFunction) {
    fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
    .then(() => {
        displayMessage("Registro removido com sucesso!");
        if (refreshFunction) refreshFunction();
    });
}

let modalSuporte;

// Renderiza a tabela e atualiza os cards do dashboard
function exibeContatos() {
    let table = document.getElementById("table-contatos");
    let busca = document.getElementById("filtroBusca").value.toLowerCase();

    readContato(dados => {
        table.innerHTML = "";
        let sPagar = 0, sPago = 0, sVencido = 0;

        dados.forEach(c => {
            const v = parseFloat(c.valor) || 0;
            
            // Lógica de acumuladores corrigida para bater com o Select do HTML
            if (c.categoria === 'Pago') {
                sPago += v;
            } else if (c.categoria === 'Vencido') {
                sVencido += v;
            } else {
                sPagar += v; // Tudo que for "A Pagar" cai aqui
            }

            // Garante que o nome existe antes de fazer o filtro de busca
            const nomeContato = c.nome ? c.nome : (c.name ? c.name : "Sem Nome");

            if (nomeContato.toLowerCase().includes(busca)) {
                let corBadge = c.categoria === 'Pago' ? 'bg-success' : (c.categoria === 'Vencido' ? 'bg-danger' : 'bg-warning text-dark');
                
                // Converte ID para string seguro para evitar erros de substring
                let idString = c.id ? c.id.toString() : "";
                let idExibicao = idString.length > 5 ? idString.substring(0, 5) + "..." : idString;

                table.innerHTML += `
                    <tr>
                        <td class="ps-4 text-muted small">${idExibicao}</td>
                        <td class="fw-bold text-primary" onclick="preencherForm('${c.id}')" style="cursor:pointer">
                            <i class="bi bi-pencil-square me-2"></i>${nomeContato}
                        </td>
                        <td>${c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                        <td class="fw-bold text-dark">${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td><span class="badge ${corBadge}">${c.categoria || 'A Pagar'}</span></td>
                        <td class="pe-4 text-center">
                            <button type="button" class="btn btn-sm btn-outline-secondary border-0" onclick="abrirDetalhes('${c.id}')">
                                <i class="bi bi-person-lines-fill fs-5"></i>
                            </button>
                        </td>
                    </tr>`;
            }
        });

        // Atualiza os valores nos cards do Dashboard
        document.getElementById('total-apagar').innerText = sPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('total-pago').innerText = sPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('total-vencidos').innerText = sVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });
}

// Abre o Modal de detalhes
function abrirDetalhes(id) {
    fetch(`${apiUrl}/${id}`).then(res => res.json()).then(c => {
        const nomeContato = c.nome ? c.nome : (c.name ? c.name : "Sem Nome");
        document.getElementById('modalNome').innerText = nomeContato;
        
        const linkHTML = c.website 
            ? `<a href="${c.website}" target="_blank" class="text-break">${c.website}</a>` 
            : '<span class="text-muted">Não informado</span>';

        let corBadge = c.categoria === 'Pago' ? 'bg-success' : (c.categoria === 'Vencido' ? 'bg-danger' : 'bg-warning text-dark');

        document.getElementById('modalDetalhes').innerHTML = `
            <div class="py-2">
                <p class="text-muted mb-1">Status: <span class="badge ${corBadge}">${c.categoria || 'A Pagar'}</span></p>
                <h2 class="mb-3 fw-bold text-primary">${(parseFloat(c.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                <hr>
                <p class="mb-1"><strong>Vencimento:</strong> ${c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</p>
                <p class="mb-1"><strong>Link pagina com fornecedor:</strong></p>
                <div class="mb-3">${linkHTML}</div>
            </div>
        `;

        const btnZap = document.getElementById('btnZap');
        if (c.telefone) {
            const telLimpo = c.telefone.replace(/\D/g, '');
            btnZap.href = `https://wa.me/55${telLimpo}?text=Olá ${nomeContato}...`;
            btnZap.style.display = 'inline-block';
        } else {
            btnZap.style.display = 'none';
        }

        modalSuporte.show();
    });
}

// Carrega os dados da tabela para o formulário superior
function preencherForm(id) {
    fetch(`${apiUrl}/${id}`).then(res => res.json()).then(c => {
        document.getElementById('inputId').value = c.id;
        document.getElementById('inputNome').value = c.nome || c.name || '';
        document.getElementById('inputTelefone').value = c.telefone || '';
        document.getElementById('inputValor').value = c.valor;
        document.getElementById('inputVencimento').value = c.vencimento || '';
        document.getElementById('inputCategoria').value = c.categoria || 'A Pagar';
        document.getElementById('inputLink').value = c.website || '';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        displayMessage("Registro carregado para edição.");
    });
}

// Função de Inicialização
function init() {
    modalSuporte = new bootstrap.Modal(document.getElementById('modalContato'));
    
    // Evento de busca em tempo real
    document.getElementById("filtroBusca").oninput = exibeContatos;

    // Ação: Botão SALVAR
    document.getElementById("btnInsert").onclick = () => {
        const c = {
            nome: document.getElementById('inputNome').value,
            telefone: document.getElementById('inputTelefone').value,
            valor: document.getElementById('inputValor').value,
            vencimento: document.getElementById('inputVencimento').value,
            categoria: document.getElementById('inputCategoria').value,
            website: document.getElementById('inputLink').value
        };
        
        if(c.nome && c.valor) {
            createContato(c, () => {
                exibeContatos();
                document.getElementById("form-contato").reset();
            });
        } else {
            alert("Preencha Fornecedor e Valor.");
        }
    };

    // Ação: Botão ALTERAR
    document.getElementById("btnUpdate").onclick = () => {
        let id = document.getElementById("inputId").value;
        if(!id) return alert("Selecione um registro na tabela clicando no nome.");
        
        const c = {
            nome: document.getElementById('inputNome').value,
            telefone: document.getElementById('inputTelefone').value,
            valor: document.getElementById('inputValor').value,
            vencimento: document.getElementById('inputVencimento').value,
            categoria: document.getElementById('inputCategoria').value,
            website: document.getElementById('inputLink').value
        };
        
        updateContato(id, c, () => {
            exibeContatos();
            document.getElementById("form-contato").reset();
            document.getElementById("inputId").value = "";
        });
    };

    // Ação: Botão EXCLUIR
    document.getElementById("btnDelete").onclick = () => {
        let id = document.getElementById("inputId").value;
        if(id && confirm("Deseja realmente apagar este registro?")) {
            deleteContato(id, () => {
                exibeContatos();
                document.getElementById("form-contato").reset();
                document.getElementById("inputId").value = "";
            });
        } else if (!id) {
            alert("Selecione um registro na tabela primeiro.");
        }
    };

    // Ação: Botão LIMPAR
    document.getElementById("btnClear").onclick = () => {
        document.getElementById("form-contato").reset();
        document.getElementById("inputId").value = "";
    };

    exibeContatos();
}