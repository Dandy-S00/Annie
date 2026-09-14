// The core comparison engine.
//
// It does retrieval + counting ONLY. It never forecasts. The app's rules
// (ported from tx-law-agent/agent/instructions.md) are enforced here in code so
// the UI cannot accidentally present a guess:
//
//   1. Below MIN_CASES comparable cases -> report "not enough data", never a pattern.
//   2. Report a fraction of a real retrieved set ("7 of 10"), never a
//      manufactured precise percentage for the user's own case.
//   3. Always attach honest caveats to every result.

import { OUTCOMES, dispositionStyle } from "../data/outcomes.js";
import { getCaseType } from "../data/caseTypes.js";

export const MIN_CASES = 6;

const GOOD = new Set(["Dismissed", "Diversion / Dismissed", "Deferred / Dismissed", "Acquittal", "Judgment for tenant", "Probation continued"]);
const BAD = new Set(["Conviction", "Judgment for landlord", "Revoked \u2013 sentenced"]);

function toneFor(disposition) {
  if (GOOD.has(disposition)) return "good";
  if (BAD.has(disposition)) return "bad";
  return "neutral";
}

/**
 * Build an honest comparison set for a case type, optionally narrowed to a
 * county (widening to DFW-wide / statewide when the local set is too thin).
 */
export function compareOutcomes({ caseType, county, years = 6 }) {
  if (!caseType) return { ok: false, reason: "no-case-type" };

  const nowYear = 2026;
  const minYear = nowYear - years;

  const byType = OUTCOMES.filter((o) => o.caseType === caseType);
  const recent = byType.filter((o) => o.year >= minYear);
  const pool = recent.length >= MIN_CASES ? recent : byType;

  let cases = pool;
  let narrowed = false;
  let widened = false;

  if (county) {
    const local = pool.filter((o) => o.county.toLowerCase() === county.toLowerCase());
    if (local.length >= MIN_CASES) {
      cases = local;
      narrowed = true;
    } else if (local.length > 0) {
      widened = true;
    }
  }

  if (cases.length < MIN_CASES) {
    return {
      ok: false,
      reason: cases.length === 0 ? "none" : "too-few",
      found: cases.length,
      minimum: MIN_CASES,
      caseType,
      county,
      caseTypeLabel: getCaseType(caseType)?.label || caseType,
      message:
        cases.length === 0
          ? "No comparable cases are indexed for this situation yet. We will not guess at a pattern. Your best next step is to talk to an attorney about your specific facts."
          : `Only ${cases.length} closely comparable case${cases.length === 1 ? "" : "s"} are indexed \u2014 fewer than the ${MIN_CASES} we require before describing a pattern. We will not guess. Talk to an attorney about your specific facts.`,
    };
  }

  const counts = new Map();
  for (const c of cases) counts.set(c.disposition, (counts.get(c.disposition) || 0) + 1);

  const total = cases.length;
  const breakdown = [...counts.entries()]
    .map(([disposition, count]) => ({
      disposition,
      count,
      total,
      plain: dispositionStyle(disposition).label,
      tone: toneFor(disposition),
    }))
    .sort((a, b) => b.count - a.count);

  const goodCount = breakdown.filter((b) => b.tone === "good").reduce((s, b) => s + b.count, 0);
  const badCount = breakdown.filter((b) => b.tone === "bad").reduce((s, b) => s + b.count, 0);
  const neutralCount = total - goodCount - badCount;

  const mostly = breakdown[0];

  return {
    ok: true,
    caseType,
    caseTypeLabel: getCaseType(caseType)?.label || caseType,
    county: narrowed ? county : null,
    scope: narrowed ? `only ${county} County` : "across the DFW area and statewide courts in this dataset",
    total,
    years: years,
    breakdown,
    headline:
      `In ${total} comparable case${total === 1 ? "" : "s"}, the single most common result was: ` +
      `"${mostly.plain}" (${mostly.count} of ${total}).`,
    spread: {
      good: goodCount,
      bad: badCount,
      neutral: neutralCount,
      goodOf: `${goodCount} of ${total}`,
      badOf: `${badCount} of ${total}`,
      neutralOf: `${neutralCount} of ${total}`,
    },
    cases: cases
      .slice()
      .sort((a, b) => b.year - a.year)
      .map((c) => ({
        id: c.id,
        county: c.county,
        year: c.year,
        disposition: c.disposition,
        plain: dispositionStyle(c.disposition).label,
        tone: toneFor(c.disposition),
        detail: c.detail,
      })),
    caveats: buildCaveats({ narrowed, widened, total, caseType }),
  };
}

function buildCaveats({ narrowed, widened, total, caseType }) {
  const caveats = [
    "These were PUBLISHED or appealed cases. Most real cases end in a plea or agreement and never produce a written opinion, so cases like yours that were resolved quietly are not counted here. That means this set over-represents cases that were fought.",
    "This is a pattern in past cases \u2014 it is NOT a prediction of what will happen in your case. No app can predict your case.",
    `This is a small set (${total} cases). Small sets swing easily: a few cases either way would change the picture.`,
    "County judges, prosecutors, and local practices differ a lot. The same facts can go differently in two neighboring counties.",
  ];

  if (narrowed) {
    caveats.push("This is narrowed to a single county, which is more relevant but a smaller sample.");
  } else if (widened) {
    caveats.push("There were not enough cases in the county you picked, so this is widened to the whole area. Local patterns in your county may differ from this.");
  }

  if (caseType === "family law - custody" || caseType === "family law - divorce" || caseType === "eviction" || caseType === "protective order") {
    caveats.push("This is a civil (non-criminal) matter. The 'won/lost' labels above mean who the judge ruled for on that issue \u2014 not guilt or innocence.");
  }

  caveats.push("The most important facts in your case may not be the facts these cases turned on. An attorney who hears your whole story can weigh things a database cannot.");
  return caveats;
}

export const DATA_SOURCE_NOTES = [
  {
    label: "Where these cases come from",
    text: "Seeded from the tx-law-agent-Courtoutcomes dataset, which is built to ingest public-domain Texas appellate opinions (CourtListener / Free Law Project) plus county disposition statistics from the Texas Office of Court Administration.",
  },
  {
    label: "What is deliberately excluded",
    text: "No licensed databases (Westlaw/Lexis) were scraped. County docket systems are queried one case at a time only, on your request \u2014 never bulk-collected.",
  },
  {
    label: "How current this is",
    text: "These are sample records for demonstration. Before relying on any number, confirm the dataset has been refreshed \u2014 the app shows the newest case year it found so you can judge for yourself.",
  },
];
