// ──────────────────────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Kontaktformular & Resend Integration
// ──────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── NETLIFY IDENTITY REDIRECT ──
  // Redirect login/invite hashes (e.g. from invite emails) to /admin/
  if (window.location.hash && (
    window.location.hash.startsWith('#invite_token=') ||
    window.location.hash.startsWith('#recovery_token=') ||
    window.location.hash.startsWith('#email_change_token=') ||
    window.location.hash.startsWith('#access_token=')
  )) {
    window.location.href = '/admin/' + window.location.hash;
    return;
  }

  // ── NEWS LOADER ──
  const newsGrid = document.getElementById('news-grid');
  if (newsGrid) {
    loadNews(newsGrid);
  }

  async function loadNews(container) {
    try {
      const response = await fetch('/news-list.json');
      if (!response.ok) throw new Error('Failed to load news');
      const newsItems = await response.json();

      if (newsItems.length > 0) {
        // Clear static placeholder cards
        container.innerHTML = '';

        newsItems.forEach(item => {
          const card = document.createElement('article');
          card.className = 'blog-card';

          let displayDate = item.date;
          if (item.date) {
            const dateObj = new Date(item.date);
            if (!isNaN(dateObj.getTime())) {
              const options = { day: 'numeric', month: 'long', year: 'numeric' };
              displayDate = dateObj.toLocaleDateString('de-CH', options);
            }
          }

          const categoryClass = (item.category || 'initiative').toLowerCase();

          let linkHtml = '';
          if (item.link_url && item.link_text) {
            const isExternalOrPdf = item.link_url.startsWith('http') || item.link_url.endsWith('.pdf');
            const targetAttr = isExternalOrPdf ? ' target="_blank" rel="noopener noreferrer"' : '';
            linkHtml = `
              <a href="${escapeHtml(item.link_url)}" class="blog-link"${targetAttr}>
                ${escapeHtml(item.link_text)}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            `;
          }

          card.innerHTML = `
            <div class="blog-header">
              <div class="blog-meta">
                <span class="blog-date">${escapeHtml(displayDate)}</span>
                <span class="blog-badge ${escapeHtml(categoryClass)}">${escapeHtml(item.category)}</span>
              </div>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <p class="blog-excerpt">${escapeHtml(item.body)}</p>
            ${linkHtml}
          `;
          container.appendChild(card);
        });
      }
    } catch (error) {
      console.warn('Could not load dynamic news, falling back to static HTML:', error);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── KONTAKTFORMULAR LOGIK ──
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
    const name = (formData.get('name') || '').trim();
    const email = (formData.get('email') || '').trim();
    const nachricht = (formData.get('nachricht') || '').trim();
    const schule = (formData.get('schule') || '').trim();
    const telefon = (formData.get('telefon') || '').trim();
    const interesse = (formData.get('interesse') || '').trim();
    const honeypot = formData.get('honeypot_field') || '';

    // Client-side validation
    let validationErrors = [];
    if (!name) {
      validationErrors.push('Bitte gib deinen Namen (Vorname & Nachname) ein.');
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