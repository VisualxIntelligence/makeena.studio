# 0017 — The exploded axonometric (06), static for now

**Date:** 27 October 2026 · **Phase:** 3 · **Status:** proposed (founder review on the preview)

## Generated layers don't hold the camera

Decision 0013 said to attempt 06's six layers in Higgsfield when this PR started, and to ship static if they couldn't be made. Two GPT Image 2.5 edits of `MKN-AXO-CAM01-EXPLODED` asked for a single layer kept at its exact position, with everything else removed:

| Layer | Job | Result |
|---|---|---|
| Roof and plant (the least hidden) | `1d691db1…` | Isolated cleanly, but redrawn at about half the size and moved up and to the side. |
| Floor plates (the most hidden) | `9ccbdb00…` | Moved and shrunk, and part of the block was missing. |

Overlaid on the original, neither lines up. Six layers from separate edits would never reassemble into one building, so the attempt stopped at two (5.5 credits; balance 113.68).

**06 needs the PRD's production route** (§9.4): a massing model rendered per layer from one fixed axonometric camera, then a style pass masked back per layer.

## What ships (PRD §9.4's reduced-motion and no-JS state)

`Axonometric.astro` on `/capability/off-plan-visualisation/`, after 04:

- **The layer list.** The fully exploded drawing (the existing render, through `ProvenanceFigure`) and the six layers as a real `<ol>`, in DOM order from foundations to roof. The figure is `aria-describedby` the list.
- **Desktop.** The drawing takes half the width. Each label sits level with its layer, positioned by fractions of the drawing's height. A copper leader line runs back to the drawing's edge, which is about 15% in from either side, because the drawing is nearly symmetric.
  - The lines draw in once as the section comes into view (a G1 effect).
  - Without motion or JS they are simply drawn.
- **Phones.** Numbers sit on the drawing level with each layer, and the labels form a numbered legend under it.
- **RTL.** The labels and lines move to the other side through logical properties. The drawing doesn't mirror.
- **Arabic layer names are drafts** for native review.

## When real layers exist

The PRD's animated version becomes possible:

- a pinned ScrollTrigger timeline that separates the six cut-outs on Y;
- leader lines drawn with `stroke-dashoffset`;
- this static state as its fallback.

The list, the label positions and the RTL rules carry over.
