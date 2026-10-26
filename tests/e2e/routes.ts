// Every page the e2e suite visits: all PRD §5 routes in both locales.
import { dirOf, locales, pathTo, routeKeys } from "../../src/i18n/config";

export const routes = locales.flatMap((lang) =>
  routeKeys.map((route) => ({ lang, dir: dirOf(lang), route, path: pathTo(lang, route) })),
);
