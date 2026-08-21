import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes } from "./_chapitre.js";

// Gabarit "Les atouts" (chapitre SCPI, import Claude Design) —
// PARAMÉTRIQUE : un seul gabarit pour les 4 atouts (rendement / risque /
// sur-mesure / gestion), pas un fichier par atout. La slide déclare
// `atoutActif` (1-4, voir deck.json) ; tout le reste (chaîne des 4
// repères, celui actif en or avec caret sur la règle, puces qui suivent)
// se déduit d'ATOUTS ci-dessous, copie fixe du système (identique pour
// tout client, voir charte CLAUDE.md "texte de narration").
//
// L'espacement du bloc de puces (margin-top/gap) varie légèrement selon
// leur nombre (2-3 puces : plus espacé ; 4 puces : resserré) — repris tel
// quel du handoff, pas une formule : c'est un choix d'équilibrage visuel
// pour que le bloc occupe sensiblement la même hauteur quel que soit
// l'atout.
const ATOUTS = [
  {
    label: "Rendement locatif optimisé",
    bullets: [
      "L'immobilier : une valeur refuge à long terme",
      "Un rendement attractif assis sur de l'immobilier professionnel",
      "Une revalorisation des loyers sur le long-terme",
    ],
    bulletsTop: 3.125,
    bulletsGap: 1.5625,
  },
  {
    label: "Un risque maîtrisé",
    bullets: ["Une forte diversification du patrimoine", "Une mutualisation du risque locatif"],
    bulletsTop: 3.125,
    bulletsGap: 1.5625,
  },
  {
    label: "Un placement sur-mesure",
    bullets: [
      "Un placement accessible",
      "Un montant d'investissement calibré",
      "Possibilité d'acquisition progressive",
      "Une transmission simplifiée",
    ],
    bulletsTop: 2.65625,
    bulletsGap: 1.25,
  },
  {
    label: "Une gestion clé en mains",
    bullets: ["Une procédure d'acquisition simple (pas de notaire)", "Une gestion locative déléguée à des experts"],
    bulletsTop: 3.125,
    bulletsGap: 1.5625,
  },
];

const CARET_LEFT = [12.5, 37.5, 62.5, 87.5]; // % — centre de chaque quart (repère actif)

export function render(slide) {
  const activeIndex = Math.min(Math.max((slide.atoutActif || 1) - 1, 0), ATOUTS.length - 1);
  const atout = ATOUTS[activeIndex];

  const circles = ATOUTS.map((a, i) => {
    const active = i === activeIndex;
    const num = String(i + 1).padStart(2, "0");
    return `
      <div class="scpi-atouts__num-cell">
        <div class="scpi-atouts__num-circle${active ? " scpi-atouts__num-circle--active" : ""}">
          <span class="scpi-atouts__num">${num}</span>
        </div>
      </div>
    `;
  }).join("");

  const labels = ATOUTS.map((a, i) => {
    const active = i === activeIndex;
    return `<span class="scpi-atouts__label${active ? " scpi-atouts__label--active" : ""}">${escapeHtml(a.label)}</span>`;
  }).join("");

  const bullets = atout.bullets
    .map(
      (b) => `
      <div class="scpi-atouts__bullet">
        <span class="scpi-atouts__bullet-dash"></span>
        <span class="scpi-atouts__bullet-text">${escapeHtml(b)}</span>
      </div>
    `
    )
    .join("");

  return `
    <div class="scpi-atouts">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="scpi-atouts__intro">
        <h1 class="chap-title scpi-atouts__title">Les atouts</h1>
        <span class="scpi-atouts__eyebrow">Atout ${activeIndex + 1} sur ${ATOUTS.length} · ${escapeHtml(atout.label)}</span>
      </div>

      <div class="scpi-atouts__stage">
        <div class="scpi-atouts__track">
          <div class="scpi-atouts__track-line"></div>
          <div class="scpi-atouts__track-row">${circles}</div>
        </div>
        <div class="scpi-atouts__labels">${labels}</div>
        <div class="scpi-atouts__rule">
          <div class="scpi-atouts__caret" style="left:${CARET_LEFT[activeIndex]}%"></div>
        </div>
        <div class="scpi-atouts__bullets" style="margin-top:${atout.bulletsTop}cqw;gap:${atout.bulletsGap}cqw">
          ${bullets}
        </div>
      </div>
    </div>
  `;
}
