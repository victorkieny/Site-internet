# Prompt Claude Code — Comparateur de contrats

Site bricepoitau.com étant en Next.js/Tailwind (bundle minifié, rien de réutilisable tel quel), le code n'a pas pu être "récupéré" — j'ai reverse-engineé la mécanique de calcul à partir des valeurs affichées (3 points de vérification, formule confirmée à l'euro près). Ce fichier contient la spec fonctionnelle + un prompt prêt à coller dans Claude Code pour construire la page sur ton site, dans ta charte.

**Point d'ordre à trancher avant de lancer** : ton roadmap simulateurs prévoyait shared.js (étape 2) et PER/SCPI/Une pierre deux coups (étape 3) *avant* le Comparateur de contrats (étape 4) — et shared.js n'a pas encore été extrait de `projection.html`. Le prompt ci-dessous construit donc le Comparateur en autonome (fonctions dupliquées, pas partagées), pour rester déblocable tout de suite. Si tu enchaînes ensuite sur PER/SCPI, il faudra soit extraire shared.js après coup en intégrant aussi ce fichier, soit accepter la duplication. À toi de voir.

---

## Spécification fonctionnelle (reverse-engineering vérifié)

**Inputs globaux** (curseurs) : Versement initial (ex. 100 000 €), Horizon de placement en années (ex. 10 ans).

**Inputs par contrat** (2 contrats, nom éditable — ex. "Contrat A" / "Contrat B") :
- Droits d'entrée (%)
- Rendement annuel brut (%)
- Frais de gestion annuels (%)
- Rendement net (%) — **champ calculé, non éditable** = rendement annuel − frais de gestion, recalculé en direct

**Formule de capital à l'année t** (vérifiée sur 3 couples valeurs/résultats affichés, exacte à l'euro) :

```
Capital(t) = VersementInitial × (1 − droits_entrée) × (1 + rendement_net)^t
```

**Point d'amortissement** (par contrat) — durée pour que le capital net des droits d'entrée retrouve le versement initial :

```
t_amortissement = ln( 1 / (1 − droits_entrée) ) / ln(1 + rendement_net)
```

Si `droits_entrée = 0` → afficher "Immédiat (0 frais)" plutôt que 0.

**Point de croisement** entre les deux contrats — t tel que Capital_A(t) = Capital_B(t) :

```
t_croisement = ln( VI_A_net / VI_B_net ) / ln( (1 + rendement_net_B) / (1 + rendement_net_A) )
```
où `VI_X_net = VersementInitial × (1 − droits_entrée_X)`. N'afficher le croisement que s'il tombe dans l'horizon [0, horizon] et si les deux rendements nets diffèrent (sinon pas de croisement).

**Sorties à l'écran** :
1. Synthèse par contrat : capital à échéance + gain (`+X € vs initial`).
2. Écart à l'échéance (Capital_B − Capital_A) + nom du contrat gagnant.
3. Graphique ligne : 3 séries (capital initial en pointillé horizontal, courbe contrat A, courbe contrat B) sur l'axe des années 0→horizon, avec marqueur vertical au point de croisement si applicable.
4. Tableau "Synthèse par échéance" : lignes fixes (An 1, An 2, ligne croisement mise en évidence si applicable, An 5, An 7, An échéance en gras/étoile), colonnes Année / Contrat A / Contrat B / Écart (B−A) / Meilleur.
5. Pied de page : mention "Hypothèses : rendements annuels nets de frais de gestion. Les performances passées ne préjugent pas des performances futures. Simulation à titre indicatif, hors fiscalité." (à reformuler si besoin — vérifier qu'elle reste cohérente avec ton statut Stellium, pas de copie mot pour mot).

---

## Prompt à coller dans Claude Code

```
Contexte : site vanilla HTML/CSS/JS de victorkieny.fr (pas de framework, pas de build), un seul styles.css partagé (~2900 lignes, tokens dans :root — --serif = Bodoni 72 Display pour les titres, --sans = Avenir Next pour le corps, --ink/--muted/--paper/--surface/--line/--accent/--logo-gold/--button pour les couleurs). N'invente aucune couleur/police hors de ces tokens.

Référence de squelette obligatoire : simulateurs/projection.html (2242 lignes). Reprends STRICTEMENT le même squelette de page pour cohérence visuelle : <body class="tool-body">, nav .main-nav + nav .tool-nav avec titre, puis section.tool-layout contenant section.tool-overview (aside.tool-params avec les curseurs + div.tool-summary) et section.tool-detail (tool-view-toggle chart/table + tool-detail-panels avec tool-chart-card et une card tableau). Réutilise les classes CSS déjà définies dans styles.css pour ces éléments (curseurs, cartes, boutons de bascule) — n'en crée de nouvelles que si vraiment rien n'existe pour un besoin précis (ex. les deux cartes "Contrat A"/"Contrat B" côte à côte, la ligne de croisement mise en évidence dans le tableau).

Ne touche pas à projection.html ni à simulateurs.html sauf pour y ajouter la carte de lien vers le nouveau simulateur (remplacer une carte "en préparation" existante si le pattern .simulator-choice le permet).

Pas de shared.js pour l'instant (il n'existe pas encore sur ce repo) : écris les fonctions utilitaires (formatage monétaire, formatage %, calcul des ticks d'axe, rendu du graphique ligne, rendu du tableau) directement dans le nouveau fichier, en t'inspirant du style de code de projection.html (mêmes conventions de nommage) plutôt qu'en les réinventant de zéro.

Tâche : créer simulateurs/comparateur-contrats.html, simulateur de comparaison de deux contrats d'investissement sur la base des frais réels.

Inputs globaux (curseurs, en tête de tool-params) : Versement initial (€, ex. défaut 100 000), Horizon de placement (années, ex. défaut 10).

Inputs par contrat — deux blocs côte à côte "Contrat A" / "Contrat B" (nom éditable en texte libre, valeur par défaut "Contrat A" / "Contrat B") : Droits d'entrée (%, curseur 0–5), Rendement annuel brut (%, curseur), Frais de gestion annuels (%, curseur), Rendement net (%, calculé automatiquement = rendement annuel − frais de gestion, affiché en lecture seule, recalculé à chaque changement de curseur).

Formule de capital à l'année t (à implémenter exactement, aucune fiscalité ni actualisation) :
Capital(t) = VersementInitial × (1 − droits_entrée) × (1 + rendement_net)^t

Point d'amortissement par contrat = ln(1 / (1 − droits_entrée)) / ln(1 + rendement_net). Si droits_entrée = 0, afficher "Immédiat (0 frais)" au lieu de 0.

Point de croisement entre les deux contrats = ln(VI_A_net / VI_B_net) / ln((1 + rendement_net_B) / (1 + rendement_net_A)), où VI_X_net = VersementInitial × (1 − droits_entrée_X). N'afficher/marquer le croisement que s'il tombe dans [0, horizon] et si rendement_net_A ≠ rendement_net_B.

Résultats à afficher dans tool-summary : point d'amortissement de chaque contrat (deux blocs), message de croisement si applicable ("Croisement à X ans — les deux contrats atteignent Y € à ce moment. Au-delà, le classement reste stable jusqu'à l'échéance." ou équivalent si pas de croisement dans l'horizon), capital + gain à échéance pour chaque contrat, écart à l'échéance (Contrat B − Contrat A) et nom du contrat gagnant.

Graphique (tool-chart-card, vue par défaut) : courbe ligne, axe X = années 0 à horizon (pas de 1 an), axe Y = capital en €, 3 séries : capital initial (ligne horizontale pointillée), Contrat A, Contrat B. Marqueur vertical au point de croisement si applicable, légende avec les 3 séries.

Tableau (deuxième panneau, bascule via tool-view-toggle) : "Synthèse par échéance", colonnes Année / [Nom Contrat A] / [Nom Contrat B] / Écart (B−A) / Meilleur. Lignes : An 1, An 2, ligne croisement (mise en évidence visuellement, libellé "✕ Croisement (~an X)") si applicable, An 5, An 7, An [horizon] (mise en évidence comme ligne finale, ex. avec une étoile).

Pied de page sous le tableau : "Hypothèses : rendements annuels nets de frais de gestion. Les performances passées ne préjugent pas des performances futures. Simulation à titre indicatif, hors fiscalité."

Vérifie ton calcul sur ce cas de contrôle avant de me le rendre : Versement initial 100 000 €, Horizon 10 ans, Contrat A (droits d'entrée 4.8%, rendement annuel 4.0%, frais gestion 1.0% → rendement net 3.0%), Contrat B (droits d'entrée 0%, rendement annuel 2.0%, frais gestion 1.0% → rendement net 1.0%). Résultats attendus : point d'amortissement A ≈ 1.7 an, B = Immédiat, croisement ≈ 2.5 ans, capital A à 10 ans ≈ 127 941 €, capital B à 10 ans ≈ 110 462 €, écart ≈ -17 479 € (A meilleur).
```

---

## Cas de contrôle (à re-vérifier après génération)

| | Contrat A (Haut de Gamme) | Contrat B (Classique) |
|---|---|---|
| Droits d'entrée | 4.8% | 0.0% |
| Rendement annuel | 4.0% | 2.0% |
| Frais de gestion | 1.0% | 1.0% |
| Rendement net | 3.0% | 1.0% |
| Point d'amortissement | 1.7 an | Immédiat |
| Capital à 10 ans | 127 941 € | 110 462 € |

Croisement : ~2.5 ans, ~102 528 €. Écart à échéance : -17 479 € (A meilleur).
