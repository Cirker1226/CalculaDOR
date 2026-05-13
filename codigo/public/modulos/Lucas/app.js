const apiUrl = 'http://localhost:3000/contatos';

// Exibe alertas de feedback para o usuário
function displayMessage(mensagem) {
    let msg = document.getElementById('msg');
    msg.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    // Autoclose após 3 segundos
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
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

// Renderiza a tabela e atualiza os cards do dashboard (image_7ee683.png)
function exibeContatos() {
    let table = document.getElementById("table-contatos");
    let busca = document.getElementById("filtroBusca").value.toLowerCase();

    readContato(dados => {
        table.innerHTML = "";
        let sPagar = 0, sPago = 0, sVencido = 0;

        dados.forEach(c => {
            const v = parseFloat(c.valor) || 0;
            
            // Lógica de acumuladores para os cards coloridos
            if (c.categoria === 'Pago') sPago += v;
            else if (c.categoria === 'Vencido') sVencido += v;
            else sPagar += v;

            // Filtro de busca por nome de fornecedor
            if (c.nome.toLowerCase().includes(busca)) {
                let corBadge = c.categoria === 'Pago' ? 'bg-success' : (c.categoria === 'Vencido' ? 'bg-danger' : 'bg-warning text-dark');
                
                table.innerHTML += `
                    <tr>
                        <td class="ps-4 text-muted small">${c.id.substring(0, 5)}...</td>
                        <td class="fw-bold text-primary" onclick="preencherForm('${c.id}')" style="cursor:pointer">
                            <i class="bi bi-pencil-square me-2"></i>${c.nome}
                        </td>
                        <td>${new Date(c.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                        <td class="fw-bold text-dark">${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td><span class="badge ${corBadge}">${c.categoria}</span></td>
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

// Interação com o "bonequinho" - Abre o Modal de detalhes
function abrirDetalhes(id) {
    fetch(`${apiUrl}/${id}`).then(res => res.json()).then(c => {
        document.getElementById('modalNome').innerText = c.nome;
        
        // Verifica se existe um link e cria a tag HTML, caso contrário exibe aviso
        const linkHTML = c.website 
            ? `<a href="${c.website}" target="_blank" class="text-break">${c.website}</a>` 
            : '<span class="text-muted">Não informado</span>';

        document.getElementById('modalDetalhes').innerHTML = `
            <div class="py-2">
                <p class="text-muted mb-1">Status: <span class="badge ${c.categoria === 'Pago' ? 'bg-success' : 'bg-danger'}">${c.categoria}</span></p>
                <h2 class="mb-3 fw-bold text-primary">${(parseFloat(c.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                <hr>
                <p class="mb-1"><strong>Vencimento:</strong> ${new Date(c.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                <p class="mb-1"><strong>Link pagina com fornecedor:</strong></p>
                <div class="mb-3">${linkHTML}</div>
            </div>
        `;

        // Lógica do botão WhatsApp (mantém a que já tínhamos)
        const btnZap = document.getElementById('btnZap');
        if (c.telefone) {
            const telLimpo = c.telefone.replace(/\D/g, '');
            btnZap.href = `https://wa.me/55${telLimpo}?text=Olá ${c.nome}...`;
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
        document.getElementById('inputNome').value = c.nome;
        document.getElementById('inputTelefone').value = c.telefone || '';
        document.getElementById('inputValor').value = c.valor;
        document.getElementById('inputVencimento').value = c.vencimento;
        document.getElementById('inputCategoria').value = c.categoria;
        document.getElementById('inputLink').value = c.website || '';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        displayMessage("Registro carregado para edição.");
    });
}

// Função de Inicialização (Chamada pelo onload do Body no index.html)
function init() {
    modalSuporte = new bootstrap.Modal(document.getElementById('modalContato'));
    
    // Evento de busca em tempo real (KeyUp/Input)
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