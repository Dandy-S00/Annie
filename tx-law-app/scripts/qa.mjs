// End-to-end QA of the TX Law Guide app in a real browser.
// Run: node <skill>/browser.mjs http://localhost:4599/ --script ./scripts/qa.mjs
export default async function run(page, ui) {
  const results = {};

  const text = () => page.evaluate(() => document.querySelector("#main").innerText);
  const title = () => page.evaluate(() => document.querySelector("#title").innerText);

  // Bridge into the app module's own context. The driver's --eval runs in a
  // separate context, so we call through a DOM event (see src/app.js) and read
  // the JSON reply out of a hidden element.
  async function call(op, arg) {
    await page.evaluate(function (payload) {
      var box = document.getElementById("txlaw-result");
      if (box) box.textContent = "";
      document.dispatchEvent(new CustomEvent("txlaw:call", { detail: payload }));
    }, { op: op, arg: arg });
    await page.waitForTimeout(80);
    const raw = await page.evaluate(function () {
      var box = document.getElementById("txlaw-result");
      return box ? box.textContent : "";
    });
    try { return JSON.parse(raw); } catch (e) { return { ok: false, raw: raw }; }
  }

  async function goto(id) {
    await call("go", id);
    await page.waitForTimeout(320);
  }

  // ---- 1. Home renders ----
  results.homeTitle = await title();
  const home = await text();
  results.homeHasDisclaimer = /not your lawyer/i.test(home);
  results.homeHasStart = /Start here/i.test(home);

  // ---- 2. Intake ----
  await goto("start");
  const snap = await ui.snapshot();
  const dwi = snap.match(/@(e\d+) button "DWI \/ DUI/);
  results.intakeHasCaseTypes = !!dwi;
  if (!dwi) {
    return { error: "no DWI option on intake screen", snapshot: snap.slice(0, 1500), results: results };
  }

  await ui.click(dwi[1]);
  await page.waitForTimeout(400);
  const st = await call("state");
  results.selectedCaseType = st && st.state ? st.state.caseType : null;
  results.countySelectShown = await page.evaluate(() => !!document.querySelector("#main select"));

  // ---- 3. Situation screen ----
  await goto("situation");
  const sit = await text();
  results.situationTitle = await title();
  results.hasOutcomeSection = /What actually happened in similar real cases/i.test(sit);
  results.hasCitation = /Tex\. Penal Code/.test(sit);
  results.hasDeadlineWarning = /15 days/i.test(sit);
  results.hasCaveats = /does NOT tell you/i.test(sit);
  results.hasDisclaimer = /not your lawyer/i.test(sit);

  // ---- 4. Comparison engine ----
  const compCall = await call("compare", { caseType: "dwi", county: "Dallas" });
  const r = compCall.result || {};
  results.comparison = {
    ok: r.ok, total: r.total, headline: r.headline,
    caveatCount: (r.caveats || []).length, scope: r.scope,
  };
  results.comparisonSaysFraction = /\d+ of \d+/.test(r.headline || "");
  results.comparisonHasCaveats = (r.caveats || []).length >= 4;

  // ---- 5. Thin data must refuse to guess ----
  const thinCall = await call("compare", { caseType: "robbery", county: "Denton" });
  const t = thinCall.result || {};
  results.thinData = { ok: t.ok, reason: t.reason, message: t.message, minimum: t.minimum };
  results.thinDataRefusesToGuess = t.ok === false && /will not guess|No comparable/i.test(t.message || "");

  // ---- 6. Attorneys ----
  await goto("attorneys");
  const att = await text();
  results.attorneysTitle = await title();
  results.attorneyHasVerify = /texasbar\.com|State Bar/i.test(att);
  results.attorneyHasQuestions = /Ask every attorney these 10 questions/i.test(att);
  results.attorneyNoBestClaim = !/\bbest attorney\b/i.test(att);
  results.attorneyCards = await page.evaluate(() => document.querySelectorAll("#main .card").length);

  // ---- 7. Court lookup ----
  await goto("court");
  const courtText = await text();
  results.courtHasDeadlines = /Deadlines that decide cases/i.test(courtText);
  const courtSnap = await ui.snapshot();
  const lookBtn = courtSnap.match(/@(e\d+) button "Get the official lookup link"/);
  results.courtHasLookupBtn = !!lookBtn;
  if (lookBtn) {
    await ui.click(lookBtn[1]);
    await page.waitForTimeout(350);
    const after = await text();
    results.courtReturnsOfficialLink = /official case search/i.test(after);
    results.courtExplainsNoAutoFetch = /automated access|CAPTCHA/i.test(after);
  }

  // ---- 8. Safety / DeFastra ----
  await goto("safety");
  const safety = await text();
  results.safetyHasSignals = /Every check explained in plain words/i.test(safety);
  results.safetyHasEmailChecks = /Email checks/i.test(safety);
  results.safetyHasPhoneChecks = /Phone checks/i.test(safety);
  results.safetyHasLimits = /Honest limits of this tool/i.test(safety);
  results.safetyNeedsConfigMsg = /not switched on yet|Live checking/i.test(safety);

  const safetySnap = await ui.snapshot();
  const sampleBtn = safetySnap.match(/@(e\d+) button "Show me a sample result/);
  results.safetyHasSampleBtn = !!sampleBtn;
  if (sampleBtn) {
    await ui.click(sampleBtn[1]);
    await page.waitForTimeout(400);
    const s2 = await text();
    results.sampleRenders = /Result for phone number/i.test(s2);
    results.sampleShowsScore = /Risk score/i.test(s2);
    results.sampleShowsWarning = /Warning sign/i.test(s2);
    results.sampleShowsGood = /Good sign/i.test(s2);
  }

  // ---- 9. More ----
  await goto("more");
  const more = await text();
  results.moreHasLawBrowse = /Browse all Texas laws/i.test(more);
  results.moreHasSources = /Where our information comes from/i.test(more);
  results.moreHasSettings = /Fraud-check settings/i.test(more);
  results.moreHasNeverDo = /What this app will never do/i.test(more);

  // ---- 10. Tab bar ----
  const tabSnap = await ui.snapshot();
  const homeTab = tabSnap.match(/@(e\d+) button "Home"/);
  if (homeTab) {
    await ui.click(homeTab[1]);
    await page.waitForTimeout(300);
    results.tabBarWorks = (await title()) === "Texas Law Guide";
  }

  return results;
}
