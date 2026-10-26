import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// WCAG 2.2 AA (PRD §3.3). Any violation fails the run, so every PR keeps the count at zero.
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const { path } of routes) {
  test(`no axe violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
    expect(summary).toEqual([]);
  });
}
