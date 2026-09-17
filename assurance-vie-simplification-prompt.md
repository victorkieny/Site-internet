# Simplification du résumé — simulateur Assurance Vie

Fichier concerné : `simulateurs/projection.html`, mode `av` uniquement (ne touche pas au mode `scpi`, qui partage le même fichier mais des chemins de code distincts). Ne pas toucher à `shared.js`.

## Contexte

Message clé de ce simulateur en RDV client : la puissance des intérêts composés — un capital final qui vient majoritairement des intérêts, pas de l'effort d'épargne. Le résumé actuel répète ce même fait quatre fois (jauge en %, montants en €, multiple ×, paragraphe en prose) ; deux de ces répétitions n'ajoutent rien et doivent disparaître. Par ailleurs, la comparaison "Livret A" doit devenir un outil générique ("Livret bancaire") à taux ajustable, plutôt qu'un produit nommé avec un plafond de versement qu'elle ignore.

## Changement 1 — Alléger le bloc de résultat (fonction `renderSummary`, branche `state.mode === "av"`)

Garder : le hero ("Capital final estimé"), la jauge de répartition (`capital-breakdown` + ses labels en %), les montants en € (`capital-metrics`), et le "Multiple obtenu" (`capital-shares`).

Supprimer :
- La ligne "Part des intérêts gagnés" dans `capital-shares` (doublon exact du pourcentage déjà affiché dans la jauge juste au-dessus — aucun angle nouveau). Le bloc `capital-shares` ne contient plus alors qu'un seul élément, "Multiple obtenu" : ajuster la mise en page si un bloc à un seul élément casse visuellement (ex. le passer en simple ligne plutôt qu'une grille à deux colonnes).
- Le bloc `capital-insight` en entier, y compris sa barre `capital-visual` (elle refait, sans les labels, la même répartition que `capital-breakdown` juste au-dessus) et le paragraphe ("En plaçant X aujourd'hui, puis Y chaque mois pendant Z ans...") : c'est une reformulation en phrase de chiffres déjà visibles ailleurs à l'écran (paramètres dans le panneau "Hypothèses", résultat dans le hero), sans valeur ajoutée.

Nettoyer en cohérence dans la branche `existingResult` (mise à jour incrémentale sans re-render complet) : retirer `updateNumber("interests-share-detail", ...)`, les références à `investedVisual`/`interestsVisual` (`capital-visual` disparaît), et les `updateCopy(...)` pour `capital-initial`, `monthly-payment`, `duration`, `annual-rate`, `capital-final` (ces `data-av-copy` n'existent plus). Vérifier qu'aucune autre fonction ne référence ces éléments supprimés.

## Changement 2 — Renommer "Livret A" en "Livret bancaire"

Le taux reste ajustable via le curseur existant (`tauxLivretA`, curseur 0-5 %) — aucun changement de calcul, aucun plafond à modéliser. Seul le nommage à l'écran change, pour permettre d'illustrer au taux réel du Livret A (si le montant simulé reste sous le plafond légal) ou avec un autre taux de référence sans induire en erreur sur un produit nommé.

Emplacements à renommer ("Livret A" → "Livret bancaire") :
- Bouton de bascule vers cette vue : `aria-label` et `title` (actuellement "Comparaison Livret A")
- Titre de la carte de résultat, en dur dans le HTML ("Livret A vs Assurance Vie : manque à gagner sur 30 ans") et sa mise à jour dynamique en JS (`renderOutputs`)
- `aria-label` du conteneur `#compare` ("Comparaison entre un Livret A et votre assurance vie")
- Dans `renderCompareShock` : le libellé "Livret A" au-dessus du montant final
- Dans `renderCompareEvolution` : le libellé "Livret A" dans les totaux, l'infobulle du graphique, et la légende
- Dans `renderLivretRateControl` : le libellé du curseur ("Taux net du Livret A retenu") et son `aria-label`

Optionnel, à ta discrétion : renommer aussi les identifiants internes non visibles (`computeLivretA`, `values.tauxLivretA`, classes CSS `compare-race-bar-livret`, `legend-invested`...) pour la cohérence du code — sans impact utilisateur, à ne faire que si ça ne complexifie pas le diff.

## Changement 3 — Réécrire le disclaimer de la comparaison

Actuel : *"Comparaison brute avant fiscalité de sortie et hors plafond de versement du Livret A (22 950 € par personne) : à ajuster selon la situation réelle du client."*

Nouveau : le plafond ne concerne que le cas où le conseiller illustre avec le taux réel du Livret A — ce n'est plus une réserve sur l'outil entier. Reformuler en ce sens, par exemple : *"Comparaison brute avant fiscalité de sortie, au taux net de votre choix. Si vous retenez le taux réel du Livret A, rappel : versements plafonnés à 22 950 € par personne (les intérêts déjà acquis continuent au-delà)."*

## Vérification avant de considérer terminé

- Le mode `scpi` (`?mode=scpi`) doit rester strictement inchangé visuellement — repasser dessus après la modif.
- Aucune erreur console au chargement du mode `av`, curseurs et bascules de vue (chart/pie/table/compare) fonctionnels.
- Relire l'écran de résultat au complet en mode `av` : plus aucune redite du pourcentage d'intérêts gagnés, plus de paragraphe de synthèse, "Livret A" n'apparaît plus nulle part à l'écran.
