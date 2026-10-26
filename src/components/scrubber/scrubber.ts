// MatchedFrameScrubber behaviour (PRD §9.1). Continuous mode (04): the range value picks the two
// nearest frames and crossfades between them by opacity (GPU-composited, no canvas); under
// reduced motion the nearest frame swaps in instantly. The ⓘ button, caption and figure ID
// always follow the frame on screen. Set up per page (ClientRouter lifecycle).
import { crossfade } from "../../lib/crossfade";
import { onPage } from "../../lib/lifecycle";
import { motion } from "../../lib/motion";

interface Layer {
  el: HTMLElement;
  value: number;
}

function setup(root: HTMLElement, signal: AbortSignal): void {
  const input = root.querySelector<HTMLInputElement>("[data-scrubber-input]");
  const output = root.querySelector<HTMLOutputElement>("[data-scrubber-output]");
  const caption = root.querySelector<HTMLElement>("[data-scrubber-caption]");
  const info = root.querySelector<HTMLButtonElement>(".pfig__info");
  const readout: Record<string, string> = JSON.parse(
    root.querySelector("[data-scrubber-readout]")?.textContent ?? "{}",
  );
  if (!input || !output) return;
  const layers: Layer[] = [...root.querySelectorAll<HTMLElement>(".scrubber__layer")].map((el) => ({
    el,
    value: Number(el.dataset.value),
  }));
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>(".scrubber__thumb")];

  const render = () => {
    const v = Number(input.value);
    let i = layers.findIndex((l, k) => k === layers.length - 1 || v < layers[k + 1].value);
    i = Math.max(0, Math.min(i, layers.length - 1));
    const next = layers[Math.min(i + 1, layers.length - 1)];
    const span = next.value - layers[i].value;
    const t = span > 0 ? Math.min(1, Math.max(0, (v - layers[i].value) / span)) : 0;
    const nearest = t < 0.5 ? layers[i] : next;

    for (const layer of layers) {
      let opacity = 0;
      if (motion.allowed) {
        if (layer === layers[i]) opacity = 1;
        if (layer === next && next !== layers[i]) opacity = t;
      } else if (layer === nearest) {
        opacity = 1;
      }
      layer.el.style.opacity = String(opacity);
      layer.el.toggleAttribute("data-active", layer === nearest);
    }

    const text = readout[String(v)] ?? "";
    output.value = text;
    input.setAttribute("aria-valuetext", text);
    root.dataset.provenance = nearest.el.dataset.provenance;
    if (caption) caption.textContent = nearest.el.dataset.caption ?? "";
    if (info && nearest.el.dataset.sheet) {
      info.setAttribute("popovertarget", nearest.el.dataset.sheet);
      info.setAttribute(
        "aria-label",
        info.getAttribute("aria-label")!.replace(/: .*$/, `: ${nearest.el.dataset.provenance}`),
      );
    }
    for (const thumb of thumbs) {
      thumb.setAttribute("aria-pressed", String(Number(thumb.dataset.value) === nearest.value));
    }
  };

  // Load the other frames on first contact with the scrubber.
  const wake = () => {
    for (const template of root.querySelectorAll<HTMLTemplateElement>("template[data-deferred]")) {
      template.replaceWith(template.content.cloneNode(true));
    }
  };
  for (const type of ["pointerenter", "focusin", "touchstart"]) {
    root.addEventListener(type, wake, { once: true, passive: true, signal });
  }

  input.addEventListener("input", render, { signal });
  for (const thumb of thumbs) {
    thumb.addEventListener(
      "click",
      () => {
        input.value = thumb.dataset.value ?? input.value;
        render();
      },
      { signal },
    );
  }
  motion.onChange(render, signal);
  render();
}

/**
 * Discrete mode (07): the checked radio picks the frame, through crossfade() (a short fade, or
 * instant without motion). The wipe shows the stop before on the inline-start side of a divider,
 * clip-path on the inline end.
 */
function setupDiscrete(root: HTMLElement, signal: AbortSignal): void {
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const layers = [...root.querySelectorAll<HTMLElement>(".scrubber__layer")];
  const notes = [...root.querySelectorAll<HTMLElement>(".scrubber__note")];
  const live = root.querySelector<HTMLElement>("[data-scrubber-live]");
  const caption = root.querySelector<HTMLElement>("[data-scrubber-caption]");
  const info = root.querySelector<HTMLButtonElement>(".pfig__info");
  const wipe = root.querySelector<HTMLElement>("[data-scrubber-wipe]");
  const wipeInput = root.querySelector<HTMLInputElement>("[data-scrubber-wipe-input]");
  const wipeLabel = root.querySelector<HTMLElement>("[data-scrubber-wipe-label]");
  const text: { announce: Record<string, string>; compare: Record<string, string> } = JSON.parse(
    root.querySelector("[data-scrubber-text]")?.textContent ?? "{}",
  );
  const rtl = () => getComputedStyle(root).direction === "rtl";

  // Frames not on screen are display:none and lazy; load them all on first contact. WebKit never
  // fetches a lazy image that was hidden at load once shown, so make them eager (decision 0012).
  const wake = () => {
    for (const img of root.querySelectorAll<HTMLImageElement>(".scrubber__layer img")) {
      img.loading = "eager";
    }
  };
  for (const type of ["pointerenter", "focusin", "touchstart"]) {
    root.addEventListener(type, wake, { once: true, passive: true, signal });
  }

  const index = () =>
    Math.max(
      0,
      radios.findIndex((r) => r.checked),
    );

  const applyWipe = () => {
    const i = index();
    const before = layers[i - 1];
    const current = layers[i];
    const v = Number(wipeInput?.value ?? 0);
    for (const layer of layers) layer.toggleAttribute("data-before", layer === before && v > 0);
    current.style.clipPath =
      before && v > 0 ? (rtl() ? `inset(0 ${v}% 0 0)` : `inset(0 0 0 ${v}%)`) : "";
    wipeInput?.setAttribute("aria-valuetext", `${v}%`);
  };

  const show = () => {
    const i = index();
    const value = radios[i].value;
    layers.forEach((layer, k) => {
      layer.toggleAttribute("data-active", k === i);
      layer.style.clipPath = "";
    });
    notes.forEach((note, k) => note.toggleAttribute("data-active", k === i));
    const layer = layers[i];
    root.dataset.provenance = layer.dataset.provenance;
    if (caption) caption.textContent = layer.dataset.caption ?? "";
    if (info && layer.dataset.sheet) {
      info.setAttribute("popovertarget", layer.dataset.sheet);
      info.setAttribute(
        "aria-label",
        info.getAttribute("aria-label")!.replace(/: .*$/, `: ${layer.dataset.provenance}`),
      );
    }
    if (wipe && wipeInput && wipeLabel) {
      wipe.hidden = i === 0 || !motion.allowed;
      wipeInput.value = "0";
      wipeLabel.textContent = text.compare[value] ?? "";
    }
    applyWipe();
  };

  const select = () => {
    wake();
    if (live) live.textContent = text.announce[radios[index()].value] ?? "";
    void crossfade(show);
  };

  for (const radio of radios) radio.addEventListener("change", select, { signal });
  wipeInput?.addEventListener("input", applyWipe, { signal });
  motion.onChange(show, signal);
  show();
}

onPage((signal) => {
  for (const root of document.querySelectorAll<HTMLElement>("[data-scrubber]")) {
    if (root.dataset.mode === "continuous") setup(root, signal);
    if (root.dataset.mode === "discrete") setupDiscrete(root, signal);
  }
});
