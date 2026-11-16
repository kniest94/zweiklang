/*
  ZWEIKLANG – Inhalte zum Selberpflegen
  ======================================
  Hier tragt ihr Termine, Videos, Hörproben und Songs ein.
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

  /*
    TERMINE
    Vergangene Termine rutschen automatisch nach unten in "Zuletzt gespielt".
    Felder: datum (Pflicht), titel, ort, uhrzeit (optional), link (optional, z. B. Veranstaltungsseite)
  */
  termine: [
    {
      datum: '2026-11-14',
      titel: 'Adventsmarkt',
      ort: 'Ski- & Wanderhütte, Kirrberg',
    },
    // Beispiel für einen neuen Termin (Schrägstriche entfernen, damit er erscheint):
    // { datum: '2027-05-22', titel: 'Hochzeitsfeier', ort: 'Homburg', uhrzeit: '19:00' },
  ],

  /*
    VIDEOS
    typ: 'mp4'        -> Datei liegt in assets/video/ (mp4 + Vorschaubild .webp)
    typ: 'instagram'  -> Kachel verlinkt auf einen Instagram-Beitrag oder Reel (link angeben)
    Der erste Eintrag mit gross: true wird groß dargestellt.
  */
  videos: [
    {
      typ: 'mp4',
      titel: 'Saskia & Nicola live',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/duo-kirrberg-1.mp4',
      poster: 'assets/video/duo-kirrberg-1.webp',
      dauer: '1:47',
      gross: true,
    },
    {
      typ: 'mp4',
      titel: 'Saskia solo',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/saskia-solo.mp4',
      poster: 'assets/video/saskia-solo.webp',
      dauer: '0:34',
    },
    {
      typ: 'mp4',
      titel: 'Im Duett',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/duo-kirrberg-2.mp4',
      poster: 'assets/video/duo-kirrberg-2.webp',
      dauer: '1:28',
    },
    {
      typ: 'mp4',
      titel: 'Nicola solo',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/nicola-solo-1.mp4',
      poster: 'assets/video/nicola-solo-1.webp',
      dauer: '0:21',
    },
    {
      typ: 'mp4',
      titel: 'Zu zweit vor der Hütte',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/duo-kirrberg-3.mp4',
      poster: 'assets/video/duo-kirrberg-3.webp',
      dauer: '0:41',
    },
    {
      typ: 'mp4',
      titel: 'Nicola im Herbstlicht',
      ort: 'Adventsmarkt Kirrberg',
      datei: 'assets/video/nicola-solo-2.mp4',
      poster: 'assets/video/nicola-solo-2.webp',
      dauer: '0:14',
    },
    // Beispiel Instagram-Reel:
    // { typ: 'instagram', titel: 'Unser neues Reel', link: 'https://www.instagram.com/reel/XXXX/', poster: 'assets/img/aufbau.webp' },
  ],

  /*
    HÖRPROBEN (mp3)
    Dateien in assets/audio/ ablegen und hier eintragen. Solange die Liste leer ist, bleibt der Bereich unsichtbar.
  */
  hoerproben: [
    // { titel: 'Songtitel', datei: 'assets/audio/songtitel.mp3' },
  ],

  /*
    REPERTOIRE
    Songs als Liste eintragen, z. B. songs: ['Titel – Interpret', 'Titel – Interpret'].
    Leere Listen werden einfach nicht angezeigt.
  */
  repertoire: [
    {
      name: 'Gefühlvolle Balladen',
      text: 'Für die ruhigen Momente: zweistimmig gesungen und ganz nah dran.',
      songs: [],
    },
    {
      name: 'Songs zum Mitsingen',
      text: 'Lieder, die alle kennen und bei denen jeder mitsingen kann.',
      songs: [],
    },
    {
      name: 'Rockige Klassiker',
      text: 'Wenn es lauter werden darf: große Rock-Klassiker in unserer eigenen Fassung.',
      songs: [],
    },
  ],
};
