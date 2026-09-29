/* Portfolio — Marvin Janssen Zepp
   Comportements de la page. Aucune dépendance. Tout est dégradable :
   sans JavaScript, la page reste entièrement lisible (le contenu n'est
   masqué par l'animation d'apparition que lorsque le script tourne).

   1. Marque « js » sur <html> (autorise l'animation d'apparition)
   2. En-tête : ombre au défilement
   3. Menu mobile
   4. Section active dans la navigation
   5. Apparition au défilement
   6. Onglets des captures
   7. Copier l'adresse e-mail
   8. Année du pied de page
*/
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── 2. En-tête ── */
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ── 3. Menu mobile ── */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nav');
    if (toggle && nav) {
        var setOpen = function (open) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            nav.classList.toggle('is-open', open);
        };
        toggle.addEventListener('click', function () {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                toggle.focus();
            }
        });
    }

    /* ── 4. Section active ── */
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
    var sections = links
        .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
        .filter(Boolean);
    if (sections.length && 'IntersectionObserver' in window) {
        var current = null;
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) current = entry.target.id;
            });
            links.forEach(function (a) {
                if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ── 5. Apparition au défilement ── */
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reveals.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            reveals.forEach(function (el) { el.classList.add('is-in'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
            reveals.forEach(function (el) { io.observe(el); });
        }
    }

    /* ── 6. Onglets des captures ── */
    var tablist = document.querySelector('.shots__tabs');
    if (tablist) {
        var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
        var select = function (tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                var panel = document.getElementById(t.getAttribute('aria-controls'));
                if (panel) panel.hidden = !on;
            });
            if (focus) tab.focus();
        };
        tabs.forEach(function (tab, i) {
            tab.addEventListener('click', function () { select(tab, false); });
            tab.addEventListener('keydown', function (e) {
                var next = null;
                if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
                else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
                else if (e.key === 'Home') next = tabs[0];
                else if (e.key === 'End') next = tabs[tabs.length - 1];
                if (next) { e.preventDefault(); select(next, true); }
            });
        });
    }

    /* ── 7. Copier l'adresse e-mail ── */
    var copyBtn = document.querySelector('[data-copy]');
    if (copyBtn && navigator.clipboard) {
        copyBtn.hidden = false;
        var label = copyBtn.textContent;
        copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
                copyBtn.textContent = 'Copié';
                copyBtn.classList.add('is-done');
                setTimeout(function () {
                    copyBtn.textContent = label;
                    copyBtn.classList.remove('is-done');
                }, 1800);
            }, function () { /* presse-papiers refusé : le lien mailto reste disponible */ });
        });
    }

    /* ── 8. Année ── */
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();
