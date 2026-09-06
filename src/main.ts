import './styles.css';
import { animateSvg, stopAnimation, type MotionOptions, type Preset } from './animator';
import { buildStandaloneHtml, downloadText } from './export';
import { resolveLocale, saveLocale, t, type Locale } from './i18n';
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
  error: ''
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
              <div class="canvas-meta"><span class="status-dot"></span><span id="statusText">${state.error || state.status || tr.status.ready}</span></div>
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
          <div class="panel-kicker">${tr.presets.section}</div>
          <div class="preset-list">
            ${presetCard('reveal', tr.presets.reveal, tr.presets.revealDesc)}
            ${presetCard('draw', tr.presets.draw, tr.presets.drawDesc)}
            ${presetCard('float', tr.presets.float, tr.presets.floatDesc)}
          </div>
          <div class="divider"></div>
          <div class="panel-kicker">${tr.controls.section}</div>
          ${rangeControl('duration', tr.controls.duration, state.duration, 0.3, 4, 0.1, `${state.duration.toFixed(1)}s`)}
          ${rangeControl('intensity', tr.controls.intensity, state.intensity, 0.1, 1, 0.05, `${Math.round(state.intensity * 100)}%`)}
          <label class="toggle-row"><span>${tr.controls.loop}</span><input id="loopControl" type="checkbox" ${state.loop ? 'checked' : ''}/><span class="toggle-ui"></span></label>
        </aside>
      </section>

      <footer class="footer"><span>SVG · MOTION · WEB</span><span>${tr.footer.note}</span></footer>
    </main>`;

  bindEvents();
}

function presetCard(preset: Preset, title: string, description: string): string {
  return `<button class="preset-card ${state.preset === preset ? 'active' : ''}" data-preset="${preset}">
    <span class="preset-glyph ${preset}"><i></i><i></i><i></i></span>
    <span><strong>${title}</strong><small>${description}</small></span>
  </button>`;
}

function rangeControl(id: string, label: string, value: number, min: number, max: number, step: number, display: string): string {
  return `<label class="range-row" for="${id}Control"><span><strong>${label}</strong><output id="${id}Value">${display}</output></span><input id="${id}Control" type="range" min="${min}" max="${max}" step="${step}" value="${value}" /></label>`;
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
  animateSvg(svg, motionOptions());
}

function updateStatus(): void {
  const status = document.querySelector<HTMLElement>('#statusText');
  if (status) status.textContent = state.error || state.status || t(state.locale).status.ready;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

render();
