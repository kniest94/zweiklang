# Zweiklang – Website

Homepage des Duos **Zweiklang** (Saskia & Nicola, Saarland).
Reines HTML, CSS und JavaScript – kein Build-Schritt, läuft direkt auf GitHub Pages.

## Inhalte pflegen

Fast alles, was sich regelmäßig ändert, steht in **`assets/js/inhalte.js`**:

| Was | Wo in `inhalte.js` | Hinweis |
|---|---|---|
| Steckbriefe | `steckbriefe` | Bilder im Format 4:5 nach `assets/img/`. Im `alt`-Text auch den Text im Bild aufschreiben. Ohne `bild` erscheint eine „Steckbrief folgt“-Kachel. |
| Termine | `termine` | Datum als `'JJJJ-MM-TT'`. Vergangene Termine rutschen automatisch nach „Zuletzt gespielt“. |
| Videos | `videos` | `typ: 'mp4'` (Datei in `assets/video/`) oder `typ: 'instagram'` (Link auf ein Reel). |
| Hörproben (mp3) | `hoerproben` | Dateien nach `assets/audio/`. Bereich erscheint erst, wenn die Liste nicht leer ist. |
| Repertoire | `repertoire` | Songs als Liste, z. B. `songs: ['Titel – Interpret']`. |
| Kontakt | `kontakt` | E-Mail, Telefon, WhatsApp-Nummer, Instagram-Name. |

Texte wie „Über uns“ stehen direkt in `index.html`, Impressum und Datenschutz in `impressum.html` und `datenschutz.html`.

## Neues Video hinzufügen

1. Video web-tauglich machen (Handy-Videos sind oft riesig). Mit [ffmpeg](https://ffmpeg.org):

   ```bash
   ffmpeg -i mein-video.mp4 -vf "scale=720:-2" -c:v libx264 -preset slow -crf 25 -c:a aac -b:a 112k -movflags +faststart assets/video/neuer-name.mp4
   ```

2. Vorschaubild (Standbild nach 3 Sekunden) erzeugen:

   ```bash
   ffmpeg -ss 3 -i assets/video/neuer-name.mp4 -frames:v 1 -c:v libwebp -quality 80 assets/video/neuer-name.webp
   ```

3. In `assets/js/inhalte.js` unter `videos` einen Eintrag ergänzen.

GitHub erlaubt maximal 100 MB pro Datei – besser unter 25 MB bleiben.

## Lokal ansehen

Im Projektordner einen kleinen Webserver starten und `http://localhost:5500` öffnen:

```bash
python -m http.server 5500
```

## Veröffentlichen (GitHub Pages)

1. Änderungen committen und auf `main` pushen.
2. Einmalig auf GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. Die Seite erscheint unter `https://kniest94.github.io/zweiklang/`.

Hinweis: Mit einem kostenlosen GitHub-Konto funktioniert Pages nur bei **öffentlichen** Repositories.

### Später: eigene Domain zweiklang-duo.com

1. Im Repo eine Datei `CNAME` mit dem Inhalt `zweiklang-duo.com` anlegen.
2. Beim Domain-Anbieter die DNS-Einträge setzen (A-Records auf GitHub Pages, `www` als CNAME auf `kniest94.github.io`) – siehe [GitHub-Doku](https://docs.github.com/de/pages/configuring-a-custom-domain-for-your-github-pages-site).
3. In `index.html` die Adresse bei `og:image` anpassen.

## Aufbau

```
index.html            Startseite
impressum.html        Impressum
datenschutz.html      Datenschutzerklärung
assets/css/style.css  Gestaltung (Farben und Schriften oben als Variablen)
assets/js/inhalte.js  Inhalte zum Selberpflegen
assets/js/main.js     Seitenlogik (Videos, Termine, Menü, Anfrage)
assets/img/           Logo-Varianten, Fotos, Favicon
assets/video/         Videos (mp4) + Vorschaubilder (webp)
assets/fonts/         Besley + Jost, selbst gehostet (siehe LIZENZ.txt)
Logo/                 Original-Logo (SVG, PDF)
media/                Rohmaterial – wird nicht hochgeladen (.gitignore)
```

## Gestaltung

- Farben aus dem Logo: Weinrot `#840026`, Gold `#b58022`, dazu Puder `#f7eeef` und Keller `#2a0710`.
- Überschriften in **Besley** (Clarendon-Stil, wie alte Konzertplakate), Fließtext in **Jost**, Notizen in **Gochi Hand** (Handschrift wie in den Instagram-Steckbriefen).
- Verspielt: Fotos als Abzüge mit Klebeband, handgezeichnete Kritzel (Sterne, Herzen, Pfeile), die sich beim Scrollen zeichnen, Laufband, Wellen zwischen den Bereichen.
- Das Logo im Aufmacher (`assets/img/logo-animiert.svg`) ist das Original-Logo in Originalfarben, das sich beim Laden aufbaut. Das unbewegte Original liegt als `assets/img/logo.svg` daneben.
- Wer im Betriebssystem „Bewegung reduzieren“ eingestellt hat, sieht die Seite ohne Animationen.
- Keine Cookies, kein Tracking, keine externen Einbindungen – Schriften und Videos liegen im Repo.
