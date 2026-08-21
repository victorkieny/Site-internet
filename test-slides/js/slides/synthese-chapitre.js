import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Synthèse de chapitre" (handoff slides assurance vie,
// GABARITS.md #8) — n lignes séparées de filets, pas de rail d'étapes
// (on boucle sur l'annonce de la slide 2). Texte fourni tel quel par
// deck.json — cf. consigne : à ne pas reformuler. Slide récap point par
// point : chaque ligne porte une case cochée (pictogramme du système,
// pas une puce ronde) pour dire "acquis".

export function render(slide) {
  const lignes = slide.lignes || [];

  return `
    <div class="synthese-chapitre">
      ${renderChapRail(slide)}

      <div class="synthese-chapitre__intro">
        <p class="synthese-chapitre__kicker">${escapeHtml(slide.kicker)}</p>
        <span class="synthese-chapitre__rule"></span>
        <h1 class="chap-title synthese-chapitre__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="synthese-chapitre__list">
        ${lignes
          .map(
            (l) => `
          <div class="synthese-chapitre__item">
            ${iconSvg("coche", "var(--or)", 24)}
            <span class="synthese-chapitre__item-text">${escapeHtml(l)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}
