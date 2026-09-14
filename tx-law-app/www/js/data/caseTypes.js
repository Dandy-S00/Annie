// Canonical, normalized case-type strings used everywhere in this app.
// These MUST match the `case_type` values used when case outcomes were indexed
// (this keeps attorney matching and outcome comparison in sync).
// Source of truth for the project — do not invent variants.

export const CASE_TYPES = [
  {
    id: "assault - family violence",
    label: "Assault \u2013 Family Violence",
    plain: "Being accused of hurting a family member, partner, or someone you live with.",
    example: "Includes pushing, grabbing, or threats against a household member or dating partner.",
  },
  {
    id: "assault",
    label: "Assault (Non-Family)",
    plain: "Being accused of hurting another person, where the person is not a family member or partner.",
    example: "Includes bar fights, fights between acquaintances, or other physical altercations.",
  },
  {
    id: "dwi",
    label: "DWI / DUI",
    plain: "Being accused of driving while drunk or high.",
    example: "Driving While Intoxicated \u2014 includes first-time arrests and repeat arrests.",
  },
  {
    id: "drug possession",
    label: "Drug Possession",
    plain: "Being accused of having an illegal drug on you or in your car or home.",
    example: "Includes small amounts for personal use (marijuana, pills, meth, cocaine, etc.).",
  },
  {
    id: "theft",
    label: "Theft / Shoplifting",
    plain: "Being accused of taking something that belongs to someone else.",
    example: "Includes shoplifting, taking items from a store, and taking money or property.",
  },
  {
    id: "burglary",
    label: "Burglary",
    plain: "Being accused of entering a building or home to commit a crime inside.",
    example: "Includes breaking into a home, garage, or business.",
  },
  {
    id: "robbery",
    label: "Robbery",
    plain: "Being accused of taking something from a person by force or threat.",
    example: "This is treated more seriously than plain theft \u2014 force or fear is involved.",
  },
  {
    id: "weapons",
    label: "Weapons / Firearms",
    plain: "Being accused of illegally carrying or using a weapon.",
    example: "Includes carrying a handgun without a license, or possessing a weapon illegally.",
  },
  {
    id: "eviction",
    label: "Eviction",
    plain: "Being told by a landlord to leave a rental home or apartment, possibly through court.",
    example: "Includes non-payment of rent or lease violations. This is a civil (non-criminal) case.",
  },
  {
    id: "family law - custody",
    label: "Family Law \u2013 Custody",
    plain: "A disagreement about where a child lives and who makes decisions for them.",
    example: "Includes custody, visitation, and parenting-plan disputes. This is a civil case.",
  },
  {
    id: "family law - divorce",
    label: "Family Law \u2013 Divorce",
    plain: "Ending a marriage, including dividing property and debts.",
    example: "Includes agreed (uncontested) and fought-over (contested) divorces. This is a civil case.",
  },
  {
    id: "protective order",
    label: "Protective Order",
    plain: "A court order meant to keep one person away from another.",
    example: "Often filed alongside a family-violence case. This is a civil case.",
  },
  {
    id: "probation revocation",
    label: "Probation Revocation",
    plain: "Being accused of breaking the rules of your probation (a sentence served in the community).",
    example: "Includes missed meetings, a new arrest, or failing drug tests while on probation.",
  },
  {
    id: "traffic",
    label: "Traffic / License",
    plain: "Being cited or charged over driving, a license, or vehicle issues.",
    example: "Includes no license, suspended license, and reckless driving.",
  },
  {
    id: "other - unknown",
    label: "Not Sure / Something Else",
    plain: "You are not sure which category your situation falls into.",
    example: "Pick this if nothing above fits, or if you are unsure. We will still help you find a lawyer.",
  },
];

export function getCaseType(id) {
  return CASE_TYPES.find((c) => c.id === id) || null;
}

export const CASE_TYPE_IDS = CASE_TYPES.map((c) => c.id);
