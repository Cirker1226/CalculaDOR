const apiUrl = '/estoques';

function cadastrarProduto() {
    const produto = document.getElementById('nome').value;
    const sku = document.getElementById('sku').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade_atual = document.getElementById('quantidade').value;
    const fornecedor = document.getElementById('fornecedor').value;
    const unidade = document.querySelector('input[name="embalagem"]:checked')?.value;
    const preco_custo = document.getElementById('custo').value;
    const preco_venda = document.getElementById('venda').value;
    const descricao = document.getElementById('descricao').value;

    const dados = {
        id: Date.now(), produto,sku,categoria,quantidade_atual,fornecedor,unidade,preco_custo,preco_venda,descricao};


    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    }).then(resposta => {
        if (resposta.ok) {
            alert('Produto cadastrado!');
            exibeProdutos();
            limparInputs();
        } else {
            alert('Erro ao cadastrar produto!');
        }
    });
}

function limparInputs() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach(input => input.value = "");
}

function exibeProdutos() {
    const tableProdutos = document.getElementById("table-produtos");
    tableProdutos.innerHTML = "";

    readProdutos(estoques => {
        estoques.forEach(estoque => {
            tableProdutos.innerHTML += `
                <tr data-id="${estoque.id}" onclick="selecionarLinha(this)">
                    <td>${estoque.id}</td>
                    <td>${estoque.produto}</td>
                    <td>${estoque.sku}</td>
                    <td>${estoque.categoria}</td>
                    <td>${estoque.quantidade_atual}</td>
                    <td>${estoque.fornecedor}</td>
                    <td>${estoque.unidade}</td>
                    <td>R$ ${estoque.preco_custo}</td>
                    <td>R$ ${estoque.preco_venda}</td>
                    <td>${estoque.descricao}</td>
                </tr>`;
        });
    });
}

function selecionarLinha(linha) {
    document.querySelectorAll('#table-produtos tr')
        .forEach(tr => tr.classList.remove('table-active'));
    linha.classList.add('table-active');
}

function excluirProduto() {
    const linhaSelecionada = document.querySelector('#table-produtos tr.table-active');

    if (!linhaSelecionada) {
        alert('Selecione um produto na tabela antes de apagar.');
        return;
    }

    const id = linhaSelecionada.dataset.id;

    fetch(`${apiUrl}/${id}`, {
        method: 'DELETE'
    }).then(resposta => {
        if (resposta.ok) {
            exibeProdutos();
        } else {
            alert('Erro ao excluir produto!');
        }
    });
}

function readProdutos(processaDados) {
    fetch(apiUrl)
        .then(db => db.json())
        .then(data => processaDados(data))
        .catch(error => {
            console.error('Erro ao ler produtos:', error);
        });
}

let produtoEditandoId = null;

function editarProduto() {
    const linhaSelecionada = document.querySelector('#table-produtos tr.table-active');

    if (!linhaSelecionada) {
        alert('Selecione um produto para editar.');
        return;
    }

    produtoEditandoId = linhaSelecionada.dataset.id;

    const colunas = linhaSelecionada.querySelectorAll('td');

    document.getElementById('nome').value = colunas[1].textContent;
    document.getElementById('sku').value = colunas[2].textContent;
    document.getElementById('categoria').value = colunas[3].textContent;
    document.getElementById('quantidade').value = colunas[4].textContent;
    document.getElementById('fornecedor').value = colunas[5].textContent;
    document.getElementById('custo').value = colunas[7].textContent.replace("R$", "").trim();
    document.getElementById('venda').value = colunas[8].textContent.replace("R$", "").trim();
    document.getElementById('descricao').value = colunas[9].textContent;

    const botao = document.getElementById("botao-dinamico");
    botao.textContent = "Salvar Edição";
    botao.onclick = salvarEdicao;
}

function salvarEdicao() {
    if (!produtoEditandoId) {
        alert('Nenhum produto selecionado para edição.');
        return;
    }

    const dadosAtualizados = {
        id: Number(produtoEditandoId),
        produto: document.getElementById('nome').value,
        sku: document.getElementById('sku').value,
        categoria: document.getElementById('categoria').value,
        quantidade_atual: document.getElementById('quantidade').value,
        fornecedor: document.getElementById('fornecedor').value,
        unidade: document.querySelector('input[name="embalagem"]:checked')?.value,
        preco_custo: document.getElementById('custo').value,
        preco_venda: document.getElementById('venda').value,
        descricao: document.getElementById('descricao').value
    };

    fetch(`${apiUrl}/${produtoEditandoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
    }).then(resposta => {
        if (resposta.ok) {
            const botao = document.getElementById("botao-dinamico");
            botao.textContent = "Cadastrar Produto";
            botao.onclick = cadastrarProduto;

            produtoEditandoId = null;
            limparInputs();
            exibeProdutos();
        }
    });
}

exibeProdutos();