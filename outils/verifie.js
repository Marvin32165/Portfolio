// Vérifie le portfolio dans un vrai navigateur (non publié).
//
//   node outils/verifie.js            -> contrôles
//   node outils/verifie.js --shots    -> contrôles + captures dans outils/shots/
//
// Contrôle : pas de débordement horizontal (320 → 1440 px), aucune erreur JS ni ressource
// locale manquante, chaque lien d'ancre mène à un id existant, chaque image locale se charge,
// les onglets des captures et le menu mobile fonctionnent, les titres se suivent sans saut.

const fs = require('fs');
const path = require('path');
const http = require('http');

const RACINE = path.resolve(__dirname, '..');
const COURS = process.env.COURS || path.resolve(RACINE, '..', 'cours');
const SHOTS = path.join(__dirname, 'shots');
const WANT_SHOTS = process.argv.includes('--shots');

function charge() {
    const essais = [process.env.PUPPETEER, 'puppeteer-core',
        path.join(COURS, 'site', 'outils', 'verif-portail', 'node_modules', 'puppeteer-core')].filter(Boolean);
    for (const e of essais) { try { return require(e); } catch (_) { /* suivant */ } }
    console.error('puppeteer-core introuvable (voir PUPPETEER=…).');
    process.exit(2);
}
const puppeteer = charge();

function navigateur() {
    const cand = [process.env.CHROME,
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
    const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    if (fs.existsSync(pw)) {
        for (const d of fs.readdirSync(pw).filter(n => n.startsWith('chromium-')).sort().reverse()) {
            cand.push(path.join(pw, d, 'chrome-linux', 'chrome'));
        }
    }
    return cand.filter(Boolean).find(p => fs.existsSync(p));
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };

let ko = 0;
const fail = m => { ko++; console.log('  KO  ' + m); };
const ok = m => console.log('  ok  ' + m);
const pause = ms => new Promise(r => setTimeout(r, ms));

function sert() {
    return new Promise(res => {
        // Servi sous /Portfolio/, comme sur GitHub Pages : les chemins absolus de 404.html s'y résolvent.
        const srv = http.createServer((q, r) => {
            const u = decodeURIComponent(q.url.split('?')[0]);
            if (!u.startsWith('/Portfolio/')) { r.writeHead(404); return r.end(); }
            let f = path.join(RACINE, u.slice('/Portfolio/'.length));
            if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
            if (!f.startsWith(RACINE) || !fs.existsSync(f)) { r.writeHead(404); return r.end('not found'); }
            r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
            fs.createReadStream(f).pipe(r);
        });
        srv.listen(0, '127.0.0.1', () => res({ srv, base: 'http://127.0.0.1:' + srv.address().port + '/Portfolio/' }));
    });
}

(async () => {
    const { srv, base } = await sert();
    const b = await puppeteer.launch({ executablePath: navigateur(), headless: 'new', args: ['--no-sandbox'] });
    const p = await b.newPage();
    const origine = new URL(base).origin;

    console.log('== débordement horizontal ==');
    for (const page of ['', '404.html']) {
        const bad = [];
        for (const w of [320, 375, 480, 768, 1024, 1440]) {
            await p.setViewport({ width: w, height: 900 });
            await p.goto(base + page, { waitUntil: 'networkidle0' });
            const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
            if (r.sw > r.cw + 1) bad.push(w + 'px→' + r.sw);
        }
        bad.length ? fail((page || 'index.html') + ' déborde à ' + bad.join(', ')) : ok(page || 'index.html');
    }

    console.log('\n== erreurs JS et ressources locales ==');
    for (const page of ['', '404.html']) {
        const errs = [];
        const h = {
            pageerror: e => errs.push('pageerror: ' + e.message),
            console: m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); },
            response: r => { if (r.url().startsWith(origine) && r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url().replace(origine, '')); },
            requestfailed: r => { if (r.url().startsWith(origine)) errs.push('échec ' + r.url().replace(origine, '')); },
        };
        Object.entries(h).forEach(([k, f]) => p.on(k, f));
        await p.setViewport({ width: 1280, height: 900 });
        await p.goto(base + page, { waitUntil: 'networkidle0' });
        Object.entries(h).forEach(([k, f]) => p.off(k, f));
        errs.length ? fail((page || 'index.html') + ' : ' + errs.join(' | ')) : ok(page || 'index.html');
    }

    console.log('\n== structure ==');
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(base, { waitUntil: 'networkidle0' });
    // Les images sont en chargement différé : on les force avant de les contrôler.
    await p.evaluate(() => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }); })));
    const s = await p.evaluate(() => {
        const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
        const ancres = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(Boolean);
        const cassees = ancres.filter(a => !ids.has(a));
        const images = [...document.images].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt') }));
        const niveaux = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]);
        let saut = null;
        niveaux.reduce((prev, n) => { if (n - prev > 1 && !saut) saut = prev + '→' + n; return n; }, 0);
        const ext = [...document.querySelectorAll('a[target="_blank"]')].filter(a => !/noopener/.test(a.rel));
        return {
            cassees, images, saut, h1: document.querySelectorAll('h1').length, ext: ext.length,
            main: document.querySelectorAll('main').length,
            lang: document.documentElement.lang,
            titre: document.title,
            desc: (document.querySelector('meta[name=description]') || {}).content || '',
            btnSansNom: [...document.querySelectorAll('button')].filter(x => !(x.textContent.trim() || x.getAttribute('aria-label'))).length,
        };
    });
    s.cassees.length ? fail('ancres cassées : ' + s.cassees.join(', ')) : ok('toutes les ancres mènent quelque part');
    const imgKo = s.images.filter(i => !i.ok || !i.alt);
    imgKo.length ? fail('images à corriger : ' + imgKo.map(i => i.src).join(', ')) : ok(s.images.length + ' images chargées, avec alt');
    s.h1 === 1 ? ok('un seul h1') : fail(s.h1 + ' h1');
    s.saut ? fail('saut de niveau de titre ' + s.saut) : ok('titres sans saut de niveau');
    s.ext ? fail(s.ext + ' lien(s) externe(s) sans rel=noopener') : ok('liens externes sûrs');
    s.main === 1 ? ok('un seul <main>') : fail(s.main + ' <main>');
    s.btnSansNom ? fail(s.btnSansNom + ' bouton(s) sans nom accessible') : ok('boutons nommés');
    s.lang === 'fr' && s.titre && s.desc.length > 80 ? ok('lang, titre et description présents') : fail('lang/titre/description');

    console.log('\n== interactions ==');
    // onglets des captures
    const tab = await p.evaluate(() => {
        const t = document.getElementById('tab-carte');
        t.click();
        return { carte: !document.getElementById('panel-carte').hidden, portail: document.getElementById('panel-portail').hidden, sel: t.getAttribute('aria-selected') };
    });
    tab.carte && tab.portail && tab.sel === 'true' ? ok('les onglets changent de capture') : fail('onglets : ' + JSON.stringify(tab));
    await p.focus('#tab-carte');
    await p.keyboard.press('ArrowRight');
    const clavier = await p.evaluate(() => document.getElementById('tab-module').getAttribute('aria-selected'));
    clavier === 'true' ? ok('onglets pilotables au clavier') : fail('flèche droite ne change pas d\'onglet');

    // menu mobile
    await p.setViewport({ width: 390, height: 800 });
    await p.goto(base, { waitUntil: 'networkidle0' });
    const menu = await p.evaluate(() => {
        const nav = document.getElementById('nav'), t = document.querySelector('.nav-toggle');
        const ferme = getComputedStyle(nav).display === 'none';
        t.click();
        const ouvert = getComputedStyle(nav).display !== 'none' && t.getAttribute('aria-expanded') === 'true';
        nav.querySelector('a').click();
        const refermé = getComputedStyle(nav).display === 'none';
        return { ferme, ouvert, refermé };
    });
    menu.ferme && menu.ouvert && menu.refermé ? ok('menu mobile : fermé, ouvre, se referme au clic') : fail('menu mobile : ' + JSON.stringify(menu));

    // contenu visible sans animation (aucune section restée invisible après défilement)
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(base, { waitUntil: 'networkidle0' });
    await p.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80)); } });
    await pause(900);
    const caches = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => !e.classList.contains('is-in')).length);
    caches ? fail(caches + ' bloc(s) jamais apparus') : ok('tous les blocs apparaissent au défilement');

    if (WANT_SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true });
        for (const [nom, w, h] of [['bureau', 1440, 900], ['tablette', 820, 1100], ['mobile', 390, 844]]) {
            await p.setViewport({ width: w, height: h });
            await p.goto(base, { waitUntil: 'networkidle0' });
            await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
            await pause(300);
            await p.screenshot({ path: path.join(SHOTS, nom + '.png'), fullPage: true });
        }
        console.log('\ncaptures → ' + SHOTS);
    }

    await b.close();
    srv.close();
    console.log(ko ? '\n' + ko + ' PROBLÈME(S)' : '\nTout est au vert');
    process.exit(ko ? 1 : 0);
})();
