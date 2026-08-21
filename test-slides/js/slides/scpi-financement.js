import { euro, escapeHtml } from "../editable.js";
import { renderChapRail, formatPct } from "./_chapitre.js";

// Gabarit "Investir en financement" (chapitre SCPI) — UNE SEULE slide en
// révélation progressive à 6 états (opts.stateIndex direct, pas de
// morphing entre couches), qui raconte le mécanisme du levier de crédit
// dans l'ordre :
//   1. la mensualité de financement brute, colonne pleine (encre) ;
//   2. les revenus SCPI montent depuis le bas de la colonne et absorbent
//      une partie de la mensualité : il ne reste que l'effort net à la
//      charge de l'investisseur ;
//   3. l'axe se compresse au premier tiers (la colonne + son repère de
//      durée glissent vers la gauche) pour laisser la place au bilan ;
//   4. le bilan : effort réel cumulé sur toute la durée, en regard du
//      patrimoine immobilier détenu ;
//   5. l'effet de levier (gain en euros et en %), toujours dérivé des
//      montants ci-dessus, jamais saisi en dur ;
//   6. les revenus SCPI se poursuivent à vie une fois le financement
//      soldé — même montant (v.revM) qu'aux états 2-3, mais calculé sur
//      les 85 000 € de patrimoine désormais détenus en pleine propriété,
//      plus sur l'effort de 40 500 € qui n'a plus cours.
//
// Colonne "mensualité" (état 1, pleine hauteur) : effort d'épargne net
// (encre) qui se rétracte, revenus SCPI (or) qui montent depuis le bas
// — hauteurs proportionnelles au ratio revenu/mensualité, jamais saisies
// en dur (même principe que les répartitions dérivées, charte
// CLAUDE.md). La somme des deux hauteurs reste constante à chaque
// instant de la transition (même durée/easing, deltas opposés) : jamais
// de trou ni de chevauchement pendant l'animation.
const BAR_HEIGHT_CQW = 11.71875; // 150px à 1280 de large

// État 1 : la colonne se construit visuellement mois après mois plutôt
// que d'apparaître comme un bloc plein — un segment par année de
// financement (slide.dureeAnnees, jamais un nombre saisi en dur),
// balayés de gauche à droite via animation-delay (CSS pur, voir
// chapitre.css .scpi-financement__bar-segment : indépendant d'opts.
// animate, pour rejouer à chaque fois qu'on arrive/revient sur cet
// état, y compris à l'ouverture de la slide). Distinct du mécanisme
// data-reveal (transition JS d'un état à l'autre) utilisé partout
// ailleurs sur cette slide.
const SEGMENT_STEP_MS = 16;

// Largeur utile de la scène (cqw) : .scpi-financement__stage fait
// 100% de .scpi-financement, elle-même en retrait du padding horizontal
// de la scène (4.84375cqw de chaque côté) — 100 - 2×4.84375.
const STAGE_W = 90.3125;
const THIRD_W = STAGE_W / 3;
const RESULT_GAP = 3.125;
const RESULT_LEFT = THIRD_W + RESULT_GAP;
const RESULT_W = STAGE_W - RESULT_LEFT;

const ETAPES = [
  {
    desc: (v) => `Investir en SCPI à crédit représente un effort mensuel de ${v.finM}.`,
  },
  {
    desc: (v) =>
      `Les revenus SCPI (${v.revM}) viennent compenser une grande partie de la mensualité : il ne reste que ${v.effM} à la charge de l'investisseur.`,
  },
  {
    desc: (v) => `Cet effort net de ${v.effM} est maintenu pendant ${v.duree} ans.`,
  },
  {
    desc: (v) => `${v.effM} pendant ${v.duree} ans représente un effort réel de ${v.effortTotal}, pour un patrimoine immobilier de ${v.capital}.`,
  },
  {
    desc: (v) => `Soit un gain de ${v.levier} par rapport à l'effort fourni, ${v.levierPctSigned}.`,
  },
  {
    desc: (v) =>
      `Une fois le financement soldé, ces ${v.revM} de loyers se poursuivent à vie — calculés sur les ${v.capital} de patrimoine détenu, non plus sur l'effort de ${v.effortTotal}.`,
  },
];

function values(slide) {
  const financementMensuel = slide.financementMensuel;
  const revenuMensuel = slide.revenuMensuel;
  const effort = financementMensuel - revenuMensuel;
  const duree = slide.dureeAnnees;
  const effortTotal = effort * duree * 12;
  const capitalCible = slide.capitalCible;
  const levier = capitalCible - effortTotal;
  const levierPct = (levier / effortTotal) * 100;
  const hRev = (BAR_HEIGHT_CQW * revenuMensuel) / financementMensuel;
  const hEff = BAR_HEIGHT_CQW - hRev;
  return {
    duree,
    capitalRaw: capitalCible,
    effortTotalRaw: effortTotal,
    capital: euro.format(capitalCible),
    finM: `${euro.format(financementMensuel)}/mois`,
    revM: `${euro.format(revenuMensuel)}/mois`,
    effM: `${euro.format(effort)}/mois`,
    effortTotal: euro.format(effortTotal),
    levier: `+${euro.format(levier)}`,
    levierPctSigned: `+${formatPct(levierPct)}`,
    td: slide.tauxDistribution,
    tf: slide.tauxFinancement,
    hEff,
    hRev,
  };
}

// Diagramme de l'effet de levier (état 5) : deux colonnes à l'échelle
// l'une de l'autre (pas juste deux hauteurs arbitraires) — "Patrimoine
// détenu" est toujours la plus grande, sa base (jusqu'à la hauteur de
// "Effort réel") reste au ton neutre, seul l'écart au sommet passe en
// or : c'est cet écart, pas la colonne entière, qui EST l'effet de
// levier.
const LEVIER_BAR_MAX_CQW = 13.75; // hauteur de la colonne "Patrimoine détenu"

function barSegmentsHtml(count, label) {
  const segments = Array.from(
    { length: count },
    (_, i) => `<span class="scpi-financement__bar-segment" style="animation-delay:${i * SEGMENT_STEP_MS}ms"></span>`
  ).join("");
  return `
    <div class="scpi-financement__bar-segments">
      ${segments}
      <span class="scpi-financement__bar-label scpi-financement__bar-label--overlay">${escapeHtml(label)}</span>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), ETAPES.length - 1);
  const animate = !!opts.animate;
  const v = values(slide);
  const etape = ETAPES[stateIndex];

  // État 2 (index 1) : les revenus SCPI montent depuis le bas, l'effort
  // se rétracte d'autant — voir en-tête de fichier.
  const revenuGrowing = animate && stateIndex === 1;
  const revenuHeight = stateIndex >= 1 ? v.hRev : 0;
  const effortHeight = stateIndex >= 1 ? v.hEff : BAR_HEIGHT_CQW;
  const effortLabel = stateIndex >= 1 ? `Effort d'épargne net · ${v.effM}` : `Mensualité de financement · ${v.finM}`;

  // État 3 (index 2) : la colonne (largeur) et son repère de durée
  // glissent du plein axe au premier tiers.
  const axisShrinking = animate && stateIndex === 2;
  const barWidth = stateIndex >= 2 ? THIRD_W : STAGE_W;
  const tickLeft = stateIndex >= 2 ? THIRD_W : STAGE_W;

  const barAttrs = axisShrinking ? ` data-reveal data-reveal-width="${THIRD_W}cqw"` : "";
  const barStyle = axisShrinking ? `width:${STAGE_W}cqw` : `width:${barWidth}cqw`;
  const tickAttrs = axisShrinking ? ` data-reveal data-reveal-left="${THIRD_W}cqw"` : "";
  const tickStyle = axisShrinking ? `left:${STAGE_W}cqw` : `left:${tickLeft}cqw`;

  const effortAttrs = revenuGrowing ? ` data-reveal data-reveal-height="${v.hEff}cqw"` : "";
  const effortStyle = revenuGrowing ? `height:${BAR_HEIGHT_CQW}cqw` : `height:${effortHeight}cqw`;
  const revenuAttrs = revenuGrowing ? ` data-reveal data-reveal-height="${v.hRev}cqw"` : "";
  const revenuStyle = revenuGrowing ? `height:0cqw` : `height:${revenuHeight}cqw`;

  // État 4 (index 3) : bilan (effort réel cumulé / patrimoine détenu).
  const showResultat = stateIndex >= 3;
  const resultatEntering = animate && stateIndex === 3;
  const resultatTextHtml = showResultat
    ? `
      <div class="scpi-financement__resultat-text${resultatEntering ? " is-entering" : ""}"${resultatEntering ? " data-reveal" : ""}>
        <div class="scpi-financement__resultat-row">
          <span class="scpi-financement__kicker">${escapeHtml(v.effM)} pendant ${v.duree} ans</span>
          <span class="scpi-financement__value">${v.effortTotal}</span>
        </div>
        <div class="scpi-financement__resultat-row scpi-financement__resultat-row--last">
          <span class="scpi-financement__kicker">Patrimoine immobilier détenu</span>
          <span class="scpi-financement__value">${v.capital}</span>
        </div>
      </div>
    `
    : "";

  // État 5 (index 4) : effet de levier — diagramme sous les deux
  // montants ci-dessus (pas en dessous de l'axe) : deux colonnes à
  // l'échelle l'une de l'autre, l'écart au sommet de "Patrimoine
  // détenu" (en or) EST le levier, montants toujours dérivés (jamais
  // saisis en dur — charte CLAUDE.md). Hauteur calée pour laisser la
  // place au texte EN DESSOUS des colonnes avant l'axe (voir
  // LEVIER_BAR_MAX_CQW).
  const showLevier = stateIndex >= 4;
  const levierEntering = animate && stateIndex === 4;
  const patrimoineBarH = LEVIER_BAR_MAX_CQW;
  const effortBarH = LEVIER_BAR_MAX_CQW * (v.effortTotalRaw / v.capitalRaw);
  const gapBarH = patrimoineBarH - effortBarH;
  const levierHtml = showLevier
    ? `
      <div class="scpi-financement__levier${levierEntering ? " is-entering" : ""}"${levierEntering ? " data-reveal" : ""}>
        <div class="scpi-financement__levier-diagram">
          <div class="scpi-financement__levier-bar scpi-financement__levier-bar--effort"${levierEntering ? ` data-reveal data-reveal-height="${effortBarH}cqw"` : ""} style="height:${levierEntering ? 0 : effortBarH}cqw"></div>
          <div class="scpi-financement__levier-bar scpi-financement__levier-bar--patrimoine"${levierEntering ? ` data-reveal data-reveal-height="${patrimoineBarH}cqw"` : ""} style="height:${levierEntering ? 0 : patrimoineBarH}cqw">
            <div class="scpi-financement__levier-bar-gap"${levierEntering ? ` data-reveal data-reveal-height="${gapBarH}cqw"` : ""} style="height:${levierEntering ? 0 : gapBarH}cqw"></div>
          </div>
        </div>
        <span class="scpi-financement__levier-kicker">Effet de levier</span>
        <span class="scpi-financement__levier-value">${v.levier} <span class="scpi-financement__levier-pct">(${v.levierPctSigned})</span></span>
      </div>
    `
    : "";

  // État 6 (index 5) : les revenus se poursuivent à vie une fois le
  // financement soldé — même montant qu'aux états 2-3 (v.revM), mais
  // affiché comme un repère de durée qui prolonge l'axe au-delà de
  // "25 ans", pas un nouveau calcul.
  const showViager = stateIndex >= 5;
  const viagerEntering = animate && stateIndex === 5;
  const viagerHtml = showViager
    ? `<span class="scpi-financement__viager${viagerEntering ? " is-entering" : ""}"${viagerEntering ? " data-reveal" : ""} style="left:${STAGE_W}cqw">Puis ${v.revM} à vie<br>sur les ${v.capital} de patrimoine</span>`
    : "";

  // État 4 (texte seul, pas encore le diagramme de levier) : le bloc
  // est centré par rapport au TITRE, donc sur la pleine largeur de la
  // scène (left:0/width:STAGE_W) — pas seulement dans l'espace à droite
  // de la colonne, qui centrerait par rapport à un axe décalé vers la
  // droite. space-between (sur la largeur RESULT_LEFT/RESULT_W plus
  // étroite) n'a de sens qu'à partir de l'état 5, quand le diagramme
  // doit rejoindre le bout de l'axe (voir plus haut).
  // top réduit à l'état 5 : le diagramme (2x plus grand que le premier
  // jet) a besoin de toute la hauteur disponible avant l'axe.
  const resultatJustify = showLevier ? "space-between" : "center";
  const resultatLeft = showLevier ? RESULT_LEFT : 0;
  const resultatWidth = showLevier ? RESULT_W : STAGE_W;
  const resultatTop = showLevier ? 0.3125 : 4.375;
  const resultatHtml =
    showResultat || showLevier
      ? `<div class="scpi-financement__resultat" style="left:${resultatLeft}cqw;top:${resultatTop}cqw;width:${resultatWidth}cqw;justify-content:${resultatJustify}">${resultatTextHtml}${levierHtml}</div>`
      : "";

  return `
    <div class="scpi-financement">
      ${renderChapRail(slide)}

      <div class="scpi-financement__intro">
        <h1 class="chap-title scpi-financement__title">${escapeHtml(slide.titre)}</h1>
        <p class="scpi-financement__desc">${escapeHtml(etape.desc(v))}</p>
      </div>

      <div class="scpi-financement__stage">
        ${
          stateIndex === 0
            ? `<div class="scpi-financement__bar" style="left:0;top:6.71875cqw;height:${BAR_HEIGHT_CQW}cqw;width:${STAGE_W}cqw">${barSegmentsHtml(v.duree, effortLabel)}</div>`
            : `
        <div class="scpi-financement__bar"${barAttrs} style="left:0;top:6.71875cqw;height:${BAR_HEIGHT_CQW}cqw;${barStyle}">
          <div class="scpi-financement__bar-effort"${effortAttrs} style="${effortStyle}">
            <span class="scpi-financement__bar-label">${escapeHtml(effortLabel)}</span>
          </div>
          <div class="scpi-financement__bar-revenu"${revenuAttrs} style="${revenuStyle}">
            <span class="scpi-financement__bar-label scpi-financement__bar-label--ink">Revenus SCPI · ${v.revM}</span>
          </div>
        </div>
        `
        }

        ${resultatHtml}

        <div class="scpi-financement__axis"></div>
        <div class="scpi-financement__tick" style="left:0"></div>
        <div class="scpi-financement__tick"${tickAttrs} style="${tickStyle}"></div>
        <span class="scpi-financement__axis-label" style="left:0">Aujourd'hui</span>
        <span class="scpi-financement__axis-label scpi-financement__axis-label--center"${tickAttrs} style="${tickStyle}">${v.duree} ans</span>
        ${viagerHtml}
      </div>

      <p class="scpi-financement__footnote">Hypothèses · taux de distribution SCPI ${escapeHtml(v.td)}/an hors revalorisation · taux de financement ${escapeHtml(v.tf)} assurance incluse · montants moyens sur les ${v.duree} premières années · données brutes de fiscalité et de prélèvements sociaux.</p>
    </div>
  `;
}
