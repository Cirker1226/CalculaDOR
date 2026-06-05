

async function carregarDespesas(tipoOrdenacao = 'recente') {
    
    const resposta = await fetch('http://localhost:3000/despesas');
    let dados = await resposta.json();
    dados.sort((a,b) => {

    switch(tipoOrdenacao) {
        case 'recente':
            return new Date(b.data) - new Date(a.data);
        
        case 'antiga':
            return new Date(a.data) - new Date(b.data);
        
        case 'barato':
            return Number(a.valor) - Number(b.valor);
        
        case 'caro':
            return Number(b.valor) - Number(a.valor);
        
        default:
            return 0;
    }
});
    

    const tbody = document.getElementById('corpo-tabela');
    
    
    tbody.innerHTML = ''
    dados.forEach(despesa => {
        tbody.innerHTML += `
            <tr>
                <th scope="row">${despesa.id}</th>
                <td>${despesa.nome}</td>
                <td>${despesa.valor}</td>
                <td>${despesa.data}</td>
                <td>${despesa.tipo}</td>
                <td>${despesa.obs}</td>
            </tr>
        `;
    });
}


carregarDespesas();