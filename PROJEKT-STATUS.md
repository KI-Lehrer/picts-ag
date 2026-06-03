# PICTS-Netzwerk AG – Website Projekt-Status

> **Stand:** 3. Juni 2026, 22:30 Uhr
> **Repo:** https://github.com/ki-lehrer/picts-ag.git
> **Domain:** www.picts-ag.ch
> **Hosting:** Netlify (mit automatischem Build & Deploy bei `git push origin main`)
> **Verantwortlich:** Sascha Lüscher, 5502 Hunzenschwil

---

## Was wurde gemacht (Komplette Überarbeitung & Schutz-Integration)

### Ziel
Die Website soll von Schul- und Behördennetzwerken nicht mehr als verdächtig eingestuft werden (Schutz vor Falsch-Positiv-Filterung) und gleichzeitig vollkommen DSG-konform (Schweizer Datenschutzgesetz) arbeiten.

### Erledigte Punkte

#### 1. Formular-Spam-Schutz & E-Mail-Integration
- [x] **Honeypot-Spam-Schutz:** In `index.html` wurde ein verstecktes Honeypot-Feld (`honeypot_field`) integriert. Bots füllen dieses Feld automatisch aus, woraufhin die Serverless Function die Anfrage verwirft, dem Client aber ein erfolgreiches Absenden vorspiegelt (`200 OK`).
- [x] **Trennung Vorname/Nachname:** Die Namenseingabe wurde in separate Felder für Vorname und Nachname aufgeteilt, um eine präzisere Datenverarbeitung zu gewährleisten.
- [x] **Clientseitige Validierung (`js/script.js`):** Führt Validierungsprüfungen durch und zeigt Fehlermeldungen dynamisch im Formular an. Verhindert doppeltes Absenden durch Deaktivierung des Buttons und Hinzufügen einer Ladeanimation.
- [x] **Resend-Integration (`netlify/functions/contact.js`):** Sichere Serverless Function zum Schutz des Resend API-Schlüssels. Sendet E-Mails als formatiertes HTML mit allen Formulardaten und setzt `reply_to` auf die Benutzer-E-Mail.

#### 2. Inhalt & Recht (DSG-konform)
- [x] **Impressum vollständig:** Genaue Angaben (Adresse, URG-Verweis, Versionsdatum, Hosting-Details).
- [x] **Datenschutzerklärung DSG-konform:** Detaillierte Abschnitte zur Datenverarbeitung, E-Mail-Übertragung via Resend und Hosting via Netlify.
- [x] **Noindex-Tags:** Die rechtlichen Seiten (`impressum.html`, `datenschutz.html`) besitzen ein `<meta name="robots" content="noindex">` Tag, damit sie in Suchmaschinen nicht unnötig ranken.
- [x] **Betreiberbeschreibung:** Neuer Abschnitt "Hintergrund" auf der Startseite ("Wer steht hinter dem Netzwerk?").

#### 3. Technische Sicherheit (CSP & HSTS)
- [x] **Lokale Ressourcen (Null externe CDNs):** Keine Aufrufe an externe Server. Die Google Fonts (`DM Sans` und `DM Serif Display`) sind lokal als `.woff2`-Dateien in `/fonts/` hinterlegt.
- [x] **Keine Inline-Styles:** Sämtliche Inline-Styles wurden entfernt und ins Stylesheet (`css/style.css`) ausgelagert.
- [x] **Scharfe Content-Security-Policy (CSP):** Konfiguriert in `netlify.toml` und `_headers`:
  ```http
  default-src 'self'; style-src 'self'; font-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'
  ```
- [x] **HSTS & Security Headers:** HSTS ist mit `max-age=31536000; includeSubDomains; preload` aktiv, ebenso `X-Frame-Options`, `X-Content-Type-Options` und `Referrer-Policy`.

#### 4. Flyer-Integration (A4-Infoblatt)
- [x] **A4-Infoblatt:** Der Flyer liegt unter `/flyer/` (`Website picts-ag/Website picts-ag/flyer/`) und ist über `www.picts-ag.ch/flyer/` live erreichbar.
- [x] **Print-Optimierung:** Über `@media print` werden alle UI-Elemente wie Navigation, Footer und Druck-Schaltflächen ausgeblendet. Der Flyer lässt sich pixelgenau auf A4 ausdrucken.
- [x] **Integration Website:** Download-Box in der Sektion "Dabei sein" sowie Links im Menü und Footer eingefügt.

---

## Wichtige Konfigurationen (Netlify-Dashboard)

Für den E-Mail-Versand müssen im Netlify-Dashboard unter **Site configuration -> Environment variables** folgende Variablen definiert sein:
1. `RESEND_API_KEY`: API-Token von Resend.
2. `CONTACT_FROM_EMAIL`: Absenderadresse (z. B. `noreply@picts-ag.ch`). Muss eine in Resend verifizierte Domain sein.
3. `CONTACT_TO_EMAIL`: Zieladresse für Anfragen (z. B. `info@picts-ag.ch`). Besitzt einen Fallback in der Serverless Function.

---

## Aktueller Status / Offene Punkte

1. **DNS-Migration prüfen:**
   - Zeigt `www.picts-ag.ch` bereits auf die Netlify-Subdomain (z.B. `picts-ag.netlify.app`)?
   - Test im Terminal: `curl -I https://www.picts-ag.ch` (Der Header `Server` sollte `Netlify` anzeigen).
2. **GitHub Pages deaktivieren:**
   - Sobald Netlify live ist, GitHub Pages in den Repo-Einstellungen deaktivieren und die Datei `CNAME` löschen.
3. **Formulartest durchführen:**
   - Eine Testnachricht über das Formular senden, um die Resend-Zustellung live zu verifizieren.

---

## Lokale Entwicklung (auf jedem PC)

1. **Netlify CLI installieren:**
   ```bash
   npm install -g netlify-cli
   ```
2. **Entwicklungsserver starten:**
   Im Verzeichnis `/Website picts-ag/Website picts-ag/` ausführen:
   ```bash
   netlify dev
   ```
   *Dies startet die Seite auf `http://localhost:8888` und stellt die Serverless-Funktion unter `/.netlify/functions/contact` bereit.*
3. **Änderungen pushen:**
   ```bash
   git add -A
   git commit -m "style: beschreibe die aenderung"
   git push origin main
   ```

---

## Dateistruktur

```
picts-ag/
├── index.html            # Hauptseite
├── impressum.html        # Impressum
├── datenschutz.html      # Datenschutzerklärung
├── netlify.toml          # Netlify Build + Security Headers
├── _headers              # HTTP-Header für Netlify
├── PICTS-Netzwerk Logo.png
├── css/
│   └── style.css         # Styling der Hauptseite
├── js/
│   └── script.js         # JavaScript (Validierung & AJAX-Versand)
├── netlify/
│   └── functions/
│       └── contact.js    # E-Mail-Versand via Resend API (Serverless Function)
├── fonts/
│   └── *.woff2           # Lokale Schriften (DM Sans, DM Serif Display)
└── flyer/                # A4 Infoblatt-Kopie
    ├── index.html
    ├── qrcode.svg
    └── PICTS-Netzwerk Logo.png
```
