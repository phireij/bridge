import type { InboxItem } from "./types";

/**
 * The CEO Inbox: approvals that need Philip's call, recommendations from the
 * CTO office and growth, and the occasional operational notification.
 */
export const inbox: InboxItem[] = [
  {
    id: "i1",
    kind: "approval",
    title: "Approve Bridge v0.1 for production",
    from: "Atlas · CTO Copilot",
    preview:
      "All checks are green. Requesting sign-off to merge PR #1 and deploy the digital HQ to Vercel.",
    time: "08:24",
    level: "high",
    unread: true,
    actions: ["Approve & merge", "Request changes"],
  },
  {
    id: "i2",
    kind: "approval",
    title: "Reservation beta — Friday go-live",
    from: "HyperAgent · Engineering",
    preview:
      "Booking flow and email confirmations are ready on staging. Approve the Friday public beta?",
    time: "08:02",
    level: "high",
    unread: true,
    actions: ["Approve", "Hold"],
  },
  {
    id: "i3",
    kind: "recommendation",
    title: "Move product media to a CDN",
    from: "Atlas · CTO Copilot",
    preview:
      "The summer campaign will roughly 3× image traffic. Recommend a CDN before Aug 1 — ~¥0 at current volume.",
    time: "Yesterday",
    level: "high",
    unread: true,
    actions: ["Approve", "Defer"],
  },
  {
    id: "i4",
    kind: "approval",
    title: "Q3 growth budget allocation (¥200K)",
    from: "Hermes · Growth",
    preview:
      "Proposed split: ¥120K content & creators, ¥50K Q4 paid test, ¥30K tooling. Approve to lock it in.",
    time: "Yesterday",
    level: "medium",
    unread: true,
    actions: ["Approve", "Adjust"],
  },
  {
    id: "i5",
    kind: "message",
    title: "Wholesale inquiry — café in Urayasu",
    from: "Google Business Profile",
    preview:
      "A café is requesting a wholesale price list for a weekly cake supply. Worth a call.",
    time: "Yesterday",
    level: "medium",
    unread: false,
    actions: ["Draft reply"],
  },
  {
    id: "i6",
    kind: "recommendation",
    title: "Add a JP/EN toggle at checkout",
    from: "Hermes · Growth",
    preview:
      "Foreign residents drop at payment. An A/B test suggests +0.6pt conversion with a language toggle.",
    time: "Wed",
    level: "medium",
    unread: false,
    actions: ["Approve", "Defer"],
  },
  {
    id: "i7",
    kind: "recommendation",
    title: "Enable Stripe as a backup to Komoju",
    from: "Atlas · CTO Copilot",
    preview:
      "Adds card redundancy for foreign customers. Roughly one day of work; low risk.",
    time: "Wed",
    level: "medium",
    unread: false,
    actions: ["Approve", "Defer"],
  },
  {
    id: "i8",
    kind: "notification",
    title: "Yamato cold-chain rates updated",
    from: "Operations",
    preview:
      "Nationwide cold delivery rises 3% from Aug 1. Margin impact is minimal at current volumes.",
    time: "Tue",
    level: "low",
    unread: false,
  },
];
