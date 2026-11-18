# Zweiklang – Inhalte vom Handy pflegen

## Einstieg

Pages CMS im Browser öffnen, Projekt **zweiklang**, Branch **main**. Speichern schreibt direkt nach GitHub; nach der GitHub-Pages-Bereitstellung ist die Änderung öffentlich. Es gibt keinen Testbranch mehr. Keine zweite Freigabe erforderlich. Den zweiten Benutzer richten wir später ein.

## Einfachere Navigation

Direkt im Hauptmenü stehen Termine, Galerie, Videos, Repertoire, Steckbriefe und Hörproben. Unter **Texte & Bilder der Seite** sind drei kurze Formulare: Startbereich, Über uns und Anfrageformular. **Erweitert** bündelt seltene Überschriften/Hinweise, Terminfoto, Kontaktdaten, Video-Kategorien und die beiden HTML-Rechtstexteditoren.

Bei Videos wird **Wer ist zu sehen?** ausgewählt, statt eine Gruppen-ID einzutippen. Die drei vorhandenen Kategorien sind fest zugeordnet; neue Kategorien gemeinsam mit Conan ergänzen, damit Auswahl und Zuordnung zusammenpassen. Bestehende kleine Galerievorschauen sind nur lesbar und bleiben erhalten; für ein neues Foto reichen Foto plus Beschreibung.

Die fünf getrennten Seitentextformulare schreiben weiterhin in dieselbe `content/seite.json`. Dafür muss `settings.content.merge: true` aktiv bleiben: Es bewahrt alle anderen, gerade nicht bearbeiteten Texte. Nach dem ersten echten Speichern eines dieser Formulare den unveränderten Rest auf GitHub prüfen lassen. Nicht als ungeprüft vollständigen Handytest behandeln.

## Verfügbare Bereiche

- **Termine:** Datum, Veranstaltung, Ort, optionale Uhrzeit und Link.
- **Repertoire:** Kategorien, Beschreibung, Songs.
- **Galerie:** Bild auswählen/hochladen, Alttext, Reihenfolge. Ein Bild genügt; eine kleine Vorschau ist optional.
- **Videos:** Gruppe, MP4 oder Instagram-Link, Titel, optionales Vorschaubild und Dauer.
- **Videogruppen:** Anzeigenamen und eindeutige IDs. IDs müssen zu den Videos passen; bestehende IDs nicht unnötig ändern.
- **Steckbriefe:** Namen, Bilder, Bildbeschreibung. Im Alttext auch Text beschreiben, der im Steckbriefbild steht. Bildformat 4:5 empfohlen.
- **Hörproben:** MP3-Datei und Titel. Ohne Einträge bleibt der Bereich verborgen.
- **Kontakt:** E-Mail, sichtbare Telefonnummer, Telefonlink, WhatsApp und Instagram. Sichtbare Startseitenlinks, Anfragewege und MusicGroup-JSON-LD folgen diesen Angaben. Die vorhandene maskierte Telefonlinknummer wurde nicht eigenmächtig geändert. Kontaktangaben in Rechtstexten weiterhin gesondert kontrollieren.
- **Seitentexte und Aufmacher:** Überschriften, Einleitungen, Über-uns-Texte, Motto, Hinweise, Anfragebeschriftungen sowie Hero-Foto/-Clip und Terminfoto. Nur Text, kein HTML. Gestaltung und SVG-Kritzel bleiben im Code.
- **Impressum / Datenschutz:** Erweiterte HTML-Direkteditoren, keine juristische Beratung. Nur Text ändern; HTML-Tags, Klassen, Styles und Scripts nicht verändern. Wenn Sie unsicher sind, Änderung über Conan statt im Direkteditor vornehmen. Die vorhandenen Rechtstexte wurden bei der Einrichtung nicht verändert.

## Bilder, Videos und Audio

Zuerst Datei hochladen/auswählen, dann den Inhaltseintrag speichern. Ein bloßer Upload fügt noch keine Kachel hinzu. Dateien werden mit zufälligen Namen abgelegt, um Namenskollisionen zu vermeiden.

- Bilder: JPG, JPEG, PNG oder WebP. Webtauglich verkleinern; keine unbearbeiteten Riesenbilder oder HEIC-Dateien hochladen.
- Video: webtaugliche MP4, für breite Browserunterstützung H.264/AAC. Möglichst unter 25 MB pro Datei bleiben. Es gibt **keine automatische Videokonvertierung** oder automatische Poster-Erzeugung. Ein Poster kann separat hochgeladen werden; ein Instagram-Link ist eine Alternative. Die viersekündige Ladegrenze betrifft JSON-Daten, nicht das Abspielen großer Videodateien.
- Audio: MP3. Nur veröffentlichungsfähige Dateien mit geklärten Rechten verwenden.
- Nur bereits öffentlich freigegebene Bilder/Videos verwenden; keine privaten Anfragen oder Rohmaterialien hochladen. Ein öffentlicher Git-Branch ist kein vertraulicher Speicher.
- Beim Entfernen eines Eintrags muss die Mediendatei nicht gelöscht werden. Vor Löschen in der Medienverwaltung prüfen, ob Hero, Galerie, Steckbrief oder Video die Datei noch verwendet.

Die Quellen sind `content/termine.json`, `repertoire.json`, `galerie.json`, `videos.json`, `videogruppen.json`, `steckbriefe.json`, `hoerproben.json`, `kontakt.json` und `seite.json`. Pfade unter `assets/` bleiben relativ, damit GitHub Pages unter `/zweiklang/` funktioniert. Keine manuell gepflegte zweite JavaScript-Inhaltsquelle.

## Sicherheit und Fehler

Der Browser validiert Struktur, Datum/Uhrzeit, sichere Links und Medienpfade. Jede JSON-Datei wird unabhängig mit einem Zeitlimit geladen. Bei einem fehlerhaften Datenbereich erscheint eine Fehlermeldung, statt einen leeren Datenbestand vorzutäuschen. Feste Seitentexte bleiben bei Ladefehler als HTML-Fallback erhalten. Diese Laufzeitprüfungen ersetzen keine vollständige Formularvalidierung vor jedem Speichern.

Bei einem 504-Speicherfehler Eingabe nicht durch Neuladen verlieren, kurz warten und erneut speichern. Danach auf GitHub bzw. der Seite kontrollieren. Nicht blind mehrfach neue Einträge erzeugen.

## Technisch prüfen

```sh
node --test
python3 -m http.server 5500 --bind 127.0.0.1
```

Die HTML-Vertragstests benötigen neben Node auch Python 3 (Standardbibliothek). Keine Paketinstallation und kein Build-Schritt für Website oder Node-Tests. Zusätzliche Bedienchecks: `python3 tests/cms_usability_test.py` mit lokalem PyYAML (Entwicklungsabhängigkeit in `requirements-dev.txt`). Die Checkliste [ABNAHME.md](ABNAHME.md) trennt technische Prüfungen von noch offenen echten Handytests. Seite per HTTP öffnen, nicht als `file://`.

Aktuelle Inhalte werden getrennt von historischen Migrationsreferenzen geprüft. Redaktionelle Änderungen sind gewollt und dürfen nicht zurückgesetzt werden, nur weil sie von der alten Seite abweichen. Ein zusätzlicher historischer Galerievergleich kann einmalig mit `PRUEFE_GALERIE_MIGRATION=1 node --test` ausgeführt werden, nicht als tägliche Inhaltsprüfung.

Die neue CMS-Konfiguration, Medienreferenzen und Browserdarstellung wurden lokal geprüft. Authentifizierte Uploads/Speicherversuche der neu hinzugefügten Bereiche auf dem tatsächlichen Handy müssen gesondert bestätigt werden; die bereits bestätigte Terminpflege ist kein Nachweis für alle Uploadarten.

## Sicherung und Wiederherstellung

Vor dem Vollausbau wurde der komplette Git-Stand einschließlich Testbranch lokal gesichert und wiederhergestellt. Sicherungsort: `/home/hermes/backups/zweiklang/20261117-150142/`. Der Testbranch ist danach auf ausdrücklichen Wunsch entfernt worden. Sicherung auf demselben Server, kein Offsite-Backup. Kein neuer Hintergrunddienst und kein automatischer Zeitplan eingerichtet.
