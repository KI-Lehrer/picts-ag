document.addEventListener('DOMContentLoaded', () => {
  const contactsContainer = document.getElementById('contacts-container');
  const refreshBtn = document.getElementById('refresh-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userEmailSpan = document.getElementById('user-email');

  // Initialisiere Netlify Identity
  netlifyIdentity.on('init', user => {
    if (!user) {
      netlifyIdentity.open('login');
    } else {
      setupApp(user);
    }
  });

  netlifyIdentity.on('login', user => {
    netlifyIdentity.close();
    setupApp(user);
  });

  netlifyIdentity.on('logout', () => {
    window.location.reload();
  });

  logoutBtn.addEventListener('click', () => {
    netlifyIdentity.logout();
  });

  refreshBtn.addEventListener('click', () => {
    const user = netlifyIdentity.currentUser();
    if (user) {
      loadContacts(user);
    }
  });

  function setupApp(user) {
    userEmailSpan.textContent = user.email;
    loadContacts(user);
  }

  async function loadContacts(user) {
    contactsContainer.innerHTML = '<div class="loading-state">Lade Kontakte...</div>';
    
    try {
      const token = await user.jwt();
      const response = await fetch('/.netlify/functions/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Nicht autorisiert. Bitte melde dich erneut an.');
        }
        throw new Error('Fehler beim Laden der Kontakte.');
      }

      const contacts = await response.json();
      renderContacts(contacts);

    } catch (error) {
      console.error(error);
      contactsContainer.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
    }
  }

  async function deleteContact(id) {
    if (!confirm('Möchtest du diesen Kontakt wirklich löschen?')) return;

    const user = netlifyIdentity.currentUser();
    if (!user) return;

    try {
      const token = await user.jwt();
      const response = await fetch(`/.netlify/functions/contacts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Kontakts.');
      }

      loadContacts(user);

    } catch (error) {
      alert(error.message);
    }
  }

  window.deleteContact = deleteContact;

  function renderContacts(contacts) {
    if (contacts.length === 0) {
      contactsContainer.innerHTML = '<div class="empty-state">Keine Kontakte in der Datenbank.</div>';
      return;
    }

    contactsContainer.innerHTML = contacts.map(contact => {
      let displayDate = 'Unbekanntes Datum';
      if (contact.createdAt) {
        const dateObj = new Date(contact.createdAt);
        if (!isNaN(dateObj.getTime())) {
          displayDate = dateObj.toLocaleString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      return `
        <div class="contact-card">
          <div class="contact-header">
            <div>
              <span class="contact-date">${escapeHTML(displayDate)}</span>
              <div class="contact-name">${escapeHTML(contact.name)}</div>
            </div>
            <button type="button" class="delete-btn" onclick="deleteContact('${contact.id}')">Löschen</button>
          </div>
          <div class="contact-details">
            <p><strong>E-Mail:</strong> <a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a></p>
            ${contact.schule ? `<p><strong>Schule/Gemeinde:</strong> ${escapeHTML(contact.schule)}</p>` : ''}
            ${contact.telefon ? `<p><strong>Telefon:</strong> ${escapeHTML(contact.telefon)}</p>` : ''}
            ${contact.interesse ? `<p><strong>Interesse:</strong> ${escapeHTML(translateInteresse(contact.interesse))}</p>` : ''}
          </div>
          ${contact.nachricht ? `<div class="contact-message">"${escapeHTML(contact.nachricht)}"</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function translateInteresse(value) {
    const map = {
      'mitmachen': 'Am Netzwerk teilnehmen',
      'kernteam': 'Im Kernteam mitarbeiten',
      'treffen': 'An Treffen teilnehmen',
      'infos': 'Informationen erhalten'
    };
    return map[value] || value;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
    );
  }
});
