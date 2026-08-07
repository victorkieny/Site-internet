# Refonte de structure — inspiration bricepoitau.com

Objectif : passer d'un site "page d'accueil = prise de RDV" à une architecture complète (home de présentation → simulateurs → ressources → à propos → RDV dédié), sans perdre la charte graphique actuelle (Bodoni 72 Display / Avenir Next, palette crème-doré, fond photo fixe).

## Décisions actées

- Périmètre : structure complète (nav globale, home refaite, /simulateurs existant conservé, /ressources, /a-propos, /rdv séparé, footer avec mentions légales).
- Home : nouvelle page de présentation façon Brice (hero, aperçu simulateurs, bandeau statuts, teaser ressources), avec le CTA "Prendre RDV" mis en avant partout — l'objectif de conversion vers la prise de RDV ne doit pas se diluer dans la présentation.
- **"Indépendant"** : tu as choisi de reprendre le vocabulaire de Brice ("cabinet indépendant", "architecture ouverte") malgré l'écart documenté avec tes propres mandats Stellium (non-indépendant en instruments financiers, conseil niveau 1 en assurance). C'est ton arbitrage, pas le mien — je te le signale une dernière fois ici pour que ce soit tracé noir sur blanc, et je l'exécute tel quel dans les prompts ci-dessous. Si un jour ça remonte en revue de conformité, ce fichier documente que c'était un choix assumé, pas un oubli.
- Méthode : séquencée, un prompt par étape, vérification visuelle avant de passer à la suivante.
- **Forme, pas fond (ajouté 07/08/2026)** : à partir de l'Étape 4, Victor a précisé qu'il ne veut que de la restructuration (HTML/CSS, squelette, titres de section) — aucun paragraphe de contenu rédigé à sa place, même à partir de faits qu'il a donnés en conversation. Partout où une section attend un paragraphe qu'il écrira lui-même, mettre un texte **visible** "À compléter." directement dans la balise de contenu (pas un commentaire HTML caché) — plus simple à repérer en relecture visuelle.

## Garde-fou DA — à garder en tête, ne pas re-décrire dans chaque prompt

Le premier prompt de chaque étape doit toujours commencer par rappeler à l'assistant :
- Site 100% HTML/CSS/JS vanilla, pas de framework, pas de build. Un seul `styles.css` partagé (~2900 lignes, tokens dans `:root`). Ne jamais créer de second fichier CSS ni de valeurs de couleur/police en dur hors des tokens existants (`--ink`, `--muted`, `--paper`, `--surface`, `--line`, `--accent`, `--logo-gold`, `--button`, etc.).
- Polices : `--serif` (Bodoni 72 Display) pour les titres, `--sans` (Avenir Next) pour le corps. Ne pas introduire d'autre police.
- Avant d'écrire du CSS nouveau, chercher un pattern existant à réutiliser (`.appointment` dans `index.html`, `.simulator-choice` dans `simulateurs.html`, `.section-heading`) plutôt que d'en inventer un.
- Chaque page = fichier `.html` indépendant à la racine (ou dans `simulateurs/`), nav dupliquée en tête de chaque page (pas de composant partagé — c'est le pattern existant, ne pas le changer sans me le proposer).
- Ne jamais toucher à `simulateurs/projection.html` ni aux simulateurs eux-mêmes dans ce chantier — c'est un chantier séparé.
- Structure d'inspiration = bricepoitau.com. Reprendre l'architecture des pages, la hiérarchie de contenu et l'esprit des formulations réglementaires — **ne pas copier-coller le texte de Brice mot pour mot** (SEO dupliqué + confraternité Stellium). Le contenu doit être réécrit pour Victor Kieny.

---

## Plan priorisé (ordre corrigé par rapport à ma question initiale)

J'avais proposé "nav d'abord" dans ma question de cadrage — en y réfléchissant, c'est le mauvais ordre : ça créerait des liens morts vers des pages qui n'existent pas encore. Ordre retenu, construit du bas vers le haut :

1. **RDV** — extraire la prise de RDV actuelle vers `rdv.html`.
2. **Home** — reconstruire `index.html` en page de présentation.
3. **Nav + footer globaux** — appliquer le menu complet et un footer commun sur les pages déjà en place.
4. **À propos** — `a-propos.html`.
5. **Ressources** — `ressources.html`.
6. **Mentions légales / confidentialité** — pages minimales si elles n'existent pas encore (à vérifier avant de lancer cette étape).

Si tu préfères garder ton ordre nav-d'abord, dis-le, mais je te conseille cet ordre-ci.

---

## Étape 1 — Page RDV dédiée

```
Contexte : site vanilla HTML/CSS/JS de victorkieny.fr, un seul styles.css partagé (tokens :root), pas de framework/build. Ne pas inventer de nouvelles couleurs/polices hors des tokens existants (--serif = Bodoni 72 Display pour les titres, --sans = Avenir Next pour le corps).

Tâche : créer un nouveau fichier `rdv.html` à la racine, qui reprend EXACTEMENT le contenu actuel de `index.html` (le bloc <main class="page" id="accueil">, les 3 cartes de rendez-vous avec leurs liens calendar.app.google, le footer "page-note") — copie fonctionnelle à l'identique, aucun changement de logique ni de liens de réservation.

Seuls changements autorisés :
- Adapter le <title> et la meta description pour refléter "Prendre rendez-vous" plutôt que la page d'accueil générale.
- id du <main> : remplacer id="accueil" par id="rdv".
- La nav en tête : pour l'instant, laisser telle quelle (elle sera refaite à l'étape 3), juste ajouter aria-current="page" sur un futur lien "Prendre RDV" si tu identifies où il ira, sinon ne touche pas à la nav.

Ne pas encore modifier index.html — ça sera l'étape suivante. Ne pas toucher à simulateurs.html ni simulateurs/.
```

**Vérification avant de passer à l'étape 2** : ouvrir `rdv.html` dans le navigateur, vérifier que les 3 liens de réservation (tel, découverte, suivi) pointent toujours vers les bonnes URLs Google Calendar et que le rendu est identique à l'ancien `index.html`.

---

## Étape 2 — Nouvelle home de présentation

```
Contexte : idem étape 1. Le fichier rdv.html existe déjà et contient l'ancienne prise de RDV. Structure de référence pour cette étape : bricepoitau.com (hero → aperçu simulateurs → bandeau statuts réglementaires → teaser ressources → CTA final) — reprendre l'architecture et la hiérarchie de contenu, PAS le texte de Brice mot pour mot.

Tâche : reconstruire index.html comme une page de présentation, en réutilisant les classes et patterns déjà présents dans styles.css (.title-block, .section-heading, .appointment, .simulator-choice, etc. — inspire-toi de leur structure pour les nouveaux blocs plutôt que d'inventer de nouvelles classes du premier coup). Sections, dans l'ordre :

1. Hero : logo (assets/logo-transparent.png), "Victor Kieny", accroche courte sur l'ingénierie patrimoniale (à rédiger — ne pas garder le texte RDV actuel ici), UN bouton CTA proéminent "Prendre rendez-vous →" vers rdv.html. C'est la conversion prioritaire du site : ce bouton doit rester visible/accessible sans nécessiter de scroll sur desktop.
2. Aperçu simulateurs : 2-3 cartes reprenant le pattern .simulator-choice de simulateurs.html (Assurance Vie + un ou deux autres), avec lien "Voir tous les simulateurs →" vers simulateurs.html.
3. Bandeau statuts réglementaires : une ligne sobre avec les mandats/immatriculations de Victor. NE PAS INVENTER les numéros ORIAS ni le libellé exact des mandats — laisser un commentaire HTML <!-- TODO: à compléter avec les mandats Stellium exacts --> à cet endroit, je le remplirai avec les infos vérifiées.
4. Teaser ressources : encart court vers ressources.html (partenaires + habilitations) — page pas encore créée, le lien peut pointer vers ressources.html en anticipation (sera crée à l'étape 5).
5. CTA final : reprise du bouton "Prendre rendez-vous →" vers rdv.html, en clôture de page.

Nav en tête : laisser le pattern actuel (liens texte "Accueil" / "Simulateurs") sans ajouter Ressources/À propos pour l'instant — ce sera l'étape 3, sur toutes les pages en même temps pour rester cohérent.

Ne pas toucher à rdv.html, simulateurs.html, ni simulateurs/.
```

**Vérification** : la home doit se lire comme une vraie page de présentation (pas un aller-retour vers RDV en 2 clics), le CTA RDV doit rester le point de sortie le plus visible visuellement.

---

## Étape 3 — Nav globale + footer commun

```
Contexte : idem. Pages existantes à ce stade : index.html (home), simulateurs.html, rdv.html. Les pages a-propos.html et ressources.html n'existent pas encore mais seront créées aux étapes suivantes — les liens de nav vers elles doivent déjà être posés (ils pointeront vers des pages à créer, c'est voulu).

Tâche :
1. Uniformiser la nav <nav class="main-nav"> sur index.html, simulateurs.html et rdv.html : liens "Accueil" / "Simulateurs" / "Ressources" / "À propos", + un bouton CTA visuellement distinct "Prendre RDV →" en fin de nav pointant vers rdv.html (inspire-toi du pattern bouton existant dans .appointment-link pour le style, ne crée pas un style de bouton radicalement différent). aria-current="page" sur le lien actif de chaque page.
2. Créer un footer commun sobre (pattern à définir une seule fois, réutilisé sur toutes les pages) avec : copyright, email de contact, liens "Mentions légales" et "Confidentialité" (pointant vers mentions-legales.html et politique-confidentialite.html — pages pas encore créées, ce sera l'étape 6).
3. Appliquer ce footer sur index.html, simulateurs.html et rdv.html (remplacer le footer "page-note" minimal de rdv.html par le nouveau footer commun, en conservant si utile la phrase "Tous les rendez-vous sont synchronisés avec mon agenda...").

Ne pas créer a-propos.html, ressources.html, mentions-legales.html ni politique-confidentialite.html dans cette étape — seulement les liens qui pointeront vers eux.
```

**Vérification** : naviguer entre les 3 pages existantes, vérifier que la nav et le footer sont identiques partout (même markup, même position), que les liens vers les pages pas encore créées ne cassent pas le rendu (juste 404 pour l'instant, normal).

---

## Étape 4 — Page À propos

```
Contexte : idem. Nav/footer globaux déjà en place (étape 3), le lien "À propos" existe déjà et pointe vers a-propos.html.

Tâche : créer a-propos.html. Structure de référence bricepoitau.com : photo, section "Parcours", section "Philosophie de conseil", section "Formation & engagement". Reprendre cette architecture — **structure uniquement, aucun paragraphe rédigé** :

- Parcours, Philosophie de conseil, Formation & engagement : pour chaque section, un simple paragraphe avec le texte visible "À compléter." — ne rédige aucun contenu, même à partir d'éléments biographiques déjà connus. Victor écrira ces textes lui-même.
- Pas de mécénat/association à mentionner sauf si je le demande explicitement (ne pas copier le bloc FinzzAct de Brice).

Photo : utiliser un placeholder (assets/ existant si disponible, sinon un simple encadré avec texte "À compléter.") plutôt qu'une image inventée.
```

**Vérification** : la page ne doit contenir que de la structure et des "À compléter." — aucun texte rédigé à la place de Victor.

---

## Étape 5 — Page Ressources

```
Contexte : idem. Lien "Ressources" déjà posé dans la nav.

Tâche : créer ressources.html. Structure de référence bricepoitau.com : "Nos partenaires" + "Habilitations & diplômes". Adapter à Victor :

- Partenaires : Victor et Brice travaillent dans le même réseau (Prodemial, marque Stellium), avec un panorama de partenaires référencés largement commun. Utiliser la liste ci-dessous comme base de travail (reprise du contenu factuel de bricepoitau.com/ressources, "Liste non exhaustive"), regroupée par verticale comme sur le site source :

  Immobilier neuf / promoteurs : Edouard Denis, CityA Immobilier, Imodéus, Cogedim, Tagerim, LP Promotion, Pierre & Passion, Vinci Immobilier, Perl, Senioriales, Urbis Réalisations, Elyade, Foncia Immo Neuf, Sporting Promotion, Saint-Agne Immobilier.

  Placement / gestion d'actifs / assurance-vie : ODDO BHF, Advenis, Sofidy, Norma Capital, Vie Plus, NextStage, Odyssée Venture, Inter Invest, Eiffel Investment Group, La Française, Alderan, Novaxia, Atland Voisin, Groupe Apicil, Eres.

  Financement / banques : CFCAL, Crédit Agricole, Société Générale, Arkéa Banque Privée, MyMoneyBank, LCL, Banque Populaire, Groupe Caisse d'Épargne, BNP Paribas.

  SCPI : Activimmo, Alta Convictions, Atream Hôtels, Comète, Corum Eurion, Corum Origin, Epargne Pierre, Epargne Pierre Europe, Eurovalys, Immorente, LF Avenir Santé, NCAP Régions, Osmo Energie, Périal Opportunités, Sofidy Europe Invest, Transitions Europe.

  <!-- TODO Victor : confirmer cette liste face à METIER/Panorama solutions (source de vérité du projet) avant publication — le réseau est commun avec Brice mais ton périmètre de mandats personnel peut différer légèrement (ex. financement/IOBSP). Ajouter/retirer au besoin. -->

- Habilitations & diplômes : NE PAS reprendre les numéros de Brice (ORIAS n°25004012, carte professionnelle CCI Toulouse, police RCP Zurich — ce sont ses identifiants personnels, pas ceux de Victor). Structure de la liste à reprendre (diplôme, n° ORIAS, mandats Stellium, carte pro le cas échéant, contrôle ACPR, assurance RCP), mais laisser <!-- TODO: ORIAS, RSAC, Anacofi, n° carte pro, police RCP --> pour chaque donnée chiffrée, à compléter avec les infos vérifiées d'Administratif/.

Structure/mise en page à construire complètement.
```

**Vérification** : la liste de partenaires doit être confrontée à METIER/Panorama solutions avant mise en ligne (base de travail, pas garantie exacte au dernier partenaire près) ; aucune donnée réglementaire chiffrée publiée sans relecture explicite — cette page ne doit pas être mise en ligne avec les TODO d'habilitations encore en place.

---

## Étape 6 — Mentions légales / Confidentialité (si absentes)

D'abord vérifier si ces pages existent déjà quelque part dans le repo avant de lancer ce prompt (`ls` à la racine). Si absentes :

```
Contexte : idem. Créer mentions-legales.html et politique-confidentialite.html, structure minimale sobre cohérente avec le reste du site (nav + footer communs, un seul bloc de texte). Contenu : texte visible "À compléter." à la place du corps juridique — ne jamais générer de mentions légales ou de politique de confidentialité "génériques" inventées, c'est un document engageant juridiquement, Victor le fournira lui-même.
```

---

## Après les 6 étapes

- Repasser sur chaque `<!-- TODO -->` un par un (mandats, ORIAS, partenaires, mentions légales) avant toute mise en ligne.
- Relire le paragraphe "indépendant" de a-propos.html une dernière fois avant publication — c'est le seul endroit du site où le choix assumé plus haut se matérialise concrètement.
- Publier avec `./publish.sh "refonte structure inspirée bricepoitau.com"` une fois tout validé (voir skill `publier-site-victorkieny`).
