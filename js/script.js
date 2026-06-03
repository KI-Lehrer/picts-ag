// ──────────────────────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Kontaktformular & Resend Integration
// ──────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const successMessage = document.getElementById('form-success');

  // Create an error container if it doesn't exist yet
  let errorMessage = document.getElementById('form-error');
  if (form && !errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.id = 'form-error';
    errorMessage.setAttribute('role', 'alert');
    form.parentNode.insertBefore(errorMessage, form.nextSibling);
  }

  // Execute only on pages that contain the contact form
  if (!form || !successMessage) return;

  const submitBtn = form.querySelector('.form-submit');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Interesse anmelden →';

  // Email format validation helper
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Reset messages and states
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    successMessage.style.display = 'none';

    const formData = new FormData(form);
    
    // Extract input fields
    const vorname = (formData.get('vorname') || '').trim();
    const nachname = (formData.get('nachname') || '').trim();
    const name = `${vorname} ${nachname}`.trim();
    const email = (formData.get('email') || '').trim();
    const nachricht = (formData.get('nachricht') || '').trim();
    const schule = (formData.get('schule') || '').trim();
    const telefon = (formData.get('telefon') || '').trim();
    const interesse = (formData.get('interesse') || '').trim();
    const honeypot = formData.get('honeypot_field') || '';

    // Client-side validation
    let validationErrors = [];
    if (!vorname) {
      validationErrors.push('Bitte gib deinen Vornamen ein.');
    }
    if (!nachname) {
      validationErrors.push('Bitte gib deinen Nachnamen ein.');
    }
    if (!email) {
      validationErrors.push('Bitte gib deine E-Mail-Adresse ein.');
    } else if (!isValidEmail(email)) {
      validationErrors.push('Bitte gib eine gültige E-Mail-Adresse ein.');
    }
    if (!nachricht) {
      validationErrors.push('Bitte gib eine Nachricht ein.');
    }

    if (validationErrors.length > 0) {
      errorMessage.innerHTML = '<strong>Es sind Fehler aufgetreten:</strong><br>' + validationErrors.join('<br>');
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Set UI to loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Wird gesendet...';
    }

    // Prepare JSON payload
    const payload = {
      name,
      email,
      nachricht,
      schule,
      telefon,
      interesse,
      honeypot_field: honeypot
    };

    try {
      // Send data to the Netlify Serverless Function
      const response = await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        result = { error: 'Ungültige Serverantwort.' };
      }

      if (response.ok && result.success) {
        // Success: Hide form and show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Validation/Server error
        const errorText = result.error || 'Es gab ein Problem beim Übermitteln der Nachricht.';
        errorMessage.innerHTML = `<strong>Fehler:</strong> ${errorText}`;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      // Connection/Network error
      console.error('Netzwerkfehler:', error);
      errorMessage.innerHTML = '<strong>Verbindungsfehler:</strong> Die Anfrage konnte nicht gesendet werden. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      // Restore submit button state if submission failed
      if (submitBtn && form.style.display !== 'none') {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
})();