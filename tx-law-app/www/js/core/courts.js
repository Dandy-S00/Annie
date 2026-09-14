// Looking up your own case in DFW courts, plus the deadlines that actually
// cost people their cases when they miss them.
//
// DESIGN CHOICE (from tx-law-agent/BUILD_TASKS.md, Task 2): county portals
// restrict automated access and several sit behind CAPTCHAs. So this app builds
// Tier 1 only \u2014 a pre-filled deep link the user opens themselves in their own
// browser. No scraping, no terms-of-use exposure, and nothing to get wrong.
// The app never pretends to fetch a case status it cannot verify.

export const COUNTIES = [
  {
    name: "Dallas",
    portalName: "Dallas County Courts \u2014 Case Records Search",
    searchUrl: "https://www.dallascounty.org/government/courts/case-records/",
    districtClerkPhone: "214-653-7301",
    note: "Criminal felony cases are in the Criminal District Clerk's office; misdemeanors are in the County Clerk's office. Ask which one your case number belongs to.",
    felonyOrMisdemeanor: "Both \u2014 separate offices",
    justiceOfPeace: true,
  },
  {
    name: "Tarrant",
    portalName: "Tarrant County \u2014 Case Search",
    searchUrl: "https://www.tarrantcounty.com/en/criminal-courts.html",
    districtClerkPhone: "817-884-1421",
    note: "Tarrant runs its criminal case search through the county's own portal. Search by case number or by your name.",
    felonyOrMisdemeanor: "Both",
    justiceOfPeace: true,
  },
  {
    name: "Collin",
    portalName: "Collin County \u2014 Online Case Search",
    searchUrl: "https://www.collincountytx.gov/district_clerk",
    districtClerkPhone: "972-548-4100",
    note: "Collin County's District Clerk handles felonies; the County Clerk handles misdemeanors and civil matters.",
    felonyOrMisdemeanor: "Both \u2014 separate offices",
    justiceOfPeace: true,
  },
  {
    name: "Denton",
    portalName: "Denton County \u2014 Case Records",
    searchUrl: "https://www.dentoncounty.gov/departments/district_clerk/",
    districtClerkPhone: "940-349-2010",
    note: "Denton County District Clerk handles felony and civil matters, including family cases.",
    felonyOrMisdemeanor: "Both",
    justiceOfPeace: true,
  },
];

export function countyByName(name) {
  return COUNTIES.find((c) => c.name.toLowerCase() === String(name || "").toLowerCase()) || null;
}

/**
 * Tier 1 deep-link generator: never scrapes, always hands the user a link to
 * open in their own browser.
 */
export function docketLookup({ county, caseNumber }) {
  const c = countyByName(county);
  if (!c) {
    return {
      found: null,
      message: `No portal is configured yet for ${county || "that"} County. Ask the district clerk's office for the correct public search page.`,
    };
  }
  const target = c.searchUrl;
  return {
    found: null,
    county: c.name,
    caseNumber: caseNumber || null,
    deepLink: target,
    portalName: c.portalName,
    phone: c.districtClerkPhone,
    message:
      "We do not pull case status automatically, because county portals restrict automated access and some use CAPTCHA protection. Open the official page below and search for your case number there \u2014 that way what you read is the court's own record, not our guess.",
  };
}

export const DEADLINES = [
  {
    title: "DWI \u2014 driver's license hearing (ALR)",
    days: "15 days",
    urgency: "critical",
    plain: "After a DWI arrest, you have only 15 days to ask for a hearing to try to keep your license. If you do nothing, the suspension usually starts automatically.",
    source: "Texas DPS administrative license revocation process",
  },
  {
    title: "Eviction \u2014 responding to a notice to vacate",
    days: "Usually 3 days, then a court date",
    urgency: "critical",
    plain: "A landlord must give you written notice before filing. After the notice period, an eviction case is filed and the hearing is often scheduled within a couple of weeks. Missing that hearing usually means an automatic loss.",
    source: "Texas Property Code Chapter 24",
  },
  {
    title: "Misdemeanor \u2014 first court setting (arraignment)",
    days: "Days to a few weeks",
    urgency: "high",
    plain: "You must appear at your first setting. If you do not, the judge can issue a warrant for your arrest. If you have a lawyer, they can often appear for you \u2014 ask first.",
    source: "Texas Code of Criminal Procedure",
  },
  {
    title: "Felony \u2014 indictment and first appearance",
    days: "Varies; often within weeks",
    urgency: "high",
    plain: "Felony cases go through a grand jury and then a first appearance. Do not miss it \u2014 a failure to appear can add a new charge on top of the original one.",
    source: "Texas Code of Criminal Procedure",
  },
  {
    title: "Custody or divorce \u2014 answer the petition",
    days: "Typically 20 days after service",
    urgency: "high",
    plain: "If someone files a family case against you, you generally must file an answer within about 20 days. If you do not, the other side can get everything they asked for by default.",
    source: "Texas Rules of Civil Procedure",
  },
  {
    title: "Protective order \u2014 hearing date",
    days: "Often within 14 days of the application",
    urgency: "high",
    plain: "A temporary protective order can be issued quickly, and a hearing follows. Showing up and being heard matters \u2014 an agreed order is usually better than one imposed without you.",
    source: "Texas Family Code Title 4",
  },
  {
    title: "Probation revocation \u2014 hearing",
    days: "Set by the court",
    urgency: "high",
    plain: "A revocation hearing is not a new trial. You are entitled to a hearing, and a lawyer can often negotiate a continuation instead of jail.",
    source: "Texas Code of Criminal Procedure art. 42A",
  },
  {
    title: "Notice of appeal",
    days: "Usually 30 days from judgment",
    urgency: "medium",
    plain: "If you want to appeal, there is a hard deadline from the date of judgment. Appeals are their own specialty \u2014 ask a lawyer quickly.",
    source: "Texas Rules of Appellate Procedure",
  },
];

export function criticalDeadlinesFor(caseTypeId) {
  const map = {
    dwi: ["DWI \u2014 driver's license hearing (ALR)", "Misdemeanor \u2014 first court setting (arraignment)"],
    eviction: ["Eviction \u2014 responding to a notice to vacate"],
    "family law - custody": ["Custody or divorce \u2014 answer the petition"],
    "family law - divorce": ["Custody or divorce \u2014 answer the petition"],
    "protective order": ["Protective order \u2014 hearing date"],
    "probation revocation": ["Probation revocation \u2014 hearing"],
    "assault - family violence": ["Misdemeanor \u2014 first court setting (arraignment)", "Protective order \u2014 hearing date"],
  };
  const titles = map[caseTypeId] || ["Misdemeanor \u2014 first court setting (arraignment)", "Felony \u2014 indictment and first appearance"];
  return DEADLINES.filter((d) => titles.includes(d.title));
}
