const admin = require('firebase-admin');

function getFirestore() {
  if (!admin.apps.length) {
    const hasEnv = process.env.FIREBASE_PROJECT_ID && 
                   process.env.FIREBASE_CLIENT_EMAIL && 
                   process.env.FIREBASE_PRIVATE_KEY;
    
    if (hasEnv) {
      try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID.trim(),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
            privateKey: privateKey,
          })
        });
      } catch (err) {
        console.error('Fehler bei der Firebase-Initialisierung:', err);
        return null;
      }
    } else {
      console.warn('Firebase-Umgebungsvariablen fehlen. Kontakte werden NICHT in Firestore gespeichert.');
      return null;
    }
  }
  return admin.firestore();
}

module.exports = { getFirestore };
