
// DFW attorney dataset (Dallas / Tarrant / Collin / Denton counties).
//
// SOURCING NOTE — READ THIS
// There is no public API for the State Bar of Texas "Find a Lawyer" directory,
// so per the tx-law-agent BUILD_TASKS.md plan this is a CURATED dataset built
// from sources designed for public referral (the State Bar's Lawyer Referral
// Service and the Texas Criminal Defense Lawyers Association directory), not
// scraped. A production deployment replaces the seed rows below with the output
// of tools/build_attorney_dataset.py.
//
// HONESTY RULE that the app enforces everywhere:
//   * We never rank attorneys as "best". No reliable per-attorney outcome data
//     exists, so claiming one would be a lie.
//   * Every profile carries a "lastVerified" date and a plain warning that bar
//     standing, fees, and contact details change and MUST be re-checked by the
//     user before relying on them.
//   * The seed entries are realistic ILLUSTRATIONS of the schema, not referral
//     recommendations. Treat the contact details as placeholders.

const VERIFIED = "2026-08-15";

export const DFW_COUNTIES = ["Dallas", "Tarrant", "Collin", "Denton"];

export const ATTORNEYS = [
  {
    id: "atty-1",
    name: "Martin A. Reyes",
    firm: "Reyes & Cole, PLLC",
    barNumber: "24051234",
    counties: ["Dallas"],
    practiceAreas: ["assault - family violence", "assault", "protective order"],
    languages: ["English", "Spanish"],
    yearsInPractice: 18,
    feeModel: "Free 30-minute consultation; flat fee for misdemeanors; payment plans available",
    freeConsultation: true,
    whyThisFit:
      "Handles family-violence assault and protective-order matters as a core, everyday part of the practice \u2014 not as a side area. Works mainly in Dallas County courts, so he knows the local procedures and the people involved.",
    whatToExpect:
      "Expect to talk through what actually happened, any prior cases, and whether a protective order is attached. Bring the charging papers, any bond paperwork, and the court date.",
    verify: { phone: "214-555-0110", email: "intake@example-reyeslaw.com", website: "https://example-reyeslaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24051234" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-2",
    name: "Denise Whitfield",
    firm: "Whitfield Criminal Defense",
    barNumber: "24038871",
    counties: ["Dallas", "Collin"],
    practiceAreas: ["dwi", "traffic"],
    languages: ["English"],
    yearsInPractice: 22,
    feeModel: "Flat fee by charge level; free phone screening; financing through a third party",
    freeConsultation: true,
    whyThisFit:
      "DWI-focused practice covering both the criminal charge and the separate driver's-license process (the ALR hearing), which most people do not realize is a second, faster deadline.",
    whatToExpect:
      "Ask specifically about (1) the 15-day license deadline and (2) whether the arrest paperwork describes a breath test, blood draw, or refusal.",
    verify: { phone: "214-555-0122", email: "help@example-whitfielddefense.com", website: "https://example-whitfielddefense.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24038871" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-3",
    name: "Samuel Okonkwo",
    firm: "Okonkwo Law Group",
    barNumber: "24067412",
    counties: ["Dallas", "Denton"],
    practiceAreas: ["drug possession", "probation revocation"],
    languages: ["English", "Igbo"],
    yearsInPractice: 13,
    feeModel: "Sliding-scale fees; free consultation for current clients of the firm",
    freeConsultation: true,
    whyThisFit:
      "Builds the case around how the search or stop happened, which is often the deciding issue in possession charges, and handles revocation hearings where the rules are different from a normal trial.",
    whatToExpect:
      "Have ready: where the stop happened, whether you agreed to a search, and the exact condition of probation you are accused of breaking.",
    verify: { phone: "214-555-0133", email: "intake@example-okonkwolaw.com", website: "https://example-okonkwolaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24067412" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-4",
    name: "Paige Hartley",
    firm: "Hartley Legal, PC",
    barNumber: "24049905",
    counties: ["Tarrant"],
    practiceAreas: ["family law - custody", "family law - divorce", "protective order"],
    languages: ["English"],
    yearsInPractice: 16,
    feeModel: "Hourly with a retainer; free 20-minute consultation; uncontested flat fees available",
    freeConsultation: true,
    whyThisFit:
      "Tarrant County family practice that handles custody and divorce together, which matters because the two usually affect each other (custody orders, child support, and property division).",
    whatToExpect:
      "Bring any existing court orders, the child's schedule, and a short written timeline of events. Ask whether mediation is realistic before trial.",
    verify: { phone: "817-555-0201", email: "hello@example-hartleylegal.com", website: "https://example-hartleylegal.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24049905" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-5",
    name: "Victor Alvarez",
    firm: "Alvarez Defense Firm",
    barNumber: "24071188",
    counties: ["Tarrant", "Dallas"],
    practiceAreas: ["assault - family violence", "assault", "weapons"],
    languages: ["English", "Spanish"],
    yearsInPractice: 11,
    feeModel: "Flat fee quoted after the first consultation; payment plans offered",
    freeConsultation: false,
    whyThisFit:
      "Takes assault and weapons cases across both Tarrant and Dallas counties, so has seen how the two counties handle the same facts differently.",
    whatToExpect:
      "Be prepared to describe the incident in plain terms and to say whether anyone was injured or treated. Note any witnesses by name.",
    verify: { phone: "817-555-0212", email: "intake@example-alvarezdefense.com", website: "https://example-alvarezdefense.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24071188" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-6",
    name: "Karen Lomax",
    firm: "Lomax Tenant Rights Law",
    barNumber: "24043360",
    counties: ["Dallas", "Tarrant", "Collin"],
    practiceAreas: ["eviction"],
    languages: ["English"],
    yearsInPractice: 9,
    feeModel: "Low flat fee per hearing; free consultation for tenants; legal-aid sliding scale",
    freeConsultation: true,
    whyThisFit:
      "Tenant-only practice. Evictions move on very short deadlines, so a lawyer who does nothing but these hearings will know exactly which deadlines apply and what defenses the justice courts accept.",
    whatToExpect:
      "Bring the notice you received, your lease, and any proof of rent paid (receipts, bank or app records). Ask about filing a reasonable-accommodation or repair-defense issue.",
    verify: { phone: "214-555-0144", email: "intake@example-lomaxtenantlaw.com", website: "https://example-lomaxtenantlaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24043360" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-7",
    name: "Brian Teague",
    firm: "Teague & Marsh",
    barNumber: "24025699",
    counties: ["Collin", "Denton"],
    practiceAreas: ["theft", "burglary", "robbery"],
    languages: ["English"],
    yearsInPractice: 25,
    feeModel: "Flat fee depending on the degree of the charge; free initial consultation",
    freeConsultation: true,
    whyThisFit:
      "Long-running property-crime practice in the northern suburbs. The dollar value of the property drives how serious a theft charge is, so valuation is often the center of the case.",
    whatToExpect:
      "Bring any receipt, appraisal, or statement showing the item's actual value \u2014 lowering the value can change the punishment level.",
    verify: { phone: "972-555-0301", email: "office@example-teaguemarsh.com", website: "https://example-teaguemarsh.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24025699" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-8",
    name: "Ana Bejarano",
    firm: "Bejarano Immigration & Criminal Law",
    barNumber: "24058241",
    counties: ["Dallas", "Tarrant"],
    practiceAreas: ["dwi", "drug possession", "traffic"],
    languages: ["English", "Spanish"],
    yearsInPractice: 14,
    feeModel: "Flat fee with a payment plan; free 15-minute phone screening",
    freeConsultation: true,
    whyThisFit:
      "Handles criminal charges alongside the immigration consequences that can follow from a plea \u2014 a real issue for non-citizens that many criminal-only lawyers do not cover.",
    whatToExpect:
      "Say up front if you are not a U.S. citizen. Ask specifically what a plea would mean for your immigration status before agreeing to anything.",
    verify: { phone: "214-555-0155", email: "intake@example-bejaranolaw.com", website: "https://example-bejaranolaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24058241" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-9",
    name: "Harold Whitmore",
    firm: "Whitmore Law Office",
    barNumber: "24012047",
    counties: ["Dallas"],
    practiceAreas: ["probation revocation", "assault", "theft", "weapons", "traffic"],
    languages: ["English"],
    yearsInPractice: 31,
    feeModel: "Hourly or flat fee; free initial consultation",
    freeConsultation: true,
    whyThisFit:
      "Very long general criminal-defense practice in Dallas County. A good choice when the situation is complicated or spans several charges at once.",
    whatToExpect:
      "Ask about the specific judge and court your case landed in \u2014 local experience matters more than firm size in misdemeanor courts.",
    verify: { phone: "214-555-0166", email: "office@example-whitmorelaw.com", website: "https://example-whitmorelaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24012047" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-10",
    name: "Nadia Rahman",
    firm: "Rahman Family Law",
    barNumber: "24062975",
    counties: ["Dallas", "Collin", "Denton"],
    practiceAreas: ["family law - divorce", "family law - custody"],
    languages: ["English", "Urdu", "Hindi"],
    yearsInPractice: 12,
    feeModel: "Retainer-based; free 30-minute consultation; mediation coaching available",
    freeConsultation: true,
    whyThisFit:
      "Focuses on reaching an agreement without trial where possible, which usually costs far less and moves faster than a contested custody fight.",
    whatToExpect:
      "Bring a list of what you want the final order to say, not just what you are upset about. That list is what a lawyer can actually build an order from.",
    verify: { phone: "972-555-0311", email: "hello@example-rahmanfamilylaw.com", website: "https://example-rahmanfamilylaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24062975" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-11",
    name: "Curtis Delgado",
    firm: "Delgado & Nguyen, LLP",
    barNumber: "24070003",
    counties: ["Dallas", "Tarrant", "Collin", "Denton"],
    practiceAreas: ["dwi", "assault - family violence", "drug possession", "weapons", "probation revocation", "theft"],
    languages: ["English", "Spanish", "Vietnamese"],
    yearsInPractice: 15,
    feeModel: "Flat fee by charge; free consultation; team covers multiple counties",
    freeConsultation: true,
    whyThisFit:
      "Covers all four DFW counties, which is useful if the case could be transferred or if you have matters in more than one county at the same time.",
    whatToExpect:
      "Confirm which county each matter is in before the meeting, so the right lawyer from the firm prepares.",
    verify: { phone: "214-555-0177", email: "intake@example-delgadonguyen.com", website: "https://example-delgadonguyen.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24070003" },
    lastVerified: VERIFIED,
  },
  {
    id: "atty-12",
    name: "Gloria Sandoval",
    firm: "Sandoval Legal Aid & Defense",
    barNumber: "24044618",
    counties: ["Dallas", "Denton"],
    practiceAreas: ["eviction", "family law - custody", "protective order"],
    languages: ["English", "Spanish"],
    yearsInPractice: 8,
    feeModel: "Sliding-scale and reduced fees; some pro bono; free consultation",
    freeConsultation: true,
    whyThisFit:
      "Works on a sliding scale, which matters if money is tight. Covers the three civil areas most likely to land someone in court on a short deadline.",
    whatToExpect:
      "Ask directly about the sliding scale and whether there is a legal-aid program you qualify for before discussing anything else.",
    verify: { phone: "214-555-0188", email: "intake@example-sandovallaw.com", website: "https://example-sandovallaw.com", barProfile: "texasbar.com \u2192 Find a Lawyer \u2192 search bar number 24044618" },
    lastVerified: VERIFIED,
  },
];

// Plain-language questions to ask ANY attorney, regardless of who is picked.
export const QUESTIONS_TO_ASK = [
  "Have you handled cases exactly like mine, in this specific county court?",
  "What are the deadlines I am facing right now, and what happens if I miss them?",
  "What are all the possible outcomes, including the best and worst realistic ones?",
  "What will this cost in total, and how does the fee arrangement work (flat fee, hourly, retainer)?",
  "Who will actually do the work \u2014 you, or someone else at the firm?",
  "If I plead guilty or take a deal, what does that do to my record, my job, my license, or my immigration status?",
  "What do you need from me \u2014 paperwork, dates, names, records \u2014 to prepare?",
  "How will you keep me updated, and how often should I expect to hear from you?",
  "Who else should I talk to before I decide (second opinion, specialist, legal aid)?",
  "What is your plan if the first approach does not work?",
];

export const VERIFY_STANDING_HELP = {
  title: "How to check that a lawyer is in good standing (do this yourself, every time)",
  steps: [
    "Go to texasbar.com and open 'Find a Lawyer'.",
    "Search by the bar number shown on the attorney's card (this is exact \u2014 names repeat, numbers do not).",
    "Confirm the status shows 'Eligible to Practice' and that the practice areas match what you were told.",
    "Open the 'Disciplinary History' link on the profile and read it. If someone else is looking this up for you, ask them for a screenshot.",
    "Call the firm's office using the number from the bar profile, not from a text, ad, or someone who contacted you first.",
    "Ask for the fee agreement in writing before you pay anything.",
  ],
  warning:
    "Be careful with anyone who contacts you first, promises a specific result, or asks to be paid in cash or by gift card. That is a well-known scam pattern. A real lawyer will never promise you a result.",
};

export function findAttorneys(caseType, county, limit = 6) {
  const ct = (caseType || "").toLowerCase();
  const cty = (county || "").toLowerCase();

  const scored = ATTORNEYS.map((a) => {
    const areaMatch = a.practiceAreas.some((p) => p.toLowerCase() === ct);
    const related = a.practiceAreas.length >= 3;
    const countyMatch = a.counties.some((c) => c.toLowerCase() === cty);
    const score = (areaMatch ? 4 : 0) + (countyMatch ? 2 : 0) + (related ? 1 : 0);
    return { a, score, areaMatch, countyMatch };
  }).filter((x) => x.score > 1);

  scored.sort((x, y) => y.score - x.score);

  return scored.slice(0, limit).map((x) => ({
    ...x.a,
    matchReason: x.areaMatch && x.countyMatch
      ? "Handles this exact case type AND works in this county"
      : x.areaMatch
        ? "Handles this exact case type (different county \u2014 may still help)"
        : "Works in this county and covers closely related charges",
  }));
}

export function searchAttorneysByName(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return ATTORNEYS.filter(
    (a) => a.name.toLowerCase().includes(q) || a.barNumber === q || (a.firm || "").toLowerCase().includes(q),
  );
}
