import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Comment ça marche" (chapitre SCPI, import Claude Design
// "Gabarits chapitre SCPI") — révélation progressive cumulative à 4
// états (opts.stateIndex direct, même mécanisme que "Les atouts") :
// état 1 = l'investisseur seul ; état 2 = + la SCPI (et les deux flux
// souscription/distribution qui les relient) ; état 3 = + la société de
// gestion (et le flux gestion) ; état 4 = + l'AMF (et ses deux liaisons
// pointillées). Chaque partie n'apparaît qu'avec les flux qui la
// relient à ce qui est déjà affiché — jamais une flèche vers une case
// encore invisible. Géométrie reprise telle quelle du handoff (px à
// 1280 de large, convertis en cqw — voir chapitre.css en tête de
// fichier), pas réinventée.

function boxHtml({ left, top, width, height, cls, icon, kicker, titre, texte, extra, entering }) {
  const boxCls = "scpi-mecanisme__box" + (cls ? " " + cls : "") + (entering ? " is-entering" : "");
  return `
    <div class="${boxCls}"${entering ? " data-reveal" : ""} style="left:${left}cqw;top:${top}cqw;width:${width}cqw;height:${height}cqw">
      ${kicker ? `<span class="scpi-mecanisme__box-kicker">${escapeHtml(kicker)}</span>` : ""}
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

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 3);
  const animate = !!opts.animate;

  const actifsHtml = (slide.actifs || [])
    .map((a) => `<span class="scpi-mecanisme__actif">${escapeHtml(a)}</span>`)
    .join("");

  const showScpi = stateIndex >= 1;
  const showGestion = stateIndex >= 2;
  const showAmf = stateIndex >= 3;

  const investisseurEntering = animate && stateIndex === 0;
  const scpiEntering = animate && stateIndex === 1;
  const gestionEntering = animate && stateIndex === 2;
  const amfEntering = animate && stateIndex === 3;

  const investisseurBox = boxHtml({
    left: 0,
    top: 13.125,
    width: 21.25,
    height: 12.1875,
    icon: "personne",
    kicker: "Associé",
    titre: "L'investisseur",
    texte: "Souscrit des parts et perçoit les revenus distribués.",
    entering: investisseurEntering,
  });

  const scpiBox = showScpi
    ? boxHtml({
        left: 32.265625,
        top: 13.125,
        width: 25.78125,
        height: 12.1875,
        cls: "scpi-mecanisme__box--vehicule",
        icon: "immeuble",
        kicker: "Le véhicule",
        titre: "La SCPI",
        texte: "Un parc d'actifs immobiliers professionnels, mutualisé entre les associés.",
        extra: `<div class="scpi-mecanisme__actifs">${actifsHtml}</div>`,
        entering: scpiEntering,
      })
    : "";

  const gestionBox = showGestion
    ? boxHtml({
        left: 69.0625,
        top: 13.125,
        width: 21.25,
        height: 12.1875,
        icon: "cle",
        kicker: "L'exploitant",
        titre: "La société de gestion",
        texte: "Achat, location, travaux, reporting : le parc est géré clé en main.",
        entering: gestionEntering,
      })
    : "";

  const amfBox = showAmf
    ? boxHtml({
        left: 33.4375,
        top: 0,
        width: 23.4375,
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

  const souscriptionFlow = showScpi ? flowLabelHtml(21.25, 13.59375, 11.015625, "Souscription de parts", false, scpiEntering) : "";
  const distributionFlow = showScpi ? flowLabelHtml(21.25, 19.84375, 11.015625, "Distribution de revenus", true, scpiEntering) : "";
  const gestionFlow = showGestion ? flowLabelHtml(58.046875, 16.71875, 11.015625, "Gestion clé en main", false, gestionEntering) : "";

  const scpiArrows = showScpi
    ? lineGroupHtml(
        scpiEntering,
        `<line x1="288" y1="206" x2="397" y2="206" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>
         <line x1="397" y1="286" x2="288" y2="286" stroke="var(--or)" stroke-width="1.2" marker-end="url(#scpi-ar-g)"/>`
      )
    : "";

  const gestionArrow = showGestion
    ? lineGroupHtml(
        gestionEntering,
        `<line x1="858" y1="246" x2="749" y2="246" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>`
      )
    : "";

  const amfLines = showAmf
    ? lineGroupHtml(
        amfEntering,
        `<path d="M578,72 V168" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>
         <path d="M578,112 H1020 V168" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>`
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
          ${scpiArrows}
          ${gestionArrow}
        </svg>

        ${amfBox}
        ${amfNote}

        ${investisseurBox}
        ${scpiBox}
        ${gestionBox}

        ${souscriptionFlow}
        ${distributionFlow}
        ${gestionFlow}
      </div>
    </div>
  `;
}
