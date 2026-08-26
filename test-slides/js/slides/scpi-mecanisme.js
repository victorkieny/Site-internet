import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Comment ça marche" (chapitre SCPI, import Claude Design
// "Gabarits chapitre SCPI") — révélation progressive cumulative à 6
// états (opts.stateIndex direct, même mécanisme que "Les atouts") :
// état 1 = l'investisseur ET la SCPI ensemble (le couple associé/
// véhicule, socle du schéma) ; état 2 = la flèche investisseur<->SCPI
// apparaît, portée par le pictogramme + libellé "Souscription de part"
// — état PRÉALABLE et transitoire, pas cumulatif comme le reste
// (voir showSouscriptionLabel) ; état 3 = ce même pictogramme et ce
// même libellé cèdent la place à "Copropriétaire" sur la même flèche
// (déjà affichée, elle ne rejoue pas son entrée) — la séquence réelle
// (on souscrit des parts, on DEVIENT ainsi copropriétaire) sans garder
// deux libellés permanents sur un même lien ; état 4 = + la flèche
// "distribution de revenus" ; état 5 = + la société de gestion (et sa
// flèche "gestion clé en main") ; état 6 = + l'AMF (et ses deux
// liaisons pointillées). Chaque flux n'apparaît qu'entre deux cases
// déjà affichées — jamais une flèche vers une case encore invisible.
// Géométrie reprise telle quelle du handoff (px à 1280 de large,
// convertis en cqw — voir chapitre.css en tête de fichier), pas
// réinventée, sauf la hauteur des cases (voir BOX_TOP_SHIFT_CQW) pour
// loger le nouveau pictogramme "Souscription de part".

// Pictogrammes fournis tels quels par le client (Claude Design,
// assets/icons/{bureau,commerce,hotel,sante}.svg) — viewBox, paths/
// rects/lines et stroke-width repris EXACTEMENT du fichier source, rien
// redessiné ni réinterprété. Chaque icône garde son propre viewBox (pas
// la grille 24×24 partagée de _chapitre.js/ICONS, à laquelle ces tracés
// ne sont pas destinés) ; seule la couleur d'origine (#33312c, figée
// dans les fichiers exportés) est remplacée par la variable d'encre du
// thème, pour suivre --chap-ink-rgb comme le reste du deck (encre sur
// papier, papier sur encre) plutôt que de rester figée si ce gabarit
// est un jour réutilisé sur fond encre.
const ACTIF_ICONS_RAW = {
  bureaux: {
    viewBox: "6.5 12.5 63 57",
    strokeWidth: 2.08,
    markup: `
      <rect x="8" y="34" width="16" height="34"></rect>
      <rect x="26" y="14" width="22" height="54"></rect>
      <rect x="50" y="26" width="18" height="42"></rect>
      <line x1="12" y1="42" x2="16" y2="42"></line><line x1="12" y1="50" x2="16" y2="50"></line><line x1="12" y1="58" x2="16" y2="58"></line>
      <line x1="31" y1="22" x2="35" y2="22"></line><line x1="39" y1="22" x2="43" y2="22"></line>
      <line x1="31" y1="30" x2="35" y2="30"></line><line x1="39" y1="30" x2="43" y2="30"></line>
      <line x1="31" y1="38" x2="35" y2="38"></line><line x1="39" y1="38" x2="43" y2="38"></line>
      <line x1="31" y1="46" x2="35" y2="46"></line><line x1="39" y1="46" x2="43" y2="46"></line>
      <line x1="54" y1="33" x2="58" y2="33"></line><line x1="62" y1="33" x2="64" y2="33"></line>
      <line x1="54" y1="41" x2="58" y2="41"></line><line x1="62" y1="41" x2="64" y2="41"></line>
      <line x1="54" y1="49" x2="58" y2="49"></line><line x1="62" y1="49" x2="64" y2="49"></line>
    `,
  },
  commerces: {
    viewBox: "10.5 8.5 51 59",
    strokeWidth: 2.15,
    markup: `
      <path d="M12 24 L16 10 H56 L60 24 Z"></path>
      <line x1="12" y1="24" x2="60" y2="24"></line>
      <line x1="20" y1="24" x2="18" y2="18"></line><line x1="28" y1="24" x2="27" y2="16"></line><line x1="36" y1="24" x2="36" y2="16"></line>
      <line x1="44" y1="24" x2="45" y2="16"></line><line x1="52" y1="24" x2="54" y2="18"></line>
      <rect x="16" y="24" width="40" height="42"></rect>
      <rect x="30" y="46" width="12" height="20"></rect>
      <rect x="20" y="32" width="9" height="9"></rect>
      <rect x="43" y="32" width="9" height="9"></rect>
    `,
  },
  hotellerie: {
    viewBox: "12.5 4.5 51 81",
    strokeWidth: 3,
    markup: `
      <rect x="22" y="6" width="32" height="12"></rect>
      <text x="38" y="15" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="7" font-weight="700" fill="rgba(var(--chap-ink-rgb),.65)" stroke="none">HOTEL</text>
      <rect x="14" y="18" width="48" height="66"></rect>
      <rect x="21" y="28" width="8" height="11"></rect><rect x="34" y="28" width="8" height="11"></rect><rect x="47" y="28" width="8" height="11"></rect>
      <rect x="21" y="46" width="8" height="11"></rect><rect x="34" y="46" width="8" height="11"></rect><rect x="47" y="46" width="8" height="11"></rect>
      <rect x="21" y="64" width="8" height="11"></rect><rect x="34" y="64" width="8" height="11"></rect><rect x="47" y="64" width="8" height="11"></rect>
    `,
  },
  sante: {
    viewBox: "2.5 10.5 71 59",
    strokeWidth: 2.3,
    markup: `
      <rect x="22" y="12" width="32" height="56"></rect>
      <path d="M34 18 H42 V24 H48 V32 H42 V38 H34 V32 H28 V24 H34 Z"></path>
      <rect x="27" y="44" width="8" height="9"></rect>
      <rect x="41" y="44" width="8" height="9"></rect>
      <rect x="32" y="58" width="12" height="10"></rect>
      <rect x="4" y="26" width="18" height="42"></rect>
      <rect x="54" y="26" width="18" height="42"></rect>
      <rect x="10" y="33" width="6" height="8"></rect><rect x="10" y="45" width="6" height="8"></rect><rect x="10" y="57" width="6" height="8"></rect>
      <rect x="60" y="33" width="6" height="8"></rect><rect x="60" y="45" width="6" height="8"></rect><rect x="60" y="57" width="6" height="8"></rect>
    `,
  },
};

function actifIconSvg(key) {
  const icon = ACTIF_ICONS_RAW[key];
  if (!icon) return "";
  return `<svg class="chap-icon" viewBox="${icon.viewBox}" fill="none" stroke="rgba(var(--chap-ink-rgb),.65)" stroke-width="${icon.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${icon.markup}</svg>`;
}

function boxHtml({ left, top, width, height, cls, icon, titre, texte, extra, entering }) {
  const boxCls = "scpi-mecanisme__box" + (cls ? " " + cls : "") + (entering ? " is-entering" : "");
  return `
    <div class="${boxCls}"${entering ? " data-reveal" : ""} style="left:${left}cqw;top:${top}cqw;width:${width}cqw;height:${height}cqw">
      <span class="scpi-mecanisme__box-head">
        ${icon ? iconSvg(icon, "rgba(var(--chap-ink-rgb),.65)") : ""}
        <span class="scpi-mecanisme__box-titre">${escapeHtml(titre)}</span>
      </span>
      ${texte ? `<p class="scpi-mecanisme__box-texte">${escapeHtml(texte)}</p>` : ""}
      ${extra || ""}
    </div>
  `;
}

function flowLabelHtml(left, top, width, texte, accent, entering) {
  const cls = "scpi-mecanisme__flow" + (accent ? " scpi-mecanisme__flow--or" : "") + (entering ? " is-entering" : "");
  return `<div class="${cls}"${entering ? " data-reveal" : ""} style="left:${left}cqw;top:${top}cqw;width:${width}cqw">${escapeHtml(texte)}</div>`;
}

function lineGroupHtml(entering, markup) {
  const cls = entering ? " is-entering" : "";
  return `<g class="scpi-mecanisme__lines-group${cls}"${entering ? " data-reveal" : ""}>${markup}</g>`;
}

// Géométrie des trois cases du socle (investisseur / SCPI / société de
// gestion) — nommée plutôt que saisie en dur à chaque appel de
// boxHtml(), pour que les flèches (plus bas) se calent dessus sans se
// désynchroniser si une case bouge. cqw ⇔ px du viewBox (0-1156, voir
// le <svg> du render) : 1cqw = 12.8px, même échelle que le reste du
// fichier.
const CQW_PX = 12.8;
const INVESTISSEUR_LEFT = 0;
const INVESTISSEUR_WIDTH = 21.25;
const SCPI_LEFT = 36.875;
const SCPI_WIDTH = 16.5625;
const GESTION_LEFT = 69.0625;
const STAGE_CENTER = 45.15625; // milieu de la scène (90.3125cqw de large) — axe de la case SCPI et de la case AMF

// Cases relevées de BOX_TOP_SHIFT_CQW par rapport au handoff d'origine
// (top 13.125cqw / hauteur 12.1875cqw pour investisseur et gestion,
// 16.25cqw pour SCPI) : libère de la place au-dessus de la flèche
// investisseur<->SCPI pour le pictogramme "Souscription de part" (état
// 2, transitoire — voir plus bas) sans déplacer ni la flèche elle-même
// ni les repères "Gestion clé en main"/"Distribution de revenus"
// (toujours à 246/286px), et sans bouger le bas des cases (top diminue,
// hauteur augmente d'autant : top+hauteur, donc le bas, ne change pas).
const BOX_TOP_SHIFT_CQW = 2.5;
const BOX_TOP_CQW = 13.125 - BOX_TOP_SHIFT_CQW;
const CENTER_BOX_HEIGHT_CQW = 12.1875 + BOX_TOP_SHIFT_CQW;
const SCPI_HEIGHT_CQW = 16.25 + BOX_TOP_SHIFT_CQW;
const BOX_TOP_PX = BOX_TOP_CQW * CQW_PX;

// Distance standard entre l'extrémité d'une flèche et le bord de la
// case qu'elle touche — mesurée à l'origine sur l'écart case
// "L'investisseur" <-> flèches (16px), puis appliquée à CHAQUE
// extrémité de CHAQUE flèche (les deux côtés de souscription/
// distribution, les deux côtés de gestion) : aucune flèche n'entre
// dans une case, et l'espacement se lit comme un choix, pas un hasard
// de géométrie.
const ARROW_GAP_PX = 1.25 * CQW_PX;

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 5);
  const animate = !!opts.animate;

  // Un pictogramme par classe d'actifs plutôt qu'une puce de texte —
  // clé dérivée du mot lui-même (accents/casse neutralisés), pas une
  // liste positionnelle : si demain "actifs" change dans deck.json, un
  // mot non couvert perd juste son icône plutôt que de désynchroniser
  // tout le rang.
  const actifsHtml = (slide.actifs || [])
    .map((a) => {
      const key = a
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return `
        <div class="scpi-mecanisme__actif">
          ${actifIconSvg(key)}
        </div>
      `;
    })
    .join("");

  // État 2 (index 1) : la flèche investisseur<->SCPI apparaît, portée
  // par le pictogramme "Souscription de part" et son libellé — un état
  // PRÉALABLE et transitoire (showSouscriptionLabel n'est vrai qu'à
  // cet état précis, pas cumulatif comme le reste du schéma) : à l'état
  // 3, ce même pictogramme et ce même libellé cèdent la place au
  // libellé "Copropriétaire" d'origine, sur la même flèche (déjà
  // affichée, elle ne rejoue pas son entrée). Représente la séquence
  // réelle (on souscrit des parts, on DEVIENT ainsi copropriétaire) sans
  // garder deux libellés permanents sur le même lien.
  const showInvestScpiArrow = stateIndex >= 1;
  const investScpiArrowEntering = animate && stateIndex === 1;
  const showSouscriptionLabel = stateIndex === 1;
  const showCopro = stateIndex >= 2;
  const showDistribution = stateIndex >= 3;
  const showGestion = stateIndex >= 4;
  const showAmf = stateIndex >= 5;

  const socleEntering = animate && stateIndex === 0;
  const souscriptionEntering = animate && stateIndex === 1;
  const coproEntering = animate && stateIndex === 2;
  const distributionEntering = animate && stateIndex === 3;
  const gestionEntering = animate && stateIndex === 4;
  const amfEntering = animate && stateIndex === 5;

  const investisseurBox = boxHtml({
    left: INVESTISSEUR_LEFT,
    top: BOX_TOP_CQW,
    width: INVESTISSEUR_WIDTH,
    height: CENTER_BOX_HEIGHT_CQW,
    cls: "scpi-mecanisme__box--center",
    icon: "groupe",
    titre: "L'investisseur",
    entering: socleEntering,
  });

  const scpiBox = boxHtml({
    left: SCPI_LEFT,
    top: BOX_TOP_CQW,
    width: SCPI_WIDTH,
    height: SCPI_HEIGHT_CQW,
    cls: "scpi-mecanisme__box--vehicule",
    titre: "SCPI",
    extra: `<div class="scpi-mecanisme__actifs">${actifsHtml}</div>`,
    entering: socleEntering,
  });

  const gestionBox = showGestion
    ? boxHtml({
        left: GESTION_LEFT,
        top: BOX_TOP_CQW,
        width: 21.25,
        height: CENTER_BOX_HEIGHT_CQW,
        cls: "scpi-mecanisme__box--center",
        icon: "cle",
        titre: "La société de gestion",
        entering: gestionEntering,
      })
    : "";

  // Largeur réduite au strict nécessaire pour "Autorité des marchés
  // financiers" (plus long que "L'AMF" + pictogramme) — l'ancienne
  // largeur (23,4375cqw) laissait ~21px de vide après le texte. Centrée
  // sur le même axe que la case SCPI (45,15625cqw, milieu de la scène),
  // pas sur une valeur saisie à part qui s'en désynchroniserait si la
  // scène changeait de largeur.
  const AMF_WIDTH = 18.75;
  const amfBox = showAmf
    ? boxHtml({
        left: STAGE_CENTER - AMF_WIDTH / 2,
        top: 0,
        width: AMF_WIDTH,
        height: 5.625,
        cls: "scpi-mecanisme__box--amf",
        icon: "bouclier",
        titre: "L'AMF",
        texte: "Autorité des marchés financiers",
        entering: amfEntering,
      })
    : "";

  const amfNote = showAmf
    ? `<span class="scpi-mecanisme__amf-note${amfEntering ? " is-entering" : ""}"${amfEntering ? " data-reveal" : ""} style="left:46.25cqw;top:6.5625cqw">Agrément et contrôle</span>`
    : "";

  // Pictogramme + libellé "Souscription de part" : au-dessus de la
  // flèche investisseur<->SCPI, dans la place libérée par
  // BOX_TOP_SHIFT_CQW — visible seulement à l'état transitoire (voir
  // showSouscriptionLabel). Le libellé "Copropriétaire" d'origine
  // (au-dessus de la flèche, même position qu'avant l'ajout de cet
  // état) prend le relais dès l'état suivant, sur la même flèche.
  // Pictogramme fourni tel quel par le client (assets/icons/souscription
  // de part.png, PNG plein) — repris sans retouche, à la demande
  // explicite du client, malgré l'écart avec le reste du registre trait
  // fin de ce fichier (voir CLAUDE.md sur le remplissage plein).
  const souscriptionIconHtml = showSouscriptionLabel
    ? `<div class="scpi-mecanisme__flow-icon${souscriptionEntering ? " is-entering" : ""}"${souscriptionEntering ? " data-reveal" : ""} style="left:21.25cqw;width:11.015625cqw;top:12.5cqw"><img src="assets/icons/souscription%20de%20part.png" alt="" /></div>`
    : "";
  const souscriptionTextFlow = showSouscriptionLabel
    ? flowLabelHtml(21.25, 17.03125, 11.015625, "Souscription de part", false, souscriptionEntering)
    : "";
  const coproFlow = showCopro ? flowLabelHtml(21.25, 13.59375, 11.015625, "Copropriétaire", false, coproEntering) : "";
  const distributionFlow = showDistribution
    ? flowLabelHtml(21.25, 19.84375, 11.015625, "Distribution de revenus", true, distributionEntering)
    : "";
  const gestionFlow = showGestion ? flowLabelHtml(58.046875, 16.71875, 11.015625, "Gestion clé en main", false, gestionEntering) : "";

  // Chaque extrémité de flèche s'arrête à ARROW_GAP_PX du bord de la
  // case qu'elle touche — jamais à l'intérieur, jamais flottant à une
  // distance différente d'une flèche à l'autre (voir ARROW_GAP_PX plus
  // haut).
  const investisseurRightPx = (INVESTISSEUR_LEFT + INVESTISSEUR_WIDTH) * CQW_PX;
  const scpiLeftPx = SCPI_LEFT * CQW_PX;
  const scpiRightPx = (SCPI_LEFT + SCPI_WIDTH) * CQW_PX;
  const gestionLeftPx = GESTION_LEFT * CQW_PX;

  const investScpiArrow = showInvestScpiArrow
    ? lineGroupHtml(
        investScpiArrowEntering,
        `<line x1="${investisseurRightPx + ARROW_GAP_PX}" y1="206" x2="${scpiLeftPx - ARROW_GAP_PX}" y2="206" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>`
      )
    : "";

  const distributionArrow = showDistribution
    ? lineGroupHtml(
        distributionEntering,
        `<line x1="${scpiLeftPx - ARROW_GAP_PX}" y1="286" x2="${investisseurRightPx + ARROW_GAP_PX}" y2="286" stroke="var(--or)" stroke-width="1.2" marker-end="url(#scpi-ar-g)"/>`
      )
    : "";

  const gestionArrow = showGestion
    ? lineGroupHtml(
        gestionEntering,
        `<line x1="${gestionLeftPx - ARROW_GAP_PX}" y1="246" x2="${scpiRightPx + ARROW_GAP_PX}" y2="246" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>`
      )
    : "";

  const amfLines = showAmf
    ? lineGroupHtml(
        amfEntering,
        `<path d="M578,72 V${BOX_TOP_PX}" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>
         <path d="M578,112 H1020 V${BOX_TOP_PX}" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>`
      )
    : "";

  return `
    <div class="scpi-mecanisme">
      ${renderChapRail(slide)}

      <div class="scpi-mecanisme__intro">
        <h1 class="chap-title scpi-mecanisme__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="scpi-mecanisme__stage">
        <svg class="scpi-mecanisme__lines" viewBox="0 0 1156 392" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="scpi-ar-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="rgba(var(--chap-ink-rgb),.6)"/></marker>
            <marker id="scpi-ar-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="var(--or)"/></marker>
          </defs>
          ${amfLines}
          ${investScpiArrow}
          ${distributionArrow}
          ${gestionArrow}
        </svg>

        ${amfBox}
        ${amfNote}

        ${investisseurBox}
        ${scpiBox}
        ${gestionBox}

        ${souscriptionIconHtml}
        ${souscriptionTextFlow}
        ${coproFlow}
        ${distributionFlow}
        ${gestionFlow}
      </div>
    </div>
  `;
}
