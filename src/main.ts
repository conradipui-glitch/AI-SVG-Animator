import './styles.css';
import {
  AiRequestError,
  fetchAiModels,
  requestMotionPlan,
  requestMotionVariants,
  type AiModelOption,
} from './ai';
import { animateMotionSpec, animateSvg, stopAnimation, type MotionOptions, type Preset } from './animator';
import { buildStandaloneHtml, downloadText } from './export';
import { resolveLocale, saveLocale, t, type Locale } from './i18n';
import {
  parseMotionVariants,
  validateMotionSpecText,
  type MotionSpec,
  type MotionVariant,
} from './motion-spec';
import { SAMPLE_SVG } from './sample';
import { normalizeSvg } from './svg';

interface State {
  locale: Locale;
  rawSvg: string;
  cleanSvg: string;
  preset: Preset;
  duration: number;
  intensity: number;
  loop: boolean;
  status: string;
  error: string;
  aiModels: AiModelOption[];
  aiModel: string;
  aiPrompt: string;
  aiPlan: string;
  aiPlanMeta: string;
  aiBusy: boolean;
  aiStage: string;
  aiSpec: MotionSpec | null;
  aiVariants: MotionVariant[];
  aiSelectedVariant: string;
  aiWarnings: string[];
  aiErrorDetail: string;
}

const state: State = {
  locale: resolveLocale(),
  rawSvg: '',
  cleanSvg: '',
  preset: 'reveal',
  duration: 1.2,
  intensity: 0.55,
  loop: true,
  status: '',
  error: '',
  aiModels: [],
  aiModel: 'glm-5.3-flash',
  aiPrompt: '',
  aiPlan: '',
  aiPlanMeta: '',
  aiBusy: false,
  aiStage: '',
  aiSpec: null,
  aiVariants: [],
  aiSelectedVariant: '',
  aiWarnings: [],
  aiErrorDetail: '',
};

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('App root not found');
const app: HTMLDivElement = appRoot;

function motionOptions(): MotionOptions {
  return { preset: state.preset, duration: state.duration, intensity: state.intensity, loop: state.loop };
}

function render(): void {
  const tr = t(state.locale);
  document.documentElement.lang = state.locale;
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="lab-mark"><span class="pulse-dot"></span>${tr.app.lab}</div>
        <div class="brand-lockup">
          <div class="brand-title"><span>AI</span> <strong>SVG</strong> Animator</div>
          <div class="tagline">${tr.app.tagline}</div>
        </div>
        <div class="top-actions">
          <span class="studio-mark">${tr.app.studio}</span>
          <div class="lang-switch" aria-label="Language">
            <button class="lang ${state.locale === 'ru' ? 'active' : ''}" data-locale="ru">RU</button>
            <button class="lang ${state.locale === 'en' ? 'active' : ''}" data-locale="en">EN</button>
          </div>
        </div>
      </header>

      <section class="workspace-grid">
        <aside class="panel input-panel">
          <div class="panel-kicker">${tr.input.section}</div>
          <label class="field-label" for="svgInput">${tr.input.svgLabel}</label>
          <textarea id="svgInput" spellcheck="false" placeholder="${tr.input.placeholder}">${escapeHtml(state.rawSvg)}</textarea>
          <p class="microcopy">${tr.input.svgHint}</p>
          <div class="button-row">
            <label class="button ghost file-button">${tr.input.uploadSvg}<input id="fileInput" type="file" accept="image/svg+xml,.svg" hidden /></label>
            <button class="button ghost" id="sampleButton">${tr.input.loadSample}</button>
          </div>
          <button class="button primary full" id="applyButton">${tr.actions.applySvg}</button>
        </aside>

        <section class="panel canvas-panel">
          <div class="canvas-head">
            <div>
              <div class="panel-kicker">${tr.workspace.section}</div>
              <div class="canvas-meta"><span class="status-dot ${state.error ? 'error' : ''}"></span><span id="statusText">${escapeHtml(state.error || state.aiStage || state.status || tr.status.ready)}</span></div>
            </div>
            ${state.cleanSvg ? `<span class="clean-badge">${tr.workspace.cleanBadge}</span>` : ''}
          </div>
          <div class="canvas" id="canvas">
            ${state.cleanSvg
              ? `<div class="svg-frame" id="svgFrame">${state.cleanSvg}</div>`
              : `<div class="empty-state"><div class="orbit-icon"><span></span></div><h2>${tr.workspace.emptyTitle}</h2><p>${tr.workspace.emptyBody}</p></div>`}
          </div>
          <div class="canvas-actions">
            <button class="button primary" id="animateButton" ${state.cleanSvg ? '' : 'disabled'}>${tr.actions.animate}</button>
            <button class="button ghost" id="replayButton" ${state.cleanSvg ? '' : 'disabled'}>${tr.actions.replay}</button>
            <button class="button ghost" id="downloadSvgButton" ${state.cleanSvg ? '' : 'disabled'}>${tr.actions.downloadSvg}</button>
            <button class="button ghost" id="exportHtmlButton" ${state.cleanSvg ? '' : 'disabled'}>${tr.actions.exportHtml}</button>
          </div>
        </section>

        <aside class="panel motion-panel">
          <div class="motion-block">
            <div class="panel-kicker">${tr.presets.section}</div>
            <div class="preset-list">
              ${presetCard('reveal', tr.presets.reveal, tr.presets.revealDesc)}
              ${presetCard('draw', tr.presets.draw, tr.presets.drawDesc)}
              ${presetCard('float', tr.presets.float, tr.presets.floatDesc)}
            </div>
          </div>

          <div class="divider"></div>
          <div class="motion-block">
            <div class="panel-kicker">${tr.controls.section}</div>
            ${rangeControl('duration', tr.controls.duration, state.duration, 0.3, 4, 0.1, `${state.duration.toFixed(1)}s`)}
            ${rangeControl('intensity', tr.controls.intensity, state.intensity, 0.1, 1, 0.05, `${Math.round(state.intensity * 100)}%`)}
            <label class="toggle-row"><span>${tr.controls.loop}</span><input id="loopControl" type="checkbox" ${state.loop ? 'checked' : ''}/><span class="toggle-ui"></span></label>
          </div>

          <div class="divider"></div>
          <div class="motion-block ai-motion-block">
            <div class="panel-kicker">${tr.ai.section}</div>
            <label class="field-label" for="aiModelSelect">${tr.ai.model}</label>
            <select id="aiModelSelect" class="ai-select" ${state.aiBusy ? 'disabled' : ''}>
              ${aiModelOptions(tr.ai.noModels)}
            </select>
            <label class="field-label ai-prompt-label" for="aiPrompt">${tr.ai.prompt}</label>
            <textarea id="aiPrompt" class="ai-prompt" spellcheck="true" placeholder="${tr.ai.promptPlaceholder}">${escapeHtml(state.aiPrompt)}</textarea>
            <p class="microcopy">${tr.ai.autoHint}</p>
            <div class="ai-actions">
              <button class="button ai-button full" id="aiMotionButton" ${state.cleanSvg && !state.aiBusy ? '' : 'disabled'}>
                ${state.aiBusy && !state.aiVariants.length ? tr.ai.generating : tr.ai.generate}
              </button>
              <button class="button ghost full variants-button" id="aiVariantsButton" ${state.cleanSvg && !state.aiBusy ? '' : 'disabled'}>
                ${state.aiBusy && state.aiStage === tr.ai.generatingVariants ? tr.ai.generatingVariants : tr.ai.suggestVariants}
              </button>
            </div>
            ${state.aiBusy && state.aiStage ? `<div class="ai-progress"><span></span><strong>${escapeHtml(state.aiStage)}</strong></div>` : ''}
            ${variantGallery()}
            ${technicalDetails()}
          </div>
        </aside>
      </section>

      <footer class="footer"><span>SVG · MOTION · WEB</span><span>${tr.footer.note}</span></footer>
    </main>`;

  bindEvents();
}

function aiModelOptions(emptyLabel: string): string {
  const candidates = state.aiModels.filter((model) => model.capabilities.includes('text') && model.availableForCredential !== false);
  if (!candidates.length) {
    return `<option value="${escapeHtml(state.aiModel)}">${escapeHtml(state.aiModel || emptyLabel)}</option>`;
  }

  return candidates.map((model) => {
    const selected = state.aiModel === model.id ? 'selected' : '';
    const visionMark = model.capabilities.includes('vision') ? ' · vision' : ' · text';
    return `<option value="${escapeHtml(model.id)}" ${selected}>${escapeHtml(model.label + visionMark)}</option>`;
  }).join('');
}

function presetCard(preset: Preset, title: string, description: string): string {
  return `<button class="preset-card ${state.preset === preset && !state.aiSpec ? 'active' : ''}" data-preset="${preset}">
    <span class="preset-glyph ${preset}"><i></i><i></i><i></i></span>
    <span><strong>${title}</strong><small>${description}</small></span>
  </button>`;
}

function rangeControl(id: string, label: string, value: number, min: number, max: number, step: number, display: string): string {
  return `<label class="range-row" for="${id}Control"><span><strong>${label}</strong><output id="${id}Value">${display}</output></span><input id="${id}Control" type="range" min="${min}" max="${max}" step="${step}" value="${value}" /></label>`;
}

function variantGallery(): string {
  if (!state.aiVariants.length) return '';
  const tr = t(state.locale);
  return `<section class="variant-gallery">
    <div class="variant-gallery-title">${tr.ai.variantsTitle}</div>
    <div class="variant-list">
      ${state.aiVariants.map((variant) => {
        const active = state.aiSelectedVariant === variant.id;
        const warning = variant.validation.rejectedTracks > 0
          ? ` · ${variant.validation.acceptedTracks}/${variant.validation.receivedTracks}`
          : '';
        return `<article class="variant-card ${active ? 'active' : ''}">
          <div class="variant-card-head"><strong>${escapeHtml(variant.title)}</strong><span>${variant.spec.tracks.length} tracks${warning}</span></div>
          <p>${escapeHtml(variant.description)}</p>
          <button class="button ${active ? 'primary' : 'ghost'} variant-apply" data-variant-id="${escapeHtml(variant.id)}">${active ? tr.ai.activeVariant : tr.ai.applyVariant}</button>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function technicalDetails(): string {
  if (!state.aiPlan && !state.aiWarnings.length && !state.aiErrorDetail) return '';
  const tr = t(state.locale);
  const warnings = state.aiWarnings.length
    ? `<ul class="ai-warnings">${state.aiWarnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>`
    : '';
  const error = state.aiErrorDetail ? `<pre class="ai-error-detail">${escapeHtml(state.aiErrorDetail)}</pre>` : '';
  const raw = state.aiPlan ? `<div class="ai-plan-head"><strong>${tr.ai.rawResponse}</strong><span>${escapeHtml(state.aiPlanMeta)}</span></div><pre>${escapeHtml(state.aiPlan)}</pre>` : '';
  return `<details class="ai-debug">
    <summary>${tr.ai.technicalDetails}</summary>
    ${warnings}
    ${error}
    ${raw}
  </details>`;
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      state.locale = button.dataset.locale as Locale;
      saveLocale(state.locale);
      render();
    });
  });

  document.querySelector<HTMLTextAreaElement>('#svgInput')?.addEventListener('input', (event) => {
    state.rawSvg = (event.target as HTMLTextAreaElement).value;
  });

  document.querySelector<HTMLInputElement>('#fileInput')?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      state.rawSvg = await file.text();
      state.error = '';
      state.status = t(state.locale).status.loaded;
      render();
    } catch {
      state.error = t(state.locale).errors.readFile;
      render();
    }
  });

  document.querySelector<HTMLButtonElement>('#sampleButton')?.addEventListener('click', () => {
    state.rawSvg = SAMPLE_SVG;
    state.error = '';
    state.status = t(state.locale).status.loaded;
    applySvg();
  });

  document.querySelector<HTMLButtonElement>('#applyButton')?.addEventListener('click', applySvg);
  document.querySelector<HTMLButtonElement>('#animateButton')?.addEventListener('click', playAnimation);
  document.querySelector<HTMLButtonElement>('#replayButton')?.addEventListener('click', () => {
    renderCanvasFresh();
    requestAnimationFrame(playAnimation);
  });

  document.querySelector<HTMLButtonElement>('#downloadSvgButton')?.addEventListener('click', () => {
    if (state.cleanSvg) downloadText('animated-source.svg', state.cleanSvg, 'image/svg+xml;charset=utf-8');
  });

  document.querySelector<HTMLButtonElement>('#exportHtmlButton')?.addEventListener('click', () => {
    if (!state.cleanSvg) return;
    downloadText('animated-svg.html', buildStandaloneHtml(state.cleanSvg, motionOptions()), 'text/html;charset=utf-8');
    state.status = t(state.locale).status.exported;
    updateStatus();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      state.aiSpec = null;
      state.aiSelectedVariant = '';
      state.preset = button.dataset.preset as Preset;
      render();
      if (state.cleanSvg) requestAnimationFrame(playAnimation);
    });
  });

  document.querySelector<HTMLInputElement>('#durationControl')?.addEventListener('input', (event) => {
    state.duration = Number((event.target as HTMLInputElement).value);
    const output = document.querySelector<HTMLOutputElement>('#durationValue');
    if (output) output.value = `${state.duration.toFixed(1)}s`;
  });

  document.querySelector<HTMLInputElement>('#intensityControl')?.addEventListener('input', (event) => {
    state.intensity = Number((event.target as HTMLInputElement).value);
    const output = document.querySelector<HTMLOutputElement>('#intensityValue');
    if (output) output.value = `${Math.round(state.intensity * 100)}%`;
  });

  document.querySelector<HTMLInputElement>('#loopControl')?.addEventListener('change', (event) => {
    state.loop = (event.target as HTMLInputElement).checked;
  });

  document.querySelector<HTMLSelectElement>('#aiModelSelect')?.addEventListener('change', (event) => {
    state.aiModel = (event.target as HTMLSelectElement).value;
  });

  document.querySelector<HTMLTextAreaElement>('#aiPrompt')?.addEventListener('input', (event) => {
    state.aiPrompt = (event.target as HTMLTextAreaElement).value;
  });

  document.querySelector<HTMLButtonElement>('#aiMotionButton')?.addEventListener('click', () => {
    void generateMotionPlan();
  });

  document.querySelector<HTMLButtonElement>('#aiVariantsButton')?.addEventListener('click', () => {
    void generateVariants();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-variant-id]').forEach((button) => {
    button.addEventListener('click', () => applyVariant(button.dataset.variantId || ''));
  });
}

function applySvg(): void {
  const tr = t(state.locale);
  if (!state.rawSvg.trim()) {
    state.error = tr.errors.emptySvg;
    state.cleanSvg = '';
    render();
    return;
  }

  state.status = tr.status.cleaning;
  state.error = '';
  resetAiResult();
  try {
    const normalized = normalizeSvg(state.rawSvg);
    state.cleanSvg = normalized.markup;
    state.status = tr.status.ready;
    render();
    requestAnimationFrame(playAnimation);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'invalid-svg';
    state.error = code === 'empty-svg' ? tr.errors.emptySvg : tr.errors.invalidSvg;
    state.cleanSvg = '';
    render();
  }
}

async function generateMotionPlan(): Promise<void> {
  const tr = t(state.locale);
  if (!state.cleanSvg) {
    state.error = tr.errors.aiNeedsSvg;
    updateStatus();
    return;
  }

  resetAiResult();
  state.aiBusy = true;
  state.aiStage = tr.status.aiPreparing;
  state.error = '';
  render();
  await nextFrame();

  try {
    state.aiStage = tr.status.aiRequesting;
    updateStatus();
    const result = await requestMotionPlan(state.cleanSvg, state.aiPrompt, state.aiModel || undefined);
    state.aiPlan = formatPlanText(result.text);
    state.aiPlanMeta = `${result.provider} · ${result.model} · ${result.latencyMs}ms${result.fallbackUsed ? ` · ${tr.ai.fallback}` : ''}`;
    state.aiStage = tr.status.aiValidating;
    updateStatus();

    const validation = validateMotionSpecText(result.text, state.cleanSvg);
    state.aiWarnings = validation.warnings;
    if (!validation.spec) {
      state.error = tr.errors.aiInvalidSpec;
      return;
    }

    state.aiSpec = validation.spec;
    state.aiStage = tr.status.aiApplying;
    state.status = validation.rejectedTracks > 0
      ? `${tr.status.aiReady} · ${tr.ai.partial} (${validation.acceptedTracks}/${validation.receivedTracks})`
      : tr.status.aiReady;
  } catch (error) {
    setAiError(error, tr.errors.aiUnavailable);
  } finally {
    state.aiBusy = false;
    state.aiStage = '';
    render();
    if (state.aiSpec) {
      requestAnimationFrame(() => {
        playAnimation();
        state.status = t(state.locale).status.aiReady;
        updateStatus();
      });
    }
  }
}

async function generateVariants(): Promise<void> {
  const tr = t(state.locale);
  if (!state.cleanSvg) {
    state.error = tr.errors.aiNeedsSvg;
    updateStatus();
    return;
  }

  resetAiResult();
  state.aiBusy = true;
  state.aiStage = tr.ai.generatingVariants;
  state.error = '';
  render();
  await nextFrame();

  try {
    const result = await requestMotionVariants(state.cleanSvg, state.aiModel || undefined);
    state.aiPlan = formatPlanText(result.text);
    state.aiPlanMeta = `${result.provider} · ${result.model} · ${result.latencyMs}ms${result.fallbackUsed ? ` · ${tr.ai.fallback}` : ''}`;
    const variants = parseMotionVariants(result.text, state.cleanSvg);
    if (!variants.length) {
      state.error = tr.errors.aiNoVariants;
      return;
    }

    state.aiVariants = variants;
    state.aiWarnings = variants.flatMap((variant) => variant.validation.warnings.map((warning) => `${variant.title}: ${warning}`));
    state.status = tr.status.variantsReady;
  } catch (error) {
    setAiError(error, tr.errors.aiUnavailable);
  } finally {
    state.aiBusy = false;
    state.aiStage = '';
    render();
  }
}

function applyVariant(id: string): void {
  const variant = state.aiVariants.find((candidate) => candidate.id === id);
  if (!variant) return;
  state.aiSpec = variant.spec;
  state.aiSelectedVariant = variant.id;
  state.aiWarnings = variant.validation.warnings;
  state.error = '';
  state.status = t(state.locale).status.aiApplying;
  render();
  requestAnimationFrame(() => {
    playAnimation();
    state.status = `${t(state.locale).status.aiReady} · ${variant.title}`;
    updateStatus();
  });
}

function setAiError(error: unknown, fallback: string): void {
  state.error = fallback;
  if (error instanceof AiRequestError) {
    const attempts = error.attempts.map((attempt) => {
      const status = attempt.status ? ` HTTP ${attempt.status}` : '';
      return `${attempt.provider}/${attempt.model}${status}: ${attempt.message}`;
    });
    state.aiErrorDetail = [
      `${error.code} · HTTP ${error.status}`,
      error.message,
      ...attempts,
    ].filter(Boolean).join('\n');
  } else if (error instanceof Error) {
    state.aiErrorDetail = error.message;
  } else {
    state.aiErrorDetail = 'Unknown AI error';
  }
}

function resetAiResult(): void {
  state.aiPlan = '';
  state.aiPlanMeta = '';
  state.aiStage = '';
  state.aiSpec = null;
  state.aiVariants = [];
  state.aiSelectedVariant = '';
  state.aiWarnings = [];
  state.aiErrorDetail = '';
}

function formatPlanText(value: string): string {
  try {
    const parsed: unknown = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (!fenced) return value.trim();
    try {
      return JSON.stringify(JSON.parse(fenced), null, 2);
    } catch {
      return fenced.trim();
    }
  }
}

function renderCanvasFresh(): void {
  stopAnimation();
  const frame = document.querySelector<HTMLDivElement>('#svgFrame');
  if (frame && state.cleanSvg) frame.innerHTML = state.cleanSvg;
}

function playAnimation(): void {
  if (!state.cleanSvg) return;
  const svg = document.querySelector<SVGSVGElement>('#svgFrame svg');
  if (!svg) return;
  state.status = t(state.locale).status.animating;
  updateStatus();
  if (state.aiSpec) animateMotionSpec(svg, state.aiSpec);
  else animateSvg(svg, motionOptions());
}

function updateStatus(): void {
  const status = document.querySelector<HTMLElement>('#statusText');
  if (status) status.textContent = state.error || state.aiStage || state.status || t(state.locale).status.ready;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function loadAiModels(): Promise<void> {
  try {
    const response = await fetchAiModels();
    state.aiModels = response.selectable;
    const eligible = state.aiModels.find((model) => model.id === response.defaults.reason && model.availableForCredential !== false)
      ?? state.aiModels.find((model) => model.capabilities.includes('vision') && model.availableForCredential !== false)
      ?? state.aiModels.find((model) => model.capabilities.includes('text') && model.availableForCredential !== false);
    if (eligible) state.aiModel = eligible.id;
    render();
  } catch {
    // Static animation remains available if model discovery is temporarily unavailable.
  }
}

render();
void loadAiModels();
