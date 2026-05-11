// ──────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Kontaktformular
// Rein mailto-basiert – keine Drittanbieter
// ──────────────────────────────────────────────

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  // Nur auf Seiten mit Formular ausführen (nicht auf Impressum/Datenschutz)
  if (!form || !success) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = new FormData(form);

    const name = ((data.get('vorname') || '') + ' ' + (data.get('nachname') || '')).trim();
    const email = data.get('email') || '';
    const schule = data.get('schule') || '';
    const interesse = data.get('interesse') || '';
    const nachricht = data.get('nachricht') || '';

    const body = [
      'Name: ' + name,
      'E-Mail: ' + email,
      'Schule: ' + schule,
      'Interesse: ' + interesse,
      'Nachricht: ' + nachricht
    ].join('\n');

    window.location.href = 'mailto:info@picts-ag.ch'
      + '?subject=' + encodeURIComponent('Interesse PICTS-Netzwerk Aargau')
      + '&body=' + encodeURIComponent(body);

    // Erfolgsanzeige nach kurzem Delay
    setTimeout(function () {
      form.style.display = 'none';
      success.style.display = 'block';
    }, 500);
  });
})();