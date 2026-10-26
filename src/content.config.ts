import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { locales, routeKeys } from "./i18n/config";

// Content model (PRD §10.1). Copy that the brief or the founder still has to supply is written as
// `[PLACEHOLDER: …]`; Arabic files are unreviewed drafts until Phase 5 (decision 0005).
// tests/unit/content.test.ts checks that every route has both locales with matching section ids.

const lang = z.enum(locales);
const localized = z.object({ en: z.string(), ar: z.string() });
const anchor = z.string().regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens");

const link = z.object({
  text: z.string(),
  route: z.enum(routeKeys),
  hash: anchor.optional(),
});

const section = z.object({
  /** Anchor id. The same in both locales so the language switch keeps the reader's place. */
  id: anchor,
  /** Mono section label, Western digits: `01 · POSITION`. */
  label: z.string(),
  heading: z.string().optional(),
  body: z.array(z.string()).default([]),
  links: z.array(link).default([]),
});

/** One file per route and locale: src/content/pages/{lang}/{route}.json. */
const pages = defineCollection({
  loader: glob({ pattern: "*/*.json", base: "./src/content/pages" }),
  schema: z.object({
    route: z.enum(routeKeys),
    lang,
    title: z.string(),
    description: z.string(),
    label: z.string(),
    heading: z.string(),
    lede: z.string().optional(),
    sections: z.array(section).default([]),
  }),
});

/** Three lead services (with their own pages) and the register of eight. */
const services = defineCollection({
  loader: file("./src/content/services.json"),
  schema: z.object({
    kind: z.enum(["lead", "register"]),
    order: z.number().int(),
    route: z.enum(routeKeys).optional(),
    name: localized,
    summary: localized,
  }),
});

const gates = defineCollection({
  loader: file("./src/content/gates.json"),
  schema: z.object({
    number: z.string().regex(/^0[1-4]$/),
    name: localized,
    description: localized,
  }),
});

/** Corporate register rows on /studio/#register. */
const register = defineCollection({
  loader: file("./src/content/register.json"),
  schema: z.object({
    order: z.number().int(),
    key: localized,
    value: localized,
    /** Identifiers (licence, tax number, phone) stay Western digits and LTR in Arabic. */
    ltr: z.boolean().default(false),
  }),
});

const site = defineCollection({
  loader: file("./src/content/site.json"),
  schema: z.object({
    legalLine: z.string(),
    copyrightHolder: z.string(),
  }),
});

export const collections = { pages, services, gates, register, site };
