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

// --- FUNÇÃO AUXILIAR PARA EVITAR DUPLICADOS ---
function normalizarTexto(texto) {
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9 ]/g, "");     
}

function verificarDuplicado(nome, idIgnorar = null, callback) {
    const nomeNovoNormalizado = normalizarTexto(nome);
    
    readContato(dados => {
        const duplicado = dados.find(c => {
            const nomeExistente = c.nome || c.name || "";
            const nomeExistenteNormalizado = normalizarTexto(nomeExistente);
            
            if (idIgnorar && c.id.toString() === idIgnorar.toString()) {
                return false;
            }
            return nomeExistenteNormalizado === nomeNovoNormalizado;
        });
        
        callback(duplicado);
    });
}

// --- REDIRECIONAMENTO PARA OS PRODUTOS DA EMPRESA ---
function irParaProdutos(nomeFornecedor) {
    window.location.href = `../Lucas-sprint2/index.html?fornecedor=${encodeURIComponent(nomeFornecedor.trim())}`;
}

// Renderiza a tabela e atualiza os cards do dashboard
function exibeContatos() {
    let table = document.getElementById("table-contatos");
    let busca = document.getElementById("filtroBusca").value.toLowerCase();

    readContato(dados => {
        table.innerHTML = "";
        let sPagar = 0, sPago = 0, sVencido = 0;

        dados.forEach(c => {
            const v = parseFloat(c.valor) || 0;
            
            if (c.categoria === 'Pago') {
                sPago += v;
            } else if (c.categoria === 'Vencido') {
                sVencido += v;
            } else {
                sPagar += v;
            }

            const nomeContato = c.nome ? c.nome : (c.name ? c.name : "Sem Nome");

            if (nomeContato.toLowerCase().includes(busca)) {
                let corBadge = c.categoria === 'Pago' ? 'bg-success' : (c.categoria === 'Vencido' ? 'bg-danger' : 'bg-warning text-dark');
                
                let idString = c.id ? c.id.toString() : "";
                let idExibicao = idString.length > 5 ? idString.substring(0, 5) + "..." : idString;

                table.innerHTML += `
                    <tr>
                        <td class="ps-4 text-muted small" onclick="preencherForm('${c.id}')" style="cursor:pointer">${idExibicao}</td>
                        <td class="fw-bold text-primary" onclick="abrirDetalhes('${c.id}')" style="cursor:pointer">
                            <i class="bi bi-search me-2 small"></i>${nomeContato}
                        </td>
                        <td>${c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                        <td class="fw-bold text-dark">${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td><span class="badge ${corBadge}">${c.categoria || 'A Pagar'}</span></td>
                        <td class="pe-4 text-center">
                            <button type="button" class="btn btn-sm btn-outline-secondary border-0" onclick="irParaProdutos('${nomeContato}')" title="Ver produtos deste fornecedor">
                                <i class="bi bi-box-seam fs-5"></i>
                            </button>
                        </td>
                    </tr>`;
            }
        });

        document.getElementById('total-apagar').innerText = sPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('total-pago').innerText = sPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('total-vencidos').innerText = sVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });
}

// Abre o Modal contendo os detalhes e a API do WhatsApp integrado
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
                <p class="mb-1"><strong>Link página com fornecedor:</strong></p>
                <div class="mb-3">${linkHTML}</div>
            </div>
        `;

        const btnZap = document.getElementById('btnZap');
        if (c.telefone) {
            const telLimpo = c.telefone.replace(/\D/g, '');
            btnZap.href = `https://wa.me/55${telLimpo}?text=Olá ${encodeURIComponent(nomeContato)}, gostaria de tratar sobre nossa pendência/faturamento.`;
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
    
    document.getElementById("filtroBusca").oninput = exibeContatos;

    // Ação: Botão SALVAR
    document.getElementById("btnInsert").onclick = () => {
        const nomeInput = document.getElementById('inputNome').value;
        const valorInput = document.getElementById('inputValor').value;
        
        if(nomeInput && valorInput) {
            verificarDuplicado(nomeInput, null, (existe) => {
                if (existe) {
                    alert(`O fornecedor "${nomeInput.trim()}" já está cadastrado sob a variação/nome: "${existe.nome}".`);
                    return;
                }

                const c = {
                    nome: nomeInput.trim(),
                    telefone: document.getElementById('inputTelefone').value,
                    valor: valorInput,
                    vencimento: document.getElementById('inputVencimento').value,
                    categoria: document.getElementById('inputCategoria').value,
                    website: document.getElementById('inputLink').value
                };
                
                createContato(c, () => {
                    exibeContatos();
                    document.getElementById("form-contato").reset();
                });
            });
        } else {
            alert("Preencha Fornecedor e Valor.");
        }
    };

    // Ação: Botão ALTERAR
    document.getElementById("btnUpdate").onclick = () => {
        let id = document.getElementById("inputId").value;
        if(!id) return alert("Selecione o ID na tabela correspondente para preencher o formulário antes de alterar.");
        
        const nomeInput = document.getElementById('inputNome').value;
        
        verificarDuplicado(nomeInput, id, (existe) => {
            if (existe) {
                alert(`Conflito de duplicidade: Outro fornecedor já utiliza o nome "${existe.nome}".`);
                return;
            }

            const c = {
                nome: nomeInput.trim(),
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
            alert("Selecione um registro carregando seu ID na tabela primeiro.");
        }
    };

    // Ação: Botão LIMPAR
    document.getElementById("btnClear").onclick = () => {
        document.getElementById("form-contato").reset();
        document.getElementById("inputId").value = "";
    };

    exibeContatos();
}