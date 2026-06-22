const signals = {
  impulse: {
    label: "離散時間単位インパルス δ[n]",
    formula: () => String.raw`X(z)=1`,
    roc: () => String.raw`\mathrm{ROC}: \text{全 } z \text{ 平面}`,
    summary: "n = 0 だけ 1",
    sequence: (n) => (n === 0 ? 1 : 0),
    poles: [],
    zeros: [],
    insights: () => [
      String.raw`極がないので、有限長列として扱えます。`,
      String.raw`インパルス応答が \(\delta[n]\) のシステムは恒等システムです。`,
      String.raw`全ての周波数成分を同じ重みで含む基準信号として使えます。`,
    ],
  },
  step: {
    label: "離散時間単位ステップ u[n]",
    formula: () => String.raw`X(z)=\frac{z}{z-1}=\frac{1}{1-z^{-1}}`,
    roc: () => String.raw`\mathrm{ROC}: |z|>1`,
    summary: "右側列",
    sequence: (n) => (n >= 0 ? 1 : 0),
    poles: [{ re: 1, im: 0 }],
    zeros: [{ re: 0, im: 0 }],
    insights: () => [
      String.raw`極は \(z=1\) にあります。`,
      String.raw`ROCが \(|z|>1\) なので右側列、つまり因果的な列として読めます。`,
      String.raw`極が単位円上にあるため、和 \(\sum_n |u[n]|\) は収束せずBIBO安定なインパルス応答ではありません。`,
    ],
  },
  geometric: {
    label: "等比数列 x[n] = a^n u[n]",
    formula: (state) => String.raw`X(z)=\frac{z}{z-${formatNumber(state.a)}}=\frac{1}{1-${formatNumber(state.a)}z^{-1}}`,
    roc: (state) => String.raw`\mathrm{ROC}: |z|>${formatNumber(Math.abs(state.a))}`,
    summary: (state) => `極 z = ${formatNumber(state.a)}`,
    sequence: (n, state) => (n >= 0 ? state.a ** n : 0),
    poles: (state) => [{ re: state.a, im: 0 }],
    zeros: [{ re: 0, im: 0 }],
    insights: (state) => [
      String.raw`極は \(z=${formatNumber(state.a)}\) にあります。`,
      Math.abs(state.a) < 1
        ? String.raw`\(|a|<1\) なので時間列は減衰します。`
        : String.raw`\(|a|\ge 1\) なので時間列は減衰せず、安定なインパルス応答にはなりません。`,
      Math.abs(state.a) < 1
        ? String.raw`極が単位円の内側にあるため、因果IIRの基本的な安定例です。`
        : String.raw`極が単位円上または外側にあるため、因果IIRとしては不安定側の例です。`,
    ],
  },
  ramp: {
    label: "一次列 x[n] = n u[n]",
    formula: () => String.raw`X(z)=\frac{z}{(z-1)^2}`,
    roc: () => String.raw`\mathrm{ROC}: |z|>1`,
    summary: "z = 1 に2重極",
    sequence: (n) => (n >= 0 ? n : 0),
    poles: [
      { re: 1, im: 0 },
      { re: 1, im: 0, offset: 1 },
    ],
    zeros: [{ re: 0, im: 0 }],
    insights: () => [
      String.raw`\(z=1\) に2重極があるため、単位ステップより強く発散する列です。`,
      String.raw`ROCは外側なので右側列ですが、単位円上に極があるため絶対総和可能ではありません。`,
      String.raw`極の重複度は、時間領域で多項式的な増加 \(n\) と対応します。`,
    ],
  },
  cosine: {
    label: "余弦列 x[n] = cos(nωT)u[n]",
    formula: (state) =>
      String.raw`X(z)=\frac{z(z-\cos ${formatNumber(state.omega)})}{z^2-2z\cos ${formatNumber(state.omega)}+1}`,
    roc: () => String.raw`\mathrm{ROC}: |z|>1`,
    summary: (state) => `極 z = e^±j${formatNumber(state.omega)}`,
    sequence: (n, state) => (n >= 0 ? Math.cos(n * state.omega) : 0),
    poles: (state) => [
      { re: Math.cos(state.omega), im: Math.sin(state.omega) },
      { re: Math.cos(state.omega), im: -Math.sin(state.omega) },
    ],
    zeros: (state) => [{ re: Math.cos(state.omega), im: 0 }],
    insights: (state) => [
      String.raw`極は \(z=e^{\pm j${formatNumber(state.omega)}}\) にあり、角度が周波数を表します。`,
      String.raw`極が単位円上にあるので、振幅は減衰せず振動が続きます。`,
      String.raw`この段階では、極の角度が振動の速さ、極の半径が減衰の有無に対応すると読むのが重要です。`,
    ],
  },
};

const properties = [
  {
    title: "線形性",
    formula: String.raw`a x_1[n]+b x_2[n]\ \longleftrightarrow\ aX_1(z)+bX_2(z)`,
    note: "複数の信号を足した結果は、z領域でも同じ係数で足せます。",
  },
  {
    title: "推移",
    formula: String.raw`x[n-k]\ \longleftrightarrow\ z^{-k}X(z)`,
    note: "時間方向にkだけ遅らせると、z領域では z^-k が掛かります。",
  },
  {
    title: "a^nによる乗算",
    formula: String.raw`a^n x[n]\ \longleftrightarrow\ X\left(\frac{z}{a}\right)`,
    note: "時間列に指数を掛けると、z平面上ではスケール変換になります。",
  },
  {
    title: "微分",
    formula: String.raw`n x[n]\ \longleftrightarrow\ -z\frac{dX(z)}{dz}`,
    note: "n倍された列は、z領域での微分と対応します。",
  },
  {
    title: "畳み込み",
    formula: String.raw`x[n]*h[n]\ \longleftrightarrow\ X(z)H(z)`,
    note: "離散時間システムでは、入力とインパルス応答の畳み込みがz領域で積になります。",
  },
  {
    title: "初期値定理",
    formula: String.raw`x[0]=\lim_{z\to\infty}X(z)`,
    note: "右側列で極限が存在する場合、最初の値をz領域から読めます。",
  },
  {
    title: "最終値定理",
    formula: String.raw`\lim_{n\to\infty}x[n]=\lim_{z\to 1}(z-1)X(z)`,
    note: "安定性などの条件が必要です。無条件に使える公式ではありません。",
  },
];

const inverseExamples = {
  rational: {
    title: String.raw`X(z)=\frac{7z^2-10z}{z^2-3z+2}`,
    body: [
      String.raw`分母は \((z-1)(z-2)\) に因数分解できます。`,
      String.raw`部分分数分解すると、\(X(z)=-3\frac{z}{z-1}+10\frac{z}{z-2}\) です。`,
      String.raw`右側列のROCを仮定すると、\(x[n]=-3\cdot 1^n u[n]+10\cdot 2^n u[n]\) です。`,
    ],
    tags: ["部分分数分解", "ROCが必要", "右側列の例"],
  },
  fir: {
    title: String.raw`H(z)=1-z^{-1}+2z^{-2}-3z^{-3}+4z^{-4}`,
    body: [
      String.raw`\(z^{-k}\) の係数が、そのまま \(h[k]\) に対応します。`,
      String.raw`\(h[0]=1,\ h[1]=-1,\ h[2]=2,\ h[3]=-3,\ h[4]=4\)`,
      "有限長のインパルス応答なので、FIRフィルタとして扱えます。",
    ],
    tags: ["べき級数", "FIR", "フィルタ章への接続"],
  },
};

const state = {
  signal: "geometric",
  a: 0.6,
  omega: 0.75,
  sampleCount: 22,
  r: 0.55,
  inverse: "rational",
};

const dom = {
  navLinks: [...document.querySelectorAll(".nav-button")],
  signalSelect: document.querySelector("#signal-select"),
  aSlider: document.querySelector("#a-slider"),
  aValue: document.querySelector("#a-value"),
  omegaSlider: document.querySelector("#omega-slider"),
  omegaValue: document.querySelector("#omega-value"),
  sampleSlider: document.querySelector("#sample-slider"),
  sampleValue: document.querySelector("#sample-value"),
  formula: document.querySelector("#formula"),
  roc: document.querySelector("#roc"),
  insightList: document.querySelector("#insight-list"),
  signalSummary: document.querySelector("#signal-summary"),
  sequenceCanvas: document.querySelector("#sequence-canvas"),
  zplaneCanvas: document.querySelector("#zplane-canvas"),
  propertyList: document.querySelector("#property-list"),
  inverseContent: document.querySelector("#inverse-content"),
  rSlider: document.querySelector("#r-slider"),
  rValue: document.querySelector("#r-value"),
  impulseCanvas: document.querySelector("#impulse-canvas"),
  stabilityMessage: document.querySelector("#stability-message"),
  systemChip: document.querySelector("#system-chip"),
  feedbackForm: document.querySelector("#feedback-form"),
  feedbackKind: document.querySelector("#feedback-kind"),
  feedbackName: document.querySelector("#feedback-name"),
  feedbackMessage: document.querySelector("#feedback-message"),
  feedbackStatus: document.querySelector("#feedback-status"),
};

const feedbackRecipient = "miyazaki@tokuyama.ac.jp";

function formatNumber(value) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : rounded.toFixed(2).replace(/\.?0+$/, "");
}

function getDynamic(value) {
  return typeof value === "function" ? value(state) : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readGroup(source, startIndex) {
  if (source[startIndex] !== "{") return null;
  let depth = 0;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return {
        value: source.slice(startIndex + 1, index),
        end: index + 1,
      };
    }
  }
  return null;
}

function readScript(source, startIndex) {
  if (source[startIndex] === "{") return readGroup(source, startIndex);
  return {
    value: source[startIndex] ?? "",
    end: startIndex + 1,
  };
}

function renderLatex(tex) {
  let html = "";

  for (let index = 0; index < tex.length; index += 1) {
    if (tex.startsWith("\\frac", index) || tex.startsWith("\\dfrac", index)) {
      const commandLength = tex.startsWith("\\dfrac", index) ? 6 : 5;
      const numerator = readGroup(tex, index + commandLength);
      const denominator = numerator ? readGroup(tex, numerator.end) : null;
      if (numerator && denominator) {
        html += `<span class="latex-frac"><span>${renderLatex(numerator.value)}</span><span>${renderLatex(denominator.value)}</span></span>`;
        index = denominator.end - 1;
        continue;
      }
    }

    if (tex.startsWith("\\mathrm", index) || tex.startsWith("\\text", index)) {
      const commandLength = tex.startsWith("\\mathrm", index) ? 7 : 5;
      const group = readGroup(tex, index + commandLength);
      if (group) {
        html += `<span class="latex-roman">${escapeHtml(group.value)}</span>`;
        index = group.end - 1;
        continue;
      }
    }

    if (tex[index] === "^" || tex[index] === "_") {
      const script = readScript(tex, index + 1);
      const tag = tex[index] === "^" ? "sup" : "sub";
      html += `<${tag}>${renderLatex(script.value)}</${tag}>`;
      index = script.end - 1;
      continue;
    }

    const commandMap = {
      "\\cdot": "・",
      "\\cos": "cos",
      "\\delta": "δ",
      "\\ge": "≥",
      "\\infty": "∞",
      "\\le": "≤",
      "\\lim": "lim",
      "\\longleftrightarrow": "⟷",
      "\\pm": "±",
      "\\sum": "Σ",
      "\\to": "→",
    };

    const command = Object.keys(commandMap).find((key) => tex.startsWith(key, index));
    if (command) {
      html += `<span class="latex-operator">${commandMap[command]}</span>`;
      index += command.length - 1;
      continue;
    }

    if (tex.startsWith("\\left", index) || tex.startsWith("\\right", index)) {
      index += 4;
      continue;
    }

    if (tex[index] === "\\") continue;
    html += escapeHtml(tex[index]);
  }

  return html;
}

function renderTextWithMath(text) {
  const parts = String(text).split(/(\\\(.*?\\\))/g);
  return parts
    .map((part) => {
      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        return inlineMath(part.slice(2, -2));
      }
      return escapeHtml(part);
    })
    .join("");
}

function displayMath(tex) {
  return `<div class="math-display">${renderLatex(tex)}</div>`;
}

function inlineMath(tex) {
  return `<span class="math-inline">${renderLatex(tex)}</span>`;
}

function renderStaticLatex() {
  document.querySelectorAll(".latex-static").forEach((item) => {
    item.innerHTML = inlineMath(item.dataset.tex || "");
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

function drawAxes(ctx, width, height, padding, yZero, xZero) {
  ctx.strokeStyle = "#d4dde5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, yZero);
  ctx.lineTo(width - padding, yZero);
  ctx.moveTo(xZero, padding);
  ctx.lineTo(xZero, height - padding);
  ctx.stroke();
}

function drawSequence(canvas, samples, options = {}) {
  const { ctx, width, height } = resizeCanvas(canvas);
  const padding = 34;
  const maxAbs = Math.max(1, ...samples.map((item) => Math.abs(item.value)));
  const minN = Math.min(...samples.map((item) => item.n));
  const maxN = Math.max(...samples.map((item) => item.n));
  const xScale = (width - padding * 2) / Math.max(1, maxN - minN);
  const yScale = (height - padding * 2) / (maxAbs * 2);
  const yZero = height / 2;
  const xAt = (n) => padding + (n - minN) * xScale;
  const yAt = (v) => yZero - v * yScale;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding, yZero, xAt(0));

  ctx.fillStyle = "#637282";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("n", width - padding + 10, yZero + 4);
  ctx.fillText(options.label || "x[n]", xAt(0) + 8, padding - 12);

  ctx.strokeStyle = "#158a8a";
  ctx.fillStyle = "#158a8a";
  ctx.lineWidth = 2;

  samples.forEach(({ n, value }) => {
    const x = xAt(n);
    const y = yAt(value);
    ctx.beginPath();
    ctx.moveTo(x, yZero);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#637282";
  [minN, 0, maxN].forEach((n) => {
    if (n < minN || n > maxN) return;
    ctx.fillText(String(n), xAt(n) - 4, yZero + 18);
  });
}

function drawZPlane() {
  const selected = signals[state.signal];
  const poles = getDynamic(selected.poles) || [];
  const zeros = getDynamic(selected.zeros) || [];
  const { ctx, width, height } = resizeCanvas(dom.zplaneCanvas);
  const padding = 42;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 3.6;
  const toX = (re) => centerX + re * scale;
  const toY = (im) => centerY - im * scale;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding, centerY, centerX);

  ctx.strokeStyle = "#9fb1bf";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#637282";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("Re", width - padding + 8, centerY + 4);
  ctx.fillText("Im", centerX + 8, padding - 14);
  ctx.fillText("単位円", centerX + scale - 16, centerY - 8);

  if (selected.roc) {
    const radius = state.signal === "geometric" ? Math.abs(state.a) * scale : state.signal === "impulse" ? 0 : scale;
    if (radius > 0) {
      ctx.strokeStyle = "rgba(47, 114, 214, 0.32)";
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  zeros.forEach((zero) => {
    const x = toX(zero.re);
    const y = toY(zero.im);
    ctx.strokeStyle = "#2f72d6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  });

  poles.forEach((pole) => {
    const jitter = pole.offset ? pole.offset * 8 : 0;
    const x = toX(pole.re) + jitter;
    const y = toY(pole.im) - jitter;
    ctx.strokeStyle = "#c2413d";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x - 8, y + 8);
    ctx.stroke();
  });
}

function makeSamples(signalKey, count) {
  const selected = signals[signalKey];
  return Array.from({ length: count }, (_, n) => ({
    n,
    value: selected.sequence(n, state),
  }));
}

function renderProperties() {
  dom.propertyList.innerHTML = properties
    .map(
      (item) => `
        <article class="property-card">
          <h4>${item.title}</h4>
          <div class="property-formula">${displayMath(item.formula)}</div>
          <p>${item.note}</p>
        </article>
      `
    )
    .join("");
}

function renderInverse() {
  const item = inverseExamples[state.inverse];
  dom.inverseContent.innerHTML = `
    <div class="inverse-main">
      <div class="inverse-title">${displayMath(item.title)}</div>
      ${item.body.map((line) => `<p>${renderTextWithMath(line)}</p>`).join("")}
    </div>
    <div class="tag-list">
      ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
  `;
}

function renderSystem() {
  const count = state.sampleCount;
  const samples = Array.from({ length: count }, (_, n) => ({
    n,
    value: n >= 0 ? state.r ** n : 0,
  }));
  drawSequence(dom.impulseCanvas, samples, { label: "h[n]" });

  const stable = Math.abs(state.r) < 1;
  dom.stabilityMessage.innerHTML = stable
    ? `${inlineMath(`|r|=${formatNumber(Math.abs(state.r))}<1`)} なので、この1次IIRはBIBO安定です。`
    : `${inlineMath(`|r|=${formatNumber(Math.abs(state.r))}\\ge 1`)} なので、インパルス応答が十分に減衰せず不安定です。`;
  dom.stabilityMessage.className = `stability-message ${stable ? "stable" : "unstable"}`;
  dom.systemChip.textContent = stable ? "安定" : "不安定";
}

function render() {
  const selected = signals[state.signal];
  dom.aValue.textContent = formatNumber(state.a);
  dom.omegaValue.textContent = formatNumber(state.omega);
  dom.sampleValue.textContent = String(state.sampleCount);
  dom.rValue.textContent = formatNumber(state.r);
  dom.formula.innerHTML = displayMath(getDynamic(selected.formula));
  dom.roc.innerHTML = inlineMath(getDynamic(selected.roc));
  dom.signalSummary.textContent = getDynamic(selected.summary);
  dom.insightList.innerHTML = getDynamic(selected.insights).map((item) => `<li>${renderTextWithMath(item)}</li>`).join("");

  drawSequence(dom.sequenceCanvas, makeSamples(state.signal, state.sampleCount), { label: "x[n]" });
  drawZPlane();
  renderSystem();
}

function updateActiveNav() {
  const hash = window.location.hash || "#overview";
  dom.navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}

function buildFeedbackMailto() {
  const kind = dom.feedbackKind.value;
  const name = dom.feedbackName.value.trim() || "未記入";
  const message = dom.feedbackMessage.value.trim();
  const signal = signals[state.signal]?.label ?? state.signal;
  const section = window.location.hash || "#overview";
  const pageUrl = window.location.href;
  const subject = `[DSP Lab] ${kind}`;
  const body = [
    "DSP Labへのフィードバックです。",
    "",
    `種類: ${kind}`,
    `名前・クラスなど: ${name}`,
    `ページ位置: ${section}`,
    `現在のz変換モジュールの信号: ${signal}`,
    `URL: ${pageUrl}`,
    "",
    "内容:",
    message,
  ].join("\n");

  return `mailto:${feedbackRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function bindEvents() {
  dom.signalSelect.addEventListener("change", (event) => {
    state.signal = event.target.value;
    render();
  });

  dom.aSlider.addEventListener("input", (event) => {
    state.a = Number(event.target.value);
    render();
  });

  dom.omegaSlider.addEventListener("input", (event) => {
    state.omega = Number(event.target.value);
    render();
  });

  dom.sampleSlider.addEventListener("input", (event) => {
    state.sampleCount = Number(event.target.value);
    render();
  });

  dom.rSlider.addEventListener("input", (event) => {
    state.r = Number(event.target.value);
    render();
  });

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      state.inverse = button.dataset.inverse;
      document.querySelectorAll(".segment").forEach((item) => item.classList.toggle("active", item === button));
      renderInverse();
    });
  });

  dom.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      dom.navLinks.forEach((item) => item.classList.toggle("active", item === link));
    });
  });

  dom.feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!dom.feedbackMessage.value.trim()) {
      dom.feedbackStatus.textContent = "内容を入力してください。";
      return;
    }

    window.location.href = buildFeedbackMailto();
    dom.feedbackStatus.textContent = "メール作成画面を開きました。内容を確認して送信してください。";
  });

  window.addEventListener("resize", render);
  window.addEventListener("hashchange", updateActiveNav);
}

function init() {
  dom.signalSelect.innerHTML = Object.entries(signals)
    .map(([key, signal]) => `<option value="${key}">${signal.label}</option>`)
    .join("");
  dom.signalSelect.value = state.signal;
  renderStaticLatex();
  renderProperties();
  renderInverse();
  bindEvents();
  updateActiveNav();
  render();
}

init();
