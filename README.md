# Portfolio — Marvin Janssen Zepp

Site personnel de Marvin Janssen Zepp, technicien IT junior : profil, compétences,
parcours, projet et labos.

**Publié sur** https://marvin32165.github.io/Portfolio/

## Fabrication

HTML, CSS et JavaScript natifs. Aucune dépendance, aucun outil de build.

```
index.html              La page (sections : accueil, compétences, labos, contact)
404.html                Page d'erreur
assets/css/style.css    Toute la mise en forme (jetons de couleur en tête de fichier)
assets/js/main.js       Menu mobile, section active, apparition au défilement, onglets, copie de l'e-mail
assets/img/             Favicon et image de partage
assets/cv/              CV téléchargeable (version publique, sans téléphone)
outils/                 Génération des images et vérification dans un navigateur (non publiés)
.github/workflows/      Publication sur GitHub Pages à chaque push sur main
```

Palette : brun `#2D1D14`, blanc cassé `#FAF6EE`, orange pâle `#F3CFA6`, beige `#E9DBC4`,
accent `#C56A2C`. Polices : Fraunces, DM Sans, IBM Plex Mono.

## En local

```bash
python3 -m http.server 8080     # puis http://localhost:8080/
```

## Publication

Le workflow `.github/workflows/pages.yml` recopie le site dans la branche `gh-pages` à chaque
push sur `main`. Réglage à faire une seule fois : **Settings → Pages → Build and deployment →
Source : Deploy from a branch → Branch : `gh-pages` / `(root)`**.

## Contenu

Version courte : accueil avec téléchargement du CV, compétences, six labos, contact. Rien de
confidentiel : pas de numéro de téléphone ni d'adresse postale, y compris dans le CV publié.
