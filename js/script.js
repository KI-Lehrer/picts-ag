// ──────────────────────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Kontaktformular & MailerLite
// ──────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  // Nur auf Seiten mit Formular ausführen (nicht auf Impressum/Datenschutz)
  if (!form || !success) return;

  // Ladezustand des Buttons steuern
  const submitBtn = form.querySelector('.form-submit');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Interesse anmelden →';

  // Hilfsfunktion zur Erstellung des Mailto-Links (Fallback)
  function triggerMailtoFallback(data) {
    const vorname = data.get('vorname') || '';
    const nachname = data.get('nachname') || '';
    const email = data.get('email') || '';
    const schule = data.get('schule') || '';
    const telefon = data.get('telefon') || '';
    const interesse = data.get('interesse') || '';
    const nachricht = data.get('nachricht') || '';

    const name = (vorname + ' ' + nachname).trim();

    const body = [
      'Name: ' + name,
      'E-Mail: ' + email,
      'Schule: ' + schule,
      'Telefon: ' + telefon,
      'Interesse: ' + interesse,
      'Nachricht: ' + nachricht
    ].join('\n');

    window.location.href = 'mailto:info@picts-ag.ch'
      + '?subject=' + encodeURIComponent('Interesse PICTS-Netzwerk Aargau')
      + '&body=' + encodeURIComponent(body);

    // Erfolgsanzeige trotzdem anzeigen, da die E-Mail geöffnet wurde
    setTimeout(function () {
      form.style.display = 'none';
      success.innerHTML = '✓ E-Mail-Programm geöffnet! Bitte sende die vorbereitete Mail ab.';
      success.style.display = 'block';
    }, 1000);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // UI in Ladezustand versetzen
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Wird gesendet...';
    }

    const payload = {
      vorname: formData.get('vorname') || '',
      nachname: formData.get('nachname') || '',
      email: formData.get('email') || '',
      schule: formData.get('schule') || '',
      telefon: formData.get('telefon') || '',
      interesse: formData.get('interesse') || '',
      nachricht: formData.get('nachricht') || ''
    };

    try {
      // Sende Daten an unsere Netlify Serverless Function
      const response = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Erfolg! Formular ausblenden und Erfolgsmeldung anzeigen
        form.style.display = 'none';
        success.style.display = 'block';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // API-Fehler (z.B. MailerLite-Fehler oder Key fehlt) -> Fallback zu Mailto
        console.warn('API-Übermittlung fehlgeschlagen:', result.error || 'Unbekannter Fehler');
        alert('Die automatische Anmeldung ist fehlgeschlagen. Wir öffnen dein E-Mail-Programm, damit du dich direkt per E-Mail anmelden kannst.');
        triggerMailtoFallback(formData);
      }
    } catch (error) {
      // Netzwerkfehler oder Verbindungsfehler -> Fallback zu Mailto
      console.error('Netzwerkfehler bei Übermittlung:', error);
      alert('Verbindungsfehler. Wir öffnen dein E-Mail-Programm, damit du dich direkt per E-Mail anmelden kannst.');
      triggerMailtoFallback(formData);
    } finally {
      // Ladezustand zurücksetzen (falls Formular nicht ausgeblendet wurde)
      if (submitBtn && form.style.display !== 'none') {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
})();