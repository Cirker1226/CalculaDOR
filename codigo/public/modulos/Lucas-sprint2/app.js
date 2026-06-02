let produtosOriginais = [];
let produtosFiltrados = [];
let modoEdicao = false;   // false = CREATE  |  true = UPDATE
let idEmEdicao = null;    // guarda o id do produto sendo editado


// 1. CARGA DE DADOS

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


// 2. PROCESSAMENTO E RENDERIZAÇÃO DA TABELA

function processarERenderizar() {
    const tbody = document.getElementById('tabela-produtos');
    tbody.innerHTML = '';

    let totalProdutosPromocao = 0;
    let somaDiasSemMovimentacao = 0;

    // Se não houver produtos após o filtro, limpa a tabela e zera as métricas
    if (produtosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Nenhum produto encontrado com os filtros aplicados.</td></tr>`;
        atualizarCardsMetricos(0, 0, 0, "Nenhum");
        return;
    }

    // Variáveis para descobrir o mais vendido dinamicamente dentro do filtro aplicado
    let maiorGiroQuantidadeGeral = -1;
    let produtoMaisVendidoNomeGeral = "Nenhum";

    produtosFiltrados.forEach((p) => {
        const dataMovimentacao = p.ultima_atualizacao;
        const qtdMovimentada = p.quantidade_movimentada_30d || 0;
        const diasSemMvto = calcularDiasSemMovimentacao(dataMovimentacao);
        const valorParadoCalculado = (p.quantidade_atual || 0) * (p.preco_custo || 0);

        // Verifica o produto campeão de vendas deste filtro
        if (qtdMovimentada > maiorGiroQuantidadeGeral) {
            maiorGiroQuantidadeGeral = qtdMovimentada;
            produtoMaisVendidoNomeGeral = p.produto;
        }

        somaDiasSemMovimentacao += diasSemMvto;

        if (diasSemMvto > 30) totalProdutosPromocao++;

        let classeCorDias = 'text-dark';
        if (diasSemMvto > 60)       classeCorDias = 'text-danger fw-bold';
        else if (diasSemMvto >= 30) classeCorDias = 'text-warning fw-bold';

        tbody.innerHTML += `
            <tr data-id="${p.id}">
                <td class="fw-semibold text-dark">${p.produto}</td>
                <td><code class="text-secondary">${p.sku || 'N/A'}</code></td>
                <td><span class="badge bg-secondary-subtle text-secondary-emphasis">${p.categoria}</span></td>
                <td>${qtdMovimentada} un</td>
                <td>${formatarDataBR(dataMovimentacao)}</td>
                <td><span class="fw-bold ${classeCorDias}">${diasSemMvto} dias</span></td>
                <td class="text-end fw-bold text-dark">
                    R$ ${valorParadoCalculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
                <td class="text-center">
                    <div class="d-flex gap-1 justify-content-center">
                        <button class="btn btn-sm btn-outline-primary shadow-sm"
                                onclick="abrirModalEdicao('${p.id}')">
                            <i class="fa-solid fa-pen-to-square me-1"></i>Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger shadow-sm"
                                onclick="excluirProduto('${p.id}')">
                            <i class="fa-solid fa-trash-can me-1"></i>Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    const mediaDias = Math.round(somaDiasSemMovimentacao / produtosFiltrados.length);
    atualizarCardsMetricos(produtosFiltrados.length, totalProdutosPromocao, mediaDias, produtoMaisVendidoNomeGeral);
}


// 3. CARDS DE MÉTRICAS

function atualizarCardsMetricos(totalProd, totalPromocao, mediaDias, maisVendido) {
    document.getElementById('metric-total-produtos').innerText = totalProd;
    document.getElementById('metric-produtos-promocao').innerText = `${totalPromocao} ${totalPromocao === 1 ? 'item' : 'itens'}`;
    document.getElementById('metric-media-dias').innerText = `${mediaDias || 0} dias`;
    document.getElementById('metric-mais-vendido').innerText = maisVendido;
}


// 4. FILTROS

function aplicarFiltros() {
    const periodoSelecionado = document.getElementById('filtro-periodo').value;
    const termoBusca = document.getElementById('input-busca').value.toLowerCase().trim();

    produtosFiltrados = produtosOriginais.filter(p => {
        const diasSemMvto = calcularDiasSemMovimentacao(p.ultima_atualizacao);

        let passaPeriodo = true;
        if (periodoSelecionado === '7')        passaPeriodo = (diasSemMvto >= 1 && diasSemMvto <= 7);
        else if (periodoSelecionado === '30')  passaPeriodo = (diasSemMvto <= 30);
        else if (periodoSelecionado === '90')  passaPeriodo = (diasSemMvto <= 90);
        else if (periodoSelecionado === 'custom') passaPeriodo = (diasSemMvto > 90);

        const passaBusca = p.produto.toLowerCase().includes(termoBusca) ||
                           p.sku.toLowerCase().includes(termoBusca);

        return passaPeriodo && passaBusca;
    });

    processarERenderizar();
}


// 5. MODAIS (abrir para CRIAR ou EDITAR)

function abrirModalNovo() {
    modoEdicao = false;
    idEmEdicao = null;

    document.getElementById('modal-titulo').innerText = '➕ Novo Produto';
    document.getElementById('campo-produto').value    = '';
    document.getElementById('campo-sku').value        = '';
    document.getElementById('campo-categoria').value  = '';
    document.getElementById('campo-data').value       = '';
    document.getElementById('campo-qtd-atual').value  = '0';
    document.getElementById('campo-qtd-30d').value    = '0';
    document.getElementById('campo-preco-custo').value = '0';
    document.getElementById('campo-preco-venda').value = '0';

    new bootstrap.Modal(document.getElementById('modalProduto')).show();
}

function abrirModalEdicao(id) {
    const produto = produtosOriginais.find(p => p.id == id);
    if (!produto) return;

    modoEdicao = true;
    idEmEdicao = id;

    document.getElementById('modal-titulo').innerText    = '✏️ Editar Produto';
    document.getElementById('campo-produto').value       = produto.produto || '';
    document.getElementById('campo-sku').value           = produto.sku || '';
    document.getElementById('campo-categoria').value     = produto.categoria || '';
    document.getElementById('campo-data').value          = produto.ultima_atualizacao || '';
    document.getElementById('campo-qtd-atual').value     = produto.quantidade_atual || 0;
    document.getElementById('campo-qtd-30d').value       = produto.quantidade_movimentada_30d || 0;
    document.getElementById('campo-preco-custo').value   = produto.preco_custo || 0;
    document.getElementById('campo-preco-venda').value   = produto.preco_venda || 0;

    new bootstrap.Modal(document.getElementById('modalProduto')).show();
}


// 6. SALVAR 

async function salvarProduto() {
    const novoProduto = {
        produto:                    document.getElementById('campo-produto').value.trim(),
        sku:                        document.getElementById('campo-sku').value.trim().toUpperCase(),
        categoria:                  document.getElementById('campo-categoria').value.trim(),
        quantidade_atual:           parseFloat(document.getElementById('campo-qtd-atual').value) || 0,
        quantidade_movimentada_30d: parseFloat(document.getElementById('campo-qtd-30d').value) || 0,
        preco_custo:                parseFloat(document.getElementById('campo-preco-custo').value) || 0,
        preco_venda:                parseFloat(document.getElementById('campo-preco-venda').value) || 0,
        ultima_atualizacao:         document.getElementById('campo-data').value,
    };

    if (!novoProduto.produto || !novoProduto.sku || !novoProduto.categoria || !novoProduto.ultima_atualizacao) {
        alert('Preencha todos os campos obrigatórios: Produto, SKU, Categoria e Data.');
        return;
    }

    try {
        let res;

        if (!modoEdicao) {
            res = await fetch('http://localhost:3000/estoques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoProduto)
            });
        } else {
            res = await fetch(`http://localhost:3000/estoques/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...novoProduto, id: idEmEdicao })
            });
        }

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
            await carregarDados(); 
        } else {
            alert('O servidor respondeu com erro ao salvar. Verifique se o JSONServer está rodando.');
        }
    } catch (e) {
        console.error('Erro ao salvar produto:', e);
        alert('Não foi possível conectar ao servidor. Verifique se o JSONServer está rodando na porta 3000.');
    }
}


// 7. DELETE

async function excluirProduto(id) {
    if (confirm("Deseja realmente excluir esta amostragem do registro?")) {
        try {
            const res = await fetch(`http://localhost:3000/estoques/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                produtosOriginais = produtosOriginais.filter(p => p.id != id);
                produtosFiltrados = produtosFiltrados.filter(p => p.id != id);
                processarERenderizar();
            } else {
                alert("O servidor respondeu com erro ao deletar.");
            }
        } catch (e) {
            console.warn("Realizando remoção apenas local (Fallback local):", e);
            produtosOriginais = produtosOriginais.filter(p => p.id != id);
            produtosFiltrados = produtosFiltrados.filter(p => p.id != id);
            processarERenderizar();
        }
    }
}


// 8. UTILITÁRIOS DE DATA

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