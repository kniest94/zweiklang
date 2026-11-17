/* Lädt neun unabhängige Inhaltsdateien; kein Framework und kein Build nötig. */
(() => {
  'use strict';
  const basis = new URL('../../content/', document.currentScript.src);
  const text = (s) => typeof s === 'string' && s.trim().length > 0;
  const objekt = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const datum = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [j, m, t] = s.split('-').map(Number);
    // 0100 vermeidet die Sonderbehandlung der Jahre 00–99 im bestehenden Renderer.
    if (j < 100 || m < 1 || m > 12 || t < 1) return false;
    const schaltjahr = j % 4 === 0 && (j % 100 !== 0 || j % 400 === 0);
    return t <= [31, schaltjahr ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  };
  const url = (s) => {
    if (typeof s !== 'string' || !/^https?:\/\//i.test(s) || /[\s\\\u0000-\u001f\u007f]/.test(s)) return false;
    try {
      const u = new URL(s);
      return ['https:', 'http:'].includes(u.protocol) && !!u.hostname && !u.username && !u.password;
    } catch { return false; }
  };
  const optional = (v, pruefung) => v === undefined || v === '' || pruefung(v);
  // Nur lokale Rasterbilder unter assets/img; keine URL-, Encoding- oder Traversal-Tricks.
  const bildpfad = (s) => typeof s === 'string'
    && /^assets\/img\/(?:[a-z0-9_-]+\/)*[a-z0-9_-][a-z0-9_.-]*\.(?:webp|png|jpe?g|gif|avif)$/i.test(s);
  const medienpfad = (s, ordner, endungen) => typeof s === 'string'
    && new RegExp(`^assets/${ordner}/(?:[a-z0-9_-]+/)*[a-z0-9_-][a-z0-9_.-]*\\.(?:${endungen})$`, 'i').test(s);
  const id = (s) => typeof s === 'string' && /^[a-z0-9_-]+$/.test(s);
  const valide = (name, data) => {
    if (name === 'seite') {
      const keys = 'heroSlogan heroLead heroWhatsapp heroVideos heroNotiz ueberTitel ueberLead ueberText1 ueberText2 ueberGruss steckbriefHinweis motto1 motto2 motto3 videosTitel videosIntro hoerprobenTitel galerieTitel galerieInstagram galerieHinweis repertoireTitel repertoireHinweis repertoireAnfrage termineTitel termineKommend termineVergangen terminBildunterschrift anfrageTitel anfrageIntro anfrageAnlass anfrageDatum anfrageOrt anfrageName anfrageNachricht anfrageOptional anfrageWhatsapp anfrageMail anfrageHinweis kontaktTitel'.split(' ');
      return objekt(data) && objekt(data.texte) && keys.every((key) => text(data.texte[key]))
        && objekt(data.hero) && bildpfad(data.hero.foto) && text(data.hero.alt)
        && ['video', 'vorschau'].every((key) => medienpfad(data.hero[key], 'video', 'mp4'))
        && ['poster', 'videoPoster'].every((key) => medienpfad(data.hero[key], 'video', 'jpg|jpeg|png|webp'))
        && text(data.hero.titel) && text(data.hero.label)
        && objekt(data.terminbild) && bildpfad(data.terminbild.datei) && text(data.terminbild.alt);
    }
    if (name === 'kontakt') return objekt(data)
      && typeof data.mail === 'string' && /^[a-z0-9.!#$%&'*+/=_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(data.mail)
      && text(data.telefonAnzeige) && /^[+\d][\d *()-]*$/.test(data.telefonAnzeige)
      // Maskierte Bestandswerte bleiben wörtlich erhalten; keine Nummer ableiten.
      && typeof data.telefonLink === 'string' && /^\+?[\d*][\d* ()-]*$/.test(data.telefonLink)
      && typeof data.whatsapp === 'string' && /^\d{6,15}$/.test(data.whatsapp)
      && typeof data.instagram === 'string' && /^[a-z0-9_][a-z0-9_.]{0,29}$/i.test(data.instagram);
    if (!Array.isArray(data)) return false;
    if (name === 'videogruppen' && new Set(data.map((g) => g?.id)).size !== data.length) return false;
    return data.every((eintrag) => {
    if (!objekt(eintrag)) return false;
    if (name === 'galerie') {
      return bildpfad(eintrag.gross) && optional(eintrag.klein, bildpfad) && text(eintrag.alt);
    }
    if (name === 'termine') {
      return datum(eintrag.datum) && text(eintrag.titel) && text(eintrag.ort)
        && optional(eintrag.uhrzeit, (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s))
        && optional(eintrag.link, url);
    }
    if (name === 'videogruppen') return id(eintrag.id) && text(eintrag.name);
    if (name === 'steckbriefe') return text(eintrag.name) && optional(eintrag.bild, bildpfad)
      && (eintrag.bild ? text(eintrag.alt) : optional(eintrag.alt, text));
    if (name === 'hoerproben') return text(eintrag.titel) && medienpfad(eintrag.datei, 'audio', 'mp3');
    if (name === 'videos') return id(eintrag.gruppe) && text(eintrag.titel)
      && optional(eintrag.dauer, (s) => typeof s === 'string' && /^\d+:[0-5]\d$/.test(s))
      && optional(eintrag.poster, (s) => bildpfad(s) || medienpfad(s, 'video', 'webp|png|jpe?g'))
      && (eintrag.typ === 'mp4' ? medienpfad(eintrag.datei, 'video', 'mp4')
        : eintrag.typ === 'instagram' && url(eintrag.link)
          && new URL(eintrag.link).protocol === 'https:'
          && ['instagram.com', 'www.instagram.com'].includes(new URL(eintrag.link).hostname));
    return text(eintrag.name) && text(eintrag.text) && Array.isArray(eintrag.songs) && eintrag.songs.every(text);
    });
  };
  window.ZWEIKLANG = window.ZWEIKLANG || {};
  window.ZWEIKLANG_BEREIT = Promise.all(['termine', 'repertoire', 'galerie', 'videos', 'videogruppen', 'steckbriefe', 'hoerproben', 'kontakt', 'seite'].map(async (name) => {
    // Kein Fallback auf alte/erfundene Daten; jeder Bereich wird unabhängig geladen.
    delete window.ZWEIKLANG[name];
    const controller = new AbortController();
    let timer;
    try {
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Zeitlimit für Inhaltsdatei überschritten'));
          controller.abort();
        }, 4000);
      });
      const laden = async () => {
        const response = await fetch(new URL(`${name}.json`, basis), { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw new Error('Inhaltsdatei nicht erreichbar');
        const data = await response.json();
        if (!valide(name, data)) throw new Error('Inhaltsdatei ungültig');
        return data;
      };
      // Erst nach dem Rennen übernehmen: verspätete Antworten bleiben wirkungslos.
      window.ZWEIKLANG[name] = await Promise.race([laden(), timeout]);
    } catch {
      // main.js zeigt für diesen Bereich eine ehrliche Fehlermeldung.
    } finally {
      clearTimeout(timer);
    }
  })).then(() => {
    const D = window.ZWEIKLANG;
    // Nur bei gültiger Gruppenquelle Referenzen prüfen. Bei deren Ausfall bleiben
    // sichere Videos ungefiltert nutzbar, statt den Nachbarbereich mitzureißen.
    if (D.videogruppen && D.videos?.some((v) => !D.videogruppen.some((g) => g.id === v.gruppe))) delete D.videos;
  });
})();
