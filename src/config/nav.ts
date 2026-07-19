import {
  Bot,
  Brain,
  Cake,
  Cpu,
  Inbox,
  LayoutDashboard,
  Rocket,
  Server,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Short blurb used on the page header and tooltips. */
  description: string;
  /** Optional live badge (e.g. unread inbox count). */
  badgeKey?: "inbox";
}

/**
 * Primary navigation. The order here is the order in the sidebar.
 * `Headquarters` is the index route ("/").
 */
export const navItems: NavItem[] = [
  {
    title: "Headquarters",
    href: "/",
    icon: LayoutDashboard,
    description: "Your morning briefing — everything that matters, at a glance.",
  },
  {
    title: "CEO Inbox",
    href: "/inbox",
    icon: Inbox,
    description: "Approvals, recommendations, and messages awaiting your call.",
    badgeKey: "inbox",
  },
  {
    title: "CTO Office",
    href: "/cto",
    icon: Cpu,
    description: "Engineering health, the stack, deployments, and tech decisions.",
  },
  {
    title: "Mission Control",
    href: "/missions",
    icon: Rocket,
    description: "Every mission — owner, phase, progress, blockers, and history.",
  },
  {
    title: "AI Workforce",
    href: "/workforce",
    icon: Bot,
    description: "Your agents — what they run, and what they're working on now.",
  },
  {
    title: "Ruby",
    href: "/ruby",
    icon: Cake,
    description: "Ruby's Cake Delights — reservations, revenue, and growth.",
  },
  {
    title: "Company Memory",
    href: "/memory",
    icon: Brain,
    description: "Mission, vision, values, and the decisions that shaped us.",
  },
  {
    title: "Infrastructure",
    href: "/infrastructure",
    icon: Server,
    description: "VPS, source control, database, and service health.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Profile, preferences, and connected integrations.",
  },
];

/** Look up a nav item by pathname (exact match, or "/" for the index). */
export function navItemFor(pathname: string): NavItem | undefined {
  if (pathname === "/") return navItems[0];
  return navItems.find((item) => item.href !== "/" && pathname.startsWith(item.href));
}
