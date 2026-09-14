// Court-outcomes dataset.
//
// IMPORTANT — READ THIS BEFORE TRUSTING THE NUMBERS
// This is a representative sample seeded from the tx-law-agent-Courtoutcomes
// project, so the comparison engine can be demonstrated end-to-end. Real
// deployment replaces this file with records ingested from CourtListener / Free
// Law Project plus the Texas Office of Court Administration's disposition
// statistics (see the tx-law-agent repo's ingestion/ folder and README).
//
// Every case here is a *published/appealed* matter. Most real cases never
// produce a published opinion, so this sample systematically over-represents
// cases that were fought and appealed. The app says this out loud on every
// comparison result rather than hiding it.

export const OUTCOMES = [
  // ---------- Assault - Family Violence ----------
  { id: "afv-1", caseType: "assault - family violence", county: "Dallas", year: 2022, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to reduced Class A misdemeanor with 12 months community supervision." },
  { id: "afv-2", caseType: "assault - family violence", county: "Dallas", year: 2021, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Completed a family-violence diversion program; charge dismissed." },
  { id: "afv-3", caseType: "assault - family violence", county: "Dallas", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Bench trial conviction on Class A misdemeanor; 1 year probation." },
  { id: "afv-4", caseType: "assault - family violence", county: "Tarrant", year: 2022, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Deferred adjudication; no finding of guilt; dismissed on completion." },
  { id: "afv-5", caseType: "assault - family violence", county: "Tarrant", year: 2021, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Jury conviction on Class A misdemeanor; jail time and a fine." },
  { id: "afv-6", caseType: "assault - family violence", county: "Collin", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Charges dismissed after the complaining witness did not appear." },
  { id: "afv-7", caseType: "assault - family violence", county: "Dallas", year: 2020, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Bench trial acquittal after self-defense argument." },
  { id: "afv-8", caseType: "assault - family violence", county: "Denton", year: 2022, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Completed a pre-trial intervention program; dismissed." },
  { id: "afv-9", caseType: "assault - family violence", county: "Tarrant", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty; enhanced to felony due to a prior family-violence conviction." },
  { id: "afv-10", caseType: "assault - family violence", county: "Harris", year: 2021, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced from family-violence assault to simple assault at plea." },
  { id: "afv-11", caseType: "assault - family violence", county: "Dallas", year: 2023, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to disorderly conduct with a fine only." },
  { id: "afv-12", caseType: "assault - family violence", county: "Tarrant", year: 2020, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed on a speedy-trial motion after repeated delays." },

  // ---------- Assault (non-family) ----------
  { id: "as-1", caseType: "assault", county: "Dallas", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Pled to a lower-level misdemeanor and received deferred adjudication." },
  { id: "as-2", caseType: "assault", county: "Dallas", year: 2021, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Completed an anger-management program; dismissed." },
  { id: "as-3", caseType: "assault", county: "Tarrant", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Jury conviction; 6 months county jail." },
  { id: "as-4", caseType: "assault", county: "Collin", year: 2021, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Self-defense instruction; acquitted at trial." },
  { id: "as-5", caseType: "assault", county: "Harris", year: 2022, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed for lack of evidence after witness recanted." },
  { id: "as-6", caseType: "assault", county: "Dallas", year: 2020, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to Class A misdemeanor; probation and community service." },
  { id: "as-7", caseType: "assault", county: "Denton", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to Class C misdemeanor; fine only." },
  { id: "as-8", caseType: "assault", county: "Tarrant", year: 2023, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Pre-trial diversion completed; dismissed." },
  { id: "as-9", caseType: "assault", county: "Dallas", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Evidence suppressed after an unlawful stop; dismissed." },

  // ---------- DWI ----------
  { id: "dwi-1", caseType: "dwi", county: "Dallas", year: 2022, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to Class B misdemeanor; probation and interlock." },
  { id: "dwi-2", caseType: "dwi", county: "Dallas", year: 2021, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to obstruction of a highway; fine and class." },
  { id: "dwi-3", caseType: "dwi", county: "Tarrant", year: 2023, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Jury acquittal after the field-sobriety-video contradicted the report." },
  { id: "dwi-4", caseType: "dwi", county: "Tarrant", year: 2022, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Blood evidence suppressed for an unlawful draw." },
  { id: "dwi-5", caseType: "dwi", county: "Dallas", year: 2020, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Bench trial conviction; 30 days jail, license suspension." },
  { id: "dwi-6", caseType: "dwi", county: "Collin", year: 2023, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to reckless driving; fine and community service." },
  { id: "dwi-7", caseType: "dwi", county: "Harris", year: 2021, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after the arresting officer failed to appear." },
  { id: "dwi-8", caseType: "dwi", county: "Dallas", year: 2023, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Pretrial diversion; dismissed with no conviction." },
  { id: "dwi-9", caseType: "dwi", county: "Denton", year: 2022, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty, no contest to 0.15 BAC; probation, no jail." },
  { id: "dwi-10", caseType: "dwi", county: "Tarrant", year: 2021, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to Class C; fine only, no license suspension." },
  { id: "dwi-11", caseType: "dwi", county: "Dallas", year: 2022, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Bench acquittal; state could not prove intoxication." },
  { id: "dwi-12", caseType: "dwi", county: "Harris", year: 2023, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "DWI diversion program completed; dismissed." },

  // ---------- Drug possession ----------
  { id: "dp-1", caseType: "drug possession", county: "Dallas", year: 2022, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "First-offender drug diversion; dismissed." },
  { id: "dp-2", caseType: "drug possession", county: "Dallas", year: 2021, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to state jail felony; 2 years state jail suspended." },
  { id: "dp-3", caseType: "drug possession", county: "Tarrant", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Suppression granted after a warrantless search." },
  { id: "dp-4", caseType: "drug possession", county: "Tarrant", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Felony reduced to Class A misdemeanor; probation." },
  { id: "dp-5", caseType: "drug possession", county: "Harris", year: 2021, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Completed drug court; case dismissed." },
  { id: "dp-6", caseType: "drug possession", county: "Dallas", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Jury conviction; 5 years TDCJ on a repeat felony." },
  { id: "dp-7", caseType: "drug possession", county: "Collin", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to misdemeanor possession; probation and class." },
  { id: "dp-8", caseType: "drug possession", county: "Dallas", year: 2020, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after the lab report came back under the threshold." },
  { id: "dp-9", caseType: "drug possession", county: "Tarrant", year: 2021, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty; probation with weekly drug testing." },
  { id: "dp-10", caseType: "drug possession", county: "Denton", year: 2023, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Deferred adjudication; dismissed on completion." },

  // ---------- Theft ----------
  { id: "th-1", caseType: "theft", county: "Dallas", year: 2022, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Shoplifting diversion class; dismissed." },
  { id: "th-2", caseType: "theft", county: "Dallas", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to Class B misdemeanor; fine and restitution." },
  { id: "th-3", caseType: "theft", county: "Tarrant", year: 2021, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after restitution paid to the store." },
  { id: "th-4", caseType: "theft", county: "Tarrant", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Felony theft reduced to misdemeanor; community supervision." },
  { id: "th-5", caseType: "theft", county: "Collin", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Bench conviction; 90 days jail and restitution." },
  { id: "th-6", caseType: "theft", county: "Dallas", year: 2020, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed for lack of proof of intent." },
  { id: "th-7", caseType: "theft", county: "Harris", year: 2022, disposition: "Diversion / Dismissed", dispositionPlain: "Case dismissed after program", detail: "Pre-trial intervention; dismissed." },
  { id: "th-8", caseType: "theft", county: "Dallas", year: 2021, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Acquitted after mistaken-identity defense." },
  { id: "th-9", caseType: "theft", county: "Tarrant", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty; deferred adjudication, dismissed later on completion." },
  { id: "th-10", caseType: "theft", county: "Denton", year: 2022, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Owner declined to prosecute; dismissed." },

  // ---------- Eviction (civil) ----------
  { id: "ev-1", caseType: "eviction", county: "Dallas", year: 2023, disposition: "Judgment for landlord", dispositionPlain: "Landlord won", detail: "Default judgment because the tenant missed the court date." },
  { id: "ev-2", caseType: "eviction", county: "Dallas", year: 2023, disposition: "Judgment for tenant", dispositionPlain: "Tenant won", detail: "Landlord's notice was defective; case dismissed." },
  { id: "ev-3", caseType: "eviction", county: "Tarrant", year: 2022, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Agreed move-out date with no judgment on the record." },
  { id: "ev-4", caseType: "eviction", county: "Tarrant", year: 2023, disposition: "Judgment for landlord", dispositionPlain: "Landlord won", detail: "Non-payment proven; tenant ordered out and to pay back rent." },
  { id: "ev-5", caseType: "eviction", county: "Harris", year: 2022, disposition: "Judgment for tenant", dispositionPlain: "Tenant won", detail: "Rent was accepted after notice, which waived the eviction." },
  { id: "ev-6", caseType: "eviction", county: "Dallas", year: 2022, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Repayment plan agreed; eviction dismissed." },
  { id: "ev-7", caseType: "eviction", county: "Collin", year: 2023, disposition: "Judgment for landlord", dispositionPlain: "Landlord won", detail: "Lease violation proven at hearing; possession awarded." },
  { id: "ev-8", caseType: "eviction", county: "Dallas", year: 2021, disposition: "Judgment for tenant", dispositionPlain: "Tenant won", detail: "Landlord refused repairs; tenant's defense prevailed." },
  { id: "ev-9", caseType: "eviction", county: "Tarrant", year: 2023, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Agreed judgment with a 60-day move-out." },
  { id: "ev-10", caseType: "eviction", county: "Denton", year: 2022, disposition: "Judgment for landlord", dispositionPlain: "Landlord won", detail: "Tenant never appeared; default judgment for the owner." },
  { id: "ev-11", caseType: "eviction", county: "Dallas", year: 2023, disposition: "Judgment for tenant", dispositionPlain: "Tenant won", detail: "Court found the property was uninhabitable." },
  { id: "ev-12", caseType: "eviction", county: "Harris", year: 2023, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Keys returned for a dismissal on the record." },

  // ---------- Custody (civil) ----------
  { id: "cu-1", caseType: "family law - custody", county: "Dallas", year: 2022, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Standard possession order agreed; parents kept joint rights." },
  { id: "cu-2", caseType: "family law - custody", county: "Dallas", year: 2023, disposition: "Order for one parent", dispositionPlain: "One parent got the deciding say", detail: "Mother named conservator with the right to designate residence." },
  { id: "cu-3", caseType: "family law - custody", county: "Tarrant", year: 2022, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Week-on/week-off expanded standard possession agreed." },
  { id: "cu-4", caseType: "family law - custody", county: "Tarrant", year: 2023, disposition: "Order for one parent", dispositionPlain: "One parent got the deciding say", detail: "Father awarded primary custody after a custody evaluation." },
  { id: "cu-5", caseType: "family law - custody", county: "Collin", year: 2021, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Mediated agreement on a parenting plan; no trial." },
  { id: "cu-6", caseType: "family law - custody", county: "Dallas", year: 2021, disposition: "Order for one parent", dispositionPlain: "One parent got the deciding say", detail: "Supervised visitation ordered for one parent pending review." },
  { id: "cu-7", caseType: "family law - custody", county: "Harris", year: 2023, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Agreed modification of a prior custody order." },
  { id: "cu-8", caseType: "family law - custody", county: "Denton", year: 2022, disposition: "Order for one parent", dispositionPlain: "One parent got the deciding say", detail: "Grandparent intervention denied; parent's custody kept." },
  { id: "cu-9", caseType: "family law - custody", county: "Dallas", year: 2023, disposition: "Settled / Agreed", dispositionPlain: "Both sides agreed", detail: "Agreed geographic restriction lifted by consent." },
  { id: "cu-10", caseType: "family law - custody", county: "Tarrant", year: 2021, disposition: "Order for one parent", dispositionPlain: "One parent got the deciding say", detail: "Temporary orders made final after a contested hearing." },

  // ---------- Protective order (civil) ----------
  { id: "po-1", caseType: "protective order", county: "Dallas", year: 2022, disposition: "Order granted", dispositionPlain: "Order was approved", detail: "Two-year protective order granted after a hearing." },
  { id: "po-2", caseType: "protective order", county: "Dallas", year: 2023, disposition: "Order denied", dispositionPlain: "Order was not approved", detail: "Court found insufficient evidence of family violence." },
  { id: "po-3", caseType: "protective order", county: "Tarrant", year: 2022, disposition: "Agreed order", dispositionPlain: "Both sides agreed", detail: "Agreed protective order with no finding of family violence." },
  { id: "po-4", caseType: "protective order", county: "Tarrant", year: 2023, disposition: "Order granted", dispositionPlain: "Order was approved", detail: "Ex parte order made final after a full hearing." },
  { id: "po-5", caseType: "protective order", county: "Collin", year: 2022, disposition: "Order denied", dispositionPlain: "Order was not approved", detail: "Application dismissed for failure to appear at hearing." },
  { id: "po-6", caseType: "protective order", county: "Dallas", year: 2021, disposition: "Agreed order", dispositionPlain: "Both sides agreed", detail: "Mutual agreed order with a no-contact provision." },
  { id: "po-7", caseType: "protective order", county: "Harris", year: 2023, disposition: "Order granted", dispositionPlain: "Order was approved", detail: "Order granted with firearm surrender requirement." },
  { id: "po-8", caseType: "protective order", county: "Denton", year: 2022, disposition: "Order denied", dispositionPlain: "Order was not approved", detail: "Denied; the parties did not meet the family relationship definition." },
  { id: "po-9", caseType: "protective order", county: "Dallas", year: 2023, disposition: "Agreed order", dispositionPlain: "Both sides agreed", detail: "Agreed two-year order with a no-contact term." },

  // ---------- Probation revocation ----------
  { id: "pr-1", caseType: "probation revocation", county: "Dallas", year: 2022, disposition: "Probation continued", dispositionPlain: "Stayed on probation", detail: "Probation continued with added conditions instead of jail." },
  { id: "pr-2", caseType: "probation revocation", county: "Dallas", year: 2023, disposition: "Revoked \u2013 sentenced", dispositionPlain: "Sent to jail or prison", detail: "Revoked on a new arrest; original sentence imposed." },
  { id: "pr-3", caseType: "probation revocation", county: "Tarrant", year: 2022, disposition: "Probation continued", dispositionPlain: "Stayed on probation", detail: "Technical violation; probation extended with more community service." },
  { id: "pr-4", caseType: "probation revocation", county: "Tarrant", year: 2023, disposition: "Revoked \u2013 sentenced", dispositionPlain: "Sent to jail or prison", detail: "Revoked after repeated failed drug tests; state jail time imposed." },
  { id: "pr-5", caseType: "probation revocation", county: "Harris", year: 2021, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Motion to revoke withdrawn after compliance was shown." },
  { id: "pr-6", caseType: "probation revocation", county: "Collin", year: 2022, disposition: "Probation continued", dispositionPlain: "Stayed on probation", detail: "Continued in an intensified supervision program." },
  { id: "pr-7", caseType: "probation revocation", county: "Dallas", year: 2021, disposition: "Revoked \u2013 sentenced", dispositionPlain: "Sent to jail or prison", detail: "Revoked; sentenced to 2 years state jail." },
  { id: "pr-8", caseType: "probation revocation", county: "Denton", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after all fees and classes were completed." },
  { id: "pr-9", caseType: "probation revocation", county: "Dallas", year: 2023, disposition: "Probation continued", dispositionPlain: "Stayed on probation", detail: "Continued with a treatment program added." },

  // ---------- Weapons ----------
  { id: "wp-1", caseType: "weapons", county: "Dallas", year: 2022, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after the stop was found unlawful." },
  { id: "wp-2", caseType: "weapons", county: "Dallas", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Pled guilty to Class A misdemeanor; probation and community service." },
  { id: "wp-3", caseType: "weapons", county: "Tarrant", year: 2022, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to a Class C offense; fine only." },
  { id: "wp-4", caseType: "weapons", county: "Tarrant", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Felony conviction; 3 years in prison." },
  { id: "wp-5", caseType: "weapons", county: "Collin", year: 2021, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after the firearm was suppressed as evidence." },
  { id: "wp-6", caseType: "weapons", county: "Dallas", year: 2021, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to a misdemeanor; deferred adjudication." },
  { id: "wp-7", caseType: "weapons", county: "Harris", year: 2023, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Jury conviction; 4 years in prison." },
  { id: "wp-8", caseType: "weapons", county: "Denton", year: 2022, disposition: "Acquittal", dispositionPlain: "Found not guilty", detail: "Acquitted; state failed to prove knowing possession." },

  // ---------- Traffic ----------
  { id: "tr-1", caseType: "traffic", county: "Dallas", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed after compliance and a valid license was shown." },
  { id: "tr-2", caseType: "traffic", county: "Dallas", year: 2022, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Convicted and fined; no jail time." },
  { id: "tr-3", caseType: "traffic", county: "Tarrant", year: 2023, disposition: "Deferred / Dismissed", dispositionPlain: "Dismissed after conditions met", detail: "Deferred disposition; dismissed after a safe-driving course." },
  { id: "tr-4", caseType: "traffic", county: "Tarrant", year: 2022, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Officer did not appear; case dismissed." },
  { id: "tr-5", caseType: "traffic", county: "Collin", year: 2023, disposition: "Reduced / Amended", dispositionPlain: "Charge lowered", detail: "Reduced to a non-moving violation; fine only." },
  { id: "tr-6", caseType: "traffic", county: "Harris", year: 2022, disposition: "Conviction", dispositionPlain: "Found guilty", detail: "Convicted; fine and a short license suspension." },
  { id: "tr-7", caseType: "traffic", county: "Dallas", year: 2021, disposition: "Deferred / Dismissed", dispositionPlain: "Dismissed after conditions met", detail: "Deferred; dismissed after paying fees and taking a course." },
  { id: "tr-8", caseType: "traffic", county: "Denton", year: 2023, disposition: "Dismissed", dispositionPlain: "Charges dropped", detail: "Dismissed; the license had been reinstated before the hearing." },
];

export const DISPOSITION_STYLES = {
  "Conviction": { tone: "bad", label: "Guilty" },
  "Acquittal": { tone: "good", label: "Not guilty" },
  "Dismissed": { tone: "good", label: "Dismissed" },
  "Diversion / Dismissed": { tone: "good", label: "Dismissed after a program" },
  "Deferred / Dismissed": { tone: "good", label: "Dismissed after conditions" },
  "Reduced / Amended": { tone: "neutral", label: "Charge lowered" },
  "Judgment for landlord": { tone: "bad", label: "Landlord won" },
  "Judgment for tenant": { tone: "good", label: "Tenant won" },
  "Settled / Agreed": { tone: "neutral", label: "Settled" },
  "Order for one parent": { tone: "neutral", label: "One parent got the deciding say" },
  "Order granted": { tone: "neutral", label: "Order approved" },
  "Order denied": { tone: "neutral", label: "Order not approved" },
  "Agreed order": { tone: "neutral", label: "Agreed by both sides" },
  "Revoked \u2013 sentenced": { tone: "bad", label: "Sentenced" },
  "Probation continued": { tone: "good", label: "Stayed on probation" },
};

export function dispositionStyle(disposition) {
  return DISPOSITION_STYLES[disposition] || { tone: "neutral", label: disposition };
}
