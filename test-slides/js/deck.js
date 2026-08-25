import * as cover from "./slides/cover.js";
import * as constat from "./slides/constat.js";
import * as sectionTitle from "./slides/section-title.js";
import * as chapitreRegles from "./slides/chapitre-regles.js";
import * as epargneDormante from "./slides/epargne-dormante.js";
import * as deuxPoches from "./slides/deux-poches.js";
import * as impactFiscal from "./slides/impact-fiscal.js";
import * as fiscaliteRachats from "./slides/fiscalite-rachats.js";
import * as transmission from "./slides/transmission.js";
import * as scpiMecanisme from "./slides/scpi-mecanisme.js";
import * as scpiCadence from "./slides/scpi-cadence.js";
import * as atouts from "./slides/atouts.js";
import * as scpiFinancement from "./slides/scpi-financement.js";
import * as clotureReflexion from "./slides/cloture-reflexion.js";
import * as clotureDetail from "./slides/cloture-detail.js";
import { playReveal } from "./reveal.js";

// Registre partagé par index.html (aperçu solo), presenter.html et
// audience.html. Chaque renderer expose `render(slide, opts)` -> HTML, et
// optionnellement `setup(container, slide, pristine, onChange)` pour les
// slides "calculator" (montants/scénarios modifiables en RDV). Les slides
// purement explicatives n'ont pas de `setup`.
export const renderers = {
  cover: { render: cover.render },
  constat: { render: constat.render },
  "section-title": { render: sectionTitle.render },
  "chap-regles": { render: chapitreRegles.render },
  "epargne-dormante": { render: epargneDormante.render },
  "deux-poches": { render: deuxPoches.render },
  "impact-fiscal": { render: impactFiscal.render },
  "fiscalite-rachats": { render: fiscaliteRachats.render },
  transmission: { render: transmission.render },
  "scpi-mecanisme": { render: scpiMecanisme.render },
  "scpi-cadence": { render: scpiCadence.render },
  atouts: { render: atouts.render },
  "scpi-financement": { render: scpiFinancement.render },
  "cloture-reflexion": { render: clotureReflexion.render },
  "cloture-detail": { render: clotureDetail.render },
};

export async function loadDeck() {
  const res = await fetch("data/deck.json");
  return res.json();
}

// ---------- Révélation progressive (états internes d'une slide) ----------
// slide.states (optionnel) : liste ordonnée d'états à dérouler avant de
// passer à la slide suivante — voir GABARITS "Fiscalité des rachats"
// (6 états) et "Impact fiscal" (2 états). Chaque renderer qui déclare des
// états lit opts.stateIndex pour savoir lequel afficher ; sans états, la
// slide n'a qu'une position implicite (0). Fonctions pures, partagées par
// app.js / presenter.js / audience.js — pas de logique dupliquée.

export function stateCount(slide) {
  return Array.isArray(slide.states) && slide.states.length > 0 ? slide.states.length : 1;
}

export function clampStateIndex(slide, stateIndex) {
  return Math.min(Math.max(stateIndex, 0), stateCount(slide) - 1);
}

// Avance d'un cran : état suivant de la slide courante si elle n'est pas
// à son dernier état, sinon première slide visible suivante (état 0).
// Retourne null si on est déjà sur le tout dernier état de la dernière
// slide visible.
export function stepForward(slides, hidden, pos) {
  const slide = slides[pos.slideIndex];
  if (pos.stateIndex < stateCount(slide) - 1) {
    return { slideIndex: pos.slideIndex, stateIndex: pos.stateIndex + 1 };
  }
  for (let i = pos.slideIndex + 1; i < slides.length; i++) {
    if (!hidden.has(slides[i].id)) return { slideIndex: i, stateIndex: 0 };
  }
  return null;
}

// Recule d'un cran : état précédent de la slide courante, sinon dernière
// slide visible précédente (à son dernier état, pour reprendre le fil
// dans le même sens que l'avancée). Retourne null en tout début de deck.
export function stepBackward(slides, hidden, pos) {
  if (pos.stateIndex > 0) {
    return { slideIndex: pos.slideIndex, stateIndex: pos.stateIndex - 1 };
  }
  for (let i = pos.slideIndex - 1; i >= 0; i--) {
    if (!hidden.has(slides[i].id)) return { slideIndex: i, stateIndex: stateCount(slides[i]) - 1 };
  }
  return null;
}

// Scène 16:9 d'une slide (voir css/slides.css : .slide__stage est un
// container query, tout le contenu s'y met à l'échelle en cqw).
export function renderStageHtml(slideData, opts = {}) {
  const renderer = renderers[slideData.type];
  if (!renderer) return "";
  return `<div class="slide__stage slide--${slideData.type}"><div class="slide__content">${renderer.render(
    slideData,
    opts
  )}</div></div>`;
}

// Rend la scène courante dans `container` et joue les animations de
// révélation des éléments neufs (voir js/reveal.js) — point d'entrée
// unique utilisé par app.js/presenter.js/audience.js pour la slide
// "vivante", plutôt que de réassigner innerHTML + appeler playReveal
// séparément à trois endroits. Ne pas utiliser pour les miniatures/
// aperçus figés (renderPreviewHtml) : eux ne jouent pas ces animations.
export function mountStage(container, slideData, opts = {}) {
  container.innerHTML = renderStageHtml(slideData, opts);
  playReveal(container);
}

// Aperçu réduit (miniatures de navigation) : cadre de taille fixe
// (.stage-preview, voir presenter.css), dans lequel .slide__stage est
// rendu à sa largeur de référence normale (1280px) puis réduit en bloc
// par transform:scale — pas de rendu natif à ~128px, où les planchers de
// lisibilité (font-size:max(Npx, Mcqw)) feraient déborder le texte.
export function renderPreviewHtml(slideData, opts = {}) {
  const stage = renderStageHtml(slideData, { readonly: true, ...opts });
  return `<div class="stage-preview">${stage}</div>`;
}
