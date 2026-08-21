import { euro, escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Investir en financement" (chapitre SCPI, import Claude
// Design) — UNE SEULE slide en révélation progressive à 3 états (Phase 1
// Constitution / Phase 2 Perception / Phase 3 Transmission), même
// mécanisme stepForward/stepBackward que "Fiscalité des rachats" et
// "Impact fiscal" (opts.stateIndex direct, pas de morphing entre
// couches) — jamais 3 slides séparées.
//
// Barre "mensualité" (état 1, gauche) : effort d'épargne net (encre) au-
// dessus, revenus SCPI (or) en dessous, hauteurs proportionnelles au
// ratio revenu/mensualité — jamais saisies en dur (même principe que les
// répartitions dérivées, charte CLAUDE.md). États 2-3 : cette barre reste
// affichée mais s'estompe (l'attention se déplace vers la suite), jamais
// retirée du DOM — la mise en page ne bouge pas.
const BAR_HEIGHT_CQW = 11.71875; // 150px à 1280 de large

const PHASES = [
  {
    eyebrow: "Étape 1 sur 3 · Phase 1 — Constitution du patrimoine",
    desc: (v) => `Capital SCPI cible de ${v.capital}, financé sur ${v.duree} ans.`,
  },
  {
    eyebrow: "Étape 2 sur 3 · Phase 2 — Perception de revenus",
    desc: () => `À l'issue du financement, les revenus SCPI deviennent un complément de revenu viager.`,
  },
  {
    eyebrow: "Étape 3 sur 3 · Phase 3 — Transmission",
    desc: () => `Le capital et les revenus accumulés sont transmis aux bénéficiaires.`,
  },
];

function values(slide) {
  const financementMensuel = slide.financementMensuel;
  const revenuMensuel = slide.revenuMensuel;
  const effort = financementMensuel - revenuMensuel;
  const hRev = (BAR_HEIGHT_CQW * revenuMensuel) / financementMensuel;
  const hEff = BAR_HEIGHT_CQW - hRev;
  return {
    capital: euro.format(slide.capitalCible),
    duree: slide.dureeAnnees,
    finM: `${euro.format(financementMensuel)}/mois`,
    revM: `${euro.format(revenuMensuel)}/mois`,
    effM: `${euro.format(effort)}/mois`,
    td: slide.tauxDistribution,
    tf: slide.tauxFinancement,
    hEff,
  };
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 2);
  const animate = !!opts.animate;
  const v = values(slide);
  const phase = PHASES[stateIndex];

  const opacityAB = stateIndex === 0 ? 1 : stateIndex === 1 ? 0.35 : 0.24;
  const showC = stateIndex >= 1;
  const cEntering = animate && stateIndex === 1;
  const opacityC = stateIndex === 1 ? 1 : 0.45;
  const widthC = stateIndex === 1 ? 25 : 21.875;
  const widthD = stateIndex === 1 ? 40.3125 : 25;
  const showE = stateIndex >= 2;
  const eEntering = animate && stateIndex === 2;

  const blockD = showC
    ? `
      <div class="scpi-financement__bar scpi-financement__block-d${cEntering ? " is-entering" : ""}"${cEntering ? " data-reveal" : ""} style="left:50cqw;top:6.71875cqw;width:${widthD}cqw;height:${BAR_HEIGHT_CQW}cqw;opacity:${opacityC}">
        <div class="scpi-financement__bar-spacer" style="height:${v.hEff}cqw"></div>
        <div class="scpi-financement__bar-revenu scpi-financement__bar-revenu--flush">
          ${stateIndex === 1 ? `<span class="scpi-financement__bar-label">Aucun effort d'épargne restant</span>` : ""}
        </div>
      </div>
    `
    : "";

  const blockC = showC
    ? `
      <div class="scpi-financement__block-c${cEntering ? " is-entering" : ""}"${cEntering ? " data-reveal" : ""} style="left:51.25cqw;top:5.78125cqw;width:${widthC}cqw;opacity:${opacityC}">
        <span class="scpi-financement__kicker">Complément de revenu viager</span>
        <span class="scpi-financement__value">${v.revM}</span>
      </div>
    `
    : "";

  const blockE = showE
    ? `
      <div class="scpi-financement__transmission${eEntering ? " is-entering" : ""}"${eEntering ? " data-reveal" : ""}>
        <div class="scpi-financement__divider"></div>
        <div class="scpi-financement__block-e">
          <span class="scpi-financement__kicker">Transmis</span>
          <span class="scpi-financement__value">${v.capital}</span>
          <p class="scpi-financement__block-e-note">de capital, plus les revenus accumulés.</p>
        </div>
        <div class="scpi-financement__tick" style="left:75cqw"></div>
        <span class="scpi-financement__axis-label scpi-financement__axis-label--transmission" style="left:75cqw">Transmission</span>
      </div>
    `
    : "";

  return `
    <div class="scpi-financement">
      ${renderChapRail(slide)}

      <div class="scpi-financement__intro">
        <h1 class="chap-title scpi-financement__title">${escapeHtml(slide.titre)}</h1>
        <span class="scpi-financement__eyebrow">${escapeHtml(phase.eyebrow)}</span>
        <p class="scpi-financement__desc">${escapeHtml(phase.desc(v))}</p>
      </div>

      <div class="scpi-financement__stage">
        <div class="scpi-financement__block-a" style="left:0;top:2.34375cqw;width:23.4375cqw;opacity:${opacityAB}">
          <span class="scpi-financement__kicker">Mensualité de financement</span>
          <span class="scpi-financement__value">${v.finM}</span>
        </div>

        <div class="scpi-financement__bar" style="left:0;top:6.71875cqw;width:50cqw;height:${BAR_HEIGHT_CQW}cqw;opacity:${opacityAB}">
          <div class="scpi-financement__bar-effort" style="height:${v.hEff}cqw">
            <span class="scpi-financement__bar-label">Effort d'épargne net · ${v.effM}</span>
          </div>
          <div class="scpi-financement__bar-revenu">
            <span class="scpi-financement__bar-label scpi-financement__bar-label--ink">Revenus SCPI · ${v.revM}</span>
          </div>
        </div>

        ${blockC}
        ${blockD}
        ${blockE}

        <div class="scpi-financement__axis"></div>
        <div class="scpi-financement__tick" style="left:0"></div>
        <div class="scpi-financement__tick" style="left:50cqw"></div>
        <span class="scpi-financement__axis-label" style="left:0">Aujourd'hui</span>
        <span class="scpi-financement__axis-label scpi-financement__axis-label--center" style="left:50cqw">Année ${v.duree} · fin du financement</span>
      </div>

      <p class="scpi-financement__footnote">Hypothèses · taux de distribution SCPI ${escapeHtml(v.td)}/an hors revalorisation · taux de financement ${escapeHtml(v.tf)} assurance incluse · montants moyens sur les ${v.duree} premières années · données brutes de fiscalité et de prélèvements sociaux.</p>
    </div>
  `;
}
