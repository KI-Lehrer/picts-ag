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

// Global binden für Modal-Steuerung
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
            <button type="button" class="btn-secondary edit-btn" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;" data-id="${contact.id}">Bearbeiten</button>
            <button type="button" class="delete-btn" data-id="${contact.id}">Löschen</button>
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

// Excel Export Funktion
function exportToExcel() {
  if (loadedContacts.length === 0) {
    alert("Keine Kontakte zum Exportieren vorhanden.");
    return;
  }

  const dataToExport = loadedContacts.map(contact => {
    let formattedDate = '';
    if (contact.createdAt) {
      const d = new Date(contact.createdAt);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleString('de-CH');
      }
    }

    return {
      'ID': contact.id || '',
      'Name': contact.name || '',
      'E-Mail': contact.email || '',
      'Schule/Gemeinde': contact.schule || '',
      'Telefon': contact.telefon || '',
      'Interesse': translateInteresse(contact.interesse),
      'Nachricht': contact.nachricht || '',
      'Status': contact.status || 'Neu',
      'Interne Notizen': contact.notizen || '',
      'Erstellt am': formattedDate
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kontakte");

  XLSX.writeFile(workbook, `PICTS_Netzwerk_Kontakte_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Excel Import Handler
async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) {
        alert("Die Excel-Datei enthält keine Daten.");
        return;
      }

      if (!confirm(`Möchtest du wirklich ${jsonData.length} Kontakte importieren?`)) {
        event.target.value = '';
        return;
      }

      const user = netlifyIdentity.currentUser();
      if (!user) {
        alert("Bitte melde dich an, um Daten zu importieren.");
        return;
      }

      const token = await user.jwt();
      let importedCount = 0;
      let failedCount = 0;

      const contactsContainer = document.getElementById('contacts-container');
      contactsContainer.innerHTML = `<div class="loading-state">Importiere Kontakte (0 / ${jsonData.length})... Bitte warten.</div>`;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        const name = row['Name'] || row['name'] || '';
        const email = row['E-Mail'] || row['email'] || row['Email'] || '';
        
        if (!name.toString().trim() || !email.toString().trim()) {
          console.warn(`Zeile ${i + 2} übersprungen: Name und E-Mail sind Pflichtfelder.`, row);
          failedCount++;
          continue;
        }

        let interestValue = row['Interesse'] || row['interesse'] || '';
        const deMap = {
          'Am Netzwerk teilnehmen': 'mitmachen',
          'Im Kernteam mitarbeiten': 'kernteam',
          'An Treffen teilnehmen': 'treffen',
          'Interesse anmelden': 'interesse',
          'Informationen erhalten': 'infos'
        };
        if (deMap[interestValue]) {
          interestValue = deMap[interestValue];
        }

        const payload = {
          name: name.toString().trim(),
          email: email.toString().trim(),
          schule: row['Schule/Gemeinde'] || row['schule'] || row['Schule'] ? (row['Schule/Gemeinde'] || row['schule'] || row['Schule']).toString().trim() : '',
          telefon: row['Telefon'] || row['telefon'] ? (row['Telefon'] || row['telefon']).toString().trim() : '',
          interesse: interestValue.toString().trim(),
          nachricht: row['Nachricht'] || row['nachricht'] ? (row['Nachricht'] || row['nachricht']).toString().trim() : '',
          status: row['Status'] || row['status'] || 'Neu',
          notizen: row['Interne Notizen'] || row['notizen'] || row['Notizen'] ? (row['Interne Notizen'] || row['notizen'] || row['Notizen']).toString().trim() : ''
        };

        try {
          const response = await fetch('/.netlify/functions/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            importedCount++;
          } else {
            const errBody = await response.text();
            console.error(`Fehler beim Importieren von Zeile ${i + 2}:`, errBody);
            failedCount++;
          }
        } catch (fetchErr) {
          console.error(`Netzwerkfehler beim Importieren von Zeile ${i + 2}:`, fetchErr);
          failedCount++;
        }

        contactsContainer.innerHTML = `<div class="loading-state">Importiere Kontakte (${importedCount + failedCount} / ${jsonData.length})... Bitte warten.</div>`;
      }

      alert(`Import abgeschlossen!\nErfolgreich: ${importedCount}\nFehlgeschlagen: ${failedCount}`);
      loadContacts(user);

    } catch (err) {
      alert("Fehler beim Lesen der Excel-Datei: " + err.message);
      loadContacts(netlifyIdentity.currentUser());
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsArrayBuffer(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const addContactBtn = document.getElementById('add-contact-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const editForm = document.getElementById('edit-contact-form');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const contactsContainer = document.getElementById('contacts-container');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFileInput = document.getElementById('import-file-input');

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

  // Klick-Delegierung für Bearbeiten & Löschen Buttons, da CSP Inline JavaScript verbietet
  if (contactsContainer) {
    contactsContainer.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        openEditModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        deleteContact(id);
      }
    });
  }

  // Excel Buttons binden
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToExcel();
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });
    importFileInput.addEventListener('change', handleImport);
  }

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
