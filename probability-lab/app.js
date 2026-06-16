const state = {
  data: [42, 48, 52, 53, 55, 58, 61, 62, 63, 64, 66, 68, 70, 72, 72, 73, 75, 78, 82, 88],
  binWidth: 10,
  points: [],
  dragIndex: null,
  distribution: "binomial",
  dist: { n: 12, p: 0.35, lambda: 4, mu: 0, sigma: 1.4, a: 2, b: 3 },
  approx: { n: 30, p: 0.4, continuity: true },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const dom = {
  views: $$(".view"),
  navButtons: $$(".nav-button"),
  dataInput: $("#data-input"),
  binWidth: $("#bin-width"),
  binWidthValue: $("#bin-width-value"),
  statsGrid: $("#stats-grid"),
  statsCount: $("#stats-count"),
  representativeNotes: $("#representative-notes"),
  frequencyTable: $("#frequency-table"),
  histogram: $("#histogram"),
  scatter: $("#scatter"),
  regressionGrid: $("#regression-grid"),
  regressionEquation: $("#regression-equation"),
  pointTable: $("#point-table"),
  population: $("#population"),
  prevalence: $("#prevalence"),
  sensitivity: $("#sensitivity"),
  specificity: $("#specificity"),
  populationValue: $("#population-value"),
  prevalenceValue: $("#prevalence-value"),
  sensitivityValue: $("#sensitivity-value"),
  specificityValue: $("#specificity-value"),
  bayesResult: $("#bayes-result"),
  bayesTable: $("#bayes-table"),
  bayesBars: $("#bayes-bars"),
  distControls: $("#distribution-controls"),
  distGrid: $("#distribution-grid"),
  distFormula: $("#distribution-formula"),
  distCanvas: $("#distribution-canvas"),
  distChip: $("#distribution-chip"),
  approxN: $("#approx-n"),
  approxP: $("#approx-p"),
  continuity: $("#continuity"),
  approxNValue: $("#approx-n-value"),
  approxPValue: $("#approx-p-value"),
  approxGrid: $("#approx-grid"),
  approxCanvas: $("#approx-canvas"),
  approxChip: $("#approx-chip"),
};

function fmt(value, digits = 3) {
  if (!Number.isFinite(value)) return "-";
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString("ja-JP");
}

function parseNumbers(text) {
  return text
    .split(/[\s,，、\n]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  const avg = mean(values);
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function modes(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  let bestCount = 0;
  counts.forEach((count) => {
    bestCount = Math.max(bestCount, count);
  });
  const valuesWithBestCount = [...counts.entries()]
    .filter(([, count]) => count === bestCount)
    .map(([value]) => value)
    .sort((a, b) => a - b);
  return { values: bestCount <= 1 ? [] : valuesWithBestCount, count: bestCount };
}

function mode(values) {
  const result = modes(values);
  return result.values.length ? result.values.map((value) => fmt(value)).join(", ") : "なし";
}

function statCard(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function typesetMath() {
  if (!window.MathJax?.typesetPromise) return;
  window.MathJax.typesetClear?.();
  window.MathJax.typesetPromise([document.body]).catch((error) => {
    console.warn("MathJax typeset failed", error);
  });
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function clearCanvas(canvas) {
  const info = resizeCanvas(canvas);
  info.ctx.clearRect(0, 0, info.width, info.height);
  return info;
}

function drawFrame(ctx, width, height, padding = 42) {
  ctx.strokeStyle = "#d8e1e7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
}

function drawBars(canvas, items, options = {}) {
  const { ctx, width, height } = clearCanvas(canvas);
  const padding = options.padding || 44;
  const max = Math.max(1e-9, ...items.map((item) => item.value));
  drawFrame(ctx, width, height, padding);
  const available = width - padding * 2;
  const gap = Math.max(1, Math.min(8, available / items.length / 3));
  const barWidth = Math.max(2, available / items.length - gap);

  ctx.fillStyle = "#137d7d";
  items.forEach((item, index) => {
    const x = padding + index * (barWidth + gap);
    const h = (item.value / max) * (height - padding * 2);
    const y = height - padding - h;
    ctx.fillRect(x, y, barWidth, h);
  });

  ctx.fillStyle = "#607080";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  const labelStep = Math.ceil(items.length / 10);
  items.forEach((item, index) => {
    if (index % labelStep !== 0 && index !== items.length - 1) return;
    const x = padding + index * (barWidth + gap);
    ctx.fillText(item.label, x, height - padding + 18);
  });

  if (options.ylabel) ctx.fillText(options.ylabel, padding + 4, padding - 14);
}

function renderStats() {
  const values = parseNumbers(dom.dataInput.value);
  state.data = values.length ? values : state.data;
  state.binWidth = Number(dom.binWidth.value);
  dom.binWidthValue.textContent = state.binWidth;
  const data = state.data;
  const avg = mean(data);
  const med = median(data);
  const modeInfo = modes(data);
  const vari = variance(data);
  const sd = Math.sqrt(vari);

  dom.statsGrid.innerHTML = [
    statCard("データ数", data.length),
    statCard("平均", fmt(avg)),
    statCard("中央値", fmt(med)),
    statCard("最頻値", modeInfo.values.length ? modeInfo.values.map((value) => fmt(value)).join(", ") : "なし"),
    statCard("分散", fmt(vari)),
    statCard("標準偏差", fmt(sd)),
    statCard("最小値", fmt(Math.min(...data))),
    statCard("最大値", fmt(Math.max(...data))),
  ].join("");
  dom.statsCount.textContent = `${data.length}件`;
  renderRepresentativeNotes(data, avg, med, modeInfo);

  const min = Math.floor(Math.min(...data) / state.binWidth) * state.binWidth;
  const max = Math.ceil((Math.max(...data) + 1) / state.binWidth) * state.binWidth;
  const bins = [];
  for (let start = min; start < max; start += state.binWidth) {
    const end = start + state.binWidth;
    const count = data.filter((value) => value >= start && value < end).length;
    bins.push({ start, end, count });
  }

  drawBars(
    dom.histogram,
    bins.map((bin) => ({ label: `${bin.start}`, value: bin.count })),
    { ylabel: "度数" },
  );

  dom.frequencyTable.innerHTML = `
    <thead><tr><th>階級</th><th>度数</th><th>相対度数</th><th>累積度数</th></tr></thead>
    <tbody>
      ${bins
        .reduce(
          (acc, bin) => {
            acc.cumulative += bin.count;
            acc.rows.push(
              `<tr><td>${bin.start}以上 ${bin.end}未満</td><td>${bin.count}</td><td>${fmt(bin.count / data.length, 3)}</td><td>${acc.cumulative}</td></tr>`,
            );
            return acc;
          },
          { cumulative: 0, rows: [] },
        )
        .rows.join("")}
    </tbody>
  `;
  typesetMath();
}

function renderRepresentativeNotes(data, avg, med, modeInfo) {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const medianPosition =
    n % 2
      ? `\\(x_{(${n}+1)/2}=x_${(n + 1) / 2}\\)`
      : `\\(\\frac{x_{${n / 2}}+x_${n / 2 + 1}}{2}\\)`;
  const modeText = modeInfo.values.length
    ? `このデータでは ${modeInfo.values.map((value) => fmt(value)).join(", ")} が ${modeInfo.count} 回${modeInfo.values.length > 1 ? "ずつ" : ""}出ているため、最頻値です。`
    : "全ての値の出現回数が1回なので、このデータでは最頻値はありません。";

  dom.representativeNotes.innerHTML = `
    <article class="definition-card">
      <h4>平均値</h4>
      <div class="formula-line">\\[\\bar{x}=\\frac{x_1+x_2+\\cdots+x_n}{n}\\]</div>
      <p>全ての値を合計し、データ数で割った値です。現在の平均は <strong>${fmt(avg)}</strong> です。</p>
    </article>
    <article class="definition-card">
      <h4>中央値</h4>
      <div class="formula-line">${medianPosition}</div>
      <p>データを小さい順に並べたとき中央にくる値です。現在の中央値は <strong>${fmt(med)}</strong> です。</p>
    </article>
    <article class="definition-card">
      <h4>最頻値</h4>
      <div class="formula-line">\\[\\operatorname{mode}(X)=\\text{最も出現回数が多い値}\\]</div>
      <p>${modeText}</p>
    </article>
    <article class="definition-card wide">
      <h4>並べ替えたデータ</h4>
      <p class="sorted-data">${sorted.map((value) => fmt(value)).join(", ")}</p>
    </article>
  `;
}

function setData(values) {
  dom.dataInput.value = values.join(", ");
  renderStats();
}

function createPoints(type = "positive") {
  const base = [];
  for (let i = 0; i < 18; i += 1) {
    const x = 8 + i * 5;
    const noise = Math.sin(i * 1.7) * 8 + Math.cos(i * 0.8) * 4;
    const y = type === "negative" ? 92 - x * 0.72 + noise : 16 + x * 0.72 + noise;
    base.push({ x, y: Math.max(5, Math.min(95, y)) });
  }
  state.points = base;
  renderCorrelation();
}

function regression(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const xbar = mean(xs);
  const ybar = mean(ys);
  const sxx = points.reduce((sum, point) => sum + (point.x - xbar) ** 2, 0);
  const syy = points.reduce((sum, point) => sum + (point.y - ybar) ** 2, 0);
  const sxy = points.reduce((sum, point) => sum + (point.x - xbar) * (point.y - ybar), 0);
  const slope = sxy / sxx;
  const intercept = ybar - slope * xbar;
  const r = sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r, r2: r ** 2, xbar, ybar };
}

function renderCorrelation() {
  const points = state.points;
  const result = regression(points);
  dom.regressionGrid.innerHTML = [
    statCard("相関係数 \\(r\\)", fmt(result.r, 4)),
    statCard("決定係数 \\(r^2\\)", fmt(result.r2, 4)),
    statCard("\\(x\\) の平均", fmt(result.xbar)),
    statCard("\\(y\\) の平均", fmt(result.ybar)),
  ].join("");
  dom.regressionEquation.innerHTML = `
    回帰直線:
    \\[
      y = ${fmt(result.slope, 3)}x ${result.intercept >= 0 ? "+" : "-"} ${fmt(Math.abs(result.intercept), 3)}
    \\]
    最小二乗法では、\\(\\sum_i (y_i - \\hat{y}_i)^2\\) を最小にします。
  `;
  dom.pointTable.innerHTML = `
    <table><thead><tr><th>#</th><th>x</th><th>y</th></tr></thead><tbody>
      ${points.map((point, index) => `<tr><td>${index + 1}</td><td>${fmt(point.x, 1)}</td><td>${fmt(point.y, 1)}</td></tr>`).join("")}
    </tbody></table>
  `;
  drawScatter(result);
  typesetMath();
}

function pointToCanvas(point, width, height, padding) {
  return {
    x: padding + (point.x / 100) * (width - padding * 2),
    y: height - padding - (point.y / 100) * (height - padding * 2),
  };
}

function canvasToPoint(x, y, width, height, padding) {
  return {
    x: Math.max(0, Math.min(100, ((x - padding) / (width - padding * 2)) * 100)),
    y: Math.max(0, Math.min(100, ((height - padding - y) / (height - padding * 2)) * 100)),
  };
}

function drawScatter(result) {
  const { ctx, width, height } = clearCanvas(dom.scatter);
  const padding = 48;
  drawFrame(ctx, width, height, padding);
  ctx.fillStyle = "#607080";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("x", width - padding + 12, height - padding + 4);
  ctx.fillText("y", padding - 16, padding - 12);

  const lineStart = pointToCanvas({ x: 0, y: result.intercept }, width, height, padding);
  const lineEnd = pointToCanvas({ x: 100, y: result.slope * 100 + result.intercept }, width, height, padding);
  ctx.strokeStyle = "#c13d37";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(lineStart.x, lineStart.y);
  ctx.lineTo(lineEnd.x, lineEnd.y);
  ctx.stroke();

  state.points.forEach((point, index) => {
    const pos = pointToCanvas(point, width, height, padding);
    ctx.fillStyle = index === state.dragIndex ? "#b36b00" : "#2f6ed3";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getScatterPointer(event) {
  const rect = dom.scatter.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function renderBayes() {
  const population = Number(dom.population.value);
  const prevalence = Number(dom.prevalence.value) / 100;
  const sensitivity = Number(dom.sensitivity.value) / 100;
  const specificity = Number(dom.specificity.value) / 100;
  const diseased = population * prevalence;
  const healthy = population - diseased;
  const truePositive = diseased * sensitivity;
  const falseNegative = diseased - truePositive;
  const falsePositive = healthy * (1 - specificity);
  const trueNegative = healthy * specificity;
  const positive = truePositive + falsePositive;
  const posterior = truePositive / positive;

  dom.populationValue.textContent = `${population.toLocaleString("ja-JP")}人`;
  dom.prevalenceValue.textContent = `${fmt(prevalence * 100, 1)}%`;
  dom.sensitivityValue.textContent = `${fmt(sensitivity * 100, 0)}%`;
  dom.specificityValue.textContent = `${fmt(specificity * 100, 0)}%`;
  dom.bayesResult.innerHTML = `
    \\[
      P(\\text{病気}\\mid\\text{陽性})
      = \\frac{P(\\text{陽性}\\mid\\text{病気})P(\\text{病気})}{P(\\text{陽性})}
      = ${fmt(posterior * 100, 2)}\\%
    \\]
    陽性者 ${fmt(positive, 0)}人のうち、本当に病気の人は ${fmt(truePositive, 0)}人です。
  `;
  dom.bayesTable.innerHTML = `
    <thead><tr><th></th><th>陽性</th><th>陰性</th><th>合計</th></tr></thead>
    <tbody>
      <tr><td>病気あり</td><td>${fmt(truePositive, 0)}</td><td>${fmt(falseNegative, 0)}</td><td>${fmt(diseased, 0)}</td></tr>
      <tr><td>病気なし</td><td>${fmt(falsePositive, 0)}</td><td>${fmt(trueNegative, 0)}</td><td>${fmt(healthy, 0)}</td></tr>
      <tr><td>合計</td><td>${fmt(positive, 0)}</td><td>${fmt(falseNegative + trueNegative, 0)}</td><td>${fmt(population, 0)}</td></tr>
    </tbody>
  `;
  drawGroupedBayes({ truePositive, falsePositive, falseNegative, trueNegative });
  typesetMath();
}

function drawGroupedBayes(values) {
  const { ctx, width, height } = clearCanvas(dom.bayesBars);
  const padding = 46;
  drawFrame(ctx, width, height, padding);
  const items = [
    { label: "真陽性", value: values.truePositive, color: "#237a57" },
    { label: "偽陽性", value: values.falsePositive, color: "#c13d37" },
    { label: "偽陰性", value: values.falseNegative, color: "#b36b00" },
    { label: "真陰性", value: values.trueNegative, color: "#2f6ed3" },
  ];
  const max = Math.max(...items.map((item) => item.value), 1);
  const gap = 22;
  const barWidth = (width - padding * 2 - gap * (items.length - 1)) / items.length;
  items.forEach((item, index) => {
    const h = (item.value / max) * (height - padding * 2);
    const x = padding + index * (barWidth + gap);
    const y = height - padding - h;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barWidth, h);
    ctx.fillStyle = "#607080";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(item.label, x, height - padding + 18);
    ctx.fillText(fmt(item.value, 0), x, Math.max(padding + 12, y - 8));
  });
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  const m = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= m; i += 1) result = (result * (n - m + i)) / i;
  return result;
}

function factorial(k) {
  let result = 1;
  for (let i = 2; i <= k; i += 1) result *= i;
  return result;
}

function normalPdf(x, mu, sigma) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function makeControl(id, label, min, max, step, value) {
  return `
    <div class="control-row">
      <label>${label}<input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" /></label>
      <output id="${id}-value">${value}</output>
    </div>
  `;
}

function renderDistributionControls() {
  if (state.distribution === "binomial") {
    dom.distControls.innerHTML =
      makeControl("dist-n", "試行回数 n", 1, 40, 1, state.dist.n) +
      makeControl("dist-p", "成功確率 p", 0.01, 0.99, 0.01, state.dist.p);
  } else if (state.distribution === "poisson") {
    dom.distControls.innerHTML = makeControl("dist-lambda", "平均発生回数 λ", 0.2, 15, 0.1, state.dist.lambda);
  } else {
    dom.distControls.innerHTML =
      makeControl("dist-mu", "平均 μ", -5, 5, 0.1, state.dist.mu) +
      makeControl("dist-sigma", "標準偏差 σ", 0.2, 5, 0.1, state.dist.sigma);
  }
  dom.distControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.id.replace("dist-", "");
      state.dist[key] = Number(input.value);
      $(`#${input.id}-value`).textContent = fmt(Number(input.value), 2);
      renderDistribution();
    });
  });
}

function distributionItems() {
  if (state.distribution === "binomial") {
    const { n, p } = state.dist;
    return Array.from({ length: n + 1 }, (_, k) => ({
      x: k,
      label: String(k),
      value: combination(n, k) * p ** k * (1 - p) ** (n - k),
    }));
  }
  if (state.distribution === "poisson") {
    const lambda = state.dist.lambda;
    const maxK = Math.max(12, Math.ceil(lambda + 5 * Math.sqrt(lambda)));
    return Array.from({ length: maxK + 1 }, (_, k) => ({
      x: k,
      label: String(k),
      value: Math.exp(-lambda) * lambda ** k / factorial(k),
    }));
  }
  const { mu, sigma } = state.dist;
  const count = 80;
  const min = mu - 4 * sigma;
  const max = mu + 4 * sigma;
  return Array.from({ length: count }, (_, index) => {
    const x = min + ((max - min) * index) / (count - 1);
    return { x, label: index % 10 === 0 ? fmt(x, 1) : "", value: normalPdf(x, mu, sigma) };
  });
}

function renderDistribution() {
  const items = distributionItems();
  let expected;
  let vari;
  let formula;
  let chip;
  if (state.distribution === "binomial") {
    expected = state.dist.n * state.dist.p;
    vari = state.dist.n * state.dist.p * (1 - state.dist.p);
    formula = "\\[P(X=k) = {}_nC_k p^k(1-p)^{n-k}\\]";
    chip = "離散型";
  } else if (state.distribution === "poisson") {
    expected = state.dist.lambda;
    vari = state.dist.lambda;
    formula = "\\[P(X=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}\\]";
    chip = "離散型";
  } else {
    expected = state.dist.mu;
    vari = state.dist.sigma ** 2;
    formula = "\\[f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)\\]";
    chip = "連続型";
  }
  dom.distGrid.innerHTML = [
    statCard("期待値 \\(E(X)\\)", fmt(expected)),
    statCard("分散 \\(V(X)\\)", fmt(vari)),
    statCard("標準偏差", fmt(Math.sqrt(vari))),
    statCard("性質", `\\(E(2X+3)=${fmt(2 * expected + 3)}\\)<br>\\(V(2X+3)=${fmt(4 * vari)}\\)`),
  ].join("");
  dom.distFormula.innerHTML = formula;
  dom.distChip.textContent = chip;
  drawBars(dom.distCanvas, items, { ylabel: state.distribution === "normal" ? "密度" : "確率" });
  typesetMath();
}

function renderApproximation() {
  const n = Number(dom.approxN.value);
  const p = Number(dom.approxP.value);
  state.approx = { n, p, continuity: dom.continuity.checked };
  const mu = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));
  dom.approxNValue.textContent = n;
  dom.approxPValue.textContent = fmt(p, 2);
  dom.approxGrid.innerHTML = [
    statCard("平均 \\(np\\)", fmt(mu)),
    statCard("分散 \\(np(1-p)\\)", fmt(sigma ** 2)),
    statCard("標準偏差", fmt(sigma)),
    statCard("近似条件", n * p >= 5 && n * (1 - p) >= 5 ? "おおむね良い" : "注意が必要"),
  ].join("");
  dom.approxChip.innerHTML = `\\(np=${fmt(n * p, 1)}\\), \\(n(1-p)=${fmt(n * (1 - p), 1)}\\)`;
  drawApproximation(n, p, mu, sigma);
  typesetMath();
}

function drawApproximation(n, p, mu, sigma) {
  const { ctx, width, height } = clearCanvas(dom.approxCanvas);
  const padding = 46;
  drawFrame(ctx, width, height, padding);
  const probs = Array.from({ length: n + 1 }, (_, k) => combination(n, k) * p ** k * (1 - p) ** (n - k));
  const normalHeights = probs.map((_, k) => normalPdf(k, mu, sigma));
  const max = Math.max(...probs, ...normalHeights);
  const visibleStep = Math.max(1, Math.floor(n / 60));
  const shown = probs.map((prob, k) => ({ k, prob })).filter((item) => item.k % visibleStep === 0 || n <= 60);
  const barGap = 1;
  const barWidth = (width - padding * 2) / shown.length - barGap;

  ctx.fillStyle = "#137d7d";
  shown.forEach((item, index) => {
    const h = (item.prob / max) * (height - padding * 2);
    const x = padding + index * (barWidth + barGap);
    const y = height - padding - h;
    ctx.fillRect(x, y, Math.max(1, barWidth), h);
  });

  ctx.strokeStyle = "#c13d37";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 320; i += 1) {
    const xValue = (i / 320) * n;
    const yValue = normalPdf(xValue, mu, sigma);
    const x = padding + (xValue / n) * (width - padding * 2);
    const y = height - padding - (yValue / max) * (height - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (state.approx.continuity) {
    ctx.strokeStyle = "#b36b00";
    ctx.setLineDash([5, 5]);
    [Math.floor(mu) - 0.5, Math.floor(mu) + 0.5].forEach((xValue) => {
      const x = padding + (xValue / n) * (width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#607080";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("棒: 二項分布", padding + 4, padding - 16);
  ctx.fillStyle = "#c13d37";
  ctx.fillText("線: 正規分布", padding + 110, padding - 16);
}

function bindEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      dom.navButtons.forEach((item) => item.classList.toggle("active", item === button));
      dom.views.forEach((view) => view.classList.toggle("active", view.id === button.dataset.view));
      renderAll();
    });
  });

  dom.dataInput.addEventListener("input", renderStats);
  dom.binWidth.addEventListener("input", renderStats);
  $("#load-skewed").addEventListener("click", () => setData([20, 22, 24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 39, 41, 46, 51, 59, 68, 81, 96]));
  $("#load-bimodal").addEventListener("click", () => setData([28, 30, 31, 33, 35, 36, 38, 40, 42, 44, 70, 72, 74, 76, 78, 79, 81, 83, 85, 88]));
  $("#load-outlier").addEventListener("click", () => setData([48, 50, 51, 52, 54, 55, 56, 56, 57, 58, 59, 60, 62, 63, 64, 66, 67, 68, 70, 130]));

  $("#corr-positive").addEventListener("click", () => createPoints("positive"));
  $("#corr-negative").addEventListener("click", () => createPoints("negative"));
  $("#corr-outlier").addEventListener("click", () => {
    state.points.push({ x: 96, y: 12 });
    renderCorrelation();
  });

  dom.scatter.addEventListener("pointerdown", (event) => {
    const { width, height } = dom.scatter.getBoundingClientRect();
    const padding = 48;
    const pointer = getScatterPointer(event);
    state.dragIndex = state.points.findIndex((point) => {
      const pos = pointToCanvas(point, width, height, padding);
      return Math.hypot(pos.x - pointer.x, pos.y - pointer.y) < 14;
    });
    if (state.dragIndex >= 0) dom.scatter.setPointerCapture(event.pointerId);
  });
  dom.scatter.addEventListener("pointermove", (event) => {
    if (state.dragIndex === null || state.dragIndex < 0) return;
    const { width, height } = dom.scatter.getBoundingClientRect();
    const pointer = getScatterPointer(event);
    state.points[state.dragIndex] = canvasToPoint(pointer.x, pointer.y, width, height, 48);
    renderCorrelation();
  });
  dom.scatter.addEventListener("pointerup", () => {
    state.dragIndex = null;
    renderCorrelation();
  });

  [dom.population, dom.prevalence, dom.sensitivity, dom.specificity].forEach((input) => input.addEventListener("input", renderBayes));

  $$(".segment[data-dist]").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".segment[data-dist]").forEach((item) => item.classList.toggle("active", item === button));
      state.distribution = button.dataset.dist;
      renderDistributionControls();
      renderDistribution();
    });
  });

  [dom.approxN, dom.approxP, dom.continuity].forEach((input) => input.addEventListener("input", renderApproximation));
  window.addEventListener("resize", renderAll);
}

function renderAll() {
  if ($("#stats").classList.contains("active")) renderStats();
  if ($("#correlation").classList.contains("active")) renderCorrelation();
  if ($("#bayes").classList.contains("active")) renderBayes();
  if ($("#distributions").classList.contains("active")) renderDistribution();
  if ($("#normal").classList.contains("active")) renderApproximation();
}

function init() {
  dom.dataInput.value = state.data.join(", ");
  createPoints("positive");
  renderDistributionControls();
  bindEvents();
  renderAll();
  typesetMath();
}

init();
