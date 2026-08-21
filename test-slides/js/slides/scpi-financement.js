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
// Même hauteur que les colonnes du diagramme de levier
// (LEVIER_BAR_MAX_CQW) : une seule échelle de "colonne" sur toute la
// slide, pas une par visualisation. AXIS_TOP_CQW doit rester égal à la
// valeur posée dans chapitre.css (.scpi-financement__axis, top) : la
// colonne repose sur l'axe, son top se déduit de sa hauteur plutôt que
// d'être saisi en dur en plus (jamais désynchronisé si l'une des deux
// valeurs change).
const AXIS_TOP_CQW = 18.4375;
const BAR_HEIGHT_CQW = 13.75;
const BAR_TOP_CQW = AXIS_TOP_CQW - BAR_HEIGHT_CQW;

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

// Le bloc central (résultat-text) est centré sur STAGE_W mais de
// largeur intrinsèque (dépend du texte réel, pas fixée en CSS) — sa
// largeur exacte n'est donc pas connue à l'écriture de ce fichier.
// TEXT_W_ASSUMED est une estimation (mesurée sur le contenu réel de ce
// client) qui sert UNIQUEMENT à calculer un espacement symétrique de
// part et d'autre du bloc (colonne -> bloc, bloc -> diagramme) ; ce
// n'est pas une contrainte posée sur le texte lui-même, qui reste libre
// de s'ajuster à son propre contenu.
const TEXT_W_ASSUMED = 16.5;
const TEXT_LEFT_ASSUMED = STAGE_W / 2 - TEXT_W_ASSUMED / 2;
const TEXT_RIGHT_ASSUMED = STAGE_W / 2 + TEXT_W_ASSUMED / 2;
const BAR_TEXT_GAP = TEXT_LEFT_ASSUMED - THIRD_W;
const LEVIER_LEFT = TEXT_RIGHT_ASSUMED + BAR_TEXT_GAP;

// L'axe s'arrête juste après le bloc central plutôt que de courir sous
// tout le diagramme de levier (voir .scpi-financement__axis, largeur
// posée en style inline) — celui-ci n'a alors plus besoin de rester
// au-dessus d'une ligne visible, et peut descendre jusqu'à son niveau
// (AXIS_TOP_CQW) au lieu de s'arrêter bien avant par précaution.
const AXIS_END_CQW = TEXT_RIGHT_ASSUMED + 2;

const ETAPES = [
  {
    desc: null,
  },
  {
    desc: null,
  },
  {
    desc: (v) =>
      `Grâce à l'effet de levier, ${v.effM} pendant ${v.duree} ans représente un effort réel de ${v.effortTotal}, pour un patrimoine immobilier constitué de ${v.capital}.`,
  },
  {
    desc: (v) =>
      `Grâce à l'effet de levier, ${v.effM} pendant ${v.duree} ans représente un effort réel de ${v.effortTotal}, pour un patrimoine immobilier constitué de ${v.capital}.`,
  },
  {
    desc: (v) =>
      `Grâce à l'effet de levier, ${v.effM} pendant ${v.duree} ans représente un effort réel de ${v.effortTotal}, pour un patrimoine immobilier constitué de ${v.capital}.`,
  },
  {
    desc: (v) =>
      `Grâce à l'effet de levier, ${v.effM} pendant ${v.duree} ans représente un effort réel de ${v.effortTotal}, pour un patrimoine immobilier constitué de ${v.capital}.`,
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
    // Arrondi à l'entier : la statistique "à droite des bâtons" est une
    // accroche visuelle (+110 %), pas une donnée de précision — le
    // détail au dixième près reste dans le texte descriptif
    // (levierPctSigned, ETAPES[4]).
    levierPctRounded: `+${Math.round(levierPct)} %`,
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
// levier. Descend jusqu'au niveau de l'axe (AXIS_TOP_CQW) — l'axe
// s'arrête désormais avant le diagramme (voir AXIS_END_CQW), le
// diagramme n'a plus besoin de rester au-dessus d'une ligne visible ;
// marge réservée pour les légendes ("Sans/Avec financement") sous les
// colonnes.
const LEVIER_TOP_CQW = 0.3125; // top de .scpi-financement__levier, voir chapitre.css
const LEVIER_BAR_MAX_CQW = AXIS_TOP_CQW - LEVIER_TOP_CQW; // hauteur de la colonne "Patrimoine détenu" — même bas que la colonne de gauche

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

  // La ligne d'axe s'arrête juste après le bloc central une fois la
  // colonne rétractée (même transition que barWidth/tickLeft
  // ci-dessus) — avant l'état 3, le repère "25 ans" est encore au bout
  // du plein axe (STAGE_W), la raccourcir plus tôt le laisserait flotter
  // sans ligne sous lui.
  const axisWidth = stateIndex >= 2 ? AXIS_END_CQW : STAGE_W;
  const axisAttrs = axisShrinking ? ` data-reveal data-reveal-width="${AXIS_END_CQW}cqw"` : "";
  const axisStyle = axisShrinking ? `width:${STAGE_W}cqw` : `width:${axisWidth}cqw`;

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

  // État 5 (index 4) : effet de levier — diagramme ancré au bloc
  // central (pas au bout de l'axe) : autant d'écart colonne -> bloc que
  // bloc -> diagramme (voir LEVIER_LEFT/BAR_TEXT_GAP). Axe des
  // ordonnées à gauche des deux colonnes ("Sans financement" /
  // "Avec financement"), effet de levier (+montant, +%) à droite.
  // Colonnes à l'échelle l'une de l'autre : l'écart au sommet de
  // "Avec financement" (en or) EST le levier — montants toujours
  // dérivés (jamais saisis en dur — charte CLAUDE.md).
  const showLevier = stateIndex >= 4;
  const levierEntering = animate && stateIndex === 4;
  const patrimoineBarH = LEVIER_BAR_MAX_CQW;
  const effortBarH = LEVIER_BAR_MAX_CQW * (v.effortTotalRaw / v.capitalRaw);
  const gapBarH = patrimoineBarH - effortBarH;
  const levierHtml = showLevier
    ? `
      <div class="scpi-financement__levier${levierEntering ? " is-entering" : ""}"${levierEntering ? " data-reveal" : ""} style="left:${LEVIER_LEFT}cqw">
        <div class="scpi-financement__levier-axis" style="height:${LEVIER_BAR_MAX_CQW}cqw">
          <span class="scpi-financement__levier-axis-label" style="bottom:${patrimoineBarH}cqw">${v.capital}</span>
          <span class="scpi-financement__levier-axis-label" style="bottom:${effortBarH}cqw">${v.effortTotal}</span>
          <span class="scpi-financement__levier-axis-label" style="bottom:0">0 €</span>
        </div>
        <div class="scpi-financement__levier-diagram">
          <div class="scpi-financement__levier-col">
            <div class="scpi-financement__levier-bar-wrap" style="height:${LEVIER_BAR_MAX_CQW}cqw">
              <div class="scpi-financement__levier-bar scpi-financement__levier-bar--effort"${levierEntering ? ` data-reveal data-reveal-height="${effortBarH}cqw"` : ""} style="height:${levierEntering ? 0 : effortBarH}cqw"></div>
            </div>
            <span class="scpi-financement__levier-caption">Sans financement</span>
          </div>
          <div class="scpi-financement__levier-col">
            <div class="scpi-financement__levier-bar-wrap" style="height:${LEVIER_BAR_MAX_CQW}cqw">
              <div class="scpi-financement__levier-bar scpi-financement__levier-bar--patrimoine"${levierEntering ? ` data-reveal data-reveal-height="${patrimoineBarH}cqw"` : ""} style="height:${levierEntering ? 0 : patrimoineBarH}cqw">
                <div class="scpi-financement__levier-bar-gap"${levierEntering ? ` data-reveal data-reveal-height="${gapBarH}cqw"` : ""} style="height:${levierEntering ? 0 : gapBarH}cqw">
                  <div class="scpi-financement__levier-annotation">
                    <span class="scpi-financement__levier-arrow">
                      <span class="scpi-financement__levier-arrow-head scpi-financement__levier-arrow-head--up"></span>
                      <span class="scpi-financement__levier-arrow-line"></span>
                      <span class="scpi-financement__levier-arrow-head scpi-financement__levier-arrow-head--down"></span>
                    </span>
                    <div class="scpi-financement__levier-text">
                      <span class="scpi-financement__levier-kicker">Effet de levier</span>
                      <span class="scpi-financement__levier-value">${v.levier}</span>
                      <span class="scpi-financement__levier-pct">${v.levierPctRounded}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span class="scpi-financement__levier-caption">Avec financement</span>
          </div>
        </div>
      </div>
    `
    : "";

  // État 6 (index 5) : les revenus se poursuivent à vie une fois le
  // financement soldé — même montant qu'aux états 2-3 (v.revM), mais
  // affiché comme un repère de durée qui prolonge l'axe au-delà de
  // "25 ans", pas un nouveau calcul. Kicker + grande valeur (même
  // vocabulaire que le bilan/l'effet de levier) plutôt qu'une légende
  // discrète : c'est la conclusion de la slide, elle doit se voir. Le
  // patrimoine (85 000 €) n'est pas répété ici, déjà lisible sur l'axe.
  // Centré sous la flèche au bout de la ligne (AXIS_END_CQW — l'axe est
  // déjà rétracté à ce stade, voir axisWidth) plutôt qu'à côté du
  // diagramme ou sous le milieu de la ligne.
  const showViager = stateIndex >= 5;
  const viagerEntering = animate && stateIndex === 5;
  const viagerHtml = showViager
    ? `
      <div class="scpi-financement__viager${viagerEntering ? " is-entering" : ""}"${viagerEntering ? " data-reveal" : ""} style="left:${AXIS_END_CQW}cqw">
        <span class="scpi-financement__viager-kicker">Puis, à vie</span>
        <span class="scpi-financement__viager-value">${v.revM}</span>
      </div>
    `
    : "";

  // État 4 (bilan) : bloc centré par rapport au TITRE, donc sur la
  // pleine largeur de la scène (left:0/width:STAGE_W). Position FIXE :
  // aux états 5-6, le diagramme de levier apparaît comme un élément
  // indépendant ancré à droite (voir levierHtml, left:STAGE_W) plutôt
  // que comme un second enfant du même conteneur flex — sinon ce bloc
  // se déplacerait pour laisser sa place, comme avant cette correction.
  const resultatHtml = showResultat
    ? `<div class="scpi-financement__resultat" style="left:0;top:4.375cqw;width:${STAGE_W}cqw">${resultatTextHtml}</div>`
    : "";

  return `
    <div class="scpi-financement">
      ${renderChapRail(slide)}

      <div class="scpi-financement__intro">
        <h1 class="chap-title scpi-financement__title">${escapeHtml(slide.titre)}</h1>
        ${etape.desc ? `<p class="scpi-financement__desc">${escapeHtml(etape.desc(v))}</p>` : ""}
      </div>

      <div class="scpi-financement__stage">
        ${
          stateIndex === 0
            ? `<div class="scpi-financement__bar" style="left:0;top:${BAR_TOP_CQW}cqw;height:${BAR_HEIGHT_CQW}cqw;width:${STAGE_W}cqw">${barSegmentsHtml(v.duree, effortLabel)}</div>`
            : `
        <div class="scpi-financement__bar"${barAttrs} style="left:0;top:${BAR_TOP_CQW}cqw;height:${BAR_HEIGHT_CQW}cqw;${barStyle}">
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
        ${levierHtml}

        <div class="scpi-financement__axis"${axisAttrs} style="${axisStyle}">
          <span class="scpi-financement__axis-arrow"></span>
        </div>
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
