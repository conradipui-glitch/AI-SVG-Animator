import './styles.css';
import './ux-fixes.css';
import {
  AiRequestError,
  fetchAiModels,
  requestMotionPlan,
  requestMotionPreparation,
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
import {
  applySemanticPreparation,
  prepareMotionReadySvg,
  type MotionSceneMap,
  type SemanticPreparation,
} from './scene-map';
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
  sceneMap: MotionSceneMap | null;
  semanticPrepared: boolean;
  semanticPrepMeta: string;
  semanticSeparations: SemanticPreparation['separationSuggestions'];
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
  sceneMap: null,
  semanticPrepared: false,
  semanticPrepMeta: '',
  semanticSeparations: [],
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
          ${canvasResultPanel()}
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
          ${readinessPanel()}

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
                ${state.aiBusy && state.aiStage !== tr.ai.generatingVariants ? tr.ai.generating : tr.ai.generate}
              </button>
              <button class="button ghost full variants-button" id="aiVariantsButton" ${state.cleanSvg && !state.aiBusy ? '' : 'disabled'}>
                ${state.aiBusy && state.aiStage === tr.ai.generatingVariants ? tr.ai.generatingVariants : tr.ai.suggestVariants}
              </button>
            </div>
            ${state.aiBusy && state.aiStage ? `<div class="ai-progress"><span></span><div><strong>${escapeHtml(state.aiStage)}</strong><small>${escapeHtml(tr.ai.waitHint)}</small></div></div>` : ''}
            ${variantGallery()}
            ${technicalDetails()}
          </div>
        </aside>
      </section>

      <footer class="footer"><span>SVG · MOTION · WEB</span><span>${tr.footer.note}</span></footer>
    </main>`;

  bindEvents();
}

function canvasResultPanel(): string {
  const tr = t(state.locale);
  if (!state.cleanSvg) return '';

  if (state.aiBusy) {
    return `<section class="canvas-result canvas-result-busy" aria-live="polite">
      <div class="canvas-result-copy">
        <span>${tr.ai.resultTitle}</span>
        <strong id="canvasAiStage">${escapeHtml(state.aiStage || tr.ai.generating)}</strong>
        <small>${escapeHtml(tr.ai.waitHint)}</small>
      </div>
      <div class="canvas-loader"><i></i><i></i><i></i></div>
    </section>`;
  }

  if (state.aiVariants.length) {
    const active = state.aiVariants.find((variant) => variant.id === state.aiSelectedVariant) ?? state.aiVariants[0];
    return `<section class="canvas-result canvas-result-success" aria-live="polite">
      <div class="canvas-result-copy">
        <span>${tr.ai.resultTitle}</span>
        <strong>${escapeHtml(tr.ai.variantsPlaying)}${active ? ` · ${escapeHtml(active.title)}` : ''}</strong>
        <small>${escapeHtml(tr.ai.resultHint)}</small>
      </div>
      <div class="canvas-variant-tabs">
        ${state.aiVariants.map((variant) => `<button class="canvas-variant-tab ${variant.id === state.aiSelectedVariant ? 'active' : ''}" data-variant-id="${escapeHtml(variant.id)}">${escapeHtml(variant.title)}</button>`).join('')}
      </div>
    </section>`;
  }

  if (state.aiSpec) {
    return `<section class="canvas-result canvas-result-success" aria-live="polite">
      <div class="canvas-result-copy">
        <span>${tr.ai.resultTitle}</span>
        <strong>${escapeHtml(tr.ai.motionPlaying)}</strong>
        <small>${state.aiSpec.tracks.length} tracks${state.aiPlanMeta ? ` · ${escapeHtml(state.aiPlanMeta)}` : ''}</small>
      </div>
      <button class="button ghost canvas-replay-ai" id="canvasReplayAi">${tr.actions.replay}</button>
    </section>`;
  }

  if (state.error && (state.aiPlan || state.aiErrorDetail)) {
    return `<section class="canvas-result canvas-result-error" aria-live="polite">
      <div class="canvas-result-copy">
        <span>${tr.ai.resultTitle}</span>
        <strong>${escapeHtml(state.error)}</strong>
        <small>${escapeHtml(state.aiWarnings[0] || state.aiErrorDetail || tr.errors.aiInvalidSpec)}</small>
      </div>
    </section>`;
  }

  if (state.semanticPrepared) {
    return `<section class="canvas-result canvas-result-info" aria-live="polite">
      <div class="canvas-result-copy">
        <span>${tr.ai.resultTitle}</span>
        <strong>${escapeHtml(tr.ai.semanticReady)}</strong>
        <small>${escapeHtml(tr.ai.semanticReadyHint)}</small>
      </div>
    </section>`;
  }

  return '';
}

function readinessPanel(): string {
  const tr = t(state.locale);
  const map = state.sceneMap;
  if (!map) {
    return `<div class="motion-block readiness-block">
      <div class="panel-kicker">${tr.readiness.section}</div>
      <p class="microcopy">${tr.readiness.noSeparation}</p>
    </div>`;
  }

  const label = map.readinessLabel === 'high'
    ? tr.readiness.high
    : map.readinessLabel === 'medium'
      ? tr.readiness.medium
      : tr.readiness.low;
  const semanticNodes = map.nodes
    .filter((node) => node.semanticHint !== 'unknown')
    .sort((a, b) => b.confidence - a.confidence || b.motionPotential - a.motionPotential)
    .slice(0, 8);
  const localSeparations = map.separationCandidates.slice(0, 4).map((candidate) => ({
    target: candidate.target,
    reason: candidate.note,
    priority: candidate.priority,
  }));
  const separationMap = new Map<string, { target: string; reason: string; priority: string }>();
  [...state.semanticSeparations, ...localSeparations].forEach((item) => {
    if (!separationMap.has(item.target)) separationMap.set(item.target, item);
  });
  const separations = Array.from(separationMap.values()).slice(0, 6);

  return `<div class="motion-block readiness-block">
    <div class="panel-kicker">${tr.readiness.section}</div>
    <section class="readiness-card">
      <div class="readiness-head">
        <div><strong>${tr.readiness.score}</strong><span>${state.semanticPrepared ? tr.readiness.enriched : `${map.motionTargetCount} motion targets`}</span></div>
        <div class="readiness-score ${map.readinessLabel}">${Math.round(map.readinessScore * 100)}% · ${label}</div>
      </div>
      <div class="readiness-metrics">
        <div class="readiness-metric"><span>${tr.readiness.groups}</span><strong>${map.groupCount}</strong></div>
        <div class="readiness-metric"><span>${tr.readiness.semantic}</span><strong>${map.semanticNodeCount}</strong></div>
        <div class="readiness-metric"><span>${tr.readiness.splitCandidates}</span><strong>${separations.length}</strong></div>
      </div>
      ${semanticNodes.length ? `<div class="semantic-section"><span class="mini-label">${tr.readiness.detected}</span><div class="semantic-list">${semanticNodes.map((node) => `<span class="semantic-chip"><strong>${escapeHtml(node.sourceLabel || node.id)}</strong><small>${escapeHtml(node.semanticHint)} · ${escapeHtml(node.pivot)}</small></span>`).join('')}</div></div>` : ''}
      <div class="semantic-section separation-section">
        <span class="mini-label">${tr.readiness.separationTitle}</span>
        ${separations.length
          ? `<div class="separation-list">${separations.map((item) => `<div class="separation-item ${escapeHtml(item.priority)}"><strong>${escapeHtml(item.target)}</strong><span>${escapeHtml(item.reason)}</span></div>`).join('')}</div>`
          : `<p class="microcopy readiness-empty">${tr.readiness.noSeparation}</p>`}
      </div>
      <button class="button ghost full prepare-motion-button" id="prepareMotionButton" ${state.cleanSvg && !state.aiBusy ? '' : 'disabled'}>${state.aiBusy && state.aiStage === tr.status.motionPreparing ? tr.readiness.analyzing : tr.readiness.analyze}</button>
      ${state.semanticPrepMeta ? `<div class="semantic-source">${escapeHtml(state.semanticPrepMeta)}</div>` : ''}
    </section>
  </div>`;
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
  document.querySelector<HTMLButtonElement>('#canvasReplayAi')?.addEventListener('click', () => {
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

  document.querySelector<HTMLButtonElement>('#prepareMotionButton')?.addEventListener('click', () => {
    void prepareMotionStructure();
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
    state.sceneMap = null;
    render();
    return;
  }

  state.status = tr.status.cleaning;
  state.error = '';
  resetAiResult();
  state.sceneMap = null;
  state.semanticPrepared = false;
  state.semanticPrepMeta = '';
  state.semanticSeparations = [];
  try {
    const normalized = normalizeSvg(state.rawSvg);
    const prepared = prepareMotionReadySvg(normalized.markup);
    state.cleanSvg = prepared.markup;
    state.sceneMap = prepared.map;
    state.status = tr.status.ready;
    render();
    requestAnimationFrame(playAnimation);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'invalid-svg';
    state.error = code === 'empty-svg' ? tr.errors.emptySvg : tr.errors.invalidSvg;
    state.cleanSvg = '';
    state.sceneMap = null;
    render();
  }
}

async function prepareMotionStructure(): Promise<void> {
  const tr = t(state.locale);
  if (!state.cleanSvg) {
    state.error = tr.errors.aiNeedsSvg;
    updateStatus();
    return;
  }

  resetAiResult();
  state.aiBusy = true;
  state.aiStage = tr.status.motionPreparing;
  state.error = '';
  render();
  await nextFrame();

  try {
    const result = await requestMotionPreparation(state.cleanSvg, state.aiModel || undefined);
    state.aiPlan = formatPlanText(result.text);
    state.aiPlanMeta = `${result.provider} · ${result.model} · ${result.latencyMs}ms${result.fallbackUsed ? ` · ${tr.ai.fallback}` : ''}`;
    const applied = applySemanticPreparation(state.cleanSvg, result.text);
    state.cleanSvg = applied.markup;
    state.sceneMap = applied.map;
    state.semanticPrepared = applied.appliedCount > 0;
    state.semanticSeparations = applied.preparation.separationSuggestions;
    state.semanticPrepMeta = applied.appliedCount
      ? `${tr.readiness.enriched} · ${applied.appliedCount} nodes · ${result.model}`
      : `${result.model} · ${applied.preparation.separationSuggestions.length} separation hints`;
    state.aiWarnings = [...applied.warnings, ...applied.map.warnings];
    state.status = applied.appliedCount || applied.preparation.separationSuggestions.length
      ? tr.status.motionPrepared
      : tr.errors.motionPreparationEmpty;
  } catch (error) {
    setAiError(error, tr.errors.aiUnavailable);
  } finally {
    state.aiBusy = false;
    state.aiStage = '';
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
    const result = await requestMotionPlan(
      state.cleanSvg,
      state.aiPrompt,
      state.aiModel || undefined,
      { includeImage: !state.semanticPrepared },
    );
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
    const result = await requestMotionVariants(
      state.cleanSvg,
      state.aiPrompt,
      state.aiModel || undefined,
      { includeImage: !state.semanticPrepared },
    );
    state.aiPlan = formatPlanText(result.text);
    state.aiPlanMeta = `${result.provider} · ${result.model} · ${result.latencyMs}ms${result.fallbackUsed ? ` · ${tr.ai.fallback}` : ''}`;
    const variants = parseMotionVariants(result.text, state.cleanSvg);
    if (!variants.length) {
      state.error = tr.errors.aiNoVariants;
      return;
    }

    state.aiVariants = variants;
    state.aiWarnings = variants.flatMap((variant) => variant.validation.warnings.map((warning) => `${variant.title}: ${warning}`));
    const preferred = variants.find((variant) => variant.id.toLowerCase() === 'natural')
      ?? variants.find((variant) => variant.title.toLowerCase() === 'natural')
      ?? variants[Math.min(1, variants.length - 1)]
      ?? variants[0];
    if (preferred) {
      state.aiSpec = preferred.spec;
      state.aiSelectedVariant = preferred.id;
      state.status = `${tr.status.variantsReady} · ${preferred.title}`;
    } else {
      state.status = tr.status.variantsReady;
    }
  } catch (error) {
    setAiError(error, tr.errors.aiUnavailable);
  } finally {
    state.aiBusy = false;
    state.aiStage = '';
    render();
    if (state.aiSpec && state.aiVariants.length) {
      requestAnimationFrame(() => {
        playAnimation();
        const active = state.aiVariants.find((variant) => variant.id === state.aiSelectedVariant);
        state.status = active ? `${t(state.locale).status.variantsReady} · ${active.title}` : t(state.locale).status.variantsReady;
        updateStatus();
      });
    }
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
  const value = state.error || state.aiStage || state.status || t(state.locale).status.ready;
  const status = document.querySelector<HTMLElement>('#statusText');
  if (status) status.textContent = value;
  const canvasStage = document.querySelector<HTMLElement>('#canvasAiStage');
  if (canvasStage && state.aiStage) canvasStage.textContent = state.aiStage;
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