/**
 * Global, non-secret configuration for Bridge.
 * Edit these values to rebrand the headquarters to your company.
 */
export const site = {
  /** Product name — the digital HQ itself. */
  name: "Bridge",
  /** Short descriptor shown under the wordmark. */
  short: "Digital HQ",
  /** Parent company / studio. */
  company: "Kakehashi",
  version: "0.1.0",
  description:
    "Bridge — the digital headquarters where the CEO starts every morning.",
  ceo: {
    name: "Philip",
    title: "Founder & CEO",
    initials: "P",
  },
  timezone: "Asia/Tokyo",
  locale: "en-US",
} as const;

export type Site = typeof site;
