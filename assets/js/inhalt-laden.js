/* Lädt ausschließlich Termine und Repertoire; kein Framework und kein Build nötig. */
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
  const valide = (name, data) => Array.isArray(data) && data.every((eintrag) => {
    if (!objekt(eintrag)) return false;
    if (name === 'termine') {
      return datum(eintrag.datum) && text(eintrag.titel) && text(eintrag.ort)
        && optional(eintrag.uhrzeit, (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s))
        && optional(eintrag.link, url);
    }
    return text(eintrag.name) && text(eintrag.text) && Array.isArray(eintrag.songs) && eintrag.songs.every(text);
  });
  window.ZWEIKLANG = window.ZWEIKLANG || {};
  window.ZWEIKLANG_BEREIT = Promise.all(['termine', 'repertoire'].map(async (name) => {
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
  }));
})();
