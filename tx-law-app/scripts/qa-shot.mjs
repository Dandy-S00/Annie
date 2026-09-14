// Capture the two content-heaviest screens so we can look at them.
export default async function run(page, ui) {
  async function call(op, arg) {
    await page.evaluate(function (p) {
      var b = document.getElementById("txlaw-result");
      if (b) b.textContent = "";
      document.dispatchEvent(new CustomEvent("txlaw:call", { detail: p }));
    }, { op: op, arg: arg });
    await page.waitForTimeout(120);
  }
  await call("go", "start");
  await page.waitForTimeout(300);
  const snap = await ui.snapshot();
  const dwi = snap.match(/@(e\d+) button "DWI \/ DUI/);
  if (dwi) { await ui.click(dwi[1]); await page.waitForTimeout(400); }
  await call("go", "attorneys");
  await page.waitForTimeout(600);
  return { ok: true, screen: "attorneys" };
}
