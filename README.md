# Portfolio — Marvin Janssen Zepp

Site personnel de Marvin Janssen Zepp, technicien IT junior : profil, compétences,
parcours, projet et labos.

**Publié sur** https://marvin32165.github.io/Portfolio/

## Fabrication

HTML, CSS et JavaScript natifs. Aucune dépendance, aucun outil de build.

```
index.html              La page (sections : profil, compétences, parcours, projet, labos, méthode, contact)
404.html                Page d'erreur
assets/css/style.css    Toute la mise en forme (jetons de couleur en tête de fichier)
assets/js/main.js       Menu mobile, section active, apparition au défilement, onglets, copie de l'e-mail
assets/img/             Favicon, image de partage et captures du centre d'apprentissage
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

Le workflow `.github/workflows/pages.yml` publie le site à chaque push sur `main`.
Réglage à faire une seule fois : **Settings → Pages → Build and deployment → Source :
GitHub Actions**.

## Contenu

Les informations viennent du CV. Rien de confidentiel : pas de numéro de téléphone, pas
d'adresse postale, pas de lettre de candidature. Le projet « Centre d'apprentissage IT »
est décrit et illustré par des captures ; son dépôt, qui contient des notes de labo, reste privé.
