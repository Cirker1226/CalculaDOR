async function carregarDespesas() {
    
    const resposta = await fetch('http://localhost:3000/despesas');
    const dados = await resposta.json();
    
    
    const tbody = document.getElementById('corpo-tabela');
    
    
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