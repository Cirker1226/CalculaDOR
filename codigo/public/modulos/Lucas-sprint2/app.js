let produtosOriginais = [];
let produtosFiltrados = [];


async function carregarDados() {
    try {
        const res = await fetch('http://localhost:3000/estoques');
        const dados = await res.json();
        
        produtosOriginais = Array.isArray(dados) ? dados : [];
        produtosFiltrados = [...produtosOriginais];
        processarERenderizar();
    } catch (e) { 
        console.error("Erro ao buscar dados do servidor:", e); 
    }
}


function processarERenderizar() {
    const tbody = document.getElementById('tabela-produtos');
    tbody.innerHTML = '';

    let totalProdutosPromocao = 0;
    let somaDiasSemMovimentacao = 0;

    
    let maiorGiroQuantidadeGeral = -1;
    let produtoMaisVendidoNomeGeral = "Nenhum";

    produtosOriginais.forEach((p) => {
        const qtdMovimentadaGeral = p.quantidade_movimentada_30d || 0;
        if (qtdMovimentadaGeral > maiorGiroQuantidadeGeral) {
            maiorGiroQuantidadeGeral = qtdMovimentadaGeral;
            produtoMaisVendidoNomeGeral = p.produto;
        }
    });
    

    if (produtosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Nenhum produto encontrado com os filtros aplicados.</td></tr>`;
        
        atualizarCardsMetricos(0, 0, 0, produtoMaisVendidoNomeGeral);
        return;
    }

    produtosFiltrados.forEach((p) => {
        const dataMovimentacao = p.ultima_atualizacao;
        const qtdMovimentada = p.quantidade_movimentada_30d || 0;
        
        const diasSemMvto = calcularDiasSemMovimentacao(dataMovimentacao);
        const valorParadoCalculado = (p.quantidade_atual || 0) * (p.preco_custo || 0);

        somaDiasSemMovimentacao += diasSemMvto;

        
        if (diasSemMvto > 30) {
            totalProdutosPromocao++;
        }

        
        let classeCorDias = 'text-dark';
        if (diasSemMvto > 60) {
            classeCorDias = 'text-danger';
        } else if (diasSemMvto >= 30) {
            classeCorDias = 'text-warning';
        }

        tbody.innerHTML += `
            <tr data-id="${p.id}">
                <td class="fw-semibold text-dark">${p.produto}</td>
                <td><code class="text-secondary">${p.sku || 'N/A'}</code></td>
                <td><span class="badge bg-secondary-subtle text-secondary-emphasis">${p.categoria}</span></td>
                <td>${qtdMovimentada} un</td>
                <td>${formatarDataBR(dataMovimentacao)}</td>
                <td>
                    <span class="fw-bold ${classeCorDias}">
                        ${diasSemMvto} dias
                    </span>
                </td>
                <td class="text-end fw-bold text-dark">R$ ${valorParadoCalculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="excluirProduto('${p.id}')">
                        <i class="fa-solid fa-trash-can me-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `;
    });

    const mediaDias = Math.round(somaDiasSemMovimentacao / produtosFiltrados.length);
    
    atualizarCardsMetricos(produtosFiltrados.length, totalProdutosPromocao, mediaDias, produtoMaisVendidoNomeGeral);
}


function atualizarCardsMetricos(totalProd, totalPromocao, mediaDias, maisVendido) {
    document.getElementById('metric-total-produtos').innerText = totalProd;
    document.getElementById('metric-produtos-promocao').innerText = `${totalPromocao} ${totalPromocao === 1 ? 'item' : 'itens'}`;
    document.getElementById('metric-media-dias').innerText = `${mediaDias || 0} dias`;
    document.getElementById('metric-mais-vendido').innerText = maisVendido;
}


function aplicarFiltros() {
    const periodoSelecionado = document.getElementById('filtro-periodo').value;
    const termoBusca = document.getElementById('input-busca').value.toLowerCase().trim();

    produtosFiltrados = produtosOriginais.filter(p => {
        const diasSemMvto = calcularDiasSemMovimentacao(p.ultima_atualizacao);
        
        let passaPeriodo = true;
        if (periodoSelecionado === '7') {
            passaPeriodo = (diasSemMvto >= 1 && diasSemMvto <= 7);
        } else if (periodoSelecionado === '30') {
            passaPeriodo = (diasSemMvto <= 30);
        } else if (periodoSelecionado === '90') {
            passaPeriodo = (diasSemMvto <= 90);
        } else if (periodoSelecionado === 'custom') {
            passaPeriodo = (diasSemMvto > 90);
        }

        const passaBusca = p.produto.toLowerCase().includes(termoBusca) || p.sku.toLowerCase().includes(termoBusca);

        return passaPeriodo && passaBusca;
    });

    processarERenderizar();
}


async function excluirProduto(id) {
    if (confirm("Deseja realmente excluir esta amostragem do registro?")) {
        try {
            const res = await fetch(`http://localhost:3000/estoques/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                produtosOriginais = produtosOriginais.filter(p => p.id !== id && p.id != id);
                produtosFiltrados = produtosFiltrados.filter(p => p.id !== id && p.id != id);
                processarERenderizar();
            } else {
                alert("O servidor respondeu com erro ao deletar.");
            }
        } catch (e) {
            console.warn("Realizando remoção apenas local (Fallback local):", e);
            produtosOriginais = produtosOriginais.filter(p => p.id !== id && p.id != id);
            produtosFiltrados = produtosFiltrados.filter(p => p.id !== id && p.id != id);
            processarERenderizar();
        }
    }
}


function calcularDiasSemMovimentacao(dataString) {
    if (!dataString) return 0;
    const dataAlvo = new Date(dataString);
    const hoje = new Date(); 
    const diferencaTempo = hoje - dataAlvo;
    const dias = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));
    return dias < 0 ? 0 : dias;
}

function formatarDataBR(dataString) {
    if (!dataString) return '---';
    const partes = dataString.split('-');
    if (partes.length !== 3) return dataString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

carregarDados();