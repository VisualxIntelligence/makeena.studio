// MatchedFrameScrubber behaviour (PRD §9.1). Continuous mode: the range value picks the two
// nearest frames and crossfades between them by opacity (GPU-composited, no canvas); under
// reduced motion the nearest frame swaps in instantly. The ⓘ button, caption and figure ID
// always follow the frame on screen. Set up per page (ClientRouter lifecycle).
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

onPage((signal) => {
  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-scrubber][data-mode='continuous']",
  )) {
    setup(root, signal);
  }
});
