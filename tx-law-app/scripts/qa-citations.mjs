// Focused check: are statute citations rendered into the DOM (inside the
// collapsed <details>), and does the outcome comparison show real case records?
export default async function run(page, ui) {
  async function call(op, arg) {
    await page.evaluate(function (p) {
      var b = document.getElementById("txlaw-result");
      if (b) b.textContent = "";
      document.dispatchEvent(new CustomEvent("txlaw:call", { detail: p }));
    }, { op: op, arg: arg });
    await page.waitForTimeout(80);
    const raw = await page.evaluate(function () {
      var b = document.getElementById("txlaw-result");
      return b ? b.textContent : "";
    });
    try { return JSON.parse(raw); } catch (e) { return { ok: false, raw: raw }; }
  }

  // Pick DWI (the intake click also persists to localStorage).
  await call("go", "start");
  await page.waitForTimeout(300);
  const snap = await ui.snapshot();
  const dwi = snap.match(/@(e\d+) button "DWI \/ DUI/);
  if (dwi) { await ui.click(dwi[1]); await page.waitForTimeout(400); }

  await call("go", "situation");
  await page.waitForTimeout(400);

  return page.evaluate(function () {
    const main = document.querySelector("#main");
    const monotexts = Array.prototype.map.call(main.querySelectorAll(".mono"), function (n) {
      return n.textContent.trim();
    });
    return {
      detailsBlocks: main.querySelectorAll("details").length,
      citationNodes: monotexts.filter(function (t) { return /Tex\./.test(t); }),
      hasStatuteHeading: /What Texas law says about this/i.test(main.textContent),
      hasOutcomeHeadline: /comparable cases/i.test(main.textContent),
      caseRows: main.querySelectorAll("table.mini tbody tr").length,
      hasCaveatText: /over-represents cases that were fought/i.test(main.textContent),
      hasPredictionBan: /not a prediction/i.test(main.textContent),
      rawHas4904: main.textContent.indexOf("49.04") !== -1,
    };
  });
}
