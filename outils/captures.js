// Génère les images du portfolio (non publié : le workflow ne copie que le site).
//
//   node outils/captures.js
//
// - assets/img/portail.jpg, carte.jpg, module.jpg : captures du centre d'apprentissage
//   (le dépôt « cours », cloné à côté ou indiqué par COURS=/chemin/du/depot)
// - assets/img/og.png : image de partage 1200×630
//
// Pilote Chromium via puppeteer-core (rien n'est téléchargé) : CHROME=/chemin/du/navigateur
// pour en imposer un, PUPPETEER=/chemin/de/puppeteer-core si le module n'est pas résolvable.

const fs = require('fs');
const path = require('path');
const http = require('http');

const RACINE = path.resolve(__dirname, '..');
const COURS = process.env.COURS || path.resolve(RACINE, '..', 'cours');
const IMG = path.join(RACINE, 'assets', 'img');

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
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

function sert(dossier) {
    return new Promise(ok => {
        const srv = http.createServer((q, r) => {
            let f = path.join(dossier, decodeURIComponent(q.url.split('?')[0]));
            if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
            if (!f.startsWith(dossier) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
            r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
            fs.createReadStream(f).pipe(r);
        });
        srv.listen(0, '127.0.0.1', () => ok({ srv, base: 'http://127.0.0.1:' + srv.address().port }));
    });
}

const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    if (!fs.existsSync(path.join(COURS, 'site', 'index.html'))) {
        console.error('Dépôt cours introuvable : ' + COURS + ' (COURS=/chemin/du/depot)');
        process.exit(2);
    }
    fs.mkdirSync(IMG, { recursive: true });
    const { srv, base } = await sert(COURS);
    const b = await puppeteer.launch({ executablePath: navigateur(), headless: 'new', args: ['--no-sandbox'] });
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    const jpg = nom => path.join(IMG, nom + '.jpg');

    // 1. Accueil
    await p.goto(base + '/site/index.html', { waitUntil: 'networkidle0' });
    await pause(400);
    await p.screenshot({ path: jpg('portail'), type: 'jpeg', quality: 84 });
    console.log('portail.jpg');

    // 2. Carte des modules, avec Docker sélectionné
    await p.goto(base + '/site/index.html', { waitUntil: 'networkidle0' });
    await p.evaluate(() => {
        const n = document.querySelector('.map__node[data-id="docker"]');
        if (n) n.click();
    });
    const top = await p.evaluate(() => document.querySelector('.map-section').getBoundingClientRect().top + window.scrollY);
    await p.evaluate(y => window.scrollTo({ top: y + 70, behavior: 'instant' }), top);
    await pause(500);
    await p.screenshot({ path: jpg('carte'), type: 'jpeg', quality: 84 });
    console.log('carte.jpg');

    // 3. Un module
    await p.goto(base + '/site/modules/docker.html', { waitUntil: 'networkidle0' });
    await p.evaluate(() => {
        const s = document.getElementById('piloter');
        window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 24, behavior: 'instant' });
    });
    await pause(500);
    await p.screenshot({ path: jpg('module'), type: 'jpeg', quality: 84 });
    console.log('module.jpg');

    // 4. Image de partage
    await p.setViewport({ width: 1200, height: 630 });
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>
        *{box-sizing:border-box;margin:0}
        body{width:1200px;height:630px;background:#2D1D14;color:#F9E4CB;font-family:Georgia,'Times New Roman',serif;position:relative;overflow:hidden}
        .glow{position:absolute;right:-180px;top:-200px;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,rgba(243,207,166,.34),rgba(243,207,166,0) 68%)}
        .grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(243,207,166,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(243,207,166,.07) 1px,transparent 1px);background-size:60px 60px}
        .in{position:absolute;left:84px;right:84px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
        .k{font:500 20px/1 'Courier New',monospace;letter-spacing:.2em;text-transform:uppercase;color:#F3CFA6;margin-bottom:34px}
        h1{font-weight:400;font-size:112px;line-height:.98;letter-spacing:-.035em;color:#FAF6EE}
        h1 i{font-weight:300;color:#F3CFA6}
        .r{margin-top:34px;font-size:34px;color:#F9E4CB;font-style:italic;font-weight:300}
        .bar{position:absolute;left:84px;bottom:64px;width:96px;height:6px;border-radius:3px;background:#C56A2C}
        .d{position:absolute;right:84px;bottom:56px;font:500 20px/1 'Courier New',monospace;letter-spacing:.08em;color:#F3CFA6}
    </style><div class="glow"></div><div class="grid"></div>
    <div class="in"><p class="k">Portfolio</p><h1>Marvin <i>Janssen</i> Zepp</h1><p class="r">Technicien IT · support &amp; infrastructure</p></div>
    <div class="bar"></div><p class="d">Disponible dès la mi-novembre 2026</p>`);
    await p.screenshot({ path: path.join(IMG, 'og.png'), type: 'png' });
    console.log('og.png');

    await b.close();
    srv.close();
})();
