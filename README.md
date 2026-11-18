# Zweiklang – Website und Inhaltspflege

Statische Website des Duos Zweiklang, Saskia und Nicola. HTML, CSS und JavaScript ohne Framework oder Build-Schritt; Hosting auf GitHub Pages.

## Inhalte bearbeiten

Im Browser Pages CMS öffnen, `zweiklang` auswählen und auf **main** arbeiten. Jeder Speichervorgang wird nach der GitHub-Pages-Bereitstellung öffentlich. Der frühere Testbranch wurde auf Nutzerwunsch gelöscht. Die abgenommene Optik bleibt unverändert.

Formulare: Termine, Repertoire, Galerie, Videos, Videogruppen, Steckbriefe, Hörproben, Kontakt sowie Seitentexte/Aufmacher. Bilder, MP4 und MP3 können über benannte Medienquellen ausgewählt/hochgeladen werden. Impressum und Datenschutz haben getrennte erweiterte HTML-Editoren; dort nur Text ändern und keine HTML-Struktur bearbeiten.

Die ausführliche kurze Pflegeanleitung einschließlich Mediengrenzen, Veröffentlichung und Fehlerbehandlung steht in [docs/INHALTSPFLEGE.md](docs/INHALTSPFLEGE.md).

## Aufbau

- `.pages.yml`: CMS-Formulare und Medienquellen.
- `content/*.json`: neun Inhaltsdateien, keine zweite manuell gepflegte JavaScript-Kopie.
- `assets/js/inhalte.js`: kompatible Initialisierung, keine Inhaltsdaten.
- `assets/js/inhalt-laden.js`: unabhängiges Laden, Validieren und Zeitlimits.
- `assets/js/main.js`: Seitendarstellung und Interaktion.
- `index.html`: unveränderte HTML-Gestaltung und Fallbacktexte.
- `impressum.html`, `datenschutz.html`: unveränderte rechtliche Seiten.
- `assets/css/`, `assets/fonts/`, `Logo/`: abgenommene Gestaltung, Schriften und Logos.
- `assets/img/`, `assets/video/`, `assets/audio/`: öffentlich verwendete Medien.

## Lokal prüfen

```sh
node --test
python3 -m http.server 5500 --bind 127.0.0.1
```

Danach `http://localhost:5500/` öffnen; nicht per `file://`. Die HTML-Vertragstests benötigen Python 3 zusätzlich zu Node, jeweils ohne externe Pakete. Die zusätzlichen CMS-Bedienchecks laufen mit `python3 tests/cms_usability_test.py`; dafür ist PyYAML aus `requirements-dev.txt` erforderlich. Website und reguläre Node-Tests benötigen keine zusätzliche Paketinstallation.

Die Redaktion ist nach Häufigkeit geordnet; Seitentexte sind in kurze Formulare aufgeteilt und seltene Einstellungen stehen unter „Erweitert“. `settings.content.merge: true` erhält bei diesen Teilformularen die übrigen Seitentexte. Offene echte Handytests stehen in [docs/ABNAHME.md](docs/ABNAHME.md).

Nur auf main veröffentlichen. Vor technischen Änderungen eine geprüfte Sicherung anlegen. Änderungen zunächst lokal prüfen; keine direkte Änderung der Live-Dateien ohne Tests. Normale redaktionelle JSON-Änderungen benötigen keine neue `?v=`-Kennung. Bei Änderungen an JavaScript/CSS die Skript-/Stylesheet-Versionen in den einbindenden HTML-Seiten aktualisieren.

## Medienhinweise

Keine automatische Konvertierung von Handyvideos: webtaugliche MP4 mit H.264/AAC verwenden, möglichst unter 25 MB. Poster separat hinzufügen. Galerie braucht nur ein Bild plus Alttext, eine kleine Vorschau ist optional. Bilder JPG/JPEG/PNG/WebP; Hörproben MP3. Inhalte und Nutzungsrechte vor Veröffentlichung prüfen. Nicht mehr benötigte Mediendateien erst nach Referenzprüfung löschen.

## Gestaltung

Weinrot `#840026`, Gold `#b58022`, Puder `#f7eeef`, dunkle Flächen; Besley/Jost/Gochi Hand, Fotoabzüge mit Klebeband, Kritzel, Wellen und Animationen. Dieses Design ist final abgenommen und wurde beim CMS-Ausbau nicht verändert. Schriften und Videos bleiben selbst gehostet; reduzierte Bewegung wird berücksichtigt.
