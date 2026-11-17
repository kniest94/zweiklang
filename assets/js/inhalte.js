/*
  ZWEIKLANG – Inhalte zum Selberpflegen
  ======================================
  Hier tragt ihr Termine, Videos, Fotos, Hörproben und Songs ein.
  Nach dem Speichern die Seite neu laden – fertig.

  Regeln:
  - Texte immer in 'einfache Anführungszeichen' setzen.
  - Nach jedem Eintrag ein Komma, die Klammern { } und [ ] nicht löschen.
  - Datum immer als 'JJJJ-MM-TT', z. B. '2027-05-22'.
*/

window.ZWEIKLANG = {

  kontakt: {
    mail: 'hello@zweiklang-duo.com',
    telefonAnzeige: '0173 1828122',
    telefonLink: '+491731828122',
    whatsapp: '491731828122',          // Nummer ohne +, ohne Leerzeichen
    instagram: 'zweiklang_duo',
  },

  /*
    STECKBRIEFE (Bereich "Über uns")
    Bilder im Format 4:5 (z. B. 1080 x 1350) nach assets/img/ legen und hier eintragen.
    alt: beschreibt das Bild UND den Text im Bild – wichtig für Menschen mit Screenreader und für Google.
    Ein Eintrag ohne bild zeigt eine "Steckbrief folgt"-Kachel.
  */
  steckbriefe: [
    {
      name: 'Saskia',
      bild: 'assets/img/steckbrief-saskia.webp',
      alt: 'Steckbrief Saskia: Saskia lächelt in die Kamera, hinter ihr Lichterketten und orangefarbene Ballons. Notizen im Bild: Baujahr 96, gibt zu viel Geld für Urlaube aus, Optimist, lieber Bier statt Blumen, Cat Mom, begnadete Zahnlücken-Pfeiferin, Chefkoch.',
    },
    {
      name: 'Saskia & Nicola',
      bild: 'assets/img/steckbrief-duo.webp',
      alt: 'Saskia und Nicola singen gemeinsam. Text im Bild: „a bit about us! – Wir sind Zweiklang! Wir sind Saskia & Nicola, zwei Musiker, die ihre Leidenschaft für ehrliche, handgemachte Musik teilen. Mal gefühlvoll und leise, mal laut und voller Energie. Wir interpretieren Songs auf unsere ganz eigene Art – mit zwei Stimmen, Gitarren und jeder Menge Herzblut.“',
    },
    {
      name: 'Nicola',
      bild: 'assets/img/steckbrief-nicola.webp',
      alt: 'Steckbrief Nicola: Nicola singt im dunklen Anzug mit Sonnenbrille. Notizen im Bild: Baujahr 94, Cat Dad, begnadeter Pokémon-Trainer, zweite Heimat: Sauna, Erzfeind: Türrahmen, immer am Lachen, leidenschaftlicher Dartsspieler.',
    },
  ],

  // Termine: ausschließlich in content/termine.json pflegen (docs/INHALTSPFLEGE.md).

  /*
    VIDEOS
    Die Videos sind in Gruppen sortiert (Auswahl über der Videoliste).
    gruppe: 'duo', 'saskia' oder 'nicola'
    typ: 'mp4'        -> Datei liegt in assets/video/ (mp4 + Vorschaubild .webp)
    typ: 'instagram'  -> Kachel verlinkt auf einen Instagram-Beitrag oder Reel (link angeben)
    Reihenfolge = Reihenfolge auf der Seite.
  */
  videogruppen: [
    { id: 'duo', name: 'Zu zweit' },
    { id: 'saskia', name: 'Saskia' },
    { id: 'nicola', name: 'Nicola' },
  ],

  videos: [
    // Zu zweit
    { gruppe: 'duo', typ: 'mp4', titel: 'Zu zweit auf der Bühne', datei: 'assets/video/duo-buehne.mp4', poster: 'assets/video/duo-buehne.webp', dauer: '0:42' },
    { gruppe: 'duo', typ: 'mp4', titel: 'Open Air mit Gitarren', datei: 'assets/video/duo-openair.mp4', poster: 'assets/video/duo-openair.webp', dauer: '0:30' },
    { gruppe: 'duo', typ: 'mp4', titel: 'Adventsmarkt Kirrberg', datei: 'assets/video/duo-kirrberg-quer.mp4', poster: 'assets/video/duo-kirrberg-quer.webp', dauer: '1:28' },
    { gruppe: 'duo', typ: 'mp4', titel: 'Abendstimmung in Kirrberg', datei: 'assets/video/duo-kirrberg-1.mp4', poster: 'assets/video/duo-kirrberg-1.webp', dauer: '0:28' },
    { gruppe: 'duo', typ: 'mp4', titel: 'Vor der Hütte', datei: 'assets/video/duo-kirrberg-3.mp4', poster: 'assets/video/duo-kirrberg-3.webp', dauer: '0:41' },

    // Saskia
    { gruppe: 'saskia', typ: 'mp4', titel: 'Saskia auf der Bühne', datei: 'assets/video/saskia-buehne.mp4', poster: 'assets/video/saskia-buehne.webp', dauer: '0:44' },
    { gruppe: 'saskia', typ: 'mp4', titel: 'Saskia live', datei: 'assets/video/saskia-party.mp4', poster: 'assets/video/saskia-party.webp', dauer: '0:11' },
    { gruppe: 'saskia', typ: 'mp4', titel: 'Saskia in Kirrberg', datei: 'assets/video/saskia-solo.mp4', poster: 'assets/video/saskia-solo.webp', dauer: '0:34' },

    // Nicola
    { gruppe: 'nicola', typ: 'mp4', titel: 'Nicola in Kirrberg', datei: 'assets/video/nicola-solo-1.mp4', poster: 'assets/video/nicola-solo-1.webp', dauer: '0:21' },
    { gruppe: 'nicola', typ: 'mp4', titel: 'Nicola im Herbstlicht', datei: 'assets/video/nicola-solo-4.mp4', poster: 'assets/video/nicola-solo-4.webp', dauer: '0:25' },
    { gruppe: 'nicola', typ: 'mp4', titel: 'Nicola am Mikro', datei: 'assets/video/nicola-solo-3.mp4', poster: 'assets/video/nicola-solo-3.webp', dauer: '0:09' },

    // Beispiel Instagram-Reel:
    // { gruppe: 'duo', typ: 'instagram', titel: 'Unser neues Reel', link: 'https://www.instagram.com/reel/XXXX/', poster: 'assets/img/galerie/foto-0054-klein.webp' },
  ],

  /*
    GALERIE
    Für jedes Foto zwei Dateien in assets/img/galerie/ ablegen:
    eine kleine (...-klein.webp, ca. 640 px) für die Übersicht und eine große für die Großansicht.
    alt: kurz beschreiben, was zu sehen ist.
  */
  galerie: [
    { klein: 'assets/img/galerie/foto-0054-klein.webp', gross: 'assets/img/galerie/foto-0054.webp', alt: 'Saskia und Nicola singen zusammen im Freien' },
    { klein: 'assets/img/galerie/foto-0048-klein.webp', gross: 'assets/img/galerie/foto-0048.webp', alt: 'Saskia und Nicola mit Gitarren in einem hellen Saal mit roten Stühlen' },
    { klein: 'assets/img/galerie/foto-0043-klein.webp', gross: 'assets/img/galerie/foto-0043.webp', alt: 'Saskia singt im geblümten Kleid vor grünem Efeu' },
    { klein: 'assets/img/galerie/foto-0042-klein.webp', gross: 'assets/img/galerie/foto-0042.webp', alt: 'Saskia und Nicola sitzen mit Gitarren an ihren Mikrofonen' },
    { klein: 'assets/img/galerie/foto-0044-klein.webp', gross: 'assets/img/galerie/foto-0044.webp', alt: 'Nicola im blauen Anzug und Saskia im rosa Kleid vor einer Sandsteinmauer' },
    { klein: 'assets/img/galerie/foto-0050-klein.webp', gross: 'assets/img/galerie/foto-0050.webp', alt: 'Saskia singt auf einer Bühne in rotem Scheinwerferlicht' },
    { klein: 'assets/img/galerie/foto-0046-klein.webp', gross: 'assets/img/galerie/foto-0046.webp', alt: 'Saskia und Nicola spielen im Sitzen Gitarre' },
    { klein: 'assets/img/galerie/foto-0049-klein.webp', gross: 'assets/img/galerie/foto-0049.webp', alt: 'Selfie von Saskia mit Nicola und einem Gast, dahinter Ballons mit Mr. und Mrs.' },
    { klein: 'assets/img/galerie/foto-0051-klein.webp', gross: 'assets/img/galerie/foto-0051.webp', alt: 'Saskia auf der Bühne zwischen bunten Lichtstrahlen' },
    { klein: 'assets/img/galerie/foto-0053-klein.webp', gross: 'assets/img/galerie/foto-0053.webp', alt: 'Saskia singt in einer Kirche neben einem geschmückten Weihnachtsbaum' },
    { klein: 'assets/img/galerie/foto-0052-klein.webp', gross: 'assets/img/galerie/foto-0052.webp', alt: 'Saskia singt vor einer leuchtenden Lichterwand' },
  ],

  /*
    HÖRPROBEN (mp3)
    Dateien in assets/audio/ ablegen und hier eintragen. Solange die Liste leer ist, bleibt der Bereich unsichtbar.
  */
  hoerproben: [
    // { titel: 'Songtitel', datei: 'assets/audio/songtitel.mp3' },
  ],

  // Repertoire: ausschließlich in content/repertoire.json pflegen.

};
