import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Les atouts" (chapitre SCPI, import Claude Design "Atouts -
// Design final") — PARAMÉTRIQUE : nombre d'atouts (2 à 4) et de puces
// par atout tous dérivés de deck.json (slide.atouts), rien saisi en
// dur. Révélation progressive à N états (opts.stateIndex, un état par
// atout — même mécanisme que "Les atouts" précédent) : le stepper de
// gauche marque l'atout actif en or, le panneau de droite affiche son
// contenu (kicker numéroté + puces).
//
// Colonne de gauche à largeur fixe (voir .atouts__side), reliée par un
// filet vertical continu derrière les cercles — un cercle plein or (+
// icône papier) pour l'atout actif, un cercle contour encre atténuée (+
// icône encre atténuée) pour les autres. Colonne de droite : contenu
// centré verticalement (justify-content:center) dans une hauteur FIXE
// (.atouts__stage min-height, calée sur l'atout qui a le plus de
// puces) — jamais de vide disproportionné ni de saut de mise en page
// d'un atout à l'autre, quel que soit leur nombre de puces.
function stepperItemHtml(atout, active) {
  const cls = "atouts__step" + (active ? " atouts__step--active" : "");
  const iconColor = active ? "var(--papier)" : "rgba(var(--chap-ink-rgb),.4)";
  return `
    <div class="${cls}">
      <span class="atouts__step-circle">${iconSvg(atout.icon, iconColor, 26)}</span>
      <span class="atouts__step-label">${escapeHtml(atout.label)}</span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const atouts = slide.atouts || [];
  const animate = !!opts.animate;
  const activeIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), Math.max(atouts.length - 1, 0));
  const atout = atouts[activeIndex] || {};

  const stepper = atouts.map((a, i) => stepperItemHtml(a, i === activeIndex)).join("");

  const bullets = (atout.bullets || [])
    .map(
      (b) => `
      <div class="atouts__bullet">
        <span class="atouts__bullet-dash">—</span>
        <span class="atouts__bullet-text">${escapeHtml(b)}</span>
      </div>
    `
    )
    .join("");

  // Contenu de droite reconstruit à chaque changement d'atout (pas de
  // morphing entre listes de puces de longueurs différentes) : un
  // fondu (data-reveal) marque le changement plutôt qu'un saut sec.
  return `
    <div class="atouts">
      ${renderChapRail(slide)}

      <div class="atouts__intro">
        <h1 class="chap-title atouts__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="atouts__stage">
        <div class="atouts__side">
          <span class="atouts__side-line"></span>
          ${stepper}
        </div>
        <div class="atouts__content${animate ? " is-entering" : ""}"${animate ? " data-reveal" : ""}>
          <span class="atouts__kicker">${escapeHtml(atout.numero)} — ${escapeHtml((atout.label || "").toUpperCase())}</span>
          <div class="atouts__bullets">${bullets}</div>
        </div>
      </div>
    </div>
  `;
}
