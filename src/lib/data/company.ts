import type { CompanyProfile, CompanyValue } from "./types";

export const company: CompanyProfile = {
  name: "Kakehashi",
  codename: "Bridge",
  tagline: "The bridge between vision and execution.",
  mission:
    "Build a portfolio of small, profitable, AI-operated businesses that serve both Japanese and international residents in Japan — starting with Ruby's Cake Delights.",
  vision:
    "A company where a lean human team and an AI workforce run world-class operations together — one bridge at a time.",
  ceo: "Philip",
  founded: "2024",
  hq: "Ichikawa, Chiba · Japan",
  timezone: "Asia/Tokyo",
  stage: "Bootstrapped · Seed",
};

export const companyValues: CompanyValue[] = [
  {
    title: "Ship small, ship real",
    description: "MVPs over master plans. Momentum compounds; perfection stalls.",
  },
  {
    title: "Bilingual by default",
    description: "Everything works in Japanese and English — products, emails, support.",
  },
  {
    title: "AI-operated, human-directed",
    description: "Agents do the work; humans set the direction and hold the taste.",
  },
  {
    title: "Profit is oxygen",
    description: "Every venture earns its keep. Revenue is the truest form of validation.",
  },
  {
    title: "Own the stack",
    description: "We control our tools, our data, and our destiny.",
  },
];
