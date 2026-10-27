import { expect, test } from "@playwright/test";

// 14 studio (PRD §9.6): the corporate register, the contact block and the structured data.
test("the register is a table with row headers; identifiers stay LTR in Arabic", async ({
  page,
}) => {
  await page.goto("/ar/studio/");
  const table = page.locator("#register table");
  await expect(table.locator("tbody tr")).toHaveCount(8);
  await expect(table.locator('th[scope="row"]')).toHaveCount(8);
  const licence = table.locator("tr").nth(1).locator("td [dir=ltr]");
  await expect(licence).toHaveText("QFC 04998");
});

test("the home page shows the register's key rows", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("#studio table tbody tr")).toHaveCount(3);
  await expect(page.locator("#studio table")).toContainText("Makeena LLC");
});

for (const path of ["/en/studio/", "/ar/"]) {
  test(`contact block: text routes, placeholders never linked: ${path}`, async ({ page }) => {
    await page.goto(path);
    const contact = page.locator("#contact .contact");
    await expect(contact).toBeVisible();
    await expect(contact).toHaveCSS("background-color", "rgb(20, 20, 20)");
    await expect(contact.locator("dd")).toHaveCount(3);
    await expect(contact.locator('a[href^="tel:"], a[href^="mailto:"]')).toHaveCount(0);
    await expect(contact).toContainText("makeena.studio");
    await expect(contact.locator("img")).toHaveCount(0);
  });
}

for (const path of ["/en/studio/", "/ar/"]) {
  test(`structured data: Organization + ProfessionalService, no placeholders: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    expect(json).not.toContain("PLACEHOLDER");
    const graph = JSON.parse(json!)["@graph"];
    const org = graph.find((n: { "@type": string }) => n["@type"] === "Organization");
    const studio = graph.find((n: { "@type": string }) => n["@type"] === "ProfessionalService");
    expect(org.legalName).toBe("Makeena LLC");
    expect(org.identifier.value).toBe("04998");
    expect(org.address.addressCountry).toBe("QA");
    expect(studio.areaServed.map((c: { name: string }) => c.name)).toEqual(["QA", "AE", "SA"]);
    expect(studio.availableLanguage).toEqual(["en", "ar"]);
  });
}
