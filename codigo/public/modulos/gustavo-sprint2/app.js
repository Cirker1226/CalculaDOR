async function carregarDespesas(tipoOrdenacao = 'recente') {
    
    
    const resposta = await fetch('/despesas');
    let dados = await resposta.json();
    
    const quantidadeTotal = dados.length;
    document.getElementById('qtd-total-despesas').innerText = `Qtd: ${quantidadeTotal}`;


    const valorTotal = dados.reduce((acumulador, despesa) => acumulador + Number(despesa.valor), 0);
    const totalFormatadoGeral = valorTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    document.getElementById('valor-total-despesas').innerText = `Total: ${totalFormatadoGeral}`;


   
    dados.sort((a,b) => {
        switch(tipoOrdenacao) {
            case 'recente':
                return new Date(a.data) - new Date(b.data);
            case 'antiga':
                return new Date(b.data) - new Date(a.data);
            case 'barato':
                return Number(a.valor) - Number(b.valor);
            case 'caro':
                return Number(b.valor) - Number(a.valor);
            default:
                return 0;
        }
    });
    
    
    
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = ''; 
    
    dados.forEach(despesa => {
        
        const valorFormatado = Number(despesa.valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        
        let dataFormatada = despesa.data;
        if (despesa.data && despesa.data.includes('-')) {
            const partes = despesa.data.split('-');
            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        
        let corBadge = 'bg-secondary';
        if (despesa.tipo === 'Aluguel') {
            corBadge = 'bg-primary'; 
        } else if (despesa.tipo === 'Outros') {
            corBadge = 'bg-warning text-dark'; 
        }

        const observacao = despesa.obs ? despesa.obs : '-';

        
        tbody.innerHTML += `
            <tr>
                <th scope="row" class="text-dark align-middle">${despesa.id}</th>
                <td class="fw-semibold text-dark align-middle">${despesa.nome}</td>
                <td class="text-success fw-bold align-middle">${valorFormatado}</td>
                <td class="align-middle">${dataFormatada}</td>
                <td class="align-middle">
                    <span class="badge ${corBadge} rounded-pill px-3 py-2 shadow-sm" style="font-weight: 500;">
                        ${despesa.tipo}
                    </span>
                </td>
                <td class="text-muted fst-italic align-middle">${observacao}</td>
            </tr>
        `;
    });
}


carregarDespesas();