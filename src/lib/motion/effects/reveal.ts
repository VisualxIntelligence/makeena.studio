// Base scroll reveal (PRD §6.4): opacity 0→1 and 12px→0, 300ms ease-out, 60ms stagger, for
// blocks marked [data-reveal]. Only blocks below the fold at load are hidden, so the LCP and
// anything already on screen never wait. Without JS or with reduced motion nothing is hidden.
import { registerEffect } from "..";

registerEffect({
  name: "reveal",
  selector: "[data-reveal]",
  setup({ conditions, gsap, ScrollTrigger }) {
    if (conditions.reduced) return;
    const below = gsap.utils
      .toArray<HTMLElement>("[data-reveal]")
      .filter((el) => el.getBoundingClientRect().top > innerHeight);
    if (below.length === 0) return;
    gsap.set(below, { opacity: 0, y: 12 });
    ScrollTrigger.batch(below, {
      start: "top 92%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power1.out",
          stagger: 0.06,
          // A leftover transform would make the block the containing block of anything fixed
          // inside it, and break 03's pin.
          clearProps: "opacity,transform",
        }),
    });
  },
});
