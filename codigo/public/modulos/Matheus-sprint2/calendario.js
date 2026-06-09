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
        eventClick: removerEvento
    });

    calendar.render();
    carregarEventos();
});

async function carregarEventos() {

    const eventos = await fetch('/events');
    const eventosResposta = await eventos.json();

    calendar.addEventSource(eventosResposta);
}

async function removerEvento(evento) {

    await fetch(`/events/${evento.event.id}`, {
        method: 'DELETE'
    });

    evento.event.remove();
}

document.getElementById('btnSalvarEvento').addEventListener('click', async function () {

    const title = document.getElementById('tituloEvento').value;
    const start = document.getElementById('dataInicio').value;
    const end = document.getElementById('dataFim').value;
    const color = document.getElementById('corEvento').value;

    await fetch('/events', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title,start,end,color})
    });

    calendar.addEvent({title,start,end,color});
});