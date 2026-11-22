import { describe, expect, it } from "vitest";
import { formatRelative } from "./index";

const today = new Date(2026, 10, 22); // 22 Nov 2026, local time

describe("formatRelative", () => {
  it("days and weeks", () => {
    expect(formatRelative("en", "2026-11-22", today)).toBe("today");
    expect(formatRelative("en", "2026-11-21", today)).toBe("yesterday");
    expect(formatRelative("en", "2026-11-08", today)).toBe("2 weeks ago");
  });

  it("rounds years down: 1 year 11 months ago is '1 year ago'", () => {
    expect(formatRelative("en", "2024-12-22", today)).toBe("last year");
    expect(formatRelative("en", "2024-11-22", today)).toBe("2 years ago");
  });

  it("rounds months down and never says 0", () => {
    expect(formatRelative("en", "2026-10-01", today)).toBe("last month");
    expect(formatRelative("en", "2025-12-01", today)).toBe("11 months ago");
  });

  it("localises", () => {
    expect(formatRelative("tr", "2024-11-22", today)).toBe("2 yıl önce");
  });
});
