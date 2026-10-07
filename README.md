# مظلات طرابلس الملكية — Tripoli Royal Shades

Site vitrine bilingue (arabe / anglais) + **panneau administrateur** pour modifier
les textes de l'interface, les catégories et les articles — sans toucher au code.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Page publique du site |
| `admin.html` | **Panneau administrateur** (mot de passe) |
| `data/site.json` | Données officielles du site (textes, catégories, articles, galerie, avis, FAQ…) |
| `js/site-data.js` | Moteur partagé : charge `data/site.json`, applique les modifications locales, affiche le contenu dynamique |

## Panneau administrateur

1. Ouvrez `admin.html` dans le navigateur (ou cliquez sur **« إدارة / Admin »** en bas du site).
2. Mot de passe par défaut : `admin123` — changez-le dans l'onglet **Réglages**.
3. Modifiez les contenus (chaque texte existe en **arabe + anglais**), puis cliquez sur
   **Enregistrer** en haut de page.
4. Contrôlez le résultat via **Voir le site** (même navigateur).

### Onglets disponibles

- **Tableau de bord** : statistiques, état de publication, guide rapide.
- **Général** : nom du site, slogan, téléphone, WhatsApp, adresse, horaires, districts desservis, thème/langue par défaut.
- **Accueil / Hero** : titre, description, diaporama, grande photo, badges, chiffres clés.
- **Textes & sections** : tous les titres de sections, bandeau parallaxe, bandeau promo, textes du formulaire de contact.
- **Contenu** : bandeau des 4 atouts, étapes de travail, bloc « Pourquoi nous ».
- **Catégories** : catégories des articles et de la galerie (ajout / renommage / suppression protégée si utilisée).
- **Articles** : produits (nom, prix au m², photo, description, atouts, carte tarifs, visibilité, mise en avant).
- **Galerie** : photos des réalisations (catégorie, titre, badge, visibilité, ordre).
- **Avis & FAQ** : avis clients (note, photo, texte) et questions fréquentes.
- **Réglages** : prix des options du calculateur, mot de passe, **export / import / réinitialisation**.

### Photos

Chaque champ image accepte soit une **URL** (`https://…`), soit un **fichier téléversé**
(compressé automatiquement). Attention : les fichiers téléversés sont stockés dans le
navigateur (≈ 5 Mo max) — préférez des URLs pour une publication durable.

## Comment les données fonctionnent

- Au chargement, le site lit `data/site.json` (version officielle).
- Les modifications faites dans le panneau admin sont d'abord stockées **dans le
  navigateur** (`localStorage`) : parfait pour tester.
- Pour **publier en ligne** : `Réglages → Exporter site.json`, remplacez
  `data/site.json` dans le projet, puis `commit` + `push` sur GitHub.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000  et  http://localhost:8000/admin.html
```

> N'ouvrez pas les fichiers en double-clic (`file://`) : le chargement de
> `data/site.json` nécessite un vrai serveur local (même simple).

## Sécurité

La protection par mot de passe du panneau admin est une **protection de confort**
côté navigateur (pratique pour un site statique), pas une sécurité serveur.
Ne stockez aucune donnée sensible dans `data/site.json`.
