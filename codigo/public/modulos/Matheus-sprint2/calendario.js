/* Foi Utilizado o FullCalendar para criar o calendário,
e o Bootstrap para estilizar os botões. */

let calendar;

document.addEventListener('DOMContentLoaded', function () {

    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        displayEventTime: false,
        fixedWeekCount: false,
    });

    calendar.render();
    carregarEventos();
});

async function carregarEventos() {

    const eventos = await fetch('http://localhost:3000/events');
    const eventosResposta = await eventos.json();

    calendar.addEventSource(eventosResposta);
}

document.getElementById('btnSalvarEvento').addEventListener('click', async function () {

    const title = document.getElementById('tituloEvento').value;
    const start = document.getElementById('dataInicio').value;
    const end = document.getElementById('dataFim').value;
    const color = document.getElementById('corEvento').value;

    await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title,start,end,color})
    });

    calendar.addEvent({title,start,end,color});
});