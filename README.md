# PICTS-Netzwerk Aargau – Kontaktformular-Setup mit Netlify & Resend

Dieses Projekt enthält eine produktionsreife statische Website für das **PICTS-Netzwerk Kanton Aargau**. Das Kontaktformular arbeitet ohne eigenes Backend oder externe Skripte auf Clientseite, indem es eine Netlify Serverless Function und den Maildienst **Resend** nutzt.

---

## 📋 Features des Kontaktformulars
- **Kein lokales Mailprogramm:** Der Versand erfolgt komplett im Hintergrund serverseitig.
- **Sicherheit:** Keine API-Keys oder Zugangsdaten im Frontend-Code sichtbar.
- **Spam-Schutz:** Integriertes Honeypot-Feld und serverseitige Validierung blockieren Bots.
- **Barrierefreiheit (a11y):** Semantisches HTML, vollständige Verknüpfung von Labels und Inputs sowie `role="alert"` für Fehlerbehandlung.
- **Benutzererfahrung:** Visuelles Feedback (Lade-Spinner, Inline-Erfolgsmeldung, Inline-Fehlermeldungen).
- **Kein MailerLite / Kein mailto:** Erfüllt die strikten Datenschutzanforderungen.

---

## 🚀 Schritt-für-Schritt-Anleitung zur Einrichtung

### 1. Projekt auf Netlify deployen
Es gibt zwei einfache Wege, die Seite auf Netlify zu veröffentlichen:
- **Über Git (Empfohlen):**
  1. Lade das Projekt in dein GitHub-Repository hoch.
  2. Logge dich bei [Netlify](https://www.netlify.com/) ein und klicke auf **"Add new site" -> "Import an existing project"**.
  3. Wähle dein Repository aus. Die Einstellungen in der Datei `netlify.toml` werden automatisch erkannt (Publish-Verzeichnis: `.`, Functions-Verzeichnis: `netlify/functions`).
- **Über Netlify Drop:**
  1. Ziehe den gesamten Ordner `Website picts-ag` einfach per Drag & Drop in das [Netlify Drop Dashboard](https://app.netlify.com/drop).

---

### 2. Resend-Konto erstellen
1. Registriere dich auf [Resend](https://resend.com/) für ein kostenloses Konto.
2. Gehe in deinem Resend-Dashboard zu **API Keys** und klicke auf **"Create API Key"**.
3. Kopiere den generierten API-Key. (Du benötigst ihn im Schritt 4).

---

### 3. Domain bei Resend verifizieren
Damit Resend E-Mails im Namen deiner Domain (z.B. `@picts-ag.ch`) senden darf, muss die Domain verifiziert werden:
1. Navigiere in Resend zu **Domains** und klicke auf **"Add Domain"**.
2. Trage deine Domain ein (z.B. `picts-ag.ch`) und wähle deine Region.
3. Resend stellt dir DNS-Einträge (DKIM, SPF und TXT) zur Verfügung.
4. Trage diese DNS-Einträge im Administrations-Panel deines Domain-Registrars ein (z.B. Hostpoint, Metanet, Switchplus etc.).
5. Warte, bis der Status in Resend auf **"Verified"** wechselt (kann zwischen 2 und 24 Stunden dauern).

---

### 4. Umgebungsvariablen in Netlify setzen
Um deinen API-Key und die E-Mail-Adressen sicher zu hinterlegen, verwende Netlify Environment Variables:
1. Logge dich im **Netlify Dashboard** ein.
2. Gehe zu deiner Seite und navigiere zu **Site configuration** -> **Environment variables**.
3. Klicke auf **"Add a variable"** (bzw. "Import from .env") und erstelle folgende Variablen:

| Variable | Beschreibung | Beispiel |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | Der API-Key aus deinem Resend-Konto. | `re_1234567890abcdef...` |
| `CONTACT_TO_EMAIL` | Die E-Mail-Adresse, an welche die Anfragen gesendet werden. | `luescher.sascha@gmail.com` |
| `CONTACT_FROM_EMAIL` | Die Absenderadresse. **Wichtig:** Muss eine verifizierte Adresse deiner Resend-Domain sein! | `noreply@picts-ag.ch` |

*Hinweis: Wenn du die Domain verifiziert hast, kannst du jede Adresse dieser Domain als Absender verwenden (z.B. `noreply@picts-ag.ch` oder `kontakt@picts-ag.ch`).*

---

### 5. Formular testen
1. Besuche deine Live-Website auf Netlify.
2. Fülle das Kontaktformular mit Testdaten aus und klicke auf **"Interesse anmelden"**.
3. Du solltest sofort eine Lade-Animation sehen, gefolgt von einer grünen Erfolgsmeldung: *„Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt.“*
4. Überprüfe den Posteingang der unter `CONTACT_TO_EMAIL` hinterlegten Adresse. Du solltest eine strukturierte HTML-E-Mail erhalten.
5. Klicke in deinem E-Mail-Client auf **"Antworten"** – die Antwort-Adresse (`Reply-To`) sollte automatisch auf die im Formular eingegebene E-Mail-Adresse des Absenders verweisen.

---

## 🛠️ Lokale Entwicklung und Testen

Du kannst die Serverless Functions auch lokal testen, ohne sie jedes Mal zu deployen. Dazu wird das **Netlify CLI** benötigt:

1. Installiere das Netlify CLI global auf deinem System:
   ```bash
   npm install -g netlify-cli
   ```
2. Erstelle eine `.env` Datei im Stammverzeichnis des Projekts (wird von Git ignoriert) und füge deine Umgebungsvariablen hinzu:
   ```env
   RESEND_API_KEY=re_dein_resend_api_key
   CONTACT_TO_EMAIL=deine_empfaenger_email@domain.com
   CONTACT_FROM_EMAIL=deine_verifizierte_absender_email@domain.com
   ```
3. Starte den lokalen Netlify-Entwicklungsserver im Projektordner:
   ```bash
   netlify dev
   ```
4. Die Website läuft nun lokal unter `http://localhost:8888`. Das Formular leitet Anfragen an deine lokale Function weiter und sendet echte E-Mails via Resend.
