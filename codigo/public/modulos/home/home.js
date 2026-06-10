const rotas = {
    vendas: '/vendas_pdvs',
    clientes: '/clientes',
    estoques: '/estoques',
    contatos: '/contatos'
};

function initHome() {
    carregarDashboard();
}

function carregarDashboard() {
    Promise.all([
        fetch(rotas.vendas).then(res => res.json()).catch(() => []),
        fetch(rotas.clientes).then(res => res.json()).catch(() => []),
        fetch(rotas.estoques).then(res => res.json()).catch(() => []),
        fetch(rotas.contatos).then(res => res.json()).catch(() => [])
    ])
    .then(([vendas, clientes, estoques, contatos]) => {
        
        // 1. Processamento de Vendas e Gráfico
        let totalFaturado = 0;
        let valoresGrafico = [];
        let labelsGrafico = [];

        vendas.forEach((v, idx) => {
            const val = parseFloat(v.valor_total) || 0;
            totalFaturado += val;
            if(idx < 6) {
                valoresGrafico.push(val);
                labelsGrafico.push(`Pedido #${v.id ? v.id.toString().substring(0,4) : idx+1}`);
            }
        });
        document.getElementById('card-faturamento').innerText = totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // 2. Quantidade de Clientes
        document.getElementById('card-clientes').innerText = clientes.length;

        // 3. Estoque Crítico e Construção dos Alertas Visuais
        let itensCriticos = 0;
        let alertasHTML = "";

        estoques.forEach(p => {
            // Filtra produtos com estoque baixo (ex: menos de 30 unidades)
            if (p.quantidade_atual !== undefined && p.quantidade_atual < 30) {
                itensCriticos++;
                alertasHTML += `
                    <tr class="border-bottom">
                        <td class="py-3"><span class="badge bg-light-danger text-danger border border-danger-subtle p-2 rounded-3">Estoque</span></td>
                        <td class="py-3"><span class="fw-bold text-dark d-block small">${p.produto}</span><small class="text-muted">Abaixo do limite</small></td>
                        <td class="text-end py-3 fw-bold text-danger">${p.quantidade_atual} un</td>
                    </tr>`;
            }
        });
        document.getElementById('card-estoque').innerText = `${itensCriticos} itens`;

        // 4. Contas a Pagar / Pendentes
        let totalPendente = 0;
        contatos.forEach(c => {
            if (c.categoria === 'A Pagar' || c.categoria === 'Vencido') {
                totalPendente += parseFloat(c.valor) || 0;
                
                if(c.categoria === 'Vencido') {
                    alertasHTML += `
                        <tr class="border-bottom">
                            <td class="py-3"><span class="badge bg-light-warning text-warning border border-warning-subtle p-2 rounded-3">Financeiro</span></td>
                            <td class="py-3"><span class="fw-bold text-dark d-block small">${c.nome || 'Fornecedor'}</span><small class="text-muted">Boleto Vencido</small></td>
                            <td class="text-end py-3 text-muted fw-semibold small">Pendente</td>
                        </tr>`;
                }
            }
        });
        document.getElementById('card-pendente').innerText = totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Renderiza tabela de alertas personalizados
        const tabela = document.getElementById('tabela-alertas');
        if(alertasHTML !== "") {
            tabela.innerHTML = alertasHTML;
        } else {
            tabela.innerHTML = `<tr><td class="text-center text-muted py-4 small">Tudo sob controle no sistema! ✨</td></tr>`;
        }

        // 5. Configuração do Gráfico de Linha (Chart.js) com visual moderno
        const ctx = document.getElementById('graficoVendas').getContext('2d');
        if(valoresGrafico.length === 0) {
            labelsGrafico = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            valoresGrafico = [2500, 4100, 3200, 6800, 5100, 7300];
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsGrafico,
                datasets: [{
                    label: 'Faturamento por Pedido',
                    data: valoresGrafico,
                    borderColor: '#7239ea', /* Cor roxa combinando com o destaque */
                    backgroundColor: 'rgba(114, 57, 234, 0.06)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#7239ea',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { borderDash: [5, 5] }, beginAtZero: true }
                }
            }
        });
    })
    .catch(err => console.error("Erro ao montar Dashboard:", err));
}