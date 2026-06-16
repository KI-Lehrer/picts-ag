// ──────────────────────────────────────────────────────────────
// PICTS-Netzwerk Aargau – Serverless Function für Resend
// ──────────────────────────────────────────────────────────────
//
// WICHTIGER HINWEIS:
// Die für diese Funktion erforderlichen Umgebungsvariablen müssen
// im Netlify-Dashboard unter:
// "Site configuration" -> "Environment variables" -> "Add a variable"
// eingetragen werden.
//
// Benötigte Variablen:
// 1. RESEND_API_KEY     - Der API-Key aus deinem Resend-Konto.
// 2. CONTACT_TO_EMAIL   - Deine Empfänger-E-Mail (z.B. luescher.sascha@gmail.com).
// 3. CONTACT_FROM_EMAIL - Die Absender-E-Mail. Muss eine verifizierte Domain
//                         in Resend sein (z.B. noreply@picts-ag.ch).
// ──────────────────────────────────────────────────────────────

const { getFirestore } = require('./db');

exports.handler = async function (event, context) {
  // CORS-Header für lokale Entwicklung und Netlify-Sicherheit
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Preflight-Anfragen (OPTIONS) direkt mit 200 OK beantworten
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
    // JSON Payload aus dem Request-Body auslesen
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ungültiges JSON-Format im Anfragekörper.' })
      };
    }

    const { name, email, nachricht, schule, telefon, interesse, honeypot_field } = data;

    // 1. SPAM-SCHUTZ: Honeypot-Validierung
    // Falls das versteckte Honeypot-Feld befüllt ist, gehen wir von einem Bot aus.
    // Wir antworten stillschweigend mit 200 OK ("success": true), senden aber KEINE E-Mail.
    if (honeypot_field && honeypot_field.trim() !== '') {
      console.warn('Spam-Verdacht: Honeypot-Feld ausgefüllt. Nachricht wird verworfen.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Message processed successfully (honeypot triggered).' })
      };
    }

    // 2. FORMULAR-VALIDIERUNG (Serverseitig)
    if (!name || name.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Der Name ist ein Pflichtfeld.' })
      };
    }

    if (!email || email.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Die E-Mail-Adresse ist ein Pflichtfeld.' })
      };
    }

    // Einfache serverseitige E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Die E-Mail-Adresse ist ungültig.' })
      };
    }

    if (!nachricht || nachricht.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Die Nachricht ist ein Pflichtfeld.' })
      };
    }

    // 2.5 In Firestore speichern (falls konfiguriert)
    const db = getFirestore();
    if (db) {
      try {
        await db.collection('contacts').add({
          name,
          email,
          nachricht,
          schule: schule || '',
          telefon: telefon || '',
          interesse: interesse || '',
          createdAt: new Date().toISOString()
        });
        console.log('Kontakt erfolgreich in Firestore gespeichert.');
      } catch (dbError) {
        console.error('Fehler beim Speichern des Kontakts in Firestore:', dbError);
        // Wir werfen keinen Fehler zurück, damit der E-Mail-Versand trotzdem versucht wird!
      }
    }

    // 3. UMGEBUNGSVARIABLEN ÜBERPRÜFEN
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || 'info@picts-ag.ch';
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey || !toEmail || !fromEmail) {
      console.error('Konfigurationsfehler: Fehlende Umgebungsvariablen in Netlify.');
      console.error('RESEND_API_KEY vorhanden:', !!resendApiKey);
      console.error('CONTACT_TO_EMAIL vorhanden:', !!toEmail);
      console.error('CONTACT_FROM_EMAIL vorhanden:', !!fromEmail);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server-Konfigurationsfehler. Bitte kontaktiere den Administrator.' })
      };
    }

    // E-Mail-Inhalt als sauberes HTML strukturieren
    const emailSubject = `Neue Kontaktanfrage: PICTS-Netzwerk Aargau`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a2a3a; max-width: 600px; margin: 0 auto; border: 1px solid #e2ddd8; border-radius: 12px; padding: 30px; background-color: #ffffff;">
        <h2 style="color: #c1001f; border-bottom: 2px solid #f7e6ea; padding-bottom: 12px; margin-top: 0; font-size: 20px;">Neue Anfrage über das Web-Kontaktformular</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 30%; border-bottom: 1px solid #f8f7f4; vertical-align: top;">Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f8f7f4; vertical-align: top;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f8f7f4; vertical-align: top;">E-Mail-Adresse:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f8f7f4; vertical-align: top;"><a href="mailto:${escapeHtml(email)}" style="color: #c1001f; text-decoration: none;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f8f7f4; vertical-align: top;">Schule / Gemeinde:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f8f7f4; vertical-align: top;">${schule ? escapeHtml(schule) : '<em>Keine Angabe</em>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f8f7f4; vertical-align: top;">Telefonnummer:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f8f7f4; vertical-align: top;">${telefon ? escapeHtml(telefon) : '<em>Keine Angabe</em>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f8f7f4; vertical-align: top;">Mein Interesse:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f8f7f4; vertical-align: top;">${interesse ? translateInteresse(interesse) : '<em>Keine Angabe</em>'}</td>
          </tr>
        </table>
        
        <div style="margin-top: 25px; padding: 20px; background-color: #f8f7f4; border-radius: 8px; border-left: 4px solid #c1001f;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 15px; color: #1a2a3a;">Nachricht:</h3>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14.5px; color: #2e4256;">${escapeHtml(nachricht)}</p>
        </div>
        
        <div style="margin-top: 30px; border-top: 1px solid #e2ddd8; padding-top: 15px; font-size: 11px; color: #8a9aaa; text-align: center;">
          Gesendet über das Formular auf <a href="https://www.picts-ag.ch" style="color: #8a9aaa;">www.picts-ag.ch</a>.
        </div>
      </div>
    `;

    // 4. API-AUFRUF AN RESEND (Natives Fetch in Node.js 18+)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        reply_to: email, // Ermöglicht das direkte Antworten auf die E-Mail des Benutzers
        subject: emailSubject,
        html: emailHtml
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API-Fehler:', resendResult);
      return {
        statusCode: resendResponse.status,
        headers,
        body: JSON.stringify({ 
          error: resendResult.message || 'Die E-Mail konnte nicht über Resend gesendet werden.' 
        })
      };
    }

    // Erfolgreiche Antwort zurückgeben
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Nachricht erfolgreich gesendet.' 
      })
    };

  } catch (error) {
    console.error('Ausnahme bei Verarbeitung des Kontaktformulars:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ein interner Fehler ist aufgetreten.' })
    };
  }
};

// Helper: HTML-Zeichen maskieren, um HTML-Injection im E-Mail-Client zu verhindern
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Interesse-Werte übersetzen
function translateInteresse(value) {
  const map = {
    'mitmachen': 'Am Netzwerk teilnehmen',
    'kernteam': 'Im Kernteam mitarbeiten',
    'treffen': 'An Treffen teilnehmen',
    'infos': 'Informationen erhalten'
  };
  return map[value] || escapeHtml(value);
}
