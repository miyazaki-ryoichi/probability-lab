const state = {
  data: [42, 48, 52, 53, 55, 58, 61, 62, 63, 64, 66, 68, 70, 72, 72, 73, 75, 78, 82, 88],
  binWidth: 10,
  affine: { a: 2, b: 10 },
  points: [],
  dragIndex: null,
  pointEditTimer: null,
  bayesPreset: "covid",
  distribution: "binomial",
  dist: { n: 100, p: 0.05, lambda: 5, mu: 0, sigma: 1.4, lower: 2, upper: 8 },
  approx: { n: 30, p: 0.4, x: 12, standardMu: 20, standardSigma: 4.2, standardLower: 9, standardUpper: 15, continuity: true },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const bayesPresets = {
  covid: {
    title: "コロナ検査の例",
    chip: "病気と検査陽性",
    note: "対象は「感染している人」、結果は「検査で陽性」です。低い有病率のとき、陽性者の中に偽陽性がどれくらい混ざるかを見ます。",
    populationLabel: "検査人数",
    prevalenceLabel: "有病率",
    sensitivityLabel: "感度 \\(P(+\\mid\\text{感染})\\)",
    specificityLabel: "特異度 \\(P(-\\mid\\text{非感染})\\)",
    targetLabel: "感染あり",
    nonTargetLabel: "感染なし",
    positiveLabel: "陽性",
    negativeLabel: "陰性",
    targetInPositiveLabel: "感染",
    positiveSentence: "陽性者",
    truePositiveSentence: "本当に感染している人",
    unit: "人",
    values: { population: 10000, prevalence: 2, sensitivity: 95, specificity: 90 },
  },
  spam: {
    title: "迷惑メール判定の例",
    chip: "迷惑メールと判定あり",
    note: "対象は「迷惑メール」、結果は「フィルタが迷惑メールと判定」です。迷惑メールの割合やフィルタ性能を変え、誤判定の影響を見ます。",
    populationLabel: "メール件数",
    prevalenceLabel: "迷惑メール率",
    sensitivityLabel: "検出率 \\(P(+\\mid\\text{迷惑メール})\\)",
    specificityLabel: "正常判定率 \\(P(-\\mid\\text{通常メール})\\)",
    targetLabel: "迷惑メール",
    nonTargetLabel: "通常メール",
    positiveLabel: "判定あり",
    negativeLabel: "判定なし",
    targetInPositiveLabel: "迷惑メール",
    positiveSentence: "迷惑メール判定されたメール",
    truePositiveSentence: "本当に迷惑メール",
    unit: "件",
    values: { population: 10000, prevalence: 35, sensitivity: 98, specificity: 95 },
  },
};

const dom = {
  views: $$(".view"),
  navButtons: $$(".nav-button"),
  dataInput: $("#data-input"),
  binWidth: $("#bin-width"),
  binWidthValue: $("#bin-width-value"),
  statsGrid: $("#stats-grid"),
  statsCount: $("#stats-count"),
  representativeNotes: $("#representative-notes"),
  affineA: $("#affine-a"),
  affineB: $("#affine-b"),
  affineAValue: $("#affine-a-value"),
  affineBValue: $("#affine-b-value"),
  affineGrid: $("#affine-grid"),
  affineCanvas: $("#affine-canvas"),
  standardTable: $("#standard-table"),
  frequencyTable: $("#frequency-table"),
  histogram: $("#histogram"),
  scatter: $("#scatter"),
  regressionGrid: $("#regression-grid"),
  regressionEquation: $("#regression-equation"),
  correlationFormulas: $("#correlation-formulas"),
  addPoint: $("#add-point"),
  resetPoints: $("#reset-points"),
  pointTable: $("#point-table"),
  population: $("#population"),
  prevalence: $("#prevalence"),
  sensitivity: $("#sensitivity"),
  specificity: $("#specificity"),
  populationValue: $("#population-value"),
  populationLabel: $("#population-label"),
  prevalenceValue: $("#prevalence-value"),
  prevalenceLabel: $("#prevalence-label"),
  sensitivityValue: $("#sensitivity-value"),
  sensitivityLabel: $("#sensitivity-label"),
  specificityValue: $("#specificity-value"),
  specificityLabel: $("#specificity-label"),
  bayesScenarioTitle: $("#bayes-scenario-title"),
  bayesScenarioChip: $("#bayes-scenario-chip"),
  bayesScenarioNote: $("#bayes-scenario-note"),
  bayesPresetButtons: $$(".bayes-preset"),
  bayesResult: $("#bayes-result"),
  bayesTable: $("#bayes-table"),
  bayesBars: $("#bayes-bars"),
  distControls: $("#distribution-controls"),
  freePoissonControls: $("#free-poisson-controls"),
  distGrid: $("#distribution-grid"),
  binomialFormula: $("#binomial-formula"),
  poissonFormula: $("#poisson-formula"),
  freePoissonFormula: $("#free-poisson-formula"),
  binomialCanvas: $("#binomial-canvas"),
  poissonCanvas: $("#poisson-canvas"),
  freePoissonCanvas: $("#free-poisson-canvas"),
  distChip: $("#distribution-chip"),
  poissonChip: $("#poisson-chip"),
  freePoissonChip: $("#free-poisson-chip"),
  distLower: $("#dist-lower"),
  distUpper: $("#dist-upper"),
  distLowerValue: $("#dist-lower-value"),
  distUpperValue: $("#dist-upper-value"),
  binomialProbability: $("#binomial-probability"),
  poissonProbability: $("#poisson-probability"),
  freePoissonProbability: $("#free-poisson-probability"),
  distNotes: $("#distribution-notes"),
  distTypeChip: $("#distribution-type-chip"),
  distRelationship: $("#distribution-relationship"),
  approxN: $("#approx-n"),
  approxP: $("#approx-p"),
  approxX: $("#approx-x"),
  continuity: $("#continuity"),
  approxNValue: $("#approx-n-value"),
  approxPValue: $("#approx-p-value"),
  approxXValue: $("#approx-x-value"),
  approxGrid: $("#approx-grid"),
  approxCanvas: $("#approx-canvas"),
  approxChip: $("#approx-chip"),
  approxLegend: $("#approx-legend"),
  approxRelationship: $("#approx-relationship"),
  normalTableResult: $("#normal-table-result"),
  standardMu: $("#standard-mu"),
  standardSigma: $("#standard-sigma"),
  standardMuValue: $("#standard-mu-value"),
  standardVarianceValue: $("#standard-variance-value"),
  standardLower: $("#standard-lower"),
  standardUpper: $("#standard-upper"),
  standardLowerZ: $("#standard-lower-z"),
  standardUpperZ: $("#standard-upper-z"),
  standardResult: $("#standard-result"),
  originalNormalCanvas: $("#original-normal-canvas"),
  standardNormalCanvas: $("#standard-normal-canvas"),
};

function fmt(value, digits = 3) {
  if (!Number.isFinite(value)) return "-";
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString("ja-JP");
}

function inputValue(value) {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 10) / 10);
}

function clampPointValue(value) {
  return Math.max(0, Math.min(100, value));
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
  const max = options.maxValue || Math.max(1e-9, ...items.map((item) => item.value));
  drawFrame(ctx, width, height, padding);
  const available = width - padding * 2;
  const gap = Math.max(1, Math.min(8, available / items.length / 3));
  const barWidth = Math.max(2, available / items.length - gap);

  items.forEach((item, index) => {
    const x = padding + index * (barWidth + gap);
    const h = (item.value / max) * (height - padding * 2);
    const y = height - padding - h;
    const highlighted =
      options.highlightMin !== undefined &&
      options.highlightMax !== undefined &&
      item.x >= options.highlightMin &&
      item.x <= options.highlightMax;
    ctx.fillStyle = highlighted ? "#c13d37" : "#137d7d";
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

function drawDotLine(ctx, values, width, y, min, max, color, label) {
  const padding = 48;
  const scale = (width - padding * 2) / Math.max(1e-9, max - min);
  const xAt = (value) => padding + (value - min) * scale;

  ctx.strokeStyle = "#d8e1e7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();

  ctx.fillStyle = "#607080";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(label, padding, y - 30);
  ctx.fillText(fmt(min, 1), padding - 8, y + 28);
  ctx.fillText(fmt(max, 1), width - padding - 20, y + 28);

  ctx.fillStyle = color;
  values.forEach((value, index) => {
    const jitter = ((index % 5) - 2) * 3;
    ctx.beginPath();
    ctx.arc(xAt(value), y + jitter, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAffineCanvas(data, transformed) {
  const { ctx, width, height } = clearCanvas(dom.affineCanvas);
  const allValues = [...data, ...transformed];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const margin = Math.max(5, (max - min) * 0.08);
  drawDotLine(ctx, data, width, height * 0.34, min - margin, max + margin, "#2f6ed3", "元のデータ X");
  drawDotLine(ctx, transformed, width, height * 0.72, min - margin, max + margin, "#137d7d", "変換後 Y = aX + b");
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
  renderAffineAndStandardization(data, avg, vari, sd);

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

function renderAffineAndStandardization(data, avg, vari, sd) {
  const a = Number(dom.affineA.value);
  const b = Number(dom.affineB.value);
  state.affine = { a, b };
  dom.affineAValue.textContent = fmt(a, 1);
  dom.affineBValue.textContent = fmt(b, 0);

  const transformed = data.map((value) => a * value + b);
  const transformedMean = mean(transformed);
  const transformedVariance = variance(transformed);
  const expectedByFormula = a * avg + b;
  const varianceByFormula = a ** 2 * vari;

  dom.affineGrid.innerHTML = [
    statCard("\\(E[X]\\)", fmt(avg)),
    statCard("\\(V[X]\\)", fmt(vari)),
    statCard("\\(E[Y]=aE[X]+b\\)", fmt(expectedByFormula)),
    statCard("\\(V[Y]=a^2V[X]\\)", fmt(varianceByFormula)),
    statCard("実際の \\(Y\\) の平均", fmt(transformedMean)),
    statCard("実際の \\(Y\\) の分散", fmt(transformedVariance)),
  ].join("");
  drawAffineCanvas(data, transformed);

  const sorted = [...data].sort((x, y) => x - y);
  const sample = sorted
    .filter((_, index) => {
      const positions = [0, Math.floor((sorted.length - 1) / 4), Math.floor((sorted.length - 1) / 2), Math.floor(((sorted.length - 1) * 3) / 4), sorted.length - 1];
      return positions.includes(index);
    })
    .filter((value, index, values) => values.indexOf(value) === index);

  dom.standardTable.innerHTML = `
    <thead><tr><th>値 \\(x\\)</th><th>標準化 \\(z\\)</th><th>偏差値 \\(T\\)</th><th>読み取り</th></tr></thead>
    <tbody>
      ${sample
        .map((value) => {
          const z = sd === 0 ? 0 : (value - avg) / sd;
          const deviationScore = 50 + 10 * z;
          const reading = z > 0 ? "平均より上" : z < 0 ? "平均より下" : "平均と同じ";
          return `<tr><td>${fmt(value)}</td><td>${fmt(z, 2)}</td><td>${fmt(deviationScore, 1)}</td><td>${reading}</td></tr>`;
        })
        .join("")}
    </tbody>
  `;
}

function renderRepresentativeNotes(data, avg, med, modeInfo) {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const medianPosition =
    n % 2
      ? `\\[\\displaystyle \\operatorname{Med}(X)=x_{(${n}+1)/2}=x_{${(n + 1) / 2}}\\]`
      : `\\[\\displaystyle \\operatorname{Med}(X)=\\frac{x_{${n / 2}}+x_{${n / 2 + 1}}}{2}\\]`;
  const modeText = modeInfo.values.length
    ? `このデータでは ${modeInfo.values.map((value) => fmt(value)).join(", ")} が ${modeInfo.count} 回${modeInfo.values.length > 1 ? "ずつ" : ""}出ているため、最頻値です。`
    : "全ての値の出現回数が1回なので、このデータでは最頻値はありません。";

  dom.representativeNotes.innerHTML = `
    <article class="definition-card">
      <h4>平均値</h4>
      <div class="formula-line">\\[\\displaystyle \\bar{x}=\\frac{x_1+x_2+\\cdots+x_n}{n}\\]</div>
      <p>全ての値を合計し、データ数で割った値です。現在の平均は <strong>${fmt(avg)}</strong> です。</p>
    </article>
    <article class="definition-card">
      <h4>中央値</h4>
      <div class="formula-line">${medianPosition}</div>
      <p>データを小さい順に並べたとき中央にくる値です。現在の中央値は <strong>${fmt(med)}</strong> です。</p>
    </article>
    <article class="definition-card">
      <h4>最頻値</h4>
      <div class="formula-line">\\[\\displaystyle \\operatorname{mode}(X)=\\text{最も出現回数が多い値}\\]</div>
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

function addEditablePoint() {
  const last = state.points[state.points.length - 1] || { x: 50, y: 50 };
  state.points.push({
    x: clampPointValue(last.x + 4),
    y: clampPointValue(last.y + 4),
  });
  renderCorrelation();
}

function deleteEditablePoint(index) {
  if (state.points.length <= 3) return;
  state.points.splice(index, 1);
  renderCorrelation();
}

function updatePointFromInput(input, shouldRender = true) {
  const index = Number(input.dataset.index);
  const axis = input.dataset.axis;
  const value = Number(input.value);
  if (!Number.isFinite(value) || !state.points[index] || !["x", "y"].includes(axis)) {
    if (shouldRender) renderCorrelation();
    return;
  }
  state.points[index][axis] = clampPointValue(value);
  if (shouldRender) renderCorrelation();
}

function regression(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const xbar = mean(xs);
  const ybar = mean(ys);
  const sxx = points.reduce((sum, point) => sum + (point.x - xbar) ** 2, 0);
  const syy = points.reduce((sum, point) => sum + (point.y - ybar) ** 2, 0);
  const sxy = points.reduce((sum, point) => sum + (point.x - xbar) * (point.y - ybar), 0);
  const vx = sxx / points.length;
  const vy = syy / points.length;
  const cov = sxy / points.length;
  const slope = sxx === 0 ? NaN : sxy / sxx;
  const intercept = Number.isFinite(slope) ? ybar - slope * xbar : NaN;
  const inverseSlope = syy === 0 ? NaN : sxy / syy;
  const inverseIntercept = Number.isFinite(inverseSlope) ? xbar - inverseSlope * ybar : NaN;
  const r = sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, inverseSlope, inverseIntercept, r, r2: r ** 2, xbar, ybar, vx, vy, cov };
}

function renderCorrelation() {
  const points = state.points;
  const result = regression(points);
  dom.regressionGrid.innerHTML = [
    statCard("相関係数 \\(r\\)", fmt(result.r, 4)),
    statCard("決定係数 \\(r^2\\)", fmt(result.r2, 4)),
    statCard("共分散 \\(\\operatorname{Cov}(X,Y)\\)", fmt(result.cov)),
    statCard("\\(x\\) の平均", fmt(result.xbar)),
    statCard("\\(y\\) の平均", fmt(result.ybar)),
    statCard("\\(x\\) の分散 \\(V[X]\\)", fmt(result.vx)),
  ].join("");
  dom.regressionEquation.innerHTML = `
    \\(y\\) を \\(x\\) から予測する回帰直線:
    \\[
      y = ${fmt(result.slope, 3)}x ${result.intercept >= 0 ? "+" : "-"} ${fmt(Math.abs(result.intercept), 3)}
    \\]
    \\(x\\) を \\(y\\) から予測する回帰直線:
    \\[
      x = ${fmt(result.inverseSlope, 3)}y ${result.inverseIntercept >= 0 ? "+" : "-"} ${fmt(Math.abs(result.inverseIntercept), 3)}
    \\]
    2つの回帰直線は、完全な直線関係でない限り基本的には一致しません。
    どちらを目的変数として予測するかで、最小にしている誤差の向きが変わります。<br>
    最小二乗法では、\\(\\sum_i (y_i - \\hat{y}_i)^2\\) を最小にします。
  `;
  dom.correlationFormulas.innerHTML = `
    <article class="definition-card">
      <h4>共分散</h4>
      <div class="formula-line">\\[\\operatorname{Cov}(X,Y)=\\frac{1}{n}\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})\\]</div>
      <p>現在の値は <strong>${fmt(result.cov)}</strong> です。正なら同じ向き、負なら逆向きに変化しやすいことを表します。</p>
    </article>
    <article class="definition-card">
      <h4>相関係数</h4>
      <div class="formula-line">\\[r=\\frac{\\operatorname{Cov}(X,Y)}{\\sqrt{V[X]}\\sqrt{V[Y]}}\\]</div>
      <p>現在の値は <strong>${fmt(result.r, 4)}</strong> です。単位の影響を除いた直線的な関係の強さです。</p>
    </article>
    <article class="definition-card">
      <h4>回帰直線 \(y=ax+b\)</h4>
      <div class="formula-line">\\[\\hat{y}=ax+b,\\quad a=\\frac{\\operatorname{Cov}(X,Y)}{V[X]},\\quad b=\\bar{y}-a\\bar{x}\\]</div>
      <p>現在は <strong>\\(a=${fmt(result.slope, 3)}\\)</strong>、<strong>\\(b=${fmt(result.intercept, 3)}\\)</strong> です。</p>
    </article>
    <article class="definition-card">
      <h4>逆向きの回帰直線</h4>
      <div class="formula-line">\\[\\hat{x}=\\alpha y+\\beta,\\quad \\alpha=\\frac{\\operatorname{Cov}(X,Y)}{V[Y]},\\quad \\beta=\\bar{x}-\\alpha\\bar{y}\\]</div>
      <p>現在は <strong>\\(\\alpha=${fmt(result.inverseSlope, 3)}\\)</strong>、<strong>\\(\\beta=${fmt(result.inverseIntercept, 3)}\\)</strong> です。</p>
    </article>
  `;
  dom.pointTable.innerHTML = `
    <table><thead><tr><th>#</th><th>x</th><th>y</th><th>操作</th></tr></thead><tbody>
      ${points
        .map(
          (point, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><input class="point-input" type="number" min="0" max="100" step="0.1" data-index="${index}" data-axis="x" value="${inputValue(point.x)}" /></td>
              <td><input class="point-input" type="number" min="0" max="100" step="0.1" data-index="${index}" data-axis="y" value="${inputValue(point.y)}" /></td>
              <td><button class="delete-point" type="button" data-index="${index}" ${points.length <= 3 ? "disabled" : ""}>削除</button></td>
            </tr>
          `,
        )
        .join("")}
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

  if (Number.isFinite(result.slope) && Number.isFinite(result.intercept)) {
    const lineStart = pointToCanvas({ x: 0, y: result.intercept }, width, height, padding);
    const lineEnd = pointToCanvas({ x: 100, y: result.slope * 100 + result.intercept }, width, height, padding);
    ctx.strokeStyle = "#c13d37";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineEnd.x, lineEnd.y);
    ctx.stroke();
  }

  if (Number.isFinite(result.inverseSlope) && Math.abs(result.inverseSlope) > 1e-9) {
    const inverseLineStart = pointToCanvas({ x: 0, y: (0 - result.inverseIntercept) / result.inverseSlope }, width, height, padding);
    const inverseLineEnd = pointToCanvas({ x: 100, y: (100 - result.inverseIntercept) / result.inverseSlope }, width, height, padding);
    ctx.strokeStyle = "#137d7d";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(inverseLineStart.x, inverseLineStart.y);
    ctx.lineTo(inverseLineEnd.x, inverseLineEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#c13d37";
  ctx.fillText("赤: y = ax + b", padding + 6, padding + 16);
  ctx.fillStyle = "#137d7d";
  ctx.fillText("青破線: x = αy + β", padding + 118, padding + 16);

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
  const preset = bayesPresets[state.bayesPreset];
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

  dom.bayesScenarioTitle.textContent = preset.title;
  dom.bayesScenarioChip.textContent = preset.chip;
  dom.bayesScenarioNote.textContent = preset.note;
  dom.populationLabel.textContent = preset.populationLabel;
  dom.prevalenceLabel.textContent = preset.prevalenceLabel;
  dom.sensitivityLabel.innerHTML = preset.sensitivityLabel;
  dom.specificityLabel.innerHTML = preset.specificityLabel;
  dom.bayesPresetButtons.forEach((button) => button.classList.toggle("active", button.dataset.preset === state.bayesPreset));
  dom.populationValue.textContent = `${population.toLocaleString("ja-JP")}${preset.unit}`;
  dom.prevalenceValue.textContent = `${fmt(prevalence * 100, 1)}%`;
  dom.sensitivityValue.textContent = `${fmt(sensitivity * 100, 0)}%`;
  dom.specificityValue.textContent = `${fmt(specificity * 100, 0)}%`;
  dom.bayesResult.innerHTML = `
    \\[
      P(\\text{${preset.targetInPositiveLabel}}\\mid\\text{${preset.positiveLabel}})
      = \\frac{P(\\text{${preset.positiveLabel}}\\mid\\text{${preset.targetInPositiveLabel}})P(\\text{${preset.targetInPositiveLabel}})}{P(\\text{${preset.positiveLabel}})}
      = ${fmt(posterior * 100, 2)}\\%
    \\]
    ${preset.positiveSentence} ${fmt(positive, 0)}${preset.unit}のうち、${preset.truePositiveSentence}は ${fmt(truePositive, 0)}${preset.unit}です。
  `;
  dom.bayesTable.innerHTML = `
    <thead><tr><th></th><th>${preset.positiveLabel}</th><th>${preset.negativeLabel}</th><th>合計</th></tr></thead>
    <tbody>
      <tr><td>${preset.targetLabel}</td><td>${fmt(truePositive, 0)}</td><td>${fmt(falseNegative, 0)}</td><td>${fmt(diseased, 0)}</td></tr>
      <tr><td>${preset.nonTargetLabel}</td><td>${fmt(falsePositive, 0)}</td><td>${fmt(trueNegative, 0)}</td><td>${fmt(healthy, 0)}</td></tr>
      <tr><td>合計</td><td>${fmt(positive, 0)}</td><td>${fmt(falseNegative + trueNegative, 0)}</td><td>${fmt(population, 0)}</td></tr>
    </tbody>
  `;
  drawGroupedBayes({ truePositive, falsePositive, falseNegative, trueNegative }, preset);
  typesetMath();
}

function applyBayesPreset(presetName) {
  const preset = bayesPresets[presetName];
  if (!preset) return;
  state.bayesPreset = presetName;
  dom.population.value = preset.values.population;
  dom.prevalence.value = preset.values.prevalence;
  dom.sensitivity.value = preset.values.sensitivity;
  dom.specificity.value = preset.values.specificity;
  renderBayes();
}

function drawGroupedBayes(values, preset) {
  const { ctx, width, height } = clearCanvas(dom.bayesBars);
  const padding = 46;
  drawFrame(ctx, width, height, padding);
  const items = [
    { label: `真${preset.positiveLabel}`, value: values.truePositive, color: "#237a57" },
    { label: `偽${preset.positiveLabel}`, value: values.falsePositive, color: "#c13d37" },
    { label: `偽${preset.negativeLabel}`, value: values.falseNegative, color: "#b36b00" },
    { label: `真${preset.negativeLabel}`, value: values.trueNegative, color: "#2f6ed3" },
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

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z));
  return sign * y;
}

function normalCdf(x, mu, sigma) {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
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
  dom.distControls.innerHTML =
    makeControl("dist-n", "二項分布の試行回数 n", 1, 1000, 1, state.dist.n) +
    makeControl("dist-p", "二項分布の成功確率 p", 0.001, 0.5, 0.001, state.dist.p);
  dom.distControls.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.id.replace("dist-", "");
      state.dist[key] = Number(input.value);
      $(`#${input.id}-value`).textContent = fmt(Number(input.value), key === "n" ? 0 : 3);
      if (key === "n" || key === "p") {
        Object.assign(state.dist, defaultDistributionRange());
      }
      renderDistribution();
    });
  });
}

function renderFreePoissonControls() {
  dom.freePoissonControls.innerHTML = makeControl("free-poisson-lambda", "単体表示のポアソン分布の平均 λ", 0.1, 50, 0.1, state.dist.lambda);
  const input = $("#free-poisson-lambda");
  input.addEventListener("input", () => {
    state.dist.lambda = Number(input.value);
    $("#free-poisson-lambda-value").textContent = fmt(state.dist.lambda, 2);
    renderDistribution();
  });
}

function setRangeInput(input, min, max, step, value) {
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
}

function defaultDistributionRange() {
  const center = state.dist.n * state.dist.p;
  const spread = Math.max(Math.sqrt(Math.max(1e-9, state.dist.n * state.dist.p * (1 - state.dist.p))), Math.sqrt(Math.max(1e-9, center)));
  return {
    lower: Math.max(0, Math.floor(center - spread)),
    upper: Math.min(state.dist.n, Math.ceil(center + spread)),
  };
}

function syncDistributionQueryControls() {
  const min = 0;
  const lambdaFromBinomial = state.dist.n * state.dist.p;
  const max = Math.max(
    state.dist.n,
    Math.ceil(lambdaFromBinomial + 5 * Math.sqrt(Math.max(lambdaFromBinomial, 1e-9))),
    Math.ceil(state.dist.lambda + 5 * Math.sqrt(Math.max(state.dist.lambda, 1e-9))),
  );
  const step = 1;

  state.dist.lower = Math.max(min, Math.min(max, state.dist.lower));
  state.dist.upper = Math.max(min, Math.min(max, state.dist.upper));
  if (state.dist.lower > state.dist.upper) {
    [state.dist.lower, state.dist.upper] = [state.dist.upper, state.dist.lower];
  }
  setRangeInput(dom.distLower, min, max, step, state.dist.lower);
  setRangeInput(dom.distUpper, min, max, step, state.dist.upper);
  dom.distLowerValue.textContent = fmt(state.dist.lower, 0);
  dom.distUpperValue.textContent = fmt(state.dist.upper, 0);
}

function binomialItems(n, p) {
  const q = 1 - p;
  const items = [];
  let probability = q ** n;
  for (let k = 0; k <= n; k += 1) {
    items.push({ x: k, label: String(k), value: probability });
    probability *= ((n - k) / (k + 1)) * (p / q);
  }
  return items;
}

function poissonItems(lambda, maxK) {
  return Array.from({ length: maxK + 1 }, (_, k) => ({
    x: k,
    label: String(k),
    value: poissonProbability(lambda, k),
  }));
}

function distributionProbability(items, lower, upper) {
  return items
    .filter((item) => item.x >= lower && item.x <= upper)
    .reduce((sum, item) => sum + item.value, 0);
}

function binomialProbability(n, p, k) {
  return combination(n, k) * p ** k * (1 - p) ** (n - k);
}

function poissonProbability(lambda, k) {
  let probability = Math.exp(-lambda);
  for (let i = 1; i <= k; i += 1) {
    probability *= lambda / i;
  }
  return probability;
}

function binomialCdf(n, p, x) {
  const maxK = Math.max(0, Math.min(n, Math.floor(x)));
  let total = 0;
  for (let k = 0; k <= maxK; k += 1) {
    total += binomialProbability(n, p, k);
  }
  return total;
}

function normalApproxMass(k, mu, sigma) {
  return normalCdf(k + 0.5, mu, sigma) - normalCdf(k - 0.5, mu, sigma);
}

function approximationGap(n, p, mu, sigma) {
  let total = 0;
  for (let k = 0; k <= n; k += 1) {
    total += Math.abs(binomialProbability(n, p, k) - normalApproxMass(k, mu, sigma));
  }
  return total;
}

function poissonApproximationGap(n, p, lambda) {
  let total = 0;
  binomialItems(n, p).forEach((item) => {
    total += Math.abs(item.value - poissonProbability(lambda, item.x));
  });
  return total;
}

function standardNormalTableAddress(z) {
  const rounded = Math.round(Math.abs(z) * 100) / 100;
  const row = Math.floor(rounded * 10) / 10;
  const column = Math.round((rounded - row) * 100) / 100;
  return {
    z: Math.round(z * 100) / 100,
    absZ: rounded,
    row: row.toFixed(1),
    column: column.toFixed(2),
    phiAbs: normalCdf(rounded, 0, 1),
    phi: normalCdf(z, 0, 1),
  };
}

function distributionMeta(expected, vari) {
  if (state.distribution === "binomial") {
    const { n, p } = state.dist;
    return {
      title: "二項分布",
      type: "離散型: 数えられる値",
      variable: "同じ条件で独立に試行をくり返し、成功回数を \\(X\\) とします。",
      use: "例: 10問中の正解数、部品検査で不良品が出る個数、クリックした人数。",
      expectation: `\\(E(X)=np=${fmt(n)}\\times ${fmt(p, 2)}=${fmt(expected)}\\), \\(V(X)=np(1-p)=${fmt(vari)}\\)`,
      note: "\\(n\\) を大きくすると横に広がり、\\(p\\) を変えると山の位置が動きます。",
    };
  }
  if (state.distribution === "poisson") {
    const { lambda } = state.dist;
    return {
      title: "ポアソン分布",
      type: "離散型: 発生回数",
      variable: "一定の時間・面積・区間で起こる回数を \\(X\\) とします。",
      use: "例: 1時間の問い合わせ件数、1ページの誤字数、一定区間のアクセス数。",
      expectation: `\\(E(X)=V(X)=\\lambda=${fmt(lambda)}\\)`,
      note: "\\(\\lambda\\) が大きくなるほど山は右へ動き、形はだんだん左右対称に近づきます。",
    };
  }
  const { mu, sigma } = state.dist;
  return {
    title: "正規分布",
    type: "連続型: 区間で確率を見る",
    variable: "身長や測定誤差のように、連続的な値をとる量を \\(X\\) とします。",
    use: "例: テスト点、測定誤差、平均付近に集まり両端が少ないデータ。",
    expectation: `\\(E(X)=\\mu=${fmt(mu)}\\), \\(V(X)=\\sigma^2=${fmt(sigma ** 2)}\\)`,
    note: "連続型では一点の確率 \\(P(X=a)\\) ではなく、面積 \\(P(a\\le X\\le b)\\) を考えます。",
  };
}

function renderDistributionNotes(meta) {
  dom.distTypeChip.textContent = meta.type;
  dom.distNotes.innerHTML = [
    `<article class="definition-card"><h4>確率変数</h4><p>${meta.variable}</p></article>`,
    `<article class="definition-card"><h4>使う場面</h4><p>${meta.use}</p></article>`,
    `<article class="definition-card"><h4>期待値と分散</h4><p>${meta.expectation}</p></article>`,
    `<article class="definition-card wide"><h4>授業での見どころ</h4><p>${meta.note}</p></article>`,
  ].join("");
}

function renderDistributionRelationship() {
  const { n, p } = state.dist;
  const lambdaFromBinomial = n * p;
  const rareEventGood = n >= 50 && p <= 0.1;
  dom.distRelationship.innerHTML = [
    `<article class="definition-card">
      <h4>二項分布 \\(B(n,p)\\)</h4>
      <p>回数が決まっている独立な試行で、成功回数を数える分布です。</p>
      <p>式: \\(P(X=k)={}_nC_kp^k(1-p)^{n-k}\\)</p>
      <p>平均と分散: \\(E(X)=np\\), \\(V(X)=np(1-p)\\)</p>
    </article>`,
    `<article class="definition-card">
      <h4>ポアソン分布 \\(\\operatorname{Po}(\\lambda)\\)</h4>
      <p>一定の時間・範囲で、まれに起こる出来事の発生回数を数える分布です。</p>
      <p>式: \\(P(X=k)=\\dfrac{e^{-\\lambda}\\lambda^k}{k!}\\)</p>
      <p>平均と分散: \\(E(X)=V(X)=\\lambda\\)</p>
    </article>`,
    `<article class="definition-card wide">
      <h4>関係性: 二項分布の近似としてのポアソン分布</h4>
      <p>ポアソン近似とは、\\(n\\) が大きく \\(p\\) が小さい二項分布 \\(B(n,p)\\) を、\\(\\lambda=np\\) のポアソン分布で近似することです。</p>
      <p>現在の二項分布では \\(n=${fmt(n, 0)}\\), \\(p=${fmt(p, 3)}\\) なので、比較用の右グラフは自動で \\(\\lambda=np=${fmt(lambdaFromBinomial)}\\) にしています。</p>
      <p>近似の見方: ${rareEventGood ? "\\(n\\) が大きく \\(p\\) が小さいので、ポアソン近似を観察しやすい設定です。" : "\\(n\\) が大きいだけでは不十分です。\\(p\\) が小さい、つまり1回ごとの成功がまれであるほど近似しやすくなります。"}</p>
    </article>`,
  ].join("");
}

function renderDistribution() {
  syncDistributionQueryControls();
  const { n, p, lambda } = state.dist;
  const lambdaFromBinomial = n * p;
  const binomial = binomialItems(n, p);
  const comparisonLambda = lambdaFromBinomial;
  const comparisonMaxK = Math.max(n, 12, Math.ceil(comparisonLambda + 5 * Math.sqrt(Math.max(comparisonLambda, 1e-9))));
  const freeMaxK = Math.max(12, Math.ceil(lambda + 5 * Math.sqrt(Math.max(lambda, 1e-9))), state.dist.upper);
  const poisson = poissonItems(comparisonLambda, comparisonMaxK);
  const freePoisson = poissonItems(lambda, freeMaxK);
  const binomialVariance = n * p * (1 - p);
  const poissonVariance = comparisonLambda;
  const gap = poissonApproximationGap(n, p, comparisonLambda);
  const rareEventGood = n >= 50 && p <= 0.1;
  dom.distGrid.innerHTML = [
    statCard("二項分布の平均 \\(np\\)", fmt(lambdaFromBinomial)),
    statCard("二項分布の分散 \\(np(1-p)\\)", fmt(binomialVariance)),
    statCard("右グラフの平均 \\(\\lambda=np\\)", fmt(comparisonLambda)),
    statCard("右グラフの分散 \\(\\lambda\\)", fmt(poissonVariance)),
    statCard("比較する範囲", `${fmt(Math.min(state.dist.lower, state.dist.upper), 0)} から ${fmt(Math.max(state.dist.lower, state.dist.upper), 0)}`),
    statCard("2つの分布の差", fmt(gap, 4)),
  ].join("");
  dom.binomialFormula.innerHTML = "\\[P(X=k) = {}_nC_k p^k(1-p)^{n-k}\\]";
  dom.poissonFormula.innerHTML = "\\[P(Y=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}\\]";
  dom.distChip.textContent = `\\(np=${fmt(lambdaFromBinomial)}\\)`;
  dom.poissonChip.innerHTML = `\\(\\operatorname{Po}(np)=\\operatorname{Po}(${fmt(comparisonLambda)})\\)`;
  dom.freePoissonChip.innerHTML = `\\(\\operatorname{Po}(${fmt(lambda)})\\)`;
  const lower = Math.min(state.dist.lower, state.dist.upper);
  const upper = Math.max(state.dist.lower, state.dist.upper);
  const binomialProbabilityInRange = distributionProbability(binomial, lower, upper);
  const poissonProbabilityInRange = distributionProbability(poisson, lower, upper);
  const freePoissonProbabilityInRange = distributionProbability(freePoisson, lower, upper);
  dom.binomialProbability.innerHTML = `左の二項分布: \\[P(${fmt(lower, 0)}\\le X\\le ${fmt(upper, 0)})=${fmt(binomialProbabilityInRange, 4)}\\]`;
  dom.poissonProbability.innerHTML = `右のポアソン近似: \\[P(${fmt(lower, 0)}\\le Y\\le ${fmt(upper, 0)})=${fmt(poissonProbabilityInRange, 4)}\\]`;
  dom.freePoissonFormula.innerHTML = "\\[P(Z=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!},\\quad E(Z)=V(Z)=\\lambda\\]";
  dom.freePoissonProbability.innerHTML = `単体のポアソン分布: \\[P(${fmt(lower, 0)}\\le Z\\le ${fmt(upper, 0)})=${fmt(freePoissonProbabilityInRange, 4)}\\]`;
  renderDistributionRelationship();
  renderDistributionNotes({
    type: rareEventGood ? "近似しやすい設定" : "nを大きく、pを小さくすると近づく",
    variable: "左は成功回数 \\(X\\sim B(n,p)\\)、右は比較用の \\(Y\\sim\\operatorname{Po}(np)\\) です。下の単体表示では別の \\(\\lambda\\) を自由に指定できます。",
    use: "\\(\\lambda=np\\) にすると、二項分布の「たくさん試すが成功はまれ」という状況をポアソン分布で近似できます。",
    expectation: `比較用では二項分布の平均 \\(np\\) とポアソン分布の平均 \\(\\lambda\\) がどちらも \\(${fmt(lambdaFromBinomial)}\\) になります。`,
    note: `現在の差は ${fmt(gap, 4)} です。\\(n\\) が大きいだけではなく、\\(p\\) が小さいことが重要です。`,
  });
  const maxValue = Math.max(...binomial.map((item) => item.value), ...poisson.map((item) => item.value));
  drawBars(dom.binomialCanvas, binomial, {
    ylabel: "確率",
    highlightMin: lower,
    highlightMax: upper,
    maxValue,
  });
  drawBars(dom.poissonCanvas, poisson, {
    ylabel: "確率",
    highlightMin: lower,
    highlightMax: upper,
    maxValue,
  });
  drawBars(dom.freePoissonCanvas, freePoisson, {
    ylabel: "確率",
    highlightMin: lower,
    highlightMax: upper,
  });
  typesetMath();
}

function renderApproximation() {
  const n = Number(dom.approxN.value);
  const p = Number(dom.approxP.value);
  const currentX = Number(state.approx.x ?? dom.approxX.value);
  const x = Math.max(0, Math.min(n, Math.round(currentX)));
  state.approx = { ...state.approx, n, p, x, continuity: dom.continuity.checked };
  const mu = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));
  const gap = approximationGap(n, p, mu, sigma);
  const poissonGap = poissonApproximationGap(n, p, mu);
  const approxGood = n * p >= 5 && n * (1 - p) >= 5;
  const poissonGood = n >= 20 && p <= 0.1;
  dom.approxNValue.textContent = n;
  dom.approxPValue.textContent = fmt(p, 2);
  dom.approxX.min = 0;
  dom.approxX.max = n;
  dom.approxX.step = 1;
  dom.approxX.value = x;
  dom.approxXValue.textContent = x;
  dom.approxGrid.innerHTML = [
    statCard("二項分布の平均 \\(np\\)", fmt(mu)),
    statCard("二項分布の分散 \\(np(1-p)\\)", fmt(sigma ** 2)),
    statCard("近似する正規分布", `\\(N(${fmt(mu)}, ${fmt(sigma ** 2)})\\)`),
    statCard("正規近似との差", fmt(gap, 4)),
    statCard("ポアソン近似との差", fmt(poissonGap, 4)),
    statCard("\\(np\\)", fmt(n * p, 1)),
    statCard("\\(n(1-p)\\)", fmt(n * (1 - p), 1)),
    statCard("近似条件", approxGood ? "おおむね良い" : "注意が必要"),
    statCard("読む値", `\\(P(X\\le ${x})\\)`),
  ].join("");
  dom.approxChip.innerHTML = `\\(np=${fmt(n * p, 1)}\\), \\(n(1-p)=${fmt(n * (1 - p), 1)}\\)`;
  renderApproximationRelationship(n, p, mu, sigma, gap, poissonGap, approxGood, poissonGood);
  renderApproximationLegend(n, p, mu, gap, poissonGap, poissonGood);
  renderNormalTableResult(n, p, x, mu, sigma);
  renderStandardizationPanel();
  drawApproximation(n, p, mu, sigma);
  typesetMath();
}

function renderStandardizationPanel() {
  if (!dom.standardMu.value) dom.standardMu.value = fmt(state.approx.standardMu, 1);
  if (!dom.standardSigma.value) dom.standardSigma.value = fmt(state.approx.standardSigma, 1);
  if (!dom.standardLower.value) dom.standardLower.value = fmt(state.approx.standardLower, 1);
  if (!dom.standardUpper.value) dom.standardUpper.value = fmt(state.approx.standardUpper, 1);
  let mu = Number(dom.standardMu.value);
  let sigma = Number(dom.standardSigma.value);
  let lower = Number(dom.standardLower.value);
  let upper = Number(dom.standardUpper.value);
  if (!Number.isFinite(mu)) mu = 0;
  if (!Number.isFinite(sigma) || sigma <= 0) sigma = 1;
  if (!Number.isFinite(lower)) lower = mu - sigma;
  if (!Number.isFinite(upper)) upper = mu + sigma;
  if (lower > upper) [lower, upper] = [upper, lower];
  state.approx.standardMu = mu;
  state.approx.standardSigma = sigma;
  state.approx.standardLower = lower;
  state.approx.standardUpper = upper;
  dom.standardMuValue.textContent = `平均=${fmt(mu, 2)}`;
  dom.standardVarianceValue.textContent = `分散=${fmt(sigma ** 2, 2)}`;
  const zLower = (lower - mu) / sigma;
  const zUpper = (upper - mu) / sigma;
  const probability = normalCdf(upper, mu, sigma) - normalCdf(lower, mu, sigma);
  dom.standardLowerZ.textContent = `z=${fmt(zLower, 3)}`;
  dom.standardUpperZ.textContent = `z=${fmt(zUpper, 3)}`;
  dom.standardResult.innerHTML = `
    <p>上のグラフは、ここで設定した元の分布 \\(X\\sim N(\\mu,\\sigma^2)\\) です。現在は \\(\\mu=${fmt(mu, 2)}\\), \\(\\sigma=${fmt(sigma, 2)}\\), \\(\\sigma^2=${fmt(sigma ** 2, 2)}\\) です。</p>
    <p>\\(a\\) は元の範囲の下限、\\(b\\) は元の範囲の上限です。</p>
    <p>標準化は \\(z=\\dfrac{x-\\mu}{\\sigma}\\) です。</p>
    <p>元の範囲 \\(${fmt(lower, 1)}\\le X\\le ${fmt(upper, 1)}\\) は、標準化後に \\(${fmt(zLower, 3)}\\le Z\\le ${fmt(zUpper, 3)}\\) へ移ります。</p>
    <p>\\[P(${fmt(lower, 1)}\\le X\\le ${fmt(upper, 1)})=P(${fmt(zLower, 3)}\\le Z\\le ${fmt(zUpper, 3)})=${fmt(probability, 4)}\\]</p>
  `;
  drawNormalRange(dom.originalNormalCanvas, mu, sigma, lower, upper, "X");
  drawNormalRange(dom.standardNormalCanvas, 0, 1, zLower, zUpper, "Z");
}

function drawNormalRange(canvas, mu, sigma, lower, upper, label) {
  const { ctx, width, height } = clearCanvas(canvas);
  const padding = 42;
  drawFrame(ctx, width, height, padding);
  const min = mu - 4 * sigma;
  const max = mu + 4 * sigma;
  const yMax = normalPdf(mu, mu, sigma);
  const xAt = (value) => padding + ((value - min) / (max - min)) * (width - padding * 2);
  const yAt = (value) => height - padding - (normalPdf(value, mu, sigma) / yMax) * (height - padding * 2);

  ctx.fillStyle = "rgba(19, 125, 125, 0.22)";
  ctx.beginPath();
  ctx.moveTo(xAt(lower), height - padding);
  const shadeSteps = 120;
  for (let i = 0; i <= shadeSteps; i += 1) {
    const value = lower + ((upper - lower) * i) / shadeSteps;
    ctx.lineTo(xAt(value), yAt(value));
  }
  ctx.lineTo(xAt(upper), height - padding);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#137d7d";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const value = min + ((max - min) * i) / 240;
    const x = xAt(value);
    const y = yAt(value);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#c13d37";
  ctx.setLineDash([5, 5]);
  [lower, upper].forEach((value) => {
    const x = xAt(value);
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.fillStyle = "#607080";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(`${label}: ${fmt(lower, 2)} から ${fmt(upper, 2)}`, padding + 4, padding - 16);
  [min, mu, max].forEach((value) => {
    ctx.fillText(fmt(value, 1), xAt(value) - 12, height - padding + 18);
  });
}

function renderApproximationRelationship(n, p, mu, sigma, gap, poissonGap, approxGood, poissonGood) {
  dom.approxRelationship.innerHTML = [
    `<article class="definition-card">
      <h4>二項分布 \\(B(n,p)\\)</h4>
      <p>成功回数を数える離散分布です。</p>
      <p>平均: \\(E(X)=np=${fmt(mu)}\\)</p>
      <p>分散: \\(V(X)=np(1-p)=${fmt(sigma ** 2)}\\)</p>
    </article>`,
    `<article class="definition-card">
      <h4>ポアソン分布 \\(\\operatorname{Po}(\\lambda)\\)</h4>
      <p>まれな発生回数を数える離散分布です。</p>
      <p>平均: \\(E(X)=\\lambda=${fmt(mu)}\\)</p>
      <p>分散: \\(V(X)=\\lambda=${fmt(mu)}\\)</p>
    </article>`,
    `<article class="definition-card">
      <h4>正規分布 \\(N(\\mu,\\sigma^2)\\)</h4>
      <p>平均のまわりに左右対称に集まる連続分布です。</p>
      <p>平均: \\(E(X)=\\mu=${fmt(mu)}\\)</p>
      <p>分散: \\(V(X)=\\sigma^2=${fmt(sigma ** 2)}\\)</p>
    </article>`,
    `<article class="definition-card wide">
      <h4>関係性: 二項分布から正規分布へ</h4>
      <p>\\(n\\) が大きく、\\(np\\) と \\(n(1-p)\\) が十分大きいとき、\\(B(n,p)\\) は \\(N(np,np(1-p))\\) で近似できます。</p>
      <p>現在は \\(np=${fmt(n * p, 1)}\\), \\(n(1-p)=${fmt(n * (1 - p), 1)}\\) なので、${approxGood ? "近似しやすい条件です。" : "まだ近似には注意が必要です。"}</p>
      <p>正規近似との差は ${fmt(gap, 4)} です。\\(n\\) を大きくし、\\(p\\) が極端でない状態にすると、この値が小さくなりやすくなります。</p>
      <p>ポアソン近似との差は ${fmt(poissonGap, 4)} です。${poissonGood ? "\\(n\\) が大きく \\(p\\) が小さいので、まれな事象の近似として見比べやすい設定です。" : "ポアソン近似は、典型的には \\(n\\) を大きく、\\(p\\) を小さくしたときに見比べやすくなります。"}</p>
    </article>`,
  ].join("");
}

function renderApproximationLegend(n, p, lambda, normalGap, poissonGap, poissonGood) {
  dom.approxLegend.innerHTML = `
    <p><strong style="color:#137d7d;">緑</strong>: 二項分布 \\(B(n,p)\\) の確率を棒で表しています。</p>
    <p><strong style="color:#c13d37;">朱</strong>: 同じ平均・分散をもつ正規分布 \\(N(np,np(1-p))\\) の曲線です。</p>
    <p><strong style="color:#2f6ed3;">青</strong>: \\(\\lambda=np=${fmt(lambda)}\\) としたポアソン分布 \\(\\operatorname{Po}(\\lambda)\\) の近似です。</p>
    <p>現在は \\(n=${fmt(n, 0)}\\), \\(p=${fmt(p, 2)}\\) です。正規近似との差は ${fmt(normalGap, 4)}、ポアソン近似との差は ${fmt(poissonGap, 4)} です。</p>
    <p>${poissonGood ? "ポアソン近似は比較しやすい設定です。" : "ポアソン近似を見たいときは、\\(n\\) を大きく、\\(p\\) を小さくしてください。例: \\(n=100\\), \\(p=0.05\\)。"}</p>
  `;
}

function renderNormalTableResult(n, p, x, mu, sigma) {
  const correctedX = state.approx.continuity ? x + 0.5 : x;
  const z = (correctedX - mu) / sigma;
  const table = standardNormalTableAddress(z);
  const exact = binomialCdf(n, p, x);
  const approx = normalCdf(correctedX, mu, sigma);
  const correctionText = state.approx.continuity ? `${x}+0.5` : `${x}`;
  const tableText =
    table.z >= 0
      ? `標準正規分布表では、行 ${table.row}・列 ${table.column} を読み、\\(\\Phi(${fmt(table.absZ, 2)})=${fmt(table.phiAbs, 4)}\\) とします。`
      : `標準正規分布表では正の値を読み、\\(\\Phi(-${fmt(table.absZ, 2)})=1-\\Phi(${fmt(table.absZ, 2)})=${fmt(table.phi, 4)}\\) とします。`;
  dom.normalTableResult.innerHTML = `
    <p>標準化: \\(Z=\\dfrac{X-\\mu}{\\sigma}\\)</p>
    <p>\\(P(X\\le ${x})\\) を読むとき、${state.approx.continuity ? "連続性補正を使って" : "連続性補正なしで"} \\(X=${correctionText}\\) とみなします。</p>
    <p>\\[z=\\dfrac{${fmt(correctedX, 1)}-${fmt(mu)}}{${fmt(sigma)}}=${fmt(z, 3)}\\]</p>
    <p>${tableText}</p>
    <p>厳密な二項分布: \\(P(X\\le ${x})=${fmt(exact, 4)}\\)</p>
    <p>正規近似: \\(P(X\\le ${x})\\approx ${fmt(approx, 4)}\\)</p>
  `;
}

function drawApproximation(n, p, mu, sigma) {
  const { ctx, width, height } = clearCanvas(dom.approxCanvas);
  const padding = 46;
  drawFrame(ctx, width, height, padding);
  const probs = Array.from({ length: n + 1 }, (_, k) => combination(n, k) * p ** k * (1 - p) ** (n - k));
  const normalHeights = probs.map((_, k) => normalPdf(k, mu, sigma));
  const poissonHeights = probs.map((_, k) => poissonProbability(mu, k));
  const max = Math.max(...probs, ...normalHeights, ...poissonHeights);
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

  ctx.strokeStyle = "#2f6ed3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let startedPoisson = false;
  probs.forEach((_, k) => {
    if (k % visibleStep !== 0 && n > 60) return;
    const x = padding + (k / n) * (width - padding * 2);
    const y = height - padding - (poissonProbability(mu, k) / max) * (height - padding * 2);
    if (!startedPoisson) {
      ctx.moveTo(x, y);
      startedPoisson = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
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
  ctx.fillStyle = "#2f6ed3";
  ctx.fillText("青線: ポアソン近似", padding + 220, padding - 16);
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
  [dom.affineA, dom.affineB].forEach((input) => input.addEventListener("input", renderStats));
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
  dom.addPoint.addEventListener("click", addEditablePoint);
  dom.resetPoints.addEventListener("click", () => createPoints("positive"));
  dom.pointTable.addEventListener("input", (event) => {
    const input = event.target.closest(".point-input");
    if (!input) return;
    updatePointFromInput(input, false);
    clearTimeout(state.pointEditTimer);
    state.pointEditTimer = setTimeout(renderCorrelation, 250);
  });
  dom.pointTable.addEventListener("change", (event) => {
    const input = event.target.closest(".point-input");
    if (!input) return;
    clearTimeout(state.pointEditTimer);
    updatePointFromInput(input);
  });
  dom.pointTable.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-point");
    if (!button) return;
    deleteEditablePoint(Number(button.dataset.index));
  });

  [dom.population, dom.prevalence, dom.sensitivity, dom.specificity].forEach((input) => input.addEventListener("input", renderBayes));
  dom.bayesPresetButtons.forEach((button) => {
    button.addEventListener("click", () => applyBayesPreset(button.dataset.preset));
  });

  $$(".segment[data-dist]").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".segment[data-dist]").forEach((item) => item.classList.toggle("active", item === button));
      state.distribution = button.dataset.dist;
      Object.assign(state.dist, defaultDistributionRange());
      renderDistributionControls();
      renderDistribution();
    });
  });
  [dom.distLower, dom.distUpper].forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.id.replace("dist-", "");
      state.dist[key] = Number(input.value);
      renderDistribution();
    });
  });

  [dom.approxN, dom.approxP].forEach((input) => {
    input.addEventListener("input", () => {
      state.approx.x = Math.round(Number(dom.approxN.value) * Number(dom.approxP.value));
      renderApproximation();
    });
  });
  dom.approxX.addEventListener("input", () => {
    state.approx.x = Number(dom.approxX.value);
    renderApproximation();
  });
  [dom.standardMu, dom.standardSigma, dom.standardLower, dom.standardUpper].forEach((input) => {
    input.addEventListener("input", renderApproximation);
  });
  dom.continuity.addEventListener("input", renderApproximation);
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
  renderFreePoissonControls();
  bindEvents();
  renderAll();
  typesetMath();
}

init();
