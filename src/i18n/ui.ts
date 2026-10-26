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
  menu: string;
  /** Label of the switch to this locale, written in this locale's own language. */
  languageName: string;
  footerNav: string;
  entity: string;
  privacy: string;
  reduceMotion: string;
  rights: string;
  notFound: { label: string; heading: string; body: string; home: string };
  /** 08 spec sheet (PRD §8.3). */
  provenance: {
    open: string;
    close: string;
    heading: string;
    id: string;
    type: string;
    types: Record<"image" | "sequence" | "video", string>;
    camera: string;
    light: string;
    aircraft: string;
    noAircraft: string;
    gates: string;
    gatesPending: string;
    source: string;
    sources: Record<
      "trainedAlgorithmicMedia" | "compositeWithTrainedAlgorithmicMedia" | "digitalCapture",
      string
    >;
    metadata: string;
    metadataOnMaster: string;
    metadataPending: string;
    rights: string;
    generated: string;
  };
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
    menu: "Menu",
    languageName: "English",
    footerNav: "Footer",
    entity: "Entity",
    privacy: "Privacy",
    reduceMotion: "Reduce motion",
    rights: "All rights reserved.",
    notFound: {
      label: "404 · NOT FOUND",
      heading: "This page does not exist.",
      body: "The address may have changed, or the page was never published.",
      home: "Return to the home page",
    },
    provenance: {
      open: "Provenance",
      close: "Close",
      heading: "Provenance",
      id: "Asset ID",
      type: "Type",
      types: { image: "Still image", sequence: "Frame sequence", video: "Video" },
      camera: "Virtual camera",
      light: "Light",
      aircraft: "Aircraft",
      noAircraft: "None · no permit",
      gates: "Gates cleared",
      gatesPending: "Concept render · not yet through the gates",
      source: "Source",
      sources: {
        trainedAlgorithmicMedia: "Generated with AI",
        compositeWithTrainedAlgorithmicMedia: "3D render restyled with AI",
        digitalCapture: "Photograph",
      },
      metadata: "Metadata",
      metadataOnMaster: "Retained on master file",
      metadataPending: "Not yet embedded in the master file",
      rights: "Rights",
      generated: "Generated",
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
    menu: "القائمة",
    languageName: "عربي",
    footerNav: "تذييل الصفحة",
    entity: "الكيان",
    privacy: "الخصوصية",
    reduceMotion: "تقليل الحركة",
    rights: "جميع الحقوق محفوظة.",
    notFound: {
      label: "404 · الصفحة غير موجودة",
      heading: "هذه الصفحة غير موجودة.",
      body: "ربما تغيّر العنوان، أو لم تُنشر الصفحة أصلاً.",
      home: "العودة إلى الصفحة الرئيسية",
    },
    provenance: {
      open: "المصدر",
      close: "إغلاق",
      heading: "المصدر",
      id: "معرّف الملف",
      type: "النوع",
      types: { image: "صورة ثابتة", sequence: "تسلسل إطارات", video: "فيديو" },
      camera: "الكاميرا الافتراضية",
      light: "الإضاءة",
      aircraft: "الطائرة",
      noAircraft: "لا يوجد · بلا تصريح",
      gates: "البوابات المجتازة",
      gatesPending: "تصوّر أولي · لم يمر بالبوابات بعد",
      source: "المصدر",
      sources: {
        trainedAlgorithmicMedia: "مولّدة بالذكاء الاصطناعي",
        compositeWithTrainedAlgorithmicMedia: "تصيير ثلاثي الأبعاد معدّل بالذكاء الاصطناعي",
        digitalCapture: "صورة فوتوغرافية",
      },
      metadata: "البيانات الوصفية",
      metadataOnMaster: "محفوظة في الملف الأصلي",
      metadataPending: "لم تُضمَّن في الملف الأصلي بعد",
      rights: "الحقوق",
      generated: "مولّدة",
    },
  },
};
