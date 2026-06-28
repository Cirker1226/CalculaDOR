let despesasGlobais = []; // Guarda os dados para facilitar a busca e filtro

async function carregarDespesas(tipoOrdenacao = 'recente') {
    const resposta = await fetch('/despesas');
    despesasGlobais = await resposta.json();
    
    atualizarResumo(despesasGlobais);
    renderizarTabela(despesasGlobais, tipoOrdenacao);
}

function atualizarResumo(dados) {
    const quantidadeTotal = dados.length;
    document.getElementById('qtd-total-despesas').innerText = `Qtd: ${quantidadeTotal}`;

    const valorTotal = dados.reduce((acumulador, despesa) => acumulador + Number(despesa.valor), 0);
    const totalFormatadoGeral = valorTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    document.getElementById('valor-total-despesas').innerText = `Total: ${totalFormatadoGeral}`;
}

function renderizarTabela(dados, tipoOrdenacao = 'recente') {
    // Ordenação dinâmica baseada no botão clicado
    dados.sort((a,b) => {
        switch(tipoOrdenacao) {
            case 'recente': return new Date(a.data) - new Date(b.data);
            case 'antiga': return new Date(b.data) - new Date(a.data);
            case 'barato': return Number(a.valor) - Number(b.valor);
            case 'caro': return Number(b.valor) - Number(a.valor);
            default: return 0;
        }
    });
    
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = ''; 
    
    dados.forEach(despesa => {
        const valorFormatado = Number(despesa.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let dataFormatada = despesa.data;
        if (despesa.data && despesa.data.includes('-')) {
            const partes = despesa.data.split('-');
            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        
        // Estilização das Badges
        let corBadge = 'bg-secondary';
        let icone = 'bi-tags';
        
        if (despesa.tipo === 'Aluguel') {
            corBadge = 'bg-primary'; 
            icone = 'bi-building';
        } else if (despesa.tipo === 'Outros') {
            corBadge = 'bg-warning text-dark'; 
            icone = 'bi-box';
        }

        const observacao = despesa.obs ? despesa.obs : '<span class="text-black-50">-</span>';
        
        tbody.innerHTML += `
            <tr class="tabela-linha-hover">
                <th scope="row" class="text-dark align-middle" style="font-size: 0.85rem;">${despesa.id.substring(0,6)}...</th>
                <td class="fw-semibold text-dark align-middle">${despesa.nome}</td>
                <td class="text-danger fw-bold align-middle">${valorFormatado}</td>
                <td class="align-middle">${dataFormatada}</td>
                <td class="align-middle">
                    <span class="badge ${corBadge} rounded-pill px-3 py-2 shadow-sm" style="font-weight: 500;">
                        <i class="bi ${icone} me-1"></i> ${despesa.tipo}
                    </span>
                </td>
                <td class="text-muted fst-italic align-middle text-truncate" style="max-width: 150px;">${observacao}</td>
            </tr>
        `;
    });
}

// Função da barra de pesquisa
function filtrarDespesas() {
    const termo = document.getElementById('busca-despesa').value.toLowerCase();
    const dadosFiltrados = despesasGlobais.filter(despesa => 
        despesa.nome.toLowerCase().includes(termo) || 
        despesa.tipo.toLowerCase().includes(termo)
    );
    renderizarTabela(dadosFiltrados);
}
carregarDespesas();