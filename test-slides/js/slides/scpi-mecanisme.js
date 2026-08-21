import { escapeHtml } from "../editable.js";
import { renderChapRail, renderRailEtapes } from "./_chapitre.js";

// Gabarit "Comment ça marche" (chapitre SCPI, import Claude Design
// "Gabarits chapitre SCPI") — schéma statique (pas de révélation
// progressive, comme "Composition du contrat") : trois parties (associé,
// véhicule, exploitant) sous le contrôle de l'AMF, reliées par les trois
// flux qui font tourner une SCPI (souscription, distribution, gestion).
// Géométrie reprise telle quelle du handoff (px à 1280 de large,
// convertis en cqw — voir chapitre.css en tête de fichier), pas
// réinventée.

function boxHtml({ left, top, width, height, cls, kicker, titre, texte, extra }) {
  return `
    <div class="scpi-mecanisme__box${cls ? " " + cls : ""}" style="left:${left}cqw;top:${top}cqw;width:${width}cqw;height:${height}cqw">
      ${kicker ? `<span class="scpi-mecanisme__box-kicker">${escapeHtml(kicker)}</span>` : ""}
      <span class="scpi-mecanisme__box-titre">${escapeHtml(titre)}</span>
      ${texte ? `<p class="scpi-mecanisme__box-texte">${escapeHtml(texte)}</p>` : ""}
      ${extra || ""}
    </div>
  `;
}

function flowLabelHtml(left, top, width, texte, accent) {
  return `<div class="scpi-mecanisme__flow${accent ? " scpi-mecanisme__flow--or" : ""}" style="left:${left}cqw;top:${top}cqw;width:${width}cqw">${escapeHtml(texte)}</div>`;
}

export function render(slide) {
  const actifsHtml = (slide.actifs || [])
    .map((a) => `<span class="scpi-mecanisme__actif">${escapeHtml(a)}</span>`)
    .join("");

  return `
    <div class="scpi-mecanisme">
      ${renderChapRail(slide)}
      ${renderRailEtapes(slide.railEtapes, slide.railActive)}

      <div class="scpi-mecanisme__intro">
        <h1 class="chap-title scpi-mecanisme__title">${escapeHtml(slide.titre)}</h1>
      </div>

      <div class="scpi-mecanisme__stage">
        <svg class="scpi-mecanisme__lines" viewBox="0 0 1156 392" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="scpi-ar-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="rgba(var(--chap-ink-rgb),.6)"/></marker>
            <marker id="scpi-ar-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="var(--or)"/></marker>
          </defs>
          <path d="M578,72 V168" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>
          <path d="M578,112 H1020 V168" fill="none" stroke="rgba(var(--chap-ink-rgb),.34)" stroke-width="1" stroke-dasharray="2 5"/>
          <line x1="288" y1="206" x2="397" y2="206" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>
          <line x1="397" y1="286" x2="288" y2="286" stroke="var(--or)" stroke-width="1.2" marker-end="url(#scpi-ar-g)"/>
          <line x1="858" y1="246" x2="749" y2="246" stroke="rgba(var(--chap-ink-rgb),.45)" stroke-width="1.2" marker-end="url(#scpi-ar-d)"/>
        </svg>

        ${boxHtml({ left: 33.4375, top: 0, width: 23.4375, height: 5.625, cls: "scpi-mecanisme__box--amf", titre: "L'AMF", texte: "Autorité des marchés financiers" })}
        <span class="scpi-mecanisme__amf-note" style="left:46.25cqw;top:6.5625cqw">Agrément et contrôle</span>

        ${boxHtml({ left: 0, top: 13.125, width: 21.25, height: 12.1875, kicker: "Associé", titre: "L'investisseur", texte: "Souscrit des parts et perçoit les revenus distribués." })}
        ${boxHtml({
          left: 32.265625,
          top: 13.125,
          width: 25.78125,
          height: 12.1875,
          cls: "scpi-mecanisme__box--vehicule",
          kicker: "Le véhicule",
          titre: "La SCPI",
          texte: "Un parc d'actifs immobiliers professionnels, mutualisé entre les associés.",
          extra: `<div class="scpi-mecanisme__actifs">${actifsHtml}</div>`,
        })}
        ${boxHtml({ left: 69.0625, top: 13.125, width: 21.25, height: 12.1875, kicker: "L'exploitant", titre: "La société de gestion", texte: "Achat, location, travaux, reporting : le parc est géré clé en main." })}

        ${flowLabelHtml(21.25, 13.59375, 11.015625, "Souscription de parts")}
        ${flowLabelHtml(21.25, 19.84375, 11.015625, "Distribution de revenus", true)}
        ${flowLabelHtml(58.046875, 16.71875, 11.015625, "Gestion clé en main")}
      </div>
    </div>
  `;
}
