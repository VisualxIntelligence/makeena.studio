// Keyboard focus is always visible: never behind the sticky header, never off-screen (WCAG
// 2.4.7, 2.4.11; decision 0021). Chromium and Firefox scroll focused elements into view and honour
// `scroll-padding` on <html>. WebKit sometimes doesn't scroll at all: Shift+Tab left the brief
// form's fields at y ≈ −40, behind the 64 px header (CI, Linux WebKit), and Tab left the ⓘ
// buttons below the viewport. One frame after the browser's own focus scroll, this scrolls the
// page by whatever is still hidden; where the browser got it right, it does nothing.
// One listener per visit: `document` survives the ClientRouter's swaps.

const GAP = 16;

document.addEventListener("focusin", (e) => {
  const el = e.target;
  // Tab stops only: not <main> or sections (tabindex -1, focused by clicks and the router), the
  // header's own controls, the skip link (shown over the header) or popovers (top layer).
  if (
    !(el instanceof HTMLElement) ||
    el.tabIndex < 0 ||
    el.closest(".site-header, .skip-link, [popover]")
  ) {
    return;
  }
  requestAnimationFrame(() => {
    const header = document.querySelector(".site-header");
    if (!header || document.activeElement !== el || !el.matches(":focus-visible")) return;
    const bottom = header.getBoundingClientRect().bottom;
    const box = el.getBoundingClientRect();
    // Taller than the space below the header: it can't fit, so leave the browser's scroll alone.
    if (box.height > innerHeight - bottom) return;
    if (box.top < bottom) scrollBy(0, box.top - bottom - GAP);
    else if (box.bottom > innerHeight) scrollBy(0, box.bottom - innerHeight + GAP);
  });
});
