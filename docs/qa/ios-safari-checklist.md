# iOS Safari check (Phase 2 transitions)

**Why:** no real iPhone has tested the site yet, and the page transitions (11, 12) must be checked on one before `phase-2/transitions` merges (decision 0010).

**What you need:** an iPhone on iOS 18.2 or later (Settings › General › About › iOS Version), or a real-device session on BrowserStack or LambdaTest (free trial; choose a real iPhone with Safari, not a simulator). About 10 minutes.

**Where:** the PR's preview address, e.g. `https://phase-2-transitions-makeena-website.makeena.workers.dev/en/`.

Tick each box, and note anything odd: a screenshot or screen recording is ideal.

## Page transition (11 section-cut)

- [ ] On `/en/`, tap **Privacy** in the footer. A thin copper line with two **A** markers sweeps **left to right**, revealing the new page behind it. No white flash.
- [ ] Do the same on `/ar/` (Privacy is الخصوصية). The line sweeps **right to left**.
- [ ] Open the **Menu**, tap **Method**. The sweep runs and the menu is closed on the new page.
- [ ] Tap the browser's **Back** button. The previous page comes back (any sweep direction is fine).
- [ ] On `/en/`, scroll all the way down and tap **Privacy** in the footer. The sweep runs and the Privacy page stays up: no "A problem repeatedly occurred" message, no reload. (Playwright's Windows WebKit crashes on exactly this; we need to know whether real Safari does.)

## Language switch (12 mirror-line)

- [ ] On `/en/method/`, scroll to **02 · PROVENANCE**, then tap **عربي** in the bar. The line starts in the **middle** and splits to both edges; the Arabic page opens at the same section.
- [ ] Tap **English** to switch back. Same split, same section.
- [ ] Nothing jumps or shifts once the Arabic text appears.

## Reduced motion

- [ ] Turn on Settings › Accessibility › Motion › **Reduce Motion**. Navigating and switching language now change the page **instantly**, with no line.
- [ ] Turn Reduce Motion off again. In the site footer, tap **Reduce motion**: transitions stop. Tap it again: they come back.

## Also check while you're there

- [ ] Swipe back from the left edge (Safari's own gesture). It works without a double animation.
- [ ] Tap an image's **ⓘ**: the provenance sheet opens; tapping outside or **Close** closes it.
- [ ] Rotate the phone on a page with images: nothing breaks.

**Send back:** "all ticked", or the unticked items with notes. iOS version and Safari version help too.
