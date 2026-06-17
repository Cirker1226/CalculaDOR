// Segurança: Impede acesso direto pela barra de navegação sem estar logado
(function verificarAutenticacao() {
    let usuarioLogado = sessionStorage.getItem('usuarioCorrente');
    if (!usuarioLogado) {
        window.location.href = "/modulos/login/login.html"; 
    }
})();

// Rotas voltadas a buscar diretamente da raiz do servidor local do JSON Server
const rotas = {
    vendas: '/vendas_pdvs',
    clientes: '/clientes',
    estoques: '/estoques',
    contatos: '/contatos',
    agendamentos: '/agendamentos'
};

function initHome() {
    let user = JSON.parse(sessionStorage.getItem('usuarioCorrente'));
    console.log("Bem-vindo ao sistema, " + user.nome);
    carregarDashboard();
}

function carregarDashboard() {
    Promise.all([
        fetch(rotas.vendas).then(res => res.json()).catch(() => []),
        fetch(rotas.clientes).then(res => res.json()).catch(() => []),
        fetch(rotas.estoques).then(res => res.json()).catch(() => []),
        fetch(rotas.contatos).then(res => res.json()).catch(() => []),
        fetch(rotas.agendamentos).then(res => res.json()).catch(() => [])
    ])
    .then(([vendas, clientes, estoques, contatos, agendamentos]) => {
        
        // ==========================================
        // 1. SUA PARTE: Processamento de Últimos Pedidos (Ajustado ao seu db.json)
        // ==========================================
        let totalFaturado = 0;
        let valoresGrafico = [];
        let labelsGrafico = [];
        let ultimasVendasHTML = "";

        vendas.forEach((v, idx) => {
            const val = parseFloat(v.valor_total) || 0;
            totalFaturado += val;
            
            if(idx < 6) {
                valoresGrafico.push(val);
                labelsGrafico.push(`Pedido #${v.id ? v.id.toString().substring(0,4) : idx+1}`);
            }

            if(idx < 5) {
                // Mapeia os itens lendo exatamente 'produto_nome' e 'quantidade' do seu db.json
                let itensHTML = "";
                if (v.itens && Array.isArray(v.itens)) {
                    itensHTML = v.itens.map(item => `${item.produto_nome} (${item.quantidade} un)`).join(', ');
                } else {
                    itensHTML = "Itens do caixa";
                }

                // Formata a data de ISO ("2025-05-23...") para o formato legível ("23/05/2025")
                let dataFormatada = "Hoje";
                if (v.data_hora) {
                    const d = new Date(v.data_hora);
                    if (!isNaN(d.getTime())) {
                        dataFormatada = d.toLocaleDateString('pt-BR');
                    }
                }

                // Busca o nome do cliente associado pelo id se necessário (ou mantém fixo se não houver a string do nome)
                let nomeCliente = "Consumidor Final";
                if (v.cliente_id) {
                    const clienteEncontrado = clientes.find(c => c.id === v.cliente_id || c.id === String(v.cliente_id));
                    if (clienteEncontrado && clienteEncontrado.nome) {
                        nomeCliente = clienteEncontrado.nome;
                    }
                } else if (v.cliente) {
                    nomeCliente = v.cliente;
                }

                ultimasVendasHTML += `
                    <tr>
                        <td class="fw-bold text-primary">#${v.id || idx+1}</td>
                        <td>
                            <span class="fw-semibold text-dark d-block">${nomeCliente}</span>
                            <small class="text-muted d-block text-truncate" style="max-width: 280px;">
                                <i class="bi bi-cart2 me-1"></i> ${itensHTML}
                            </small>
                        </td>
                        <td>${dataFormatada}</td>
                        <td class="text-end fw-bold text-dark">R$ ${val.toFixed(2)}</td>
                    </tr>`;
            }
        });
        document.getElementById('card-faturamento').innerText = totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const tabelaVendas = document.getElementById('tabela-ultimas-vendas');
        tabelaVendas.innerHTML = ultimasVendasHTML || '<tr><td colspan="4" class="text-center text-muted py-3">Nenhum pedido processado hoje.</td></tr>';

        // 2. Quantidade de Clientes
        document.getElementById('card-clientes').innerText = clientes.length;

        // 3. Trabalho do seu Colega: Alertas de Estoque Crítico (SEM BORDAS NO BOTÃO)
        let itensCriticos = 0;
        let alertasHTML = "";

        estoques.forEach(p => {
            if (p.quantidade_atual !== undefined && p.quantidade_atual < 30) {
                itensCriticos++;
                alertasHTML += `
                    <tr class="border-bottom">
                        <td class="py-3"><span class="badge bg-danger-subtle text-danger p-2 rounded-3">Estoque</span></td>
                        <td class="py-3"><span class="fw-bold text-dark d-block small">${p.produto || p.produto_nome}</span><small class="text-muted">Abaixo do limite</small></td>
                        <td class="text-end py-3 fw-bold text-danger">${p.quantidade_atual} un</td>
                    </tr>`;
            }
        });
        document.getElementById('card-estoque').innerText = `${itensCriticos} itens`;

        // Contas a Pagar
        let totalPendente = 0;
        contatos.forEach(c => {
            if (c.categoria === 'A Pagar' || c.categoria === 'Vencido') {
                totalPendente += parseFloat(c.valor) || 0;
                
                if(c.categoria === 'Vencido') {
                    alertasHTML += `
                        <tr class="border-bottom">
                            <td class="py-3"><span class="badge bg-light-warning text-warning border border-warning-subtle p-2 rounded-3">Financeiro</span></td>
                            <td class="py-3"><span class="fw-bold text-dark d-block small">${c.nome || c.name || 'Fornecedor'}</span><small class="text-muted">Boleto Vencido</small></td>
                            <td class="text-end py-3 text-danger fw-semibold small">Vencido</td>
                        </tr>`;
                }
            }
        });
        document.getElementById('card-pendente').innerText = totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const tabela = document.getElementById('tabela-alertas');
        if(alertasHTML !== "") {
            tabela.innerHTML = alertasHTML;
        } else {
            tabela.innerHTML = `<tr><td class="text-center text-muted py-4 small">Tudo sob controle no sistema! ✨</td></tr>`;
        }

        // ==========================================
        // 4. SUA PARTE: Agenda Logística de Entregas
        // ==========================================
        let agendamentosHTML = "";
        if (agendamentos.length > 0) {
            agendamentos.slice(0, 4).forEach(ag => {
                agendamentosHTML += `
                    <div class="d-flex align-items-center p-2 rounded-3 bg-light border-start border-4 border-primary mb-1">
                        <div class="me-3 ps-2">
                            <span class="d-block fw-bold text-dark small">${ag.titulo || ag.title || "Saída de Carga"}</span>
                            <small class="text-muted"><i class="bi bi-clock me-1"></i> ${ag.data || ag.date || "Agendado"}</small>
                        </div>
                        <span class="badge bg-white text-primary border ms-auto small">${ag.status || "Pendente"}</span>
                    </div>`;
            });
        } else {
            agendamentosHTML = `
                <div class="d-flex align-items-center p-2 rounded-3 bg-light border-start border-4 border-info mb-1">
                    <div class="me-3 ps-2">
                        <span class="d-block fw-bold text-dark small">Entrega: 50 sacos de Cimento (Caminhão 01)</span>
                        <small class="text-muted"><i class="bi bi-clock me-1"></i> 14:00h - Setor Norte</small>
                    </div>
                </div>
                <div class="d-flex align-items-center p-2 rounded-3 bg-light border-start border-4 border-warning">
                    <div class="me-3 ps-2">
                        <span class="d-block fw-bold text-dark small">Retirada em Loja: Palete de Tijolos</span>
                        <small class="text-muted"><i class="bi bi-clock me-1"></i> 16:30h - Cliente: Marcos Silva</small>
                    </div>
                </div>`;
        }
        document.getElementById('lista-agendamentos').innerHTML = agendamentosHTML;

        // 5. Configuração do Gráfico de Linha (Chart.js)
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
                    borderColor: '#7239ea',
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