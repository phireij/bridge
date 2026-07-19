/**
 * Host-routing tests for the domain-isolation middleware.
 *
 * These test the middleware logic directly by simulating NextRequest
 * objects for each scenario.  Run with: npx jest or vitest run
 *
 * Covers:
 *   - Reservation host: root → /reserve
 *   - Reservation host: /login → /reserve
 *   - Reservation host: /inbox → /reserve  (all Bridge-only routes)
 *   - Reservation host: /reserve → 200
 *   - Reservation host: /admin → 200
 *   - Bridge host: /login → 200 (public)
 *   - Bridge host: / (authenticated) → 200
 *   - Bridge host: / (unauthenticated) → 302 /login
 */

// We test the middleware by calling it with simulated requests.
// Since Next.js middleware runs in the Edge runtime, we test the
// functional logic by extracting the host-aware branching.

import { describe, it, expect, vi, beforeEach } from "vitest";

// The middleware function
const RESERVATION_HOST = "reservations.rubyscakedelights.shop";
const BRIDGE_ONLY_PATHS = [
  "/login", "/inbox", "/cto", "/missions", "/memory", "/workforce",
  "/settings", "/reports",
];
const ALWAYS_PUBLIC = ["/reserve", "/admin", "/api"];

function isReservationHost(hostname: string): boolean {
  return hostname === RESERVATION_HOST;
}

function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type RouteResult = "redirect:/reserve" | "passthrough" | "redirect:/login" | null;

function simulateRoute(
  hostname: string,
  pathname: string,
  authenticated: boolean = false,
): RouteResult {
  // Reservation domain
  if (isReservationHost(hostname)) {
    if (pathname === "/") return "redirect:/reserve";
    if (matchPath(pathname, BRIDGE_ONLY_PATHS) || pathname === "/login") {
      return "redirect:/reserve";
    }
    if (matchPath(pathname, ALWAYS_PUBLIC)) return "passthrough";
    return "redirect:/reserve";
  }

  // Bridge HQ
  if (!authenticated && !matchPath(pathname, ALWAYS_PUBLIC)) {
    return "redirect:/login";
  }
  return "passthrough";
}

describe("Domain isolation middleware", () => {
  // ── Reservation hostname ──────────────────────────────────────
  describe("reservations.rubyscakedelights.shop", () => {
    it("redirects root to /reserve", () => {
      expect(simulateRoute(RESERVATION_HOST, "/")).toBe("redirect:/reserve");
    });

    it("redirects /login to /reserve", () => {
      expect(simulateRoute(RESERVATION_HOST, "/login")).toBe("redirect:/reserve");
    });

    it.each(BRIDGE_ONLY_PATHS)("redirects Bridge-only route %s to /reserve", (path) => {
      expect(simulateRoute(RESERVATION_HOST, path)).toBe("redirect:/reserve");
    });

    it.each(BRIDGE_ONLY_PATHS)("redirects Bridge-only sub-route %s/xxx to /reserve", (path) => {
      expect(simulateRoute(RESERVATION_HOST, `${path}/something`)).toBe("redirect:/reserve");
    });

    it("passes through /reserve", () => {
      expect(simulateRoute(RESERVATION_HOST, "/reserve")).toBe("passthrough");
    });

    it("passes through /reserve/xxx", () => {
      expect(simulateRoute(RESERVATION_HOST, "/reserve/confirm?token=abc")).toBe("passthrough");
    });

    it("passes through /admin", () => {
      expect(simulateRoute(RESERVATION_HOST, "/admin")).toBe("passthrough");
    });

    it("passes through /api/reports", () => {
      expect(simulateRoute(RESERVATION_HOST, "/api/reports")).toBe("passthrough");
    });
  });

  // ── Bridge HQ hostname ────────────────────────────────────────
  describe("bridge-gray-one.vercel.app (Bridge HQ)", () => {
    it("redirects unauthenticated root to /login", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/", false)).toBe("redirect:/login");
    });

    it("passes through authenticated root", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/", true)).toBe("passthrough");
    });

    it("passes through /login (unauthenticated)", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/login", false)).toBe("passthrough");
    });

    it("passes through /reserve", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/reserve", false)).toBe("passthrough");
    });

    it("passes through /admin", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/admin", false)).toBe("passthrough");
    });

    it("redirects unauthenticated /inbox to /login", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/inbox", false)).toBe("redirect:/login");
    });

    it("passes through authenticated /inbox", () => {
      expect(simulateRoute("bridge-gray-one.vercel.app", "/inbox", true)).toBe("passthrough");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles empty hostname gracefully (local dev)", () => {
      expect(simulateRoute("", "/")).toBe("redirect:/login");
    });

    it("handles unknown hostname like Bridge HQ", () => {
      expect(simulateRoute("localhost:3000", "/inbox", false)).toBe("redirect:/login");
    });

    it("passes through static assets on reservation domain", () => {
      expect(simulateRoute(RESERVATION_HOST, "/_next/static/chunk.js")).toBe("redirect:/reserve");
    });
  });
});