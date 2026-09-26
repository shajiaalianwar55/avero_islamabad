import { describe, expect, it } from "vitest";
import { assessSafetyRules } from "@/lib/safety/rules";
import { classifyOutcome } from "@/lib/ai/triage";
import { parseIncident } from "@/lib/ai/intake";
import { scoreOffers } from "@/lib/scoring/offers";
import {
  warrantyExpiresAt,
  warrantyRemainingDays,
} from "@/lib/history/warranty";
import type { ScoredOffer } from "@/lib/scoring/offers";

describe("safety rules", () => {
  it("emergency electrical fixture blocks DIY", () => {
    const result = assessSafetyRules("Socket buzzing and burning smell");
    expect(result.stop_troubleshooting).toBe(true);
    expect(result.level).toBe("emergency");
  });
});

describe("triage fixtures", () => {
  it("safe low-risk AC path prefers DIY", async () => {
    const intake = await parseIncident(
      "AC airflow weak, filter appears dirty, no electrical warning signs"
    );
    const decision = await classifyOutcome({
      description: "AC airflow weak, filter appears dirty, no electrical warning signs",
      intake,
      answers: ["Filter dirty, no electrical warnings"],
      emergency: false,
    });
    expect(decision.outcome).toBe("DIY");
  });

  it("specialist plumbing path prefers technician", async () => {
    const intake = await parseIncident("There is water under my kitchen sink.");
    const decision = await classifyOutcome({
      description: "There is water under my kitchen sink.",
      intake,
      answers: ["Only when water runs", "Under-sink pipe / P-trap"],
      emergency: false,
    });
    expect(decision.outcome).toBe("TECHNICIAN");
  });
});

describe("offer ranking", () => {
  it("ranks deterministically", () => {
    const scored = scoreOffers([
      {
        id: "1",
        provider_id: "p1",
        estimated_total_min: 5000,
        earliest_arrival: new Date(Date.now() + 3600000).toISOString(),
        warranty_days: 3,
        provider: { rating: 4, trade: "plumbing", areas: ["F-10"] },
        requestedTrade: "plumbing",
        requestedArea: "F-10",
      },
      {
        id: "2",
        provider_id: "p2",
        estimated_total_min: 2500,
        earliest_arrival: new Date(Date.now() + 7200000).toISOString(),
        warranty_days: 14,
        provider: { rating: 4.8, trade: "plumbing", areas: ["F-10"] },
        requestedTrade: "plumbing",
        requestedArea: "F-10",
      },
    ]);
    expect(scored[0]?.badges.includes("Recommended")).toBe(true);
    expect(scored.some((s: ScoredOffer) => s.badges.includes("Cheapest"))).toBe(true);
    expect(
      scored.some((s: ScoredOffer) => s.badges.includes("Longest warranty"))
    ).toBe(true);
  });
});

describe("warranty", () => {
  it("returns null when missing warranty", () => {
    expect(warrantyExpiresAt(new Date(), null)).toBeNull();
    expect(warrantyRemainingDays(null)).toBeNull();
  });

  it("calculates remaining days", () => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 12);
    expect(warrantyRemainingDays(expires.toISOString())).toBe(12);
  });
});
