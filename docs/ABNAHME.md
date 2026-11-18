# Zweiklang – Abnahme der mobilen Pflege

## Technisch geprüft

- [x] Aktueller GitHub-Stand einschließlich neuem Upload vor Änderungen gesichert; aus dem Bundle wiederhergestellt und 96 reguläre Dateien mit Archiv verglichen.
- [x] Öffentliches Layout, HTML, Skripte, Schriften und vorhandene Inhalte durch die Bedienungsänderung nicht geändert.
- [x] 115 Node-Tests bestanden.
- [x] Fünf zusätzliche Python/PyYAML-Bedienchecks: Menüaufteilung, Auswahlwerte, Galeriepflichtfelder, vollständige Seitenfeldabdeckung und modellierter Erhalt nicht bearbeiteter verschachtelter Seitentexte.
- [x] Alle 53 vorhandenen Medienreferenzen zeigen auf vorhandene Dateien.
- [x] Alle zwölf vorhandenen MP4-Dateien mit ffprobe geprüft: H.264; Auftrittsvideos mit AAC, stumme Hero-Schleife ohne Audiospur.
- [x] Ein tatsächlicher Pages-CMS-Bildupload ist auf main vorhanden. Die Datei ist noch keinem Galerieeintrag zugeordnet; Upload und Eintrag speichern sind zwei Schritte. Datei nicht eigenmächtig entfernt.
- [x] Primärquelle des CMS geprüft: readonly verwendet readOnly und form.getValues(), nicht die Auslassungslogik von disabled HTML-Feldern. Gemeinsame Seitentextdatei wird mit settings.content.merge=true verschachtelt zusammengeführt; Formulare sind keine Top-Level-Listen.

## Noch echte Bedienung am Gerät bestätigen

- [ ] Neu gegliederte Menüs auf dem Handy öffnen; alle erwarteten Formulare erreichen.
- [ ] Eine Änderung in einem kurzen Seitentextformular speichern und neu öffnen. Danach auf GitHub bestätigen, dass die anderen Texte/Medien unverändert erhalten sind; Teständerung wieder entfernen.
- [ ] Galerieeintrag mit bereits hochgeladenem Foto und Bildbeschreibung speichern. Prüfen: Sichtbarkeit, Ausrichtung, Großansicht und Reihenfolge. Danach bei Bedarf Testeintrag entfernen, ohne noch verwendete Medien zu löschen.
- [ ] MP4 neu auswählen/hochladen, Poster hinzufügen, speichern und mit Ton auf dem tatsächlichen Handy abspielen. Kein automatisches Transcoding eingerichtet.
- [ ] Tatsächliche MP3-Hörprobe hochladen/abspielen; der vorhandene leere Hörprobenbereich allein ist kein Audiotest.
- [ ] WhatsApp, E-Mail und Telefon per Tap prüfen. Nicht automatisch Nachrichten absenden.
- [ ] Abgebrochenen Upload, Wiederanmeldung und Wiederholung nach 504 auf dem tatsächlichen Gerät beobachten. Keine künstlichen großen Produktivuploads nur für Fehlertests erzeugen.

## Offene Entscheidungen

- Anruf-Link enthält einen historischen maskierten Wert. Nicht automatisch aus einer anderen Nummer abgeleitet; tatsächlichen Telefon-Link vom Nutzer bestätigen lassen.
- Zusätzliche externe Vollsicherung: Ziel/Ordner erst auswählen und genehmigen lassen. Bestehende Archive liegen auf demselben Server. Keine Drittanbieter-Uploads oder Hintergrundpläne stillschweigend einrichten.
- Zweiter Benutzer auf Nutzerwunsch später.

## Prüfkommandos

```sh
node --test
python3 tests/cms_usability_test.py
```

Die Python-Bedienchecks benötigen PyYAML aus requirements-dev.txt; die Website selbst und die Node-Tests benötigen keine neuen Pakete. Das Python-Modell ist kein authentifizierter Pages-CMS-End-to-End-Test.
