// Phase 0 spike copy. English is from the brief / homepage UX doc.
// ARABIC IS AN UNREVIEWED DRAFT, written only to test fonts, RTL and CLS.
// It must not ship: Phase 5 replaces it with native-reviewed copy.
export const spikeCopy = {
  en: {
    draftNote: null,
    nav: { home: "Home", method: "Method", aerial: "Aerial" },
    eyebrowPlace: "DOHA",
    headline: "Every real estate developer is now a media company.",
    lede: "Most are not staffed like one.",
    cta: "See the four gates",
    positionLabel: "POSITION",
    position:
      "A broadcast studio that works at the speed of a content team. A content partner that finishes to the standard of a broadcast studio.",
    methodLabel: "METHOD",
    methodTitle: "Four gates.",
    methodLede: "Nothing reaches a client that has not cleared all of them.",
    heroAlt: "Generated image: a fictional slender residential tower on a waterfront at blue hour.",
    generated: "GENERATED",
  },
  ar: {
    draftNote: "AR DRAFT · NOT REVIEWED · FOR FONT AND RTL TESTING ONLY",
    nav: { home: "الرئيسية", method: "المنهجية", aerial: "التصوير الجوي" },
    eyebrowPlace: "الدوحة",
    headline: "كل مطوّر عقاري أصبح اليوم مؤسسة إعلامية.",
    lede: "ومعظمهم لا يملك الفريق المناسب لذلك.",
    cta: "اطّلع على البوابات الأربع",
    positionLabel: "الموقع",
    position:
      "استوديو بمعايير البث يعمل بسرعة فريق المحتوى. وشريك محتوى يُنجز أعماله بمعايير استوديو البث.",
    methodLabel: "المنهجية",
    methodTitle: "أربع بوابات.",
    methodLede: "لا يصل إلى العميل أي عمل لم يجتز البوابات الأربع كلها.",
    heroAlt: "صورة مولّدة: برج سكني نحيف متخيَّل على واجهة بحرية عند الغسق.",
    generated: "مولّدة",
  },
} as const;

export type SpikeLang = keyof typeof spikeCopy;
