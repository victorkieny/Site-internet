// Fonctions génériques, réutilisables par n'importe quel simulateur — aucune
// logique métier ici (pas de calcul de projection, pas de référence à une
// notion de "mode"). Chargé avant le script principal de chaque page
// simulateur (script classique, pas de module ES).

const formatMoney = (value) => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
}).format(Math.round(value || 0));

const formatNumber = (value) => new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0
}).format(Math.round(value || 0));

const roundToHundred = (value) => Math.round((value || 0) / 100) * 100;

const formatPercent = (value) => new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1
}).format(value || 0);

function niceStep(range, targetCount) {
  const rawStep = range / Math.max(1, targetCount);
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceResidual;
  if (residual < 1.5) niceResidual = 1;
  else if (residual < 3) niceResidual = 2;
  else if (residual < 7) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

// Round, "speakable" axis labels (100 000 / 200 000 / 300 000, année 1 / 5 / 10...)
// rather than exact fractions of the data — the curve itself stays exact and can
// simply run a bit past the last labeled gridline.
function niceValueTicks(max, targetCount = 4) {
  if (!Number.isFinite(max) || max <= 0) return [];
  const step = niceStep(max, targetCount);
  const ticks = [];
  for (let value = step; value <= max + step * 0.001; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks;
}

function niceYearTicks(totalYears) {
  if (totalYears <= 1) return [1];
  const step = niceStep(totalYears, 6);
  const ticks = new Set([1]);
  for (let value = step; value < totalYears; value += step) {
    ticks.add(Math.round(value));
  }
  ticks.add(totalYears);
  return Array.from(ticks).sort((a, b) => a - b);
}

// Comme niceValueTicks, mais pour un domaine [min, max] qui peut descendre
// sous zéro (ex. un graphique d'effort net qui devient un revenu net). Pour
// min = 0, produit exactement les mêmes graduations que niceValueTicks.
function niceRangeTicks(min, max, targetCount = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const step = niceStep(max - min, targetCount);
  let start = Math.ceil(min / step) * step;
  if (start <= min) start += step;
  const ticks = [];
  for (let value = start; value <= max + step * 0.001; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks;
}

function parseInputNumber(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".");
  return Number(normalized || 0);
}

function formatInputNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "";
  const [integer, decimal] = String(number).split(".");
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decimal ? `${formattedInteger},${decimal}` : formattedInteger;
}

function withHeightTransition(el, mutate) {
  if (!el) {
    mutate();
    return;
  }
  const token = (el._heightTransitionToken = (el._heightTransitionToken || 0) + 1);

  // Undo any leftover inline sizing from a previous run that never
  // reached its cleanup step (e.g. interrupted mid-flight), so this
  // run always starts from the element's true natural/stretched size.
  el.style.transition = "none";
  el.style.height = "";
  el.style.overflow = "";
  const startHeight = el.getBoundingClientRect().height;

  mutate();
  const endHeight = el.getBoundingClientRect().height;

  if (Math.abs(endHeight - startHeight) < 1) return;

  el.style.overflow = "hidden";
  el.style.height = `${startHeight}px`;
  el.getBoundingClientRect();

  requestAnimationFrame(() => {
    if (el._heightTransitionToken !== token) return;
    el.style.transition = "height 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.height = `${endHeight}px`;
  });

  const cleanup = () => {
    el.removeEventListener("transitionend", onEnd);
    if (el._heightTransitionToken !== token) return;
    el.style.transition = "";
    el.style.height = "";
    el.style.overflow = "";
  };
  const onEnd = (event) => {
    if (event.target !== el || event.propertyName !== "height") return;
    cleanup();
  };
  el.addEventListener("transitionend", onEnd);
  // Safety net: guarantees cleanup even if transitionend never fires
  // (e.g. the transition gets interrupted by another toggle).
  window.setTimeout(cleanup, 420);
}

function updateRangeProgress(range) {
  const min = Number(range.min || 0);
  const max = Number(range.max || 100);
  const value = Number(range.value || 0);
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  range.style.setProperty("--range-progress", `${Math.max(0, Math.min(100, progress))}%`);
}

// Rendu générique d'un champ "curseur + champ texte" lié (avec presets
// optionnels). values/fieldRefreshers sont fournis par l'appelant (portée
// partagée avec les autres champs du même formulaire). onValueChange et
// onCommit sont les points d'extension par lesquels l'appelant branche sa
// propre logique métier (ex. déclencher un nouveau rendu) sans que ce
// rendu générique ait besoin de la connaître.
function renderNumberField(field, values, fieldRefreshers, options = {}) {
  const { mini = false, onValueChange, onCommit } = options;

  const label = document.createElement("label");
  label.className = mini ? "tool-fee-rate" : "tool-field";
  label.dataset.field = field.key;

  const span = document.createElement("span");
  span.textContent = typeof field.label === "function" ? field.label(values) : field.label;
  label.append(span);

  // Curseur à valeurs discrètes (ex. tranches de TMI) : le curseur se déplace
  // par index dans `field.steps` plutôt que par pas régulier, pour n'autoriser
  // que ces valeurs précises tout en gardant l'interaction "glisser".
  const steps = field.steps || null;
  const closestStepIndex = (value) => {
    let closest = 0;
    let closestDiff = Infinity;
    steps.forEach((step, i) => {
      const diff = Math.abs(step - value);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = i;
      }
    });
    return closest;
  };

  const control = document.createElement("div");
  control.className = "tool-input-wrap";
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.min = steps ? steps[0] : field.min;
  input.max = steps ? steps[steps.length - 1] : field.max;
  input.step = field.step;
  input.value = formatInputNumber(values[field.key]);
  const range = document.createElement("input");
  range.className = mini ? "tool-range tool-range-mini" : "tool-range";
  range.type = "range";
  range.min = steps ? 0 : field.min;
  range.max = steps ? steps.length - 1 : field.max;
  range.step = steps ? 1 : field.step;
  range.value = steps ? closestStepIndex(values[field.key]) : values[field.key];
  updateRangeProgress(range);

  const note = field.note ? document.createElement("small") : null;
  const updateNote = () => {
    if (!note) return;
    note.textContent = typeof field.note === "function" ? field.note(values) : field.note;
  };
  const refreshField = () => {
    span.textContent = typeof field.label === "function" ? field.label(values) : field.label;
    updateNote();
  };
  fieldRefreshers.push(refreshField);
  const refreshDependentFields = () => fieldRefreshers.forEach((refresh) => refresh());
  const updatePresets = () => {
    if (!presetRow) return;
    presetRow.querySelectorAll(".tool-preset").forEach((button) => {
      button.classList.toggle("is-active", values[field.key] === Number(button.dataset.value));
    });
  };

  input.addEventListener("input", () => {
    const previousValue = values[field.key];
    values[field.key] = parseInputNumber(input.value);
    onValueChange?.(field.key, previousValue, values[field.key]);
    if (steps) {
      range.value = closestStepIndex(values[field.key]);
    } else {
      range.value = values[field.key];
    }
    updateRangeProgress(range);
    refreshDependentFields();
    updatePresets();
  });
  input.addEventListener("blur", () => {
    // En saisie libre, la valeur tapée est ramenée à la tranche autorisée la
    // plus proche une fois la saisie terminée (pas à chaque frappe, pour ne
    // pas gêner la frappe d'un nombre à deux chiffres comme "45").
    if (steps) {
      values[field.key] = steps[closestStepIndex(values[field.key])];
      range.value = closestStepIndex(values[field.key]);
      updateRangeProgress(range);
    }
    input.value = formatInputNumber(values[field.key]);
  });
  range.addEventListener("input", () => {
    const previousValue = values[field.key];
    values[field.key] = steps ? steps[Number(range.value || 0)] : Number(range.value || 0);
    onValueChange?.(field.key, previousValue, values[field.key]);
    input.value = formatInputNumber(values[field.key]);
    updateRangeProgress(range);
    refreshDependentFields();
    updatePresets();
  });
  const suffix = document.createElement("small");
  suffix.textContent = field.suffix;
  control.append(input, suffix);
  label.append(control);

  let presetRow = null;
  if (field.presets) {
    presetRow = document.createElement("div");
    presetRow.className = "tool-presets";
    field.presets.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tool-preset";
      button.dataset.value = preset;
      button.textContent = `${preset} ${field.suffix}`;
      button.classList.toggle("is-active", values[field.key] === preset);
      button.addEventListener("click", () => {
        values[field.key] = preset;
        input.value = formatInputNumber(values[field.key]);
        range.value = values[field.key];
        updateRangeProgress(range);
        refreshDependentFields();
        updatePresets();
        onCommit?.();
      });
      presetRow.append(button);
    });
    label.append(presetRow);
  }

  label.append(range);

  if (note) {
    note.className = "tool-field-note";
    updateNote();
    label.append(note);
  }

  return label;
}

// Graphique en ligne générique : jusqu'à 3 séries nommées (rôles "capital" /
// "invested" / "gains" — repris des classes CSS déjà existantes : couleur de
// ligne, puce de légende, point au survol et ligne d'infobulle en découlent
// directement, aucune CSS supplémentaire à écrire par l'appelant), avec
// grille, axes, légende et infobulle au survol.
//
// config:
//   series: [{ role, label, values }]  — une ligne par entrée, `values` déjà
//     calculé par l'appelant (un nombre par ligne de `rows`)
//   areas: [{ role, lower, upper }]  (optionnel) — remplissage empilé sous
//     les lignes ; seuls les rôles "invested"/"gains" ont un dégradé défini
//   tooltipExtras: [{ role, label, key }]  (optionnel) — lignes d'infobulle
//     supplémentaires lisant row[key] directement, sans point ni ligne tracée
//     (ex. un "gain" qui est la différence visuelle entre deux aires)
//   totals: [{ label, value, className }]  (optionnel) — bandeau de synthèse
//     en tête de graphique
//   marker: { index, label }  (optionnel) — repère vertical (ex. le point où
//     un seuil est atteint)
//   ariaLabel: string
//
// Le domaine vertical s'adapte automatiquement aux valeurs négatives (utile
// pour un "effort net" qui devient un revenu net) : min = 0 si toutes les
// valeurs sont positives (comportement historique inchangé), sinon min
// descend jusqu'à la valeur la plus basse.
function renderLineChart(rows, config) {
  const chart = document.querySelector("#chart");
  if (!rows.length) {
    chart.innerHTML = `
      <div class="chart-zero-state" role="status">
        <span>Déplacez un curseur pour afficher la projection.</span>
      </div>
    `;
    return;
  }
  const { series, areas = [], tooltipExtras = [], totals = [], marker = null, ariaLabel = "Graphique de projection", zeroBaseline = true } = config;
  // Par défaut, une puce de légende par ligne tracée — sauf si l'appelant
  // fournit sa propre liste (ex. une aire sans ligne tracée, comme "gains",
  // qui a quand même besoin d'une puce de légende).
  const legend = config.legend || series.map((s) => ({ role: s.role, label: s.label }));

  const width = 960;
  const height = 380;
  const pad = { top: 28, right: 36, bottom: 54, left: 128 };

  const allValues = series.flatMap((s) => s.values);
  // zeroBaseline: true (par défaut) part de 0 — pertinent pour une
  // accumulation depuis rien (versements). zeroBaseline: false cadre l'axe
  // sur la fourchette réelle des valeurs (+ une marge de 8 %) — utile pour
  // comparer des courbes qui évoluent toutes loin de 0 (ex. un capital
  // déjà investi), où un axe à 0 écraserait leur écart réel dans une
  // grande zone vide sous elles.
  const rawMin = Math.min(...allValues);
  const rawSpan = Math.max(...allValues) - rawMin;
  const min = zeroBaseline ? Math.min(0, ...allValues) : rawMin - rawSpan * 0.08;
  const rawMax = Math.max(0, ...allValues, min + 1);
  // Avec un repère vertical, sa légende texte se place au-dessus du
  // graphique : on réserve un peu de marge en tête pour qu'elle ne
  // chevauche jamais la ligne la plus haute (sans repère, le comportement
  // historique — pas de marge — reste inchangé).
  const max = marker ? rawMax + (rawMax - min) * 0.12 : rawMax;

  const x = (index) => pad.left + (index / Math.max(rows.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value) => height - pad.bottom - ((value - min) / (max - min)) * (height - pad.top - pad.bottom);
  const pointsFor = (values) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const areaPath = (lower, upper) => {
    const top = upper.map((value, index) => `${x(index)},${y(value)}`);
    const bottom = lower.map((value, index) => `${x(index)},${y(value)}`).reverse();
    return `M${top.join(" L")} L${bottom.join(" L")} Z`;
  };

  const grid = niceRangeTicks(min, max, 4).map((value) => {
    const lineY = y(value);
    return `
      <g>
        <line x1="${pad.left}" y1="${lineY}" x2="${width - pad.right}" y2="${lineY}" />
        <text x="${pad.left - 16}" y="${lineY + 5}">${formatMoney(value)}</text>
      </g>
    `;
  }).join("");
  const ticks = niceYearTicks(rows.length).map((annee) => {
    const tickX = x(annee - 1);
    return `<text x="${tickX}" y="${height - 10}">${annee}</text>`;
  }).join("");

  const totalsMarkup = totals.length ? `
    <div class="chart-totals" style="--chart-pad-left:0%; --chart-pad-right:${pad.right / width * 100}%">
      ${totals.map((t) => `<span class="${t.className || ""}">${t.label} <strong>${formatMoney(t.value)}</strong></span>`).join("")}
    </div>
  ` : "";

  const defsMarkup = areas.length ? `
    <defs>
      <linearGradient id="chartAreaInvested" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6f8ba7" stop-opacity="0.5"></stop>
        <stop offset="100%" stop-color="#6f8ba7" stop-opacity="0.05"></stop>
      </linearGradient>
      <linearGradient id="chartAreaGains" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b99761" stop-opacity="0.55"></stop>
        <stop offset="100%" stop-color="#b99761" stop-opacity="0.08"></stop>
      </linearGradient>
    </defs>
  ` : "";
  const areasMarkup = areas.map((a) => `<path class="chart-area chart-area-${a.role}" d="${areaPath(a.lower, a.upper)}"></path>`).join("");
  // Étiquetée comme les autres graduations (et non simplement laissée comme
  // un trait nu) : sur un domaine négatif, 0 ne tombe pas nécessairement sur
  // une graduation "ronde" de niceRangeTicks, la ligne de référence a donc
  // besoin de son propre label pour rester lisible.
  const zeroLineMarkup = min < 0 ? `
    <line class="chart-zero-line" x1="${pad.left}" y1="${y(0)}" x2="${width - pad.right}" y2="${y(0)}"></line>
    <text class="chart-zero-line-label" x="${pad.left - 16}" y="${y(0) + 5}">${formatMoney(0)}</text>
  ` : "";
  const linesMarkup = series.map((s) => `<polyline class="chart-line chart-line-${s.role}" points="${pointsFor(s.values)}"></polyline>`).join("");
  const markerMarkup = marker ? `
    <line class="chart-marker-line" x1="${x(marker.index)}" y1="${pad.top}" x2="${x(marker.index)}" y2="${height - pad.bottom}"></line>
    <text class="chart-marker-label" x="${x(marker.index)}" y="${pad.top - 10}">${marker.label}</text>
  ` : "";
  const hoverDotsMarkup = series.map((s) => `<circle class="chart-hover-dot chart-hover-dot-${s.role}" r="4"></circle>`).join("");
  const tooltipRowsMarkup = series.map((s) => `<div class="chart-tooltip-row chart-tooltip-${s.role}"><small>${s.label}</small><strong></strong></div>`).join("")
    + tooltipExtras.map((t) => `<div class="chart-tooltip-row chart-tooltip-${t.role}"><small>${t.label}</small><strong></strong></div>`).join("");

  chart.innerHTML = `
    ${totalsMarkup}
    <div class="chart-canvas">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${ariaLabel}">
        ${defsMarkup}
        <g class="chart-grid">${grid}</g>
        ${zeroLineMarkup}
        ${areasMarkup}
        ${linesMarkup}
        ${markerMarkup}
        <g class="chart-axis">${ticks}</g>
        <g class="chart-hover">
          <line class="chart-hover-line" x1="0" y1="${pad.top}" x2="0" y2="${height - pad.bottom}"></line>
          ${hoverDotsMarkup}
        </g>
      </svg>
      <div class="chart-tooltip">
        <span class="chart-tooltip-year"></span>
        ${tooltipRowsMarkup}
      </div>
    </div>
    <div class="chart-legend">
      ${legend.map((l) => `<span><i class="legend-${l.role}"></i>${l.label}</span>`).join("")}
    </div>
  `;

  if (totals.length) {
    const alignTotalsWithYAxisLabel = () => {
      const totalsEl = chart.querySelector(".chart-totals");
      const yAxisLabels = chart.querySelectorAll(".chart-grid text");
      const topYAxisLabel = yAxisLabels[yAxisLabels.length - 1];
      if (!totalsEl || !topYAxisLabel) return;

      const labelStart = topYAxisLabel.getBBox().x;
      totalsEl.style.setProperty("--chart-pad-left", `${Math.max(0, labelStart / width * 100)}%`);
    };

    requestAnimationFrame(alignTotalsWithYAxisLabel);
    document.fonts?.ready.then(alignTotalsWithYAxisLabel);
  }

  setupChartHover(chart, rows, { x, y, pad, width, height, series, tooltipExtras });
}

function setupChartHover(chart, rows, ctx) {
  const svg = chart.querySelector("svg");
  const canvas = chart.querySelector(".chart-canvas");
  const hoverGroup = chart.querySelector(".chart-hover");
  const hoverLine = chart.querySelector(".chart-hover-line");
  const tooltip = chart.querySelector(".chart-tooltip");
  const tooltipYear = chart.querySelector(".chart-tooltip-year");
  const dots = ctx.series.map((s) => chart.querySelector(`.chart-hover-dot-${s.role}`));
  const tooltipValues = ctx.series.map((s) => chart.querySelector(`.chart-tooltip-${s.role} strong`));
  const tooltipExtraValues = ctx.tooltipExtras.map((t) => chart.querySelector(`.chart-tooltip-${t.role} strong`));
  if (!svg || !rows.length) return;

  hoverGroup.style.display = "none";
  tooltip.hidden = true;

  const updateAt = (clientX, clientY) => {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = point.matrixTransform(ctm.inverse());
    const ratio = (local.x - ctx.pad.left) / (ctx.width - ctx.pad.left - ctx.pad.right);
    const index = Math.max(0, Math.min(rows.length - 1, Math.round(ratio * (rows.length - 1))));
    const row = rows[index];
    const px = ctx.x(index);

    hoverGroup.style.display = "";
    hoverLine.setAttribute("x1", px);
    hoverLine.setAttribute("x2", px);

    let topY = ctx.y(0);
    ctx.series.forEach((s, i) => {
      const py = ctx.y(s.values[index]);
      if (dots[i]) {
        dots[i].setAttribute("cx", px);
        dots[i].setAttribute("cy", py);
      }
      if (tooltipValues[i]) tooltipValues[i].textContent = formatMoney(roundToHundred(s.values[index]));
      topY = Math.min(topY, py);
    });
    ctx.tooltipExtras.forEach((t, i) => {
      if (tooltipExtraValues[i]) tooltipExtraValues[i].textContent = formatMoney(roundToHundred(row[t.key]));
    });

    tooltipYear.textContent = `Année ${row.annee}`;

    const screenPoint = svg.createSVGPoint();
    screenPoint.x = px;
    screenPoint.y = topY;
    const screenPos = screenPoint.matrixTransform(ctm);
    const canvasRect = canvas.getBoundingClientRect();
    tooltip.hidden = false;
    tooltip.style.left = `${screenPos.x - canvasRect.left}px`;
    tooltip.style.top = `${screenPos.y - canvasRect.top}px`;
  };

  const hide = () => {
    hoverGroup.style.display = "none";
    tooltip.hidden = true;
  };

  svg.addEventListener("mousemove", (event) => updateAt(event.clientX, event.clientY));
  svg.addEventListener("mouseleave", hide);
  svg.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) updateAt(touch.clientX, touch.clientY);
  }, { passive: true });
  svg.addEventListener("touchend", hide);
}

// Camembert générique : répartition entre "sommes investies" et un second
// poste de gains désigné par metric/metricLabel (fourni par l'appelant).
function renderPie(rows, { metric, metricLabel }) {
  const panel = document.querySelector("#pie");
  const last = rows.at(-1) || {};

  const invested = Math.max(0, last.versementsCumules || 0);
  const gains = Math.max(0, last[metric] || 0);
  const total = invested + gains || 1;
  const investedShare = (invested / total) * 100;
  const gainsShare = 100 - investedShare;

  const size = 340;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentGap = 8;
  const investedFull = (investedShare / 100) * circumference;
  const gainsFull = circumference - investedFull;
  const investedDrawn = Math.max(0, investedFull - segmentGap);
  const gainsDrawn = Math.max(0, gainsFull - segmentGap);
  const investedOffset = segmentGap / 2;
  const gainsOffset = investedFull + segmentGap / 2;
  const capitalAmount = formatMoney(last.capital).replace(/\s?€$/, "");

  panel.innerHTML = `
    <div class="pie-layout">
      <div class="pie-canvas">
        <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Répartition du capital final entre sommes investies et ${metricLabel.toLowerCase()}">
          <defs>
            <linearGradient id="pieInvested" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#627f9b"></stop>
              <stop offset="48%" stop-color="#89a2b8"></stop>
              <stop offset="78%" stop-color="#aec0cd"></stop>
              <stop offset="100%" stop-color="#7893ac"></stop>
            </linearGradient>
            <linearGradient id="pieGains" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#9f7135"></stop>
              <stop offset="42%" stop-color="#bd9252"></stop>
              <stop offset="74%" stop-color="#dfc48f"></stop>
              <stop offset="100%" stop-color="#ad7d3d"></stop>
            </linearGradient>
          </defs>
          <circle class="pie-track" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}"></circle>
          <circle class="pie-segment pie-segment-invested" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}"
            stroke-dasharray="${investedDrawn} ${circumference - investedDrawn}" stroke-dashoffset="${-investedOffset}"></circle>
          <circle class="pie-segment pie-segment-gains" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}"
            stroke-dasharray="${gainsDrawn} ${circumference - gainsDrawn}" stroke-dashoffset="${-gainsOffset}"></circle>
        </svg>
        <div class="pie-center">
          <span>Capital final</span>
          <strong><span>${capitalAmount}</span><small>€</small></strong>
        </div>
      </div>
      <div class="pie-legend">
        <div class="pie-legend-row pie-legend-invested">
          <i></i>
          <div class="pie-legend-copy">
            <span>Sommes investies</span>
            <strong>${formatMoney(invested)}</strong>
          </div>
          <small>${formatNumber(investedShare)} %</small>
        </div>
        <div class="pie-legend-row pie-legend-gains">
          <i></i>
          <div class="pie-legend-copy">
            <span>${metricLabel}</span>
            <strong>${formatMoney(gains)}</strong>
          </div>
          <small>${formatNumber(gainsShare)} %</small>
        </div>
      </div>
    </div>
  `;
}

// Tableau générique : headers/mapper/rows sont entièrement fournis par
// l'appelant (colonnes et lignes à afficher déjà déterminées côté métier).
// options.dividerIndex (optionnel) insère une ligne séparateur étiquetée
// (options.dividerLabel) juste avant la ligne de cet index — ex. marquer la
// fin d'une phase dans une série temporelle. options.rowClassName(row, index)
// (optionnel) attribue une classe à une ligne existante — ex. surligner une
// ligne particulière (point de croisement, seuil atteint...).
function renderTable(headers, mapper, rows, options = {}) {
  const { dividerIndex = null, dividerLabel = "", rowClassName = null } = options;
  const table = document.querySelector("#projection-table");
  const bodyRows = rows.map((row, index) => {
    const divider = index === dividerIndex
      ? `<tr class="table-divider-row"><td colspan="${headers.length}">${dividerLabel}</td></tr>`
      : "";
    const className = rowClassName ? rowClassName(row, index) : "";
    const classAttr = className ? ` class="${className}"` : "";
    return `${divider}<tr${classAttr}>${mapper(row).map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
  }).join("");
  table.innerHTML = `
    <thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead>
    <tbody>${bodyRows}</tbody>
  `;
}
