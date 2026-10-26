import type { Lang, RouteKey } from "./config";

// Interface strings. English follows docs/reference/homepage-ux.md.
// ARABIC IS AN UNREVIEWED DRAFT (decision 0005): every page in /ar/ shows the draft banner until
// a native editor signs it off in Phase 5.

interface Ui {
  /** Shown at the top of every page while the locale's copy is unreviewed; null when reviewed. */
  draftNotice: string | null;
  skipLink: string;
  primaryNav: string;
  nav: Partial<Record<RouteKey, string>>;
  sendBrief: string;
  /** Label of the switch to this locale, written in this locale's own language. */
  languageName: string;
  footerNav: string;
  entity: string;
  privacy: string;
  rights: string;
  notFound: { label: string; heading: string; body: string; home: string };
}

export const ui: Record<Lang, Ui> = {
  en: {
    draftNotice: null,
    skipLink: "Skip to content",
    primaryNav: "Primary",
    nav: {
      capability: "Capability",
      method: "Method",
      engagement: "Engagement",
      studio: "Studio",
    },
    sendBrief: "Send a brief",
    languageName: "English",
    footerNav: "Footer",
    entity: "Entity",
    privacy: "Privacy",
    rights: "All rights reserved.",
    notFound: {
      label: "404 · NOT FOUND",
      heading: "This page does not exist.",
      body: "The address may have changed, or the page was never published.",
      home: "Return to the home page",
    },
  },
  ar: {
    draftNotice: "AR DRAFT · NOT REVIEWED",
    skipLink: "انتقل إلى المحتوى",
    primaryNav: "التنقل الرئيسي",
    nav: {
      capability: "القدرات",
      method: "المنهجية",
      engagement: "التعاقد",
      studio: "الاستوديو",
    },
    sendBrief: "أرسل موجزاً",
    languageName: "عربي",
    footerNav: "تذييل الصفحة",
    entity: "الكيان",
    privacy: "الخصوصية",
    rights: "جميع الحقوق محفوظة.",
    notFound: {
      label: "404 · الصفحة غير موجودة",
      heading: "هذه الصفحة غير موجودة.",
      body: "ربما تغيّر العنوان، أو لم تُنشر الصفحة أصلاً.",
      home: "العودة إلى الصفحة الرئيسية",
    },
  },
};
