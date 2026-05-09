document.querySelector('button[type="button"]').addEventListener('click', async () => {

    const produto = document.getElementById('nome').value;
    const sku = document.getElementById('sku').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = document.getElementById('quantidade').value;
    const fornecedor = document.getElementById('fornecedor').value;
    const unidade = document.querySelector('input[name="embalagem"]:checked')?.value;
    const descricao = document.getElementById('descricao').value;
    const imagem = document.getElementById('imagem').files[0];

    const dados = { id: Date.now(), produto, sku, categoria, quantidade, fornecedor, unidade, descricao };

    const resposta = await fetch('http://localhost:3000/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (resposta.ok) {
        alert('Produto cadastrado!');
    } else {
        alert('Erro ao cadastrar produto!');
    }
});