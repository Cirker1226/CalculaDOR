/* Foi Utilizado o FullCalendar para criar o calendário, 
e o Bootstrap para estilizar os botões. */

document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', 
    locale: 'pt-br',             
    
    fixedWeekCount: false,
    });
  
  calendar.render();
});