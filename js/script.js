const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = new FormData(form);
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        const mailto = `mailto:info@picts-ag.ch?subject=Interesse%20PICTS-Netzwerk%20Aargau&body=Name%3A%20${encodeURIComponent(data.get('vorname') + ' ' + data.get('nachname'))}%0AE-Mail%3A%20${encodeURIComponent(data.get('email'))}%0ASchule%3A%20${encodeURIComponent(data.get('schule') || '')}%0AInteresse%3A%20${encodeURIComponent(data.get('interesse') || '')}%0ANachricht%3A%20${encodeURIComponent(data.get('nachricht') || '')}`;
        window.location.href = mailto;
      }
    } catch {
      const mailto = `mailto:info@picts-ag.ch?subject=Interesse%20PICTS-Netzwerk%20Aargau&body=Name%3A%20${encodeURIComponent(data.get('vorname') + ' ' + data.get('nachname'))}%0AE-Mail%3A%20${encodeURIComponent(data.get('email'))}%0ASchule%3A%20${encodeURIComponent(data.get('schule') || '')}%0AInteresse%3A%20${encodeURIComponent(data.get('interesse') || '')}%0ANachricht%3A%20${encodeURIComponent(data.get('nachricht') || '')}`;
      window.location.href = mailto;
    }
  });