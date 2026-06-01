// ──────────────────────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Serverless Function für MailerLite
// ──────────────────────────────────────────────────────────────

exports.handler = async function (event, context) {
  // CORS-Header für lokale Entwicklung und Netlify-Sicherheit
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Preflight-Anfragen (OPTIONS) direkt beantworten
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Nur POST-Anfragen erlauben
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Methode nicht erlaubt.' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { email, vorname, nachname, schule, telefon, interesse, nachricht } = data;

    // Validierung der Pflichtfelder
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'E-Mail-Adresse ist erforderlich.' })
      };
    }

    // API-Key aus Netlify Umgebungsvariablen auslesen
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY ist nicht in den Netlify-Umgebungsvariablen konfiguriert.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server-Konfigurationsfehler. API-Key fehlt.' })
      };
    }

    // Felder für MailerLite vorbereiten (Standard- und benutzerdefinierte Felder)
    // Hinweis: Die Felder 'name' und 'last_name' sind standardmässig in MailerLite vorhanden.
    // Eigene Felder wie 'schule', 'interesse', 'nachricht' müssen in MailerLite als benutzerdefinierte Felder angelegt sein.
    const fields = {
      name: vorname || '',
      last_name: nachname || ''
    };

    if (schule) fields.schule = schule;
    if (telefon) fields.phone = telefon; // 'phone' ist oft ein Standardfeld in MailerLite
    if (interesse) fields.interesse = interesse;
    if (nachricht) fields.nachricht = nachricht;

    // Optional: Falls du eine bestimmte Gruppe (z.B. "Mitglieder") hast, kannst du die ID hier eintragen
    const groupId = process.env.MAILERLITE_GROUP_ID;

    // Body für die MailerLite API v2
    const mailerliteBody = {
      email: email,
      fields: fields
    };

    // Falls eine Gruppen-ID hinterlegt ist, fügen wir diese hinzu
    if (groupId) {
      mailerliteBody.groups = [groupId];
    }

    // API-Aufruf an MailerLite (Verwendung von nativem fetch in Node 18+)
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(mailerliteBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('MailerLite API-Fehler:', result);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: result.message || 'Fehler bei der Übertragung an MailerLite.',
          details: result.errors || null
        })
      };
    }

    // Erfolgreiche Antwort zurückgeben
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Erfolgreich bei MailerLite eingetragen.' 
      })
    };

  } catch (error) {
    console.error('Ausnahme bei Formularübertragung:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Interner Serverfehler bei der Verarbeitung des Formulars.' })
    };
  }
};
