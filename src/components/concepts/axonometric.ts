// 06 leader lines (PRD §9.4) draw in once, from each label towards the drawing, when the layer list
// scrolls into view. A G1 effect: without motion, without JS, or when the list is already on
// screen at start, the lines are simply drawn (their CSS state).
import { registerEffect } from "../../lib/motion";

registerEffect({
  name: "axonometric-leaders",
  selector: "[data-axonometric]",
  setup({ conditions, gsap, ScrollTrigger }) {
    if (conditions.reduced || !conditions.desktop) return;
    for (const root of document.querySelectorAll<HTMLElement>("[data-axonometric]")) {
      const lines = [...root.querySelectorAll<HTMLElement>(".axo__leader")].reverse();
      if (lines.length === 0 || root.getBoundingClientRect().top < innerHeight) continue;
      const rtl = getComputedStyle(root).direction === "rtl";
      // Lines grow from the label end (the inline end of the line) towards the drawing.
      gsap.set(lines, { scaleX: 0, transformOrigin: rtl ? "0% 50%" : "100% 50%" });
      ScrollTrigger.create({
        trigger: root,
        start: "top 70%",
        once: true,
        onEnter: () =>
          gsap.to(lines, {
            scaleX: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.08,
            clearProps: "transform,scale",
          }),
      });
    }
  },
});
