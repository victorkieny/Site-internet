import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Clôture — détail" : même intention et même habillage que
// "Clôture — synthèse" (cloture-synthese.js, voir son en-tête) — fond
// encre à la manière de "Constat", même rail, même bloc titre+filet or.
// Seule la densité change : ici chaque préconisation garde 2 puces
// (rendement/fiscalité/ingénierie...), en registre EMPILÉ (une ligne par
// préconisation, filet horizontal entre chacune) plutôt qu'en colonnes —
// le texte plus long ne tiendrait pas sur 3 colonnes étroites. Les deux
// gabarits existent en parallèle le temps d'un choix ; garder les deux
// synchronisés visuellement (couleurs, tailles de titre/filet, "à terme")
// plutôt que diverger, seule la forme du corps change. Révélation
// progressive cumulative en (2 + N préconisations) états, même mécanique
// que la variante synthèse.
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), preco.length + 1);
  const animate = !!opts.animate;

  const visibleCount = Math.min(Math.max(stateIndex, 0), preco.length);
  const showATerme = stateIndex >= preco.length + 1;
  const aTermeEntering = animate && stateIndex === preco.length + 1;

  // Toujours rendues, même avant leur état d'apparition (voir
  // --invisible) : la liste garde sa hauteur pleine dès le premier état,
  // seule l'opacité de chaque ligne change — sinon la liste grandit à
  // chaque clic et redéplace le bloc "à terme" sous elle (même bug que
  // celui corrigé sur le sous-titre de "Investir en financement").
  const rows = preco
    .map((p, i) => {
      const visible = i < visibleCount;
      const entering = animate && stateIndex === i + 1;
      const last = i === preco.length - 1;
      const bullets = (p.bullets || [])
        .map(
          (b) => `
          <div class="cloture-d__bullet">
            <span class="cloture-d__bullet-dash"></span>
            <span class="cloture-d__bullet-text">${escapeHtml(b)}</span>
          </div>
        `
        )
        .join("");
      return `
        <div class="cloture-d__row${last ? " cloture-d__row--last" : ""}${visible ? "" : " cloture-d__row--invisible"}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <div class="cloture-d__row-head">
            <span class="cloture-d__row-nom">${escapeHtml(p.nom)}</span>
            <span class="cloture-d__row-montant">${escapeHtml(p.montant)}</span>
          </div>
          <div class="cloture-d__bullets">${bullets}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="cloture">
      ${renderChapRail(slide)}

      <div class="cloture__intro">
        <h1 class="chap-title cloture__title">${escapeHtml(slide.titre)}</h1>
        <span class="cloture__rule"></span>
        <p class="cloture__budget">${escapeHtml(slide.budget)}</p>
      </div>

      <div class="cloture-d__list">
        ${rows}
      </div>

      <div class="cloture__aterme${!showATerme ? " cloture__aterme--invisible" : ""}${aTermeEntering ? " is-entering" : ""}"${aTermeEntering ? " data-reveal" : ""}>
        <span class="cloture__aterme-label">${escapeHtml(slide.aTerme.label)}</span>
        <p class="cloture__aterme-text">${escapeHtml(slide.aTerme.texte)}</p>
      </div>
    </div>
  `;
}
