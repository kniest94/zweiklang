/* Zweiklang – Seitenlogik. Inhalte kommen aus assets/js/inhalte.js */
(() => {
  'use strict';

  const D = window.ZWEIKLANG || {};
  const K = D.kontakt || {};
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const instaUrl = `https://www.instagram.com/${K.instagram || 'zweiklang_duo'}/`;
  const root = document.documentElement;
  if (!('IntersectionObserver' in window)) root.classList.remove('bewegung');
  const bewegung = root.classList.contains('bewegung');
  const feinerZeiger = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Kopfzeile: Schriftzug erscheint, sobald der Aufmacher vorbei ist ---- */
  const kopf = $('[data-kopf]');
  const hero = $('[data-hero]');
  if (kopf && hero && 'IntersectionObserver' in window) {
    let beobachter;
    const beobachte = () => {
      beobachter?.disconnect();
      beobachter = new IntersectionObserver(([e]) => kopf.classList.toggle('ist-fest', !e.isIntersecting), {
        rootMargin: `-${kopf.offsetHeight + 24}px 0px 0px 0px`,
      });
      beobachter.observe(hero);
    };
    beobachte();
    window.addEventListener('resize', beobachte);
  } else if (kopf) {
    kopf.classList.add('ist-fest');
  }

  /* ---- Menü (mobil) ---------------------------------------------------- */
  const menuKnopf = $('.kopf__menu');
  const nav = $('.kopf__nav');
  const mobil = window.matchMedia('(max-width: 960px)');
  const syncInert = () => { if (nav && kopf) nav.inert = mobil.matches && !kopf.classList.contains('menue-offen'); };
  const setzeMenu = (offen) => {
    if (!menuKnopf) return;
    menuKnopf.setAttribute('aria-expanded', String(offen));
    kopf.classList.toggle('menue-offen', offen);
    $('.kopf__menu-text', menuKnopf).textContent = offen ? 'Schließen' : 'Menü';
    syncInert();
  };
  syncInert();
  mobil.addEventListener('change', () => { if (!mobil.matches) setzeMenu(false); syncInert(); });
  menuKnopf?.addEventListener('click', () => setzeMenu(menuKnopf.getAttribute('aria-expanded') !== 'true'));
  $$('.kopf__nav a').forEach((a) => a.addEventListener('click', () => setzeMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kopf?.classList.contains('menue-offen')) { setzeMenu(false); menuKnopf.focus(); }
  });

  /* ---- Aktiver Navigationspunkt (Aufmacher mitbeobachtet: dort ist keiner aktiv) ---- */
  const navLinks = $$('.kopf__nav a[href^="#"]').filter((a) => a.getAttribute('href') !== '#anfragen');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const ziele = [...navLinks.map((a) => $(a.getAttribute('href'))), hero].filter(Boolean);
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === `#${e.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ziele.forEach((z) => io.observe(z));
  }

  /* ---- Großansicht (Videos mit Ton, Steckbriefe zum Lesen) ------------- */
  const buehne = $('[data-buehne]');
  const buehneInhalt = $('[data-buehne-inhalt]');
  const heroLoop = $('.hero__clip video');
  const oeffne = (html) => {
    if (!buehne) return;
    buehneInhalt.innerHTML = html;
    if (typeof buehne.showModal === 'function') buehne.showModal();
    else buehne.setAttribute('open', '');
    heroLoop?.pause();
    const v = $('video', buehneInhalt);
    if (v) v.play().catch(() => {});
  };
  const schliesse = () => { if (buehne?.open) buehne.close ? buehne.close() : buehne.removeAttribute('open'); };
  buehne?.addEventListener('close', () => {
    $$('video', buehneInhalt).forEach((v) => v.pause());
    buehneInhalt.innerHTML = '';
    if (bewegung) heroLoop?.play().catch(() => {});
  });
  $('[data-buehne-zu]')?.addEventListener('click', schliesse);
  buehne?.addEventListener('click', (e) => { if (e.target === buehne) schliesse(); });
  const zeigeVideo = (src, titel, poster) => oeffne(
    `<video src="${esc(src)}"${poster ? ` poster="${esc(poster)}"` : ''} controls playsinline autoplay></video>${titel ? `<p class="buehne__titel">${esc(titel)}</p>` : ''}`,
  );
  const zeigeBild = (src, alt) => oeffne(`<img src="${esc(src)}" alt="${esc(alt)}">`);

  /* ---- Aufmacher: Live-Clip und Maus-Parallax --------------------------- */
  const clip = $('.hero__clip');
  if (clip) {
    if (!bewegung && heroLoop) { heroLoop.removeAttribute('autoplay'); heroLoop.pause(); }
    clip.addEventListener('click', () => zeigeVideo(clip.dataset.video, clip.dataset.titel, clip.dataset.video.replace('.mp4', '.webp')));
  }
  const heroBuehne = $('.hero__buehne');
  if (hero && heroBuehne && bewegung && feinerZeiger) {
    let rahmen = 0;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (rahmen) return;
      rahmen = requestAnimationFrame(() => {
        heroBuehne.style.setProperty('--mx', (x * -14).toFixed(2));
        heroBuehne.style.setProperty('--my', (y * -10).toFixed(2));
        rahmen = 0;
      });
    });
    hero.addEventListener('pointerleave', () => {
      heroBuehne.style.setProperty('--mx', '0');
      heroBuehne.style.setProperty('--my', '0');
    });
  }

  /* ---- Motto: Wörter leuchten nacheinander auf, Kritzel zeichnen sich -- */
  const motto = $('[data-motto]');
  if (motto && bewegung) {
    motto.classList.add('motto--aktiv');
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('ist-an'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -38% 0px', threshold: 1 });
    $$('.motto__wort', motto).forEach((w) => io.observe(w));
  }

  /* ---- Steckbriefe als angepinnte Abzüge ------------------------------- */
  const steckBox = $('[data-steckbriefe]');
  if (steckBox && Array.isArray(D.steckbriefe)) {
    const dreh = [-5, 2.5, -3, 3.5, -2];
    steckBox.innerHTML = D.steckbriefe
      .map((s, i) => s.bild
        ? `<li class="steckbrief" data-auftritt style="--i: ${i}"><button class="print print--band steckbrief__knopf" type="button" style="--dreh: ${dreh[i % dreh.length]}deg" data-bild="${esc(s.bild)}" data-alt="${esc(s.alt || `Steckbrief ${s.name}`)}"><img src="${esc(s.bild)}" alt="${esc(s.alt || `Steckbrief ${s.name}`)}" width="900" height="1125" loading="lazy" decoding="async"><span class="sr-only">, vergrößern</span></button></li>`
        : `<li class="steckbrief steckbrief--folgt" data-auftritt style="--i: ${i}"><div class="print" style="--dreh: ${dreh[i % dreh.length]}deg"><span class="steckbrief__name">${esc(s.name)}</span><span class="steckbrief__text">Steckbrief folgt. Bis dahin seht ihr ${esc(s.name)} in den <a href="#videos">Live-Momenten</a>.</span></div></li>`)
      .join('');
    steckBox.addEventListener('click', (e) => {
      const knopf = e.target.closest('.steckbrief__knopf');
      if (knopf) zeigeBild(knopf.dataset.bild, knopf.dataset.alt);
    });
    // Auf dem Handy ist die Reihe wischbar: dann auch per Tastatur scrollbar machen
    const scrollbar = () => {
      if (steckBox.scrollWidth > steckBox.clientWidth + 1) steckBox.setAttribute('tabindex', '0');
      else steckBox.removeAttribute('tabindex');
    };
    scrollbar();
    window.addEventListener('resize', scrollbar);
    window.addEventListener('load', scrollbar);
  }

  /* ---- Videos: schräge Karten, stumme Vorschau beim Drüberfahren ------- */
  const videoListe = $('[data-videos]');
  if (videoListe && Array.isArray(D.videos)) {
    const dreh = [-2, 1.6, -1.2, 2, -1.6, 1.2, -1, 1.8];
    const kacheln = D.videos.map((v, i) => {
      const info = `<span class="video__info" aria-hidden="true"><span class="video__titel">${esc(v.titel)}</span>${v.dauer ? `<span class="video__dauer">${esc(v.dauer)}</span>` : ''}</span>`;
      const poster = v.poster ? `<img src="${esc(v.poster)}" alt="" loading="lazy" decoding="async">` : '';
      const klasse = `video${v.gross ? ' video--gross' : ''}`;
      const stil = `style="--dreh: ${dreh[i % dreh.length]}deg; --i: ${i % 5}"`;
      if (v.typ === 'instagram') {
        return `<li class="${klasse}" data-auftritt ${stil}><a class="video__knopf" href="${esc(v.link || instaUrl)}" target="_blank" rel="noopener" aria-label="${esc(v.titel)} auf Instagram ansehen">${poster}<span class="video__play" aria-hidden="true"><svg class="icon"><use href="#i-instagram"/></svg></span>${info}</a></li>`;
      }
      const label = `Video abspielen: ${v.titel}${v.dauer ? `, ${v.dauer} Minuten` : ''}`;
      return `<li class="${klasse}" data-auftritt ${stil}><button class="video__knopf" type="button" data-src="${esc(v.datei)}" data-titel="${esc(v.titel)}" data-poster="${esc(v.poster || '')}" aria-label="${esc(label)}">${poster}<span class="video__play" aria-hidden="true"><svg class="icon"><use href="#i-play"/></svg></span>${info}</button></li>`;
    });
    kacheln.push(`<li class="video video--mehr" data-auftritt style="--dreh: 2deg; --i: 4"><a href="${instaUrl}" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-instagram"/></svg><span class="video__mehr-titel">Mehr Live-Momente</span><span class="video__mehr-text">Neue Clips zeigen wir zuerst auf Instagram.</span></a></li>`);
    videoListe.innerHTML = kacheln.join('');

    videoListe.addEventListener('click', (e) => {
      const knopf = e.target.closest('button.video__knopf');
      if (!knopf) return;
      $$('.video__vorschau', videoListe).forEach((x) => x.pause());
      zeigeVideo(knopf.dataset.src, knopf.dataset.titel, knopf.dataset.poster);
    });

    if (feinerZeiger && bewegung) {
      $$('.video', videoListe).forEach((karte) => {
        const knopf = $('button.video__knopf', karte);
        if (!knopf) return;
        karte.addEventListener('pointerenter', () => {
          let vorschau = $('.video__vorschau', karte);
          if (!vorschau) {
            vorschau = document.createElement('video');
            vorschau.className = 'video__vorschau';
            vorschau.muted = true;
            vorschau.loop = true;
            vorschau.playsInline = true;
            vorschau.preload = 'auto';
            vorschau.setAttribute('aria-hidden', 'true');
            vorschau.src = `${knopf.dataset.src}#t=2`;
            knopf.insertBefore(vorschau, $('.video__play', knopf));
          }
          vorschau.play().then(() => karte.classList.add('spielt-vorschau')).catch(() => {});
        });
        karte.addEventListener('pointerleave', () => {
          $('.video__vorschau', karte)?.pause();
          karte.classList.remove('spielt-vorschau');
        });
      });
    }
  }

  /* ---- Laufband: zweite Hälfte für eine nahtlose Schleife -------------- */
  const spur = $('[data-laufband]');
  if (spur) {
    const teil = $('.laufband__teil', spur);
    if (teil) spur.appendChild(teil.cloneNode(true));
  }

  /* ---- Hörproben ------------------------------------------------------- */
  const hoerBox = $('[data-hoerproben]');
  if (hoerBox && Array.isArray(D.hoerproben) && D.hoerproben.length) {
    $('[data-hoerproben-liste]', hoerBox).innerHTML = D.hoerproben
      .map((h) => `<li><span>${esc(h.titel)}</span><audio controls preload="none" src="${esc(h.datei)}"></audio></li>`)
      .join('');
    hoerBox.hidden = false;
  }

  /* ---- Repertoire mit Kritzel-Symbolen --------------------------------- */
  const repBox = $('[data-repertoire]');
  if (repBox && Array.isArray(D.repertoire)) {
    const symbole = ['k-herz', 'k-noten', 'k-blitz'];
    repBox.innerHTML = D.repertoire
      .map((r, i) => {
        const songs = Array.isArray(r.songs) && r.songs.length
          ? `<ul class="rep__songs">${r.songs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
          : '';
        return `<div class="rep" data-auftritt style="--i: ${i}"><h3 class="rep__name">${esc(r.name)}</h3><div class="rep__text"><p>${esc(r.text)}</p>${songs}</div><svg class="kritzel rep__icon" data-zeichnen style="--verzug: ${0.3 + i * 0.15}s" aria-hidden="true"><use href="#${symbole[i % symbole.length]}"/></svg></div>`;
      })
      .join('');
  }

  /* ---- Termine --------------------------------------------------------- */
  const kommendBox = $('[data-termine-kommend]');
  const vergangenListe = $('[data-termine-vergangen]');
  if (kommendBox && vergangenListe) {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const datum = (s) => {
      const [j, m, t] = String(s).split('-').map(Number);
      return new Date(j, m - 1, t);
    };
    const termine = (D.termine || []).filter((t) => t && t.datum).map((t) => ({ ...t, d: datum(t.datum) }));
    const kommend = termine.filter((t) => t.d >= heute).sort((a, b) => a.d - b.d);
    const vergangen = termine.filter((t) => t.d < heute).sort((a, b) => b.d - a.d);
    const fMonat = new Intl.DateTimeFormat('de-DE', { month: 'short', year: 'numeric' });
    const fTag = new Intl.DateTimeFormat('de-DE', { weekday: 'long' });
    const zeile = (t) => {
      const ort = [fTag.format(t.d), t.uhrzeit ? `${t.uhrzeit} Uhr` : '', t.ort].filter(Boolean).map(esc).join(', ');
      const link = t.link ? `<a class="termin__link" href="${esc(t.link)}" target="_blank" rel="noopener">Zur Veranstaltung</a>` : '';
      return `<li class="termin"><time class="termin__datum" datetime="${esc(t.datum)}"><span class="termin__tag">${t.d.getDate()}.</span><span class="termin__monat">${esc(fMonat.format(t.d))}</span></time><div><p class="termin__titel">${esc(t.titel)}</p><p class="termin__ort">${ort}</p>${link}</div></li>`;
    };
    kommendBox.innerHTML = kommend.length
      ? `<ol class="termine__liste">${kommend.map(zeile).join('')}</ol>`
      : `<p class="termine__leer">Neue Auftritte sind in Planung. Sobald sie feststehen, findet ihr sie hier und auf <a href="${instaUrl}" target="_blank" rel="noopener">Instagram</a>. Ihr sucht Musik für euren eigenen Termin? <a href="#anfragen">Fragt uns an.</a></p>`;
    if (vergangen.length) vergangenListe.innerHTML = vergangen.slice(0, 6).map(zeile).join('');
    else $('[data-termine-vergangen-box]').hidden = true;
  }

  /* ---- Anfrage: Nachricht zusammenstellen, Herzchen beim Auswählen ---- */
  const form = $('[data-anfrage]');
  if (form) {
    const herzchen = (ziel) => {
      const r = ziel.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      for (let i = 0; i < 9; i++) {
        const h = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        h.setAttribute('class', 'herzchen-flug');
        h.setAttribute('viewBox', '0 0 100 100');
        h.setAttribute('aria-hidden', 'true');
        h.innerHTML = '<use href="#k-herz"/>';
        h.style.left = `${x}px`;
        h.style.top = `${y}px`;
        h.style.fill = i % 3 === 0 ? 'var(--gold)' : 'var(--wein)';
        document.body.appendChild(h);
        const winkel = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const weite = 55 + Math.random() * 70;
        h.animate([
          { transform: 'translate(0, 0) scale(0.3) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(winkel) * weite}px, ${Math.sin(winkel) * weite}px) scale(${0.8 + Math.random() * 0.7}) rotate(${Math.random() * 70 - 35}deg)`, opacity: 0 },
        ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => h.remove();
      }
    };
    form.addEventListener('change', (e) => {
      if (bewegung && e.target.name === 'anlass') herzchen(e.target.nextElementSibling);
    });

    const nachrichtBauen = () => {
      const f = new FormData(form);
      const anlass = f.get('anlass');
      const roh = f.get('datum');
      const ort = String(f.get('ort') || '').trim();
      const name = String(f.get('name') || '').trim();
      const text = String(f.get('nachricht') || '').trim();
      const tag = roh ? new Date(`${roh}T12:00:00`) : null;
      const datumLang = tag ? tag.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
      const zeilen = [
        'Hallo Saskia & Nicola,',
        '',
        anlass ? `wir möchten euch gern für folgenden Anlass anfragen: ${anlass}.` : 'wir möchten euch gern für eine Veranstaltung anfragen.',
      ];
      if (datumLang) zeilen.push(`Datum: ${datumLang}`);
      if (ort) zeilen.push(`Ort: ${ort}`);
      if (text) zeilen.push('', text);
      zeilen.push('', 'Viele Grüße');
      if (name) zeilen.push(name);
      const betreff = ['Anfrage', anlass ? `: ${anlass}` : '', tag ? ` am ${tag.toLocaleDateString('de-DE')}` : ''].join('');
      return { text: zeilen.join('\n'), betreff };
    };
    form.addEventListener('click', (e) => {
      const knopf = e.target.closest('[data-senden]');
      if (!knopf) return;
      const { text, betreff } = nachrichtBauen();
      if (knopf.dataset.senden === 'whatsapp') {
        window.open(`https://wa.me/${K.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      } else {
        window.location.href = `mailto:${K.mail}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
      }
    });
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  /* ---- Auftritte beim Scrollen (erst nach dem Befüllen der Listen) ----- */
  if (bewegung) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('ist-sichtbar'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    $$('[data-auftritt], [data-zeichnen]').forEach((el) => io.observe(el));
  }

  /* ---- Jahr in der Fußzeile ------------------------------------------- */
  const jahr = $('[data-jahr]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());
})();
