# PICTS-Netzwerk AG – Website Projekt-Status

> **Stand:** 11. Mai 2026, 21:55 Uhr
> **Repo:** https://github.com/KI-Lehrer/picts-ag.git
> **Domain:** www.picts-ag.ch
> **Hosting:** Netlify (neu, vorher GitHub Pages)
> **Verantwortlich:** Sascha Lüscher, 5502 Hunzenschwil

---

## Was wurde gemacht (komplette Überarbeitung)

### Ziel
Die Website soll von Schul- und Behördennetzwerken nicht mehr als verdächtig eingestuft werden. Fokus auf: Vertrauenswürdigkeit, rechtliche Klarheit (Schweizer DSG), technische Sicherheit.

### Erledigte Punkte

#### Inhalt & Recht
- [x] **Impressum vollständig** – Adresse (5502 Hunzenschwil), Hosting-Anbieter (Netlify), URG-Verweis, Versionsdatum
- [x] **Datenschutzerklärung DSG-konform** – Rechtsgrundlagen (Art. 13 DSG), Netlify als Hoster, formelle Anrede (Sie), 8 Abschnitte
- [x] **Betreiberbeschreibung** auf der Startseite (Sektion "Wer steckt dahinter?")
- [x] **TBD-Platzhalter** im Hero entfernt → "2026 / Kick-off folgt"
- [x] **Meta descriptions** auf allen 3 Seiten
- [x] **Differenzierte `<title>`-Tags** pro Seite
- [x] **Schema.org JSON-LD** Structured Data (Organization)

#### Technische Sicherheit
- [x] **Hosting auf Netlify** umgestellt (Security Headers jetzt möglich)
- [x] **Scharfe Content-Security-Policy** via `netlify.toml` und `_headers`:
  ```
  default-src 'self'; style-src 'self'; font-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'
  ```
- [x] **HSTS** mit `max-age=31536000; includeSubDomains; preload`
- [x] **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**, **Permissions-Policy**
- [x] **Null externe Verbindungen** – keine Google Fonts, kein Formspree, keine CDNs

#### Externe Abhängigkeiten & Services
- [x] **Google Fonts → lokal** gehostet (8 woff2-Dateien in `/fonts/`)
- [x] **Formspree → entfernt** – reiner mailto-Versand, kein US-Drittanbieter
- [x] **MailerLite-Integration** – Sichere Anbindung über Netlify Serverless Functions (`netlify/functions/subscribe.js`) zum Schutz des API-Schlüssels und resilienter clientseitiger Mailto-Fallback-Mechanismus in `js/script.js`.
- [x] **Datenschutzerklärung & Disclaimer** – Rechtstexte in `datenschutz.html` und `index.html` DSG-konform für MailerLite aktualisiert.

#### Code-Qualität
- [x] **Alle Inline-Styles → CSS** ausgelagert (0 verbleibend, CSP-kompatibel)
- [x] **Nav-Links auf Unterseiten** korrigiert (→ `index.html#section`)
- [x] **Favicon (SVG)** hinzugefügt
- [x] **script.js** mit IIFE, Null-Check für Seiten ohne Formular
- [x] **noindex** auf Impressum/Datenschutz (rechtliche Seiten)

---

## Aktueller Status / Offene Punkte

### DNS-Migration (in Arbeit)
- Die Domain `www.picts-ag.ch` zeigt möglicherweise noch auf GitHub Pages
- **Aktion nötig:** CNAME-Record bei DNS-Anbieter auf die Netlify-URL umstellen
- SSL-Zertifikat wird von Netlify automatisch erstellt (kann einige Stunden dauern)
- Prüfen mit: `curl -I https://www.picts-ag.ch` → Server sollte `Netlify` zeigen

### GitHub Pages deaktivieren
- Nach erfolgreicher Netlify-Migration: In GitHub Repo Settings → Pages → deaktivieren
- CNAME-Datei im Repo kann dann entfernt werden

### Optional / Zukunft
- [ ] `Permissions-Policy` erweitern wenn nötig
- [ ] Cookie-Banner – aktuell nicht nötig (keine Cookies)
- [ ] Formular auf Netlify Forms umstellen (serverless, kein JS nötig)
- [ ] Inline-Styles komplett vermeiden (für noch strengere CSP ohne `'unsafe-inline'`)

---

## Dateistruktur

```
picts-ag/
├── index.html            # Hauptseite
├── impressum.html        # Impressum
├── datenschutz.html      # Datenschutzerklärung
├── favicon.svg           # SVG Favicon
├── CNAME                 # Domain-Config (kann nach Migration entfernt werden)
├── netlify.toml          # Netlify Build + Security Headers
├── _headers              # Alternative Header-Config für Netlify
├── PICTS-Netzwerk Logo.png
├── css/
│   └── style.css         # Gesamtes Styling inkl. @font-face
├── js/
│   └── script.js         # Kontaktformular (mailto-basiert)
└── fonts/
    ├── dm-sans-latin-normal.woff2
    ├── dm-sans-latin-ext-normal.woff2
    ├── dm-sans-latin-italic.woff2
    ├── dm-sans-latin-ext-italic.woff2
    ├── dm-serif-display-latin-normal.woff2
    ├── dm-serif-display-latin-ext-normal.woff2
    ├── dm-serif-display-latin-italic.woff2
    └── dm-serif-display-latin-ext-italic.woff2
```

---

## Wichtige Konfigurationen

### netlify.toml
Enthält Build-Config (`publish = "."`) und alle Security Headers als scharfe CSP.

### Content-Security-Policy
Aktuell **keine externen Quellen** erlaubt. Falls du z.B. YouTube-Embeds oder externe Bilder einbinden willst, muss die CSP erweitert werden.

### Kontaktformular
- Rein mailto-basiert (script.js)
- Öffnet das Standard-Mailprogramm des Nutzers
- Kein serverseitiger Versand, kein Drittanbieter
- Falls du serverseitigen Versand willst: Netlify Forms aktivieren

---

## Analyse-Dokument
Die vollständige Analyse wurde als Artefakt gespeichert:
`~/.gemini/antigravity/brain/a94a4219-588e-4d3d-8bd6-4dcc9cbaecf4/picts_ag_analyse.md`
