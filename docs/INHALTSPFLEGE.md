# Inhaltspflege – erste lokale Etappe

## Kanonische Dateien

- `content/termine.json`: Termine als JSON-Liste, ursprüngliche Daten unverändert übernommen.
- `content/repertoire.json`: Repertoiregruppen als JSON-Liste, ursprüngliche Daten unverändert übernommen.
- Alle anderen Inhalte bleiben in `assets/js/inhalte.js` beziehungsweise im bisherigen HTML.

Termine/Repertoire nicht zusätzlich in JavaScript pflegen. JSON benötigt doppelte Anführungszeichen; keine Kommentare oder abschließenden Kommas.

### Termine

Jeder Eintrag benötigt `datum`, `titel`, `ort`. Titel und Ort sind nicht leere Texte.
`datum` ist ein echtes Kalenderdatum in `JJJJ-MM-TT` (Jahre 0100–9999, inklusive Schaltjahrprüfung).
Optional: `uhrzeit` als `HH:MM` (00:00–23:59), `link` als absolute HTTP-/HTTPS-URL ohne Zugangsdaten, Leer-/Steuerzeichen oder Backslashes. Optionale Felder dürfen fehlen oder `""` sein; `null` ist ungültig.
Die Reihenfolge der bisherigen Darstellung und automatische Zuordnung vergangener Termine bleiben erhalten.

### Repertoire

Jeder Eintrag benötigt nicht leere Texte `name`, `text` sowie `songs` als Liste nicht leerer Songtexte. `songs: []` ist erlaubt. Die Listenreihenfolge bestimmt die Darstellung.

## Lokal prüfen

Im Repository:

```sh
node --test
python3 -m http.server 5500 --bind 127.0.0.1
```

Danach `http://localhost:5500/` öffnen. Nicht per `file://`: Die JSON-Dateien werden per HTTP geladen. Keine Installation, kein Framework, kein Build-Schritt nötig. Die Tests verwenden ausschließlich Node-Standardbibliotheken (node:test und VM), keinen Netzwerkzugriff. Der unveränderliche Git-Commit `5a2e9d54898ab0cd59d385a3e8d21213c13050b5` dient als Migrationsreferenz, nicht als zweite gepflegte Inhaltsdatei.

## Ladeverhalten

`assets/js/inhalt-laden.js` lädt beide Dateien parallel und prüft jeden Bereich vollständig. `main.js` wartet auf das Ergebnis. Pro Datei gelten vier Sekunden Zeitlimit einschließlich Antwortverarbeitung; abgebrochene/späte Antworten überschreiben den Fehlerstatus nicht. Geladene Inhalte werden mit `cache: no-cache` revalidiert.

Fehlende Dateien, Netzwerkfehler, ungültiges JSON, Schemafehler oder Timeout führen nur im betroffenen Bereich zu einer sichtbaren Ladefehlermeldung. Sie sind **keine** leere Terminliste. Andere Bereiche starten danach weiterhin. Ein gültiges `[]` erhält dagegen die bisherige Leerlisten-Darstellung: Termine mit bestehendem Hinweis, Repertoire ohne Gruppen. Erfolgreiche Ausgabe, Gestaltung und Medien bleiben unverändert.

Bei Änderungen an JavaScript weiterhin die betroffenen `?v=`-Kennungen in `index.html` erhöhen. Reine JSON-Inhaltsänderungen benötigen keine manuelle Cache-Kennung.

## Noch offen

Keine CMS-Anbindung oder mobile Redaktionsoberfläche in dieser Etappe. Anmeldung, zwei Redakteurskonten, Konfliktbehandlung und Veröffentlichungsablauf werden separat entschieden. Keine Zugangsdaten im Frontend ablegen. Die visuelle Browserabnahme übernimmt Conan; VM-Tests ersetzen sie nicht. Diese Etappe ist ausschließlich lokal und weder committet noch veröffentlicht.
