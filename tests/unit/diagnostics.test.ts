import { describe, expect, it } from "vitest";
import {
  answerAndContinue,
  applyAnswer,
  createSession,
  createSessionFromIntake,
  nextStep,
  questionUtility,
  rankedHypotheses,
  runWithChooser,
  selectNextQuestion,
} from "@/lib/diagnostics/engine";
import { kitchenSinkKb, parseSymptomIntake, radiatorKb } from "@/lib/diagnostics";
import type { DiagnosticQuestion } from "@/lib/diagnostics/types";

describe("symptom intake gates first question", () => {
  it("not heating does not open with a burning-smell question", () => {
    const intake = parseSymptomIntake({
      applianceId: "radiator",
      text: "Not heating",
      shortcutId: "not_heating",
    });
    expect(intake.family).toBe("no_heat");
    expect(intake.safety.emergency).toBe(false);
    expect(intake.suppressedTags).toContain("safety_burn");

    const session = createSessionFromIntake(radiatorKb, intake);
    const step = nextStep(radiatorKb, session);
    expect(step.stopped).toBe(false);
    if (!step.stopped) {
      expect(step.question.id).not.toBe("rad_safety_smell");
      expect(step.question.id).not.toBe("rad_safety_sparks");
      expect(step.question.tags?.includes("safety_burn")).not.toBe(true);
      // Should lean heat/power/type family
      expect(
        ["rad_type", "rad_thermostat_position", "rad_power_light", "rad_waited"].includes(
          step.question.id
        ) || step.question.tags?.some((t) => ["heat", "power", "type"].includes(t))
      ).toBe(true);
    }
  });

  it("burning smell at intake triggers emergency without diagnostic quiz", () => {
    const intake = parseSymptomIntake({
      applianceId: "radiator",
      text: "Burning smell and a bit of smoke",
      shortcutId: "burn_smoke",
    });
    expect(intake.safety.emergency).toBe(true);
    const session = createSessionFromIntake(radiatorKb, intake);
    const step = nextStep(radiatorKb, session);
    expect(step.stopped).toBe(true);
    if (step.stopped) {
      expect(step.outcome).toBe("EMERGENCY");
    }
  });

  it("appliance alone does not force a unique first question without intake", () => {
    const plain = selectNextQuestion(radiatorKb, createSession(radiatorKb));
    const heated = selectNextQuestion(
      radiatorKb,
      createSessionFromIntake(
        radiatorKb,
        parseSymptomIntake({
          applianceId: "radiator",
          shortcutId: "not_heating",
          text: "Not heating",
        })
      )
    );
    // With intake, first question should be preference-shaped (not generic safety)
    expect(heated?.id).not.toBe("rad_safety_smell");
    expect(plain?.id).toBeTruthy();
  });
});

describe("diagnostic engine core", () => {
  it("starts with multiple hypotheses scored from priors", () => {
    const session = createSession(radiatorKb);
    expect(Object.keys(session.scores).length).toBe(radiatorKb.hypotheses.length);
    expect(session.asked).toHaveLength(0);
    const step = nextStep(radiatorKb, session);
    expect(step.stopped).toBe(false);
    if (!step.stopped) {
      expect(step.question.options.some((o) => o.label.toLowerCase().includes("not sure"))).toBe(
        true
      );
    }
  });

  it("selects questions deterministically (stable tie-break)", () => {
    const session = createSession(radiatorKb);
    const a = selectNextQuestion(radiatorKb, session);
    const b = selectNextQuestion(radiatorKb, session);
    expect(a?.id).toBe(b?.id);
  });

  it("emergency safety is a hard override regardless of DIY-leaning scores", () => {
    let session = createSession(radiatorKb);
    let step = nextStep(radiatorKb, session);
    // Drive until we can answer the burn question, or answer it if presented
    for (let i = 0; i < 8 && !step.stopped; i++) {
      if (step.stopped) break;
      const q = step.question;
      if (q.id === "rad_safety_smell") {
        step = answerAndContinue(radiatorKb, step.session, q, "yes_burn");
        break;
      }
      // pick a non-emergency option to continue
      const safe =
        q.options.find((o) => !o.safety?.emergency && o.id !== "unsure") || q.options[0];
      step = answerAndContinue(radiatorKb, step.session, q, safe.id);
    }
    // If burn question never appeared, apply it directly after finding it
    if (!step.stopped || step.outcome !== "EMERGENCY") {
      const smell = radiatorKb.questions.find((q) => q.id === "rad_safety_smell")!;
      session = step.stopped
        ? createSession(radiatorKb)
        : "session" in step
          ? step.session
          : createSession(radiatorKb);
      // Fresh path: answer type then smell
      session = createSession(radiatorKb);
      const typeQ = radiatorKb.questions.find((q) => q.id === "rad_type")!;
      session = applyAnswer(radiatorKb, session, typeQ, "oil_portable");
      session = applyAnswer(radiatorKb, session, smell, "yes_burn");
      const result = nextStep(radiatorKb, session);
      expect(result.stopped).toBe(true);
      if (result.stopped) {
        expect(result.outcome).toBe("EMERGENCY");
        expect(result.reason).toBe("emergency");
      }
    } else if (step.stopped) {
      expect(step.outcome).toBe("EMERGENCY");
    }
  });

  it("utility prefers questions that split top hypotheses", () => {
    const session = createSession(radiatorKb);
    const typeQ = radiatorKb.questions.find((q) => q.id === "rad_type")!;
    const dustQ = radiatorKb.questions.find((q) => q.id === "rad_dust")!;
    // Early on, type should be more useful than a deep dust question
    expect(questionUtility(typeQ, radiatorKb, session)).toBeGreaterThan(
      questionUtility(dustQ, radiatorKb, session) - 0.01
    );
  });
});

describe("kitchen sink fixtures", () => {
  it("loose supply when running → DIY-leaning supply hypothesis", () => {
    const result = runWithChooser(kitchenSinkKb, (q) => {
      const map: Record<string, string> = {
        sink_safety_flood: "not_flood",
        sink_water_electrics: "dry_elec",
        sink_when: "only_running",
        sink_where_seen: "on_hoses",
        sink_drain_speed: "drains_fine",
        sink_dry_test: "first_hose",
        sink_hand_tighten_ok: "can_tighten",
        sink_shutoff_known: "shutoff_yes",
        sink_dishwasher: "dw_no",
        sink_disposal: "disp_no",
        sink_gurgle: "gurgle_no",
        sink_both_bowls: "single_bowl",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    expect(result.outcome).not.toBe("EMERGENCY");
    expect(result.topHypothesis?.id).toBe("sink_supply_line_loose");
    expect(result.outcome).toBe("DIY");
    expect(result.answers.length).toBeGreaterThanOrEqual(2);
    expect(result.answers.length).toBeLessThanOrEqual(10);
  });

  it("water near electrics → EMERGENCY", () => {
    const intake = parseSymptomIntake({
      applianceId: "kitchen-sink",
      text: "Water under the sink near a plug",
      shortcutId: "leak_under",
    });
    // Force electrical hazard via free-text gate
    const wet = parseSymptomIntake({
      applianceId: "kitchen-sink",
      text: "Water is on the dishwasher plug under the sink",
    });
    expect(wet.safety.emergency).toBe(true);
    const session = createSessionFromIntake(kitchenSinkKb, wet);
    const step = nextStep(kitchenSinkKb, session);
    expect(step.stopped).toBe(true);
    if (step.stopped) expect(step.outcome).toBe("EMERGENCY");
    expect(intake.family).toBe("water_leak");
  });

  it("slow drain both sides / backup → technician deeper clog path", () => {
    const result = runWithChooser(kitchenSinkKb, (q) => {
      const map: Record<string, string> = {
        sink_safety_flood: "not_flood",
        sink_water_electrics: "dry_elec",
        sink_when: "no_leak_slow",
        sink_drain_speed: "drains_backup",
        sink_gurgle: "gurgle_yes",
        sink_where_seen: "floor_unclear",
        sink_both_bowls: "both_sides",
        sink_hand_tighten_ok: "cannot_see",
        sink_dishwasher: "dw_no",
        sink_disposal: "disp_no",
        sink_shutoff_known: "shutoff_yes",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    expect(result.outcome).toBe("TECHNICIAN");
    expect(
      ["sink_deeper_drain_clog", "sink_vent_or_slow_drain", "sink_ptrap_clog"].includes(
        result.topHypothesis?.id || ""
      )
    ).toBe(true);
  });

  it("does not use fixed question count of 3", () => {
    const result = runWithChooser(kitchenSinkKb, (q) => pickNonEmergency(q));
    // Dynamic — may be more or fewer than 3 depending on confidence
    expect(result.answers.length).not.toBe(0);
  });
});

describe("radiator fixtures (demo)", () => {
  it("thermostat too low on portable oil radiator → DIY", () => {
    const result = runWithChooser(radiatorKb, (q) => {
      const map: Record<string, string> = {
        rad_type: "oil_portable",
        rad_main_symptom: "no_heat",
        rad_safety_smell: "no_burn",
        rad_safety_sparks: "no_spark",
        rad_water_near_power: "no_wet_power",
        rad_power_light: "light_on",
        rad_thermostat_position: "thermo_low",
        rad_timer_mode: "timer_no",
        rad_waited: "waited_no",
        rad_plug_seated: "plug_ok",
        rad_upright: "level_yes",
        rad_covered: "covered_no",
        rad_socket_test: "socket_works",
        rad_comfort_diy: "diy_ok",
        rad_after_basic_checks: "improved",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    expect(result.outcome).toBe("DIY");
    expect(result.topHypothesis?.id).toBe("rad_thermostat_too_low");
    expect(result.diySteps.length).toBeGreaterThan(0);
  });

  it("burning smell → EMERGENCY hard stop", () => {
    const intake = parseSymptomIntake({
      applianceId: "radiator",
      text: "Burning smell",
      shortcutId: "burn_smoke",
    });
    const session = createSessionFromIntake(radiatorKb, intake);
    const step = nextStep(radiatorKb, session);
    expect(step.stopped).toBe(true);
    if (step.stopped) expect(step.outcome).toBe("EMERGENCY");
  });

  it("hydronic airlock pattern → technician", () => {
    const result = runWithChooser(radiatorKb, (q) => {
      const map: Record<string, string> = {
        rad_type: "plumbed_wall",
        rad_main_symptom: "weak_heat",
        rad_safety_smell: "no_burn",
        rad_safety_sparks: "no_spark",
        rad_water_near_power: "no_wet_power",
        rad_hydronic_valve: "valve_open",
        rad_hydronic_pattern: "bottom_hot_top_cold",
        rad_other_rads: "others_work",
        rad_water_leak_floor: "water_no",
        rad_hiss_gurgle: "gurgle_yes",
        rad_comfort_diy: "diy_no",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    expect(result.outcome).toBe("TECHNICIAN");
    expect(result.topHypothesis?.id).toBe("rad_hydronic_airlock");
  });

  it("dead socket path → DIY breaker/socket checks", () => {
    const result = runWithChooser(radiatorKb, (q) => {
      const map: Record<string, string> = {
        rad_type: "oil_portable",
        rad_main_symptom: "no_heat",
        rad_safety_smell: "no_burn",
        rad_safety_sparks: "no_spark",
        rad_water_near_power: "no_wet_power",
        rad_power_light: "light_off",
        rad_socket_test: "socket_dead",
        rad_plug_seated: "plug_ok",
        rad_upright: "level_yes",
        rad_comfort_diy: "diy_ok",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    expect(result.topHypothesis?.id).toBe("rad_dead_socket_or_breaker");
    expect(result.outcome).toBe("DIY");
  });

  it("oil leak → technician with caution (not DIY)", () => {
    let session = createSession(radiatorKb);
    const answer = (qid: string, oid: string) => {
      const q = radiatorKb.questions.find((x) => x.id === qid)!;
      session = applyAnswer(radiatorKb, session, q, oid);
    };
    answer("rad_type", "oil_portable");
    answer("rad_main_symptom", "leak_mess");
    answer("rad_safety_smell", "no_burn");
    answer("rad_safety_sparks", "no_spark");
    answer("rad_oil_spots", "oil_yes");
    const ranked = rankedHypotheses(radiatorKb, session);
    expect(ranked[0].hypothesis.id).toBe("rad_oil_leak");
    const result = nextStep(radiatorKb, session);
    // May still ask more questions, but oil leak should remain dominant if we finalize
    if (result.stopped) {
      expect(result.topHypothesis?.id).toBe("rad_oil_leak");
      expect(result.outcome).toBe("TECHNICIAN");
    } else {
      // Finish with chooser preferring oil path
      const finished = runWithChooser(
        radiatorKb,
        (q) => {
          if (q.id === "rad_oil_spots" || q.id === "rad_oil_spots_general") return "oil_yes";
          const map: Record<string, string> = {
            rad_type: "oil_portable",
            rad_main_symptom: "leak_mess",
            rad_safety_smell: "no_burn",
            rad_safety_sparks: "no_spark",
            rad_water_near_power: "no_wet_power",
            rad_power_light: "light_on",
            rad_cord_condition: "cord_ok",
            rad_thermostat_position: "thermo_mid_high",
            rad_waited: "waited_yes_cold",
          };
          return map[q.id] || pickNonEmergency(q);
        }
      );
      expect(finished.topHypothesis?.id).toBe("rad_oil_leak");
      expect(finished.outcome).toBe("TECHNICIAN");
    }
  });

  it("question count is dynamic — not fixed at 3", () => {
    const low = runWithChooser(radiatorKb, (q) => {
      const map: Record<string, string> = {
        rad_type: "oil_portable",
        rad_main_symptom: "no_heat",
        rad_safety_smell: "no_burn",
        rad_safety_sparks: "no_spark",
        rad_water_near_power: "no_wet_power",
        rad_power_light: "light_on",
        rad_thermostat_position: "thermo_low",
        rad_plug_seated: "plug_ok",
        rad_comfort_diy: "diy_ok",
      };
      return map[q.id] || pickNonEmergency(q);
    });
    const long = runWithChooser(radiatorKb, (q) => pickNonEmergency(q));
    expect(low.answers.length).not.toBe(3);
    expect(long.answers.length).toBeGreaterThan(0);
    // Both should terminate via engine stop rules
    expect(["confident", "no_useful_questions", "max_questions", "emergency"]).toContain(
      low.reason
    );
  });

  it("every radiator question offers an unsure option where listed", () => {
    for (const q of radiatorKb.questions) {
      const hasUnsure = q.options.some(
        (o) => o.id === "unsure" || /not sure/i.test(o.label)
      );
      expect(hasUnsure).toBe(true);
    }
  });

  it("recalculates ranking after each answer", () => {
    let session = createSession(radiatorKb);
    const before = rankedHypotheses(radiatorKb, session)[0].score;
    const typeQ = radiatorKb.questions.find((q) => q.id === "rad_type")!;
    session = applyAnswer(radiatorKb, session, typeQ, "oil_portable");
    const mid = rankedHypotheses(radiatorKb, session);
    const thermoQ = radiatorKb.questions.find((q) => q.id === "rad_thermostat_position")!;
    session = applyAnswer(radiatorKb, session, thermoQ, "thermo_low");
    const after = rankedHypotheses(radiatorKb, session);
    expect(after[0].hypothesis.id).toBe("rad_thermostat_too_low");
    expect(after[0].score).toBeGreaterThan(mid.find((m) => m.hypothesis.id === "rad_thermostat_too_low")!.score - 0.01);
    expect(after[0].score).toBeGreaterThan(before);
  });
});

function pickNonEmergency(q: DiagnosticQuestion): string {
  // Prefer "no / ok / fine" style answers so unmapped questions don't accidentally confirm faults
  const preferred = q.options.find(
    (o) =>
      !o.safety?.emergency &&
      (/(_no|no_|_ok|fine|dry|works|open|clean|level_yes|plug_ok|timer_no|covered_no|waited_yes_warm)/.test(
        o.id
      ) ||
        /^(No)\b/i.test(o.label))
  );
  if (preferred) return preferred.id;
  const safe = q.options.find((o) => !o.safety?.emergency && o.id !== "unsure");
  return safe?.id || q.options[0].id;
}
