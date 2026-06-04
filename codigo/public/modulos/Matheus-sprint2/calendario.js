/* Foi Utilizado o FullCalendar para criar o calendário,
e o Bootstrap para estilizar os botões. */

document.addEventListener('DOMContentLoaded', async function () {

    const calendarEl = document.getElementById('calendar');

    const eventos = await fetch('http://localhost:3000/events');
    const eventosResposta = await eventos.json();

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        displayEventTime: false,
        fixedWeekCount: false,
        events: eventosResposta
    });

    calendar.render();
});

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