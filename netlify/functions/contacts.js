const { getFirestore } = require('./db');

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Authentifizierung prüfen (Netlify Identity JWT)
  const { user } = context.clientContext || {};
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Nicht autorisiert. Bitte melde dich an.' })
    };
  }

  const db = getFirestore();
  if (!db) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Datenbankverbindung fehlgeschlagen (Umgebungsvariablen fehlen).' })
    };
  }

  try {
    // 2. GET: Alle Kontakte abrufen
    if (event.httpMethod === 'GET') {
      const snapshot = await db.collection('contacts').orderBy('createdAt', 'desc').get();
      const contacts = [];
      snapshot.forEach(doc => {
        contacts.push({ id: doc.id, ...doc.data() });
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(contacts)
      };
    }

    // 3. DELETE: Einzelnen Kontakt löschen
    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters || {};
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Kontakt-ID fehlt.' })
        };
      }

      await db.collection('contacts').doc(id).delete();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Kontakt erfolgreich gelöscht.' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Methode nicht erlaubt.' })
    };

  } catch (error) {
    console.error('Fehler in contacts API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Interner Fehler: ' + error.message })
    };
  }
};
