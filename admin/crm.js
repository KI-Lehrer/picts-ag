// Globaler Fehler-Handler für einfaches Debugging
window.onerror = function(message, source, lineno, colno, error) {
  alert("JavaScript-Fehler: " + message + "\nQuelle: " + source + "\nZeile: " + lineno);
};

window.addEventListener('unhandledrejection', function(event) {
  alert("Unbehandelter Promise-Fehler: " + event.reason);
});

// Globale Variable zum Zwischenspeichern der geladenen Kontakte
let loadedContacts = [];

// Registriere Identity-Events sofort, um Race Conditions zu vermeiden
netlifyIdentity.on('init', user => {
  if (!user) {
    netlifyIdentity.open('login');
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setupApp(user));
    } else {
      setupApp(user);
    }
  }
});

netlifyIdentity.on('login', user => {
  netlifyIdentity.close();
  setupApp(user);
});

netlifyIdentity.on('logout', () => {
  window.location.reload();
});

function setupApp(user) {
  const userEmailSpan = document.getElementById('user-email');
  if (userEmailSpan) {
    userEmailSpan.textContent = user.email;
  }
  loadContacts(user);
}

async function loadContacts(user) {
  const contactsContainer = document.getElementById('contacts-container');
  if (!contactsContainer) return;
  
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
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Fehler beim Laden der Kontakte (Status ' + response.status + ').');
    }

    loadedContacts = await response.json();
    renderContacts(loadedContacts);

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
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Fehler beim Löschen des Kontakts.');
    }

    loadContacts(user);

  } catch (error) {
    alert(error.message);
  }
}

// Modal Öffnen für Bearbeitung (Edit Mode)
function openEditModal(id) {
  const contact = loadedContacts.find(c => c.id === id);
  if (!contact) {
    alert("Kontakt nicht gefunden.");
    return;
  }

  // Modal-Titel anpassen
  const modalHeader = document.querySelector('#edit-modal h2');
  if (modalHeader) modalHeader.textContent = 'Kontakt bearbeiten';

  // Modus setzen
  const editForm = document.getElementById('edit-contact-form');
  if (editForm) editForm.setAttribute('data-mode', 'edit');

  // Formularfelder befüllen
  document.getElementById('edit-id').value = contact.id;
  document.getElementById('edit-name').value = contact.name || '';
  document.getElementById('edit-email').value = contact.email || '';
  document.getElementById('edit-school').value = contact.schule || '';
  document.getElementById('edit-phone').value = contact.telefon || '';
  document.getElementById('edit-interest').value = contact.interesse || '';
  document.getElementById('edit-message').value = contact.nachricht || '';
  document.getElementById('edit-status').value = contact.status || 'Neu';
  document.getElementById('edit-notizen').value = contact.notizen || '';

  // Modal anzeigen
  document.getElementById('edit-modal').style.display = 'flex';
}

// Modal Öffnen für Neuerstellung (Create Mode)
function openCreateModal() {
  // Modal-Titel anpassen
  const modalHeader = document.querySelector('#edit-modal h2');
  if (modalHeader) modalHeader.textContent = 'Neuen Kontakt anlegen';

  // Modus setzen
  const editForm = document.getElementById('edit-contact-form');
  if (editForm) editForm.setAttribute('data-mode', 'create');

  // Formularfelder leeren
  document.getElementById('edit-id').value = '';
  document.getElementById('edit-name').value = '';
  document.getElementById('edit-email').value = '';
  document.getElementById('edit-school').value = '';
  document.getElementById('edit-phone').value = '';
  document.getElementById('edit-interest').value = '';
  document.getElementById('edit-message').value = '';
  document.getElementById('edit-status').value = 'Neu';
  document.getElementById('edit-notizen').value = '';

  // Modal anzeigen
  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Global binden für onclick-Attribute in HTML
window.deleteContact = deleteContact;
window.openEditModal = openEditModal;
window.openCreateModal = openCreateModal;
window.closeEditModal = closeEditModal;

function renderContacts(contacts) {
  const contactsContainer = document.getElementById('contacts-container');
  if (!contactsContainer) return;

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

    // Status Badge auslesen und stylen
    const status = contact.status || 'Neu';
    const statusClass = 'status-' + status.toLowerCase().replace(/\s+/g, '-');

    // Interne Notizen vorbereiten
    const notesHtml = contact.notizen ? `
      <div class="admin-notes-section">
        <div class="admin-notes-title">Interne Notizen</div>
        <div class="admin-notes-text">${escapeHTML(contact.notizen)}</div>
      </div>
    ` : '';

    return `
      <div class="contact-card">
        <div class="contact-header">
          <div>
            <span class="contact-date">${escapeHTML(displayDate)}</span>
            <div class="contact-name">
              ${escapeHTML(contact.name)}
              <span class="status-badge ${statusClass}">${escapeHTML(status)}</span>
            </div>
          </div>
          <div class="btn-group">
            <button type="button" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;" onclick="openEditModal('${contact.id}')">Bearbeiten</button>
            <button type="button" class="delete-btn" onclick="deleteContact('${contact.id}')">Löschen</button>
          </div>
        </div>
        <div class="contact-details">
          <p><strong>E-Mail:</strong> <a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a></p>
          ${contact.schule ? `<p><strong>Schule/Gemeinde:</strong> ${escapeHTML(contact.schule)}</p>` : ''}
          ${contact.telefon ? `<p><strong>Telefon:</strong> ${escapeHTML(contact.telefon)}</p>` : ''}
          ${contact.interesse ? `<p><strong>Interesse:</strong> ${escapeHTML(translateInteresse(contact.interesse))}</p>` : ''}
        </div>
        ${contact.nachricht ? `<div class="contact-message">"${escapeHTML(contact.nachricht)}"</div>` : ''}
        ${notesHtml}
      </div>
    `;
  }).join('');
}

function translateInteresse(value) {
  const map = {
    'mitmachen': 'Am Netzwerk teilnehmen',
    'kernteam': 'Im Kernteam mitarbeiten',
    'treffen': 'An Treffen teilnehmen',
    'interesse': 'Interesse anmelden',
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

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const addContactBtn = document.getElementById('add-contact-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const editForm = document.getElementById('edit-contact-form');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      netlifyIdentity.logout();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const user = netlifyIdentity.currentUser();
      if (user) {
        loadContacts(user);
      } else {
        alert("Kein Benutzer eingeloggt. Bitte melde dich an.");
        netlifyIdentity.open('login');
      }
    });
  }

  if (addContactBtn) {
    addContactBtn.addEventListener('click', () => {
      openCreateModal();
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = netlifyIdentity.currentUser();
      if (!user) return;

      const mode = editForm.getAttribute('data-mode') || 'edit';
      const id = document.getElementById('edit-id').value;
      const payload = {
        name: document.getElementById('edit-name').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        schule: document.getElementById('edit-school').value.trim(),
        telefon: document.getElementById('edit-phone').value.trim(),
        interesse: document.getElementById('edit-interest').value,
        nachricht: document.getElementById('edit-message').value.trim(),
        status: document.getElementById('edit-status').value,
        notizen: document.getElementById('edit-notizen').value.trim()
      };

      // Button in Ladezustand versetzen
      const submitBtn = editForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Speichert...';

      try {
        const token = await user.jwt();
        
        let url = '/.netlify/functions/contacts';
        let method = 'POST';

        if (mode === 'edit') {
          url = `/.netlify/functions/contacts?id=${id}`;
          method = 'PUT';
        }

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Fehler beim Speichern des Kontakts.');
        }

        closeEditModal();
        loadContacts(user);
      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
