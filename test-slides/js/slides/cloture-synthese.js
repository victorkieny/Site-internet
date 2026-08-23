import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Clôture — synthèse" : dernière slide du RDV, fond encre à la
// manière de "Constat" (même rail, même bloc titre+filet or) — un
// bookend visuel du début et de la fin de la présentation. Contrairement
// à Constat (un registre de SUPPORTS EXISTANTS, réparti en % du
// patrimoine actuel), ce registre liste les PRÉCONISATIONS retenues
// pendant le RDV : pas de barre de répartition (ce ne sont pas des parts
// d'un même total), juste nom + effort mensuel + objectif, une par
// ingénierie. Révélation progressive cumulative en (2 + N préconisations)
// états (opts.stateIndex direct, même mécanisme que "Les atouts") :
// état 1 = titre + phrase de budget (arrivée) ; états 2..N+1 = une
// préconisation à la fois ; dernier état = la conclusion "à terme".
export function render(slide, opts = {}) {
  const preco = slide.preconisations || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), preco.length + 1);
  const animate = !!opts.animate;

  const visibleCount = Math.min(Math.max(stateIndex, 0), preco.length);
  const showATerme = stateIndex >= preco.length + 1;
  const aTermeEntering = animate && stateIndex === preco.length + 1;

  // Toujours rendu, même avant son état d'apparition (voir --invisible) :
  // seule l'opacité change, jamais la présence dans le flux — sinon la
  // grille grandit d'une case à chaque clic et redéplace le registre
  // (centré par margin:auto, voir .cloture__registre), même bug que celui
  // corrigé sur le sous-titre de "Investir en financement".
  const cells = preco
    .map((p, i) => {
      const visible = i < visibleCount;
      const entering = animate && stateIndex === i + 1;
      const rule = i > 0 ? `<span class="cloture__item-rule${i < visibleCount ? "" : " cloture__item-rule--hidden"}"></span>` : "";
      const cell = `
        <div class="cloture__item${visible ? "" : " cloture__item--invisible"}${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <span class="cloture__item-nom">${escapeHtml(p.nom)}</span>
          <span class="cloture__item-montant">${escapeHtml(p.montant)}</span>
          <p class="cloture__item-note">${escapeHtml(p.note)}</p>
        </div>
      `;
      return rule + cell;
    })
    .join("");

  // 1fr par préconisation, 1px pour chaque filet intercalé — même
  // grille que .constat__kpis, pas un repeat() uniforme (les filets
  // doivent rester fins, pas prendre une part égale de la largeur).
  const columns = ["1fr", ...Array(preco.length - 1).fill("1px 1fr")].join(" ");

  return `
    <div class="cloture">
      ${renderChapRail(slide)}

      <div class="cloture__intro">
        <h1 class="chap-title cloture__title">${escapeHtml(slide.titre)}</h1>
        <span class="cloture__rule"></span>
        <p class="cloture__budget">${escapeHtml(slide.budget)}</p>
      </div>

      <div class="cloture__registre" style="grid-template-columns:${columns}">
        ${cells}
      </div>

      <div class="cloture__aterme${!showATerme ? " cloture__aterme--invisible" : ""}${aTermeEntering ? " is-entering" : ""}"${aTermeEntering ? " data-reveal" : ""}>
        <span class="cloture__aterme-label">${escapeHtml(slide.aTerme.label)}</span>
        <p class="cloture__aterme-text">${escapeHtml(slide.aTerme.texte)}</p>
      </div>
    </div>
  `;
}
