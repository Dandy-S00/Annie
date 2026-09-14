x// ---------------------------------------------------------------------------
// Texas Law Guide — app shell
//
// Rules ported from tx-law-agent/agent/instructions.md and enforced in code:
//   * Never predict an outcome. Only report what happened in real retrieved cases.
//   * Say "not enough data" rather than guessing.
//   * Never rank attorneys as "best" — no per-attorney outcome data exists.
//   * Always show the citation / source so the user can verify it themselves.
// ---------------------------------------------------------------------------

import { CASE_TYPES } from "./data/caseTypes.js";
import { STATUTES, statutesForCaseType } from "./data/statutes.js";
import {
  DFW_COUNTIES, findAttorneys, QUESTIONS_TO_ASK, VERIFY_STANDING_HELP,
  ATTORNEYS, searchAttorneysByName,
} from "./data/attorneys.js";
import { compareOutcomes, DATA_SOURCE_NOTES, MIN_CASES } from "./core/comparison.js";
import { COUNTIES, docketLookup, criticalDeadlinesFor, DEADLINES } from "./core/courts.js";
import {
  DEFASTRA, EMAIL_SIGNALS, PHONE_SIGNALS, runDeepCheck, isConfigured,
} from "./core/defastra.js";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

function el(tag, attrs, content) {
  const n = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
  }
  if (content !== undefined && content !== null) n.innerHTML = content;
  return n;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

function card(extraClass) {
  return el("div", { class: extraClass ? "card " + extraClass : "card" });
}

function pill(text, tone) {
  return el("span", { class: "pill " + (tone || ""), text: text });
}

function detailsRow(summaryText, bodyNode) {
  const d = el("details");
  const s = el("summary");
  s.textContent = summaryText;
  d.appendChild(s);
  d.appendChild(bodyNode);
  return d;
}

function table(headers, rows) {
  const t = el("table", { class: "mini" });
  const thead = el("thead");
  const hr = el("tr");
  headers.forEach((h) => hr.appendChild(el("th", { text: h })));
  thead.appendChild(hr);
  const tbody = el("tbody");
  rows.forEach((r) => {
    const tr = el("tr");
    r.forEach((cell) => {
      const td = el("td");
      if (cell && cell.nodeType) td.appendChild(cell);
      else td.innerHTML = cell === null || cell === undefined ? "" : String(cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  t.appendChild(thead);
  t.appendChild(tbody);
  return t;
}

function toast(msg, tone) {
  const t = el("div", { class: "toast " + (tone || ""), text: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  },
};

function disclaimerBox(kind) {
  const d = el("div", { class: kind ? "disclaimer " + kind : "disclaimer" });
  d.innerHTML = "<strong>I am not your lawyer, and this is not legal advice.</strong> " +
    "This app is a research and orientation tool. It helps you understand your situation and find a real Texas attorney. " +
    "Only a licensed attorney who knows your full story can advise you.";
  return d;
}

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------
const state = {
  screen: "home",
  caseType: storage.get("caseType", null),
  county: storage.get("county", "Dallas"),
  situation: storage.get("situation", ""),
  settings: storage.get("settings", { apiKey: "", proxyUrl: "" }),
  attorneyQuery: "",
};

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function renderHome(main) {
  main.appendChild(el("h1", { text: "Texas Law Guide" }));
  main.appendChild(el("p", {
    class: "meta",
    text: "Plain-language help for people facing a Texas case — criminal or civil — in Dallas, Tarrant, Collin, or Denton County.",
  }));
  main.appendChild(disclaimerBox());

  const start = el("button", { class: "btn primary", "data-go": "start" });
  start.innerHTML = "Start here — tell us what happened" +
    '<span class="hint">Takes about a minute. Everything stays on your phone.</span>';
  main.appendChild(start);

  const what = card();
  what.appendChild(el("h3", { text: "What this app does" }));
  const ul = el("ul", { class: "plain" });
  [
    "<strong>Explains the Texas law</strong> that applies to your situation, in normal words, with the statute number so you can check it yourself.",
    "<strong>Shows what actually happened</strong> in similar real cases — and says plainly when there is not enough data to tell you anything.",
    "<strong>Finds DFW attorneys</strong> who handle your exact kind of case, with everything you need to verify them yourself.",
    "<strong>Tells you your real deadlines</strong> — the ones that quietly cost people their cases.",
    "<strong>Checks suspicious emails and phone numbers</strong> (using the DeFastra fraud-detection tools) if someone contacts you about your case.",
  ].forEach((t) => ul.appendChild(el("li", { html: t })));
  what.appendChild(ul);
  main.appendChild(what);

  if (state.caseType) {
    const ct = CASE_TYPES.find((c) => c.id === state.caseType);
    const resume = card("tight");
    resume.appendChild(el("div", { class: "label", text: "Your last situation" }));
    resume.appendChild(el("div", { text: (ct ? ct.label : state.caseType) + " · " + state.county + " County" }));
    resume.appendChild(el("p", { class: "meta", text: "Tap any tab below, or start over to change it." }));
    main.appendChild(resume);
  }

  const urgent = card();
  urgent.appendChild(el("h3", { text: "Under time pressure right now?" }));
  urgent.appendChild(el("p", {
    class: "small",
    text: "If you have a court date, a hearing, or a deadline in the next few days, skip the research and contact an attorney first.",
  }));
  urgent.appendChild(el("button", { class: "btn", "data-go": "attorneys", text: "Find a DFW attorney now" }));
  main.appendChild(urgent);
}

// ---------------------------------------------------------------------------
// Start (intake)
// ---------------------------------------------------------------------------
function renderStart(main) {
  main.appendChild(el("h1", { text: "Tell us what happened" }));
  main.appendChild(el("p", {
    class: "meta",
    text: "Nothing you type leaves this phone. It is only used to pick the right law, cases, and attorneys for you.",
  }));

  const s1 = card();
  s1.appendChild(el("div", { class: "label", text: "Step 1 · What kind of situation is it?" }));
  CASE_TYPES.forEach((c) => {
    const b = el("button", { class: "btn" + (state.caseType === c.id ? " primary" : "") });
    b.innerHTML = esc(c.label) + '<span class="hint">' + esc(c.plain) + "</span>";
    b.onclick = () => {
      state.caseType = c.id;
      storage.set("caseType", c.id);
      go("start");
    };
    s1.appendChild(b);
  });
  main.appendChild(s1);

  if (!state.caseType) {
    main.appendChild(el("p", { class: "meta center", text: "Pick one above to continue." }));
    return;
  }

  const s2 = card();
  s2.appendChild(el("div", { class: "label", text: "Step 2 · Which county is the case in?" }));
  const sel = el("select");
  DFW_COUNTIES.forEach((c) => {
    const o = el("option", { value: c, text: c + " County" });
    if (state.county === c) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = () => {
    state.county = sel.value;
    storage.set("county", sel.value);
    go("start");
  };
  s2.appendChild(sel);

  const lbl = el("label", { class: "field" });
  lbl.appendChild(el("span", { text: "Step 3 · In your own words, what happened? (optional but helps a lot)" }));
  const ta = el("textarea", { placeholder: "Example: I was arrested at my apartment on Saturday. Nobody was hurt, and the other person is my roommate." });
  ta.value = state.situation;
  ta.oninput = () => {
    state.situation = ta.value;
    storage.set("situation", ta.value);
  };
  lbl.appendChild(ta);
  s2.appendChild(lbl);
  main.appendChild(s2);

  const goBtn = el("button", { class: "btn primary", "data-go": "situation" });
  goBtn.innerHTML = "Show me my results" +
    '<span class="hint">Law, real cases, deadlines, and attorneys</span>';
  main.appendChild(goBtn);
}

// ---------------------------------------------------------------------------
// My situation
// ---------------------------------------------------------------------------
function renderSituation(main) {
  if (!state.caseType) {
    main.appendChild(el("p", { text: "Start by telling us what happened." }));
    main.appendChild(el("button", { class: "btn primary", "data-go": "start", text: "Start here" }));
    return;
  }

  const ct = CASE_TYPES.find((c) => c.id === state.caseType);
  main.appendChild(el("h1", { text: ct.label }));
  main.appendChild(el("p", { class: "meta", text: state.county + " County · " + ct.plain }));

  const crit = criticalDeadlinesFor(state.caseType);
  if (crit.length) {
    const box = el("div", { class: "disclaimer danger" });
    const rows = crit.map((d) =>
      '<div style="margin-top:6px"><strong>' + esc(d.title) + "</strong> — " + esc(d.plain) +
      " <em>(" + esc(d.days) + ")</em></div>").join("");
    box.innerHTML = "<strong>Time-sensitive: read this first.</strong>" + rows;
    main.appendChild(box);
  }

  main.appendChild(disclaimerBox());

  // --- What the law says ---
  const law = card();
  law.appendChild(el("h3", { text: "What Texas law says about this" }));
  const statutes = statutesForCaseType(state.caseType);
  if (!statutes.length) {
    law.appendChild(el("p", {
      class: "small",
      text: "We do not have a statute summary mapped to this category yet. Use the More tab to search all the laws in this app, or ask an attorney to identify the exact law you are charged under.",
    }));
  } else {
    statutes.forEach((s) => {
      const d = el("details");
      const sum = el("summary");
      sum.innerHTML = esc(s.short) + ' <span class="pill accent">' + esc(s.plainType) + "</span>";
      d.appendChild(sum);

      const body = el("div", { class: "small" });
      const qs = s.commonQuestions.map((q) => "<li>" + esc(q) + "</li>").join("");
      body.innerHTML =
        "<p><strong>In plain words:</strong> " + esc(s.plain) + "</p>" +
        "<p><strong>Typical punishment:</strong> " + esc(s.punishment) + "</p>" +
        "<p><strong>Why it matters to you:</strong> " + esc(s.whyItMatters) + "</p>" +
        '<div class="label">Common questions</div>' +
        '<ul class="plain q">' + qs + "</ul>" +
        '<div class="hr"></div>' +
        '<div class="label">Official citation (verify this yourself)</div>' +
        '<div class="mono">' + esc(s.citation) + "</div>" +
        '<p class="meta">Look it up free at <a href="https://statutes.capitol.texas.gov" target="_blank" rel="noopener">statutes.capitol.texas.gov</a>.</p>';
      d.appendChild(body);
      law.appendChild(d);
    });
  }
  main.appendChild(law);

  // --- Outcomes ---
  main.appendChild(renderComparison(compareOutcomes({ caseType: state.caseType, county: state.county }), ct));

  // --- Next steps ---
  const next = card();
  next.appendChild(el("h3", { text: "What to do next" }));
  next.appendChild(el("p", { class: "small", text: "In order, this is the sequence that helps most people:" }));
  const ol = el("ul", { class: "plain" });
  [
    "Write down every date and deadline you already know (arrest, court date, notice received).",
    "Contact an attorney who handles this exact kind of case in your county — two or three of them.",
    "Bring the paperwork: charging papers, bond papers, notices, the lease or court petition.",
    "Do not talk about the facts with anyone else before you speak with a lawyer.",
  ].forEach((t) => ol.appendChild(el("li", { text: t })));
  next.appendChild(ol);
  next.appendChild(el("button", {
    class: "btn primary", "data-go": "attorneys",
    text: "Find " + state.county + " County attorneys for this case type",
  }));
  main.appendChild(next);
}

function renderComparison(res, ct) {
  const c = card();
  c.appendChild(el("h3", { text: "What actually happened in similar real cases" }));
  c.appendChild(el("p", {
    class: "meta",
    text: "Case type: " + ct.label + " · Counties: Dallas, Tarrant, Collin, Denton and statewide records in this dataset",
  }));

  if (!res.ok) {
    const warn = el("div", { class: "disclaimer calm" });
    warn.innerHTML = "<strong>Not enough comparable cases to tell you a pattern.</strong>" +
      '<p style="margin:8px 0 0">' + esc(res.message) + "</p>" +
      '<p style="margin:8px 0 0" class="meta">This is the honest answer. Making up a percentage here would be worse than useless — ' +
      "it could make you accept a deal you should not accept, or reject one you should.</p>";
    c.appendChild(warn);
    return c;
  }

  const head = card("tight");
  head.style.background = "#16294d";
  head.style.borderColor = "#24406e";
  head.style.marginBottom = "12px";
  head.appendChild(el("div", { class: "label", text: "Most common result" }));
  head.appendChild(el("div", { text: res.headline }));
  const years = res.cases.map((x) => x.year);
  head.appendChild(el("p", {
    class: "meta",
    text: "Cases found: " + res.total + " · Newest case year: " + Math.max.apply(null, years) + " · Scope: " + res.scope,
  }));
  c.appendChild(head);

  const spread = card("tight");
  spread.appendChild(el("div", { class: "label", text: "The spread, in plain terms" }));
  const rows = [
    { tone: "good", label: "Ended without a conviction / in your favor", count: res.spread.good },
    { tone: "bad", label: "Ended with a conviction / against the defendant", count: res.spread.bad },
    { tone: "neutral", label: "Ended lowered, settled, or agreed", count: res.spread.neutral },
  ];
  rows.forEach((r) => {
    const row = el("div", { class: "bar-row" });
    const bl = el("div", { class: "bar-label" });
    bl.innerHTML = "<span>" + esc(r.label) + "</span><strong>" + r.count + " of " + res.total + "</strong>";
    row.appendChild(bl);
    const track = el("div", { class: "bar-track" });
    const fill = el("div", { class: "bar-fill " + r.tone });
    fill.style.width = Math.round((r.count / res.total) * 100) + "%";
    track.appendChild(fill);
    row.appendChild(track);
    spread.appendChild(row);
  });
  spread.appendChild(el("p", {
    class: "meta",
    text: "These are the actual outcomes in the cases found — nothing here is a prediction about your case.",
  }));
  c.appendChild(spread);

  c.appendChild(detailsRow(
    "Every result, one by one (" + res.breakdown.length + " kinds of outcome)",
    table(["What happened", "How often"],
      res.breakdown.map((b) => [pill(b.plain, b.tone), b.count + " of " + b.total])),
  ));

  const caseTable = table(["Year", "County", "Result", "What happened"],
    res.cases.map((x) => [x.year, esc(x.county), pill(x.plain, x.tone), esc(x.detail)]));
  const caseWrap = el("div");
  caseWrap.appendChild(caseTable);
  caseWrap.appendChild(el("p", {
    class: "meta",
    text: "These are published or appealed cases. Court records for each are public.",
  }));
  c.appendChild(detailsRow("The actual cases behind these numbers (" + res.cases.length + ")", caseWrap));

  const cav = el("div", { class: "disclaimer calm" });
  cav.innerHTML = "<strong>What this does NOT tell you (read this part):</strong>" +
    '<ul class="plain" style="margin-top:8px">' +
    res.caveats.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
  c.appendChild(cav);

  return c;
}

// ---------------------------------------------------------------------------
// Attorneys
// ---------------------------------------------------------------------------
function renderAttorneys(main) {
  main.appendChild(el("h1", { text: "Attorneys in the DFW area" }));
  main.appendChild(el("p", { class: "meta", text: "Dallas · Tarrant · Collin · Denton counties" }));

  if (state.caseType) {
    const ct = CASE_TYPES.find((c) => c.id === state.caseType);
    const list = findAttorneys(state.caseType, state.county);

    const intro = card();
    intro.appendChild(el("h3", { text: "Best-matched for: " + ct.label + " in " + state.county + " County" }));
    intro.appendChild(el("p", {
      class: "meta",
      text: "Sorted only by how well their stated practice areas match your case type and county. Not sorted by skill, " +
        "and not by results — no reliable per-attorney result data exists, so any app that ranks lawyers as best is making it up.",
    }));
    main.appendChild(intro);

    if (!list.length) {
      const w = el("div", { class: "disclaimer" });
      w.innerHTML = "<strong>No listed attorney exactly matches that combination.</strong> Try changing the county, or use the search box below to look up anyone you have already been referred to.";
      main.appendChild(w);
    }
    list.forEach((a) => main.appendChild(attorneyCard(a)));
  } else {
    main.appendChild(el("button", {
      class: "btn primary", "data-go": "start",
      text: "Tell us your case type first — then we can match attorneys",
    }));
  }

  const s = card();
  s.appendChild(el("h3", { text: "Look up a specific attorney" }));
  s.appendChild(el("p", {
    class: "small",
    text: "Already have a name or a bar number from a referral, a letter, or a text message? Look them up here to see if they are in our verified list and to get the State Bar link for checking them.",
  }));
  const inp = el("input", { placeholder: "Name or bar number (e.g. 24051234)" });
  inp.value = state.attorneyQuery;
  const out = el("div");
  inp.oninput = () => {
    state.attorneyQuery = inp.value;
    clear(out);
    const hits = searchAttorneysByName(inp.value);
    if (inp.value.trim().length > 1 && !hits.length) {
      const w = el("div", { class: "disclaimer" });
      w.innerHTML = "<strong>Not in our list.</strong> That does not mean they are not a real attorney — it means our curated list does not cover them. Verify them yourself with the steps below, and never rely only on a text or a call that reached out to you first.";
      out.appendChild(w);
    }
    hits.forEach((h) => out.appendChild(attorneyCard(h)));
  };
  s.appendChild(inp);
  s.appendChild(out);
  main.appendChild(s);

  main.appendChild(renderVerifyCard());
  main.appendChild(renderQuestionsCard());

  const allBody = el("div");
  ATTORNEYS.forEach((a) => {
    allBody.appendChild(el("div", {
      class: "small",
      html: "<strong>" + esc(a.name) + "</strong> · " + esc(a.firm) + " · Bar #" + esc(a.barNumber) +
        " · " + a.counties.map(esc).join(", ") + " · " + a.practiceAreas.map(esc).join("; "),
    }));
    allBody.appendChild(el("div", { class: "hr" }));
  });
  main.appendChild(detailsRow("See all " + ATTORNEYS.length + " attorneys in this app's DFW list", allBody));

  main.appendChild(el("p", {
    class: "meta",
    text: "List last verified: " + ATTORNEYS[0].lastVerified +
      ". Bar standing, fees, and contact details change — always re-check before relying on them.",
  }));
}

function attorneyCard(a) {
  const c = card();
  const head = el("div", { class: "card-head" });
  const left = el("div");
  left.appendChild(el("h3", { text: a.name }));
  left.appendChild(el("div", { class: "meta", text: a.firm + " · " + a.yearsInPractice + " years in practice" }));
  head.appendChild(left);
  head.appendChild(pill(a.freeConsultation ? "Free consult" : "Paid consult", a.freeConsultation ? "good" : "neutral"));
  c.appendChild(head);

  const areaNames = a.practiceAreas
    .map((p) => {
      const found = CASE_TYPES.find((x) => x.id === p);
      return found ? found.label : p;
    })
    .join(" · ");

  c.appendChild(table(["Field", "Details"], [
    ["Counties", a.counties.map(esc).join(", ")],
    ["Handles", esc(areaNames)],
    ["Languages", a.languages.map(esc).join(", ")],
    ["Bar number", '<span class="mono">' + esc(a.barNumber) + "</span>"],
    ["How they charge", esc(a.feeModel)],
    ["Last checked", esc(a.lastVerified)],
  ]));

  if (a.matchReason) {
    const m = el("div", { class: "disclaimer calm" });
    m.innerHTML = "<strong>Why this one is on your list:</strong> " + esc(a.matchReason);
    c.appendChild(m);
  }

  c.appendChild(detailsRow("Why this might be a good fit for you", el("p", { class: "small", text: a.whyThisFit })));
  c.appendChild(detailsRow("What to expect & what to bring", el("p", { class: "small", text: a.whatToExpect })));

  const contact = card("tight");
  contact.appendChild(el("div", { class: "label", text: "Contact (verify each of these yourself before using)" }));
  const rows = el("div");
  rows.innerHTML =
    '<div class="small">Phone: <span class="mono">' + esc(a.verify.phone) + "</span></div>" +
    '<div class="small">Email: <span class="mono">' + esc(a.verify.email) + "</span></div>" +
    '<div class="small">Website: <a href="' + esc(a.verify.website) + '" target="_blank" rel="noopener">' + esc(a.verify.website) + "</a></div>" +
    '<div class="small">Check standing: <span class="mono">' + esc(a.verify.barProfile) + "</span></div>";
  contact.appendChild(rows);
  const barBtn = el("button", { class: "btn", text: "Open the State Bar lookup (texasbar.com)" });
  barBtn.onclick = () => window.open("https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer", "_blank");
  contact.appendChild(barBtn);
  c.appendChild(contact);

  c.appendChild(el("p", {
    class: "meta",
    text: "We do not rank attorneys as best and we are not paid by any attorney to appear here. Match is based on stated practice area and county only.",
  }));
  return c;
}

function renderVerifyCard() {
  const c = card();
  c.appendChild(el("h3", { text: VERIFY_STANDING_HELP.title }));
  const ul = el("ul", { class: "plain check" });
  VERIFY_STANDING_HELP.steps.forEach((s) => ul.appendChild(el("li", { text: s })));
  c.appendChild(ul);
  const w = el("div", { class: "disclaimer danger" });
  w.innerHTML = "<strong>Watch out for:</strong> " + esc(VERIFY_STANDING_HELP.warning);
  c.appendChild(w);
  return c;
}

function renderQuestionsCard() {
  const c = card();
  c.appendChild(el("h3", { text: "Ask every attorney these 10 questions" }));
  c.appendChild(el("p", {
    class: "small",
    text: "Write the answers down and compare them side by side. This is the single fastest way to tell a real fit from a sales pitch.",
  }));
  const ul = el("ul", { class: "plain q" });
  QUESTIONS_TO_ASK.forEach((q) => ul.appendChild(el("li", { text: q })));
  c.appendChild(ul);
  return c;
}

// ---------------------------------------------------------------------------
// Court & deadlines
// ---------------------------------------------------------------------------
function renderCourt(main) {
  main.appendChild(el("h1", { text: "Your court, case, and deadlines" }));
  main.appendChild(el("p", { class: "meta", text: "Where to look up your own case, and the dates that matter most." }));

  const look = card();
  look.appendChild(el("h3", { text: "Look up your own case" }));
  look.appendChild(el("p", {
    class: "small",
    text: "We do not pull your case status for you. County court systems limit automated access and some use CAPTCHA protection, so instead we hand you the official court page and you search there. That way what you read is the court's own record, not our guess.",
  }));

  const ctyLbl = el("label", { class: "field" });
  ctyLbl.appendChild(el("span", { text: "County" }));
  const sel = el("select");
  DFW_COUNTIES.forEach((x) => {
    const o = el("option", { value: x, text: x + " County" });
    if (state.county === x) o.selected = true;
    sel.appendChild(o);
  });
  ctyLbl.appendChild(sel);
  look.appendChild(ctyLbl);

  const cnLbl = el("label", { class: "field" });
  cnLbl.appendChild(el("span", { text: "Your case number (if you have it)" }));
  const cn = el("input", { placeholder: "Example: F-2270000-01" });
  cnLbl.appendChild(cn);
  look.appendChild(cnLbl);

  const out = el("div");
  const btn = el("button", { class: "btn primary", text: "Get the official lookup link" });
  btn.onclick = () => {
    const r = docketLookup({ county: sel.value, caseNumber: cn.value.trim() });
    clear(out);

    const phoneLine = r.phone
      ? '<p class="small" style="margin:0">Clerk office phone: <span class="mono">' + esc(r.phone) + "</span></p>"
      : "";
    const box = el("div", { class: "disclaimer calm" });
    box.innerHTML = "<strong>" + esc(r.portalName || "Court search") + "</strong>" +
      '<p class="small" style="margin:8px 0">' + esc(r.message) + "</p>" + phoneLine;
    out.appendChild(box);

    if (r.deepLink) {
      const open = el("button", { class: "btn", text: "Open " + r.county + " County's official case search" });
      open.onclick = () => window.open(r.deepLink, "_blank");
      out.appendChild(open);
    }

    const county = COUNTIES.filter((x) => x.name === sel.value)[0];
    if (county) {
      const note = card("tight");
      note.appendChild(el("div", { class: "label", text: "Good to know" }));
      note.appendChild(el("p", { class: "small", text: county.note }));
      out.appendChild(note);
    }
  };
  look.appendChild(btn);
  look.appendChild(out);
  main.appendChild(look);

  const dl = card();
  dl.appendChild(el("h3", { text: "Deadlines that decide cases" }));
  dl.appendChild(el("p", {
    class: "small",
    text: "In Texas, most people who lose badly do not lose on the facts — they lose by missing a deadline or a court date. These are the ones to check immediately.",
  }));
  DEADLINES.forEach((d) => {
    const box = card("tight");
    const hd = el("div", { class: "card-head" });
    hd.appendChild(el("strong", { text: d.title }));
    const tone = d.urgency === "critical" ? "bad" : d.urgency === "high" ? "warn" : "neutral";
    hd.appendChild(pill(d.days, tone));
    box.appendChild(hd);
    box.appendChild(el("p", { class: "small", text: d.plain }));
    box.appendChild(el("div", { class: "meta", text: "Legal basis: " + d.source }));
    dl.appendChild(box);
  });
  main.appendChild(dl);

  main.appendChild(el("p", {
    class: "meta",
    text: "Deadline lengths vary by county and by the specific paperwork you received. Treat these as prompts to ask a lawyer, not as a substitute for reading your own papers.",
  }));
}

// ---------------------------------------------------------------------------
// Safety check (DeFastra)
// ---------------------------------------------------------------------------
const SAMPLE_RESULT = {
  kind: "phone",
  identifier: "+12145550100",
  score: 6,
  level: "medium",
  levelInfo: DEFASTRA.riskLevels[1],
  profilesCount: 4,
  requestId: "SAMPLE0000",
  generatedAt: new Date().toISOString(),
  signals: [
    { code: "PHONE_DISPOSABLE", title: "Throwaway number?", meaning: "Was this number created to receive one text and be discarded?", outcome: "trust", outcomePlain: "Good sign", detail: "This number was not found on any disposable SMS service." },
    { code: "PHONE_CARRIER", title: "Who really owns the number?", meaning: "Which phone company is behind the number?", outcome: "trust", outcomePlain: "Good sign", detail: "The carrier is a main, legitimate carrier in that country." },
    { code: "PHONE_IS_BLACKLISTED", title: "Banned by other sites?", meaning: "Has this number been banned by social media for fake accounts?", outcome: "risk", outcomePlain: "Warning sign found", detail: "This number was blacklisted by one third-party service." },
    { code: "PHONE_OS", title: "Does a real device back it?", meaning: "Is this number live on a normal phone?", outcome: "trust", outcomePlain: "Good sign", detail: "This number is live on a normal device." },
    { code: "PHONE_TYPE", title: "Mobile, landline, or internet number?", meaning: "Internet-based (VOIP) numbers are easier to create anonymously.", outcome: "trust", outcomePlain: "Good sign", detail: "This is a normal mobile number." },
  ],
  profileRows: [
    { label: "Platforms found", value: "4 entries" },
    { label: "Country", value: "United States" },
  ],
  other: [
    { label: "Creation Year", value: "2019" },
    { label: "Deliverable", value: "true" },
  ],
};

function renderSafety(main) {
  main.appendChild(el("h1", { text: "Is this message real?" }));
  main.appendChild(el("p", {
    class: "meta",
    text: "Scammers target people with open cases. Check an email address or phone number before you send money, documents, or personal details.",
  }));

  const what = el("div", { class: "disclaimer calm" });
  what.innerHTML = "<strong>What this is:</strong> a fraud-risk signal from the DeFastra deep-check tools " +
    "(the same ones used to fight payment fraud), translated into plain words. It is a <em>warning light</em>, " +
    "not proof about a person, and not evidence for court.";
  main.appendChild(what);

  if (!isConfigured(state.settings)) {
    const warn = el("div", { class: "disclaimer" });
    warn.innerHTML = "<strong>Live checking is not switched on yet.</strong>" +
      '<p class="small" style="margin:8px 0 0">You can still read exactly what each check means and what a result would tell you below — ' +
      "and run a check against a sample result. To run live checks, add your DeFastra API key or a proxy URL in the <strong>More</strong> tab.</p>";
    main.appendChild(warn);
  }

  const form = card();
  form.appendChild(el("h3", { text: "Run a check" }));

  const kindLbl = el("label", { class: "field" });
  kindLbl.appendChild(el("span", { text: "What are you checking?" }));
  const kindSel = el("select");
  kindSel.appendChild(el("option", { value: "phone", text: "Phone number (a text or call)" }));
  kindSel.appendChild(el("option", { value: "email", text: "Email address (an email)" }));
  kindLbl.appendChild(kindSel);
  form.appendChild(kindLbl);

  const valLbl = el("label", { class: "field" });
  const valSpan = el("span", { text: "Phone number, with country code (e.g. +12145550100)" });
  valLbl.appendChild(valSpan);
  const valIn = el("input", { placeholder: "+12145550100" });
  valLbl.appendChild(valIn);
  form.appendChild(valLbl);

  const toLbl = el("label", { class: "field" });
  toLbl.appendChild(el("span", { text: "How thorough should the check be?" }));
  const toSel = el("select");
  DEFASTRA.timeoutOptions.forEach((t) => {
    toSel.appendChild(el("option", { value: t.id, text: t.label + " — " + t.plain }));
  });
  toSel.value = "normal";
  toLbl.appendChild(toSel);
  form.appendChild(toLbl);

  const noteLbl = el("label", { class: "field" });
  noteLbl.appendChild(el("span", { text: "A note for your own records (optional)" }));
  const labelIn = el("input", { placeholder: "Example: text message about bond payment" });
  noteLbl.appendChild(labelIn);
  form.appendChild(noteLbl);

  kindSel.onchange = () => {
    const isPhone = kindSel.value === "phone";
    valSpan.textContent = isPhone
      ? "Phone number, with country code (e.g. +12145550100)"
      : "Email address (e.g. name@example.com)";
    valIn.placeholder = isPhone ? "+12145550100" : "name@example.com";
  };

  const out = el("div");
  const runBtn = el("button", { class: "btn primary", text: "Check it now" });
  runBtn.onclick = async () => {
    const value = valIn.value.trim();
    if (!value) { toast("Enter a phone number or email first.", "bad"); return; }
    if (!isConfigured(state.settings)) { toast("Add a DeFastra key in the More tab first.", "bad"); return; }

    clear(out);
    const loading = card("center");
    loading.appendChild(el("span", { class: "spinner" }));
    loading.appendChild(el("div", { class: "small muted", text: "Checking… this can take a few seconds." }));
    out.appendChild(loading);
    runBtn.disabled = true;

    try {
      const res = await runDeepCheck({
        kind: kindSel.value,
        value: value,
        timeout: toSel.value,
        label: labelIn.value,
        config: state.settings,
      });
      clear(out);
      out.appendChild(renderCheckResult(res));
    } catch (err) {
      clear(out);
      const box = el("div", { class: "disclaimer danger" });
      box.innerHTML = "<strong>That check did not go through.</strong>" +
        '<p class="small" style="margin:8px 0 0">' + esc(err && err.message ? err.message : String(err)) + "</p>" +
        '<p class="small" style="margin:8px 0 0">Nothing was charged or sent anywhere else. Check the key or proxy URL in the More tab.</p>';
      out.appendChild(box);
    } finally {
      runBtn.disabled = false;
    }
  };
  form.appendChild(runBtn);
  form.appendChild(out);
  main.appendChild(form);

  const sample = el("button", { class: "btn", text: "Show me a sample result so I can see what this looks like" });
  sample.onclick = () => {
    const wrap = el("div");
    wrap.appendChild(renderCheckResult(SAMPLE_RESULT));
    main.appendChild(wrap);
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  main.appendChild(sample);

  main.appendChild(renderSignalsExplainer());

  const limits = el("div", { class: "disclaimer" });
  limits.innerHTML = "<strong>Honest limits of this tool:</strong>" +
    '<ul class="plain" style="margin-top:8px">' +
    "<li>A low score does not prove a person is honest, and a high score does not prove a crime was committed.</li>" +
    "<li>It cannot be used as evidence in court, and no judge or prosecutor relies on it.</li>" +
    "<li>It reads public and leaked data. Some of that data can be wrong or outdated about a real person.</li>" +
    "<li>Use it to decide whether to slow down and verify — never to accuse anyone of anything.</li>" +
    "<li>Never send money, gift cards, bank details, or copies of documents to anyone who contacted you first, no matter what a check says.</li>" +
    "</ul>";
  main.appendChild(limits);
}

function renderCheckResult(res) {
  const wrap = el("div");
  const tone = res.levelInfo ? res.levelInfo.tone : "neutral";

  const head = card();
  head.appendChild(el("div", { class: "label", text: "Result for " + (res.kind === "email" ? "email" : "phone number") }));
  head.appendChild(el("div", { class: "mono", text: res.identifier }));

  const scoreRow = el("div", { class: "row-between" });
  scoreRow.style.marginTop = "10px";
  const sc = el("div");
  const scorePill = el("div", {
    class: "badge-score pill " + tone,
    text: res.score === null || res.score === undefined ? "n/a" : String(res.score),
  });
  scorePill.style.fontSize = "1.6rem";
  scorePill.style.padding = "6px 12px";
  sc.appendChild(scorePill);
  sc.appendChild(el("div", { class: "meta", text: "Risk score (0 safe to 100 fraudulent)" }));
  scoreRow.appendChild(sc);

  const lv = el("div");
  lv.style.textAlign = "right";
  lv.appendChild(pill(String(res.level || "unknown").toUpperCase(), tone));
  lv.appendChild(el("div", { class: "meta", text: res.levelInfo ? res.levelInfo.plain : "Risk level not provided" }));
  scoreRow.appendChild(lv);
  head.appendChild(scoreRow);

  const adv = el("div", { class: "disclaimer " + (tone === "bad" ? "danger" : "calm") });
  adv.style.marginTop = "12px";
  adv.innerHTML = "<strong>What we recommend:</strong> " +
    esc(res.levelInfo ? res.levelInfo.advice : "Treat this as a weak signal only.");
  head.appendChild(adv);
  wrap.appendChild(head);

  const risks = res.signals.filter((s) => s.outcome === "risk");
  const good = res.signals.filter((s) => s.outcome === "trust");
  const notes = res.signals.filter((s) => s.outcome !== "risk" && s.outcome !== "trust");

  if (risks.length) wrap.appendChild(signalGroup("Warning signs found", risks, "bad"));
  if (good.length) wrap.appendChild(signalGroup("Reassuring signs found", good, "good"));
  if (notes.length) wrap.appendChild(signalGroup("Notes", notes, "neutral"));

  if (!res.signals.length) {
    const c = card();
    c.appendChild(el("p", {
      class: "small",
      text: "The service returned a risk score but no individual signal details. Rely on the score and the recommendation above, and treat this as a weak signal.",
    }));
    wrap.appendChild(c);
  }

  if (res.profileRows && res.profileRows.length) {
    const body = el("div");
    body.appendChild(table(["Field", "Value"], res.profileRows.map((r) => [esc(r.label), esc(r.value)])));
    body.appendChild(el("p", {
      class: "meta",
      text: "This is background data the service found publicly. It is not proof of anything, and it can be wrong or belong to someone else with the same number.",
    }));
    wrap.appendChild(detailsRow(
      "Public profiles linked to this " + (res.kind === "email" ? "email" : "number") +
      " (" + res.profileRows.length + " fields)", body));
  }

  if (res.other && res.other.length) {
    const body = el("div");
    body.appendChild(table(["Field", "Value"], res.other.map((r) => [esc(r.label), esc(r.value)])));
    body.appendChild(el("p", {
      class: "meta",
      text: "Shown exactly as returned. This app does not interpret fields it cannot map to documented checks.",
    }));
    wrap.appendChild(detailsRow("Other details the service returned", body));
  }

  const meta = el("p", { class: "meta" });
  meta.textContent = "Checked " + new Date(res.generatedAt).toLocaleString() +
    (res.requestId ? " · Reference " + res.requestId : "") +
    ". This is a signal, not proof, and not legal evidence.";
  wrap.appendChild(meta);
  return wrap;
}

function signalGroup(title, signals, tone) {
  const c = card();
  c.appendChild(el("div", { class: "label", text: title }));
  signals.forEach((s) => {
    const box = card("tight");
    const hd = el("div", { class: "card-head" });
    hd.appendChild(el("strong", { text: s.title }));
    hd.appendChild(pill(s.outcomePlain, tone));
    box.appendChild(hd);
    const p1 = el("p", { class: "small", text: s.meaning });
    p1.style.margin = "6px 0 0";
    box.appendChild(p1);
    if (s.detail) {
      const p2 = el("p", { class: "small muted", text: "What the service saw: " + s.detail });
      p2.style.margin = "6px 0 0";
      box.appendChild(p2);
    }
    c.appendChild(box);
  });
  return c;
}

function renderSignalsExplainer() {
  const c = card();
  c.appendChild(el("h2", { text: "Every check explained in plain words" }));
  c.appendChild(el("p", {
    class: "small",
    text: "This is the complete list of checks the DeFastra deep tools run. Nothing is hidden, and you can see exactly what each one means before you trust a result.",
  }));

  const makeGroup = (title, list) => {
    const body = el("div");
    list.forEach((s) => {
      const b = card("tight");
      b.appendChild(el("strong", { text: s.title }));
      const p = el("p", { class: "small", text: s.plain });
      p.style.margin = "6px 0 0";
      b.appendChild(p);
      if (s.risk) {
        const r = el("p", { class: "small" });
        r.style.margin = "4px 0 0";
        r.innerHTML = '<span class="pill bad">Warning</span> ' + esc(s.risk);
        b.appendChild(r);
      }
      if (s.trust) {
        const t = el("p", { class: "small" });
        t.style.margin = "4px 0 0";
        t.innerHTML = '<span class="pill good">Good</span> ' + esc(s.trust);
        b.appendChild(t);
      }
      b.appendChild(el("div", { class: "meta mono", text: s.code }));
      body.appendChild(b);
    });
    return detailsRow(title + " (" + list.length + " checks)", body);
  };

  c.appendChild(makeGroup("Email checks", EMAIL_SIGNALS));
  c.appendChild(makeGroup("Phone checks", PHONE_SIGNALS));

  const lvBody = table(["Level", "Score", "Meaning", "Advice"],
    DEFASTRA.riskLevels.map((l) => [pill(l.level, l.tone), esc(l.scoreRange), esc(l.plain), esc(l.advice)]));
  c.appendChild(detailsRow("What the risk score ranges mean", lvBody));

  const howBody = el("div");
  const ep = DEFASTRA.endpoints;
  howBody.innerHTML =
    '<p class="small">Address: <span class="mono">' + esc(DEFASTRA.baseUrl) + "</span> — secure (HTTPS) and POST-only.</p>" +
    '<p class="small">Endpoints used: <span class="mono">' + esc(ep.email) + '</span> and <span class="mono">' + esc(ep.phone) + "</span>.</p>" +
    '<p class="small">Each request sends the value you typed, a thoroughness setting, and your optional note. Nothing else about you or your case is sent.</p>' +
    '<p class="small">A packaged store version should route through your own small server so your key never sits on the phone; this app supports both a direct key and a proxy URL.</p>';
  c.appendChild(detailsRow("How this app talks to DeFastra", howBody));
  return c;
}

// ---------------------------------------------------------------------------
// More
// ---------------------------------------------------------------------------
function renderMore(main) {
  main.appendChild(el("h1", { text: "More" }));

  const browse = card();
  browse.appendChild(el("h3", { text: "Browse all Texas laws in this app" }));
  const searchIn = el("input", { placeholder: "Search laws (e.g. eviction, DWI, custody)" });
  const listWrap = el("div");
  const draw = (q) => {
    clear(listWrap);
    const qq = String(q || "").trim().toLowerCase();
    STATUTES.forEach((s) => {
      const hay = (s.short + " + s.plain + " + s.citation).toLowerCase();
      if (qq && hay.indexOf(qq) === -1) return;
      const d = el("details");
      const sum = el("summary");
      sum.innerHTML = esc(s.short) + ' <span class="pill accent">' + esc(s.plainType) + "</span>";
      d.appendChild(sum);
      const body = el("div", { class: "small" });
      body.innerHTML =
        "<p><strong>In plain words:</strong> " + esc(s.plain) + "</p>" +
        "<p><strong>Typical punishment:</strong> " + esc(s.punishment) + "</p>" +
        "<p><strong>Why it matters:</strong> " + esc(s.whyItMatters) + "</p>" +
        '<div class="mono small">' + esc(s.citation) + "</div>";
      d.appendChild(body);
      listWrap.appendChild(d);
    });
  };
  searchIn.oninput = () => draw(searchIn.value);
  draw("");
  browse.appendChild(searchIn);
  browse.appendChild(listWrap);
  main.appendChild(browse);

  const data = card();
  data.appendChild(el("h3", { text: "Where our information comes from" }));
  DATA_SOURCE_NOTES.forEach((n) => {
    data.appendChild(el("div", { class: "label", text: n.label }));
    data.appendChild(el("p", { class: "small", text: n.text }));
  });
  data.appendChild(el("p", {
    class: "small muted",
    text: "Outcome comparison needs at least " + MIN_CASES +
      " comparable cases before it will describe a pattern. Below that, it says so instead of guessing.",
  }));
  main.appendChild(data);

  const set = card();
  set.appendChild(el("h3", { text: "Fraud-check settings (DeFastra)" }));
  set.appendChild(el("p", {
    class: "small",
    text: "Optional. Only needed if you want the live email and phone checks in the Safety tab.",
  }));

  const keyLbl = el("label", { class: "field" });
  keyLbl.appendChild(el("span", { text: "DeFastra API key (stored only on this phone)" }));
  const keyIn = el("input", { placeholder: "Paste your key", type: "password" });
  keyIn.value = state.settings.apiKey || "";
  keyLbl.appendChild(keyIn);
  set.appendChild(keyLbl);

  const proxyLbl = el("label", { class: "field" });
  proxyLbl.appendChild(el("span", { text: "Or a proxy URL of your own (recommended for a shared or store build)" }));
  const proxyIn = el("input", { placeholder: "https://your-server.example.com/api/defastra" });
  proxyIn.value = state.settings.proxyUrl || "";
  proxyLbl.appendChild(proxyIn);
  set.appendChild(proxyLbl);

  const save = el("button", { class: "btn primary", text: "Save" });
  save.onclick = () => {
    state.settings = { apiKey: keyIn.value.trim(), proxyUrl: proxyIn.value.trim() };
    storage.set("settings", state.settings);
    toast("Saved on this device.", "good");
  };
  set.appendChild(save);
  set.appendChild(el("p", {
    class: "meta",
    text: "A key saved directly on a phone can be extracted from the device. For anything shared beyond your own phone, use the proxy option instead.",
  }));
  main.appendChild(set);

  const misc = card();
  misc.appendChild(el("h3", { text: "Your data" }));
  misc.appendChild(el("p", {
    class: "small",
    text: "Your case type, county, and what you typed are saved only on this phone. There is no account and no server of ours in the middle.",
  }));
  const reset = el("button", { class: "btn ghost", text: "Erase everything saved on this phone" });
  reset.onclick = () => {
    storage.set("caseType", null);
    storage.set("county", "Dallas");
    storage.set("situation", "");
    storage.set("settings", { apiKey: "", proxyUrl: "" });
    storage.set("lastCheck", null);
    state.caseType = null;
    state.situation = "";
    state.settings = { apiKey: "", proxyUrl: "" };
    toast("Everything saved on this phone has been erased.", "good");
    go("home");
  };
  misc.appendChild(reset);
  main.appendChild(misc);

  const about = card();
  about.appendChild(el("h3", { text: "What this app will never do" }));
  const ul = el("ul", { class: "plain" });
  [
    "It will never tell you what plea, filing, or strategy to choose — that is legal advice, and only your attorney can give it.",
    "It will never give a percentage chance for your own case. It only reports what happened in real past cases and says clearly that it is not a forecast.",
    "It will never invent a case, a statute, or an attorney record. When it has nothing, it says so.",
    "It will never rank attorneys as best — no reliable per-attorney outcome data exists.",
    "It is not a law firm, does not represent you, and no attorney-client relationship is created by using it.",
  ].forEach((t) => ul.appendChild(el("li", { text: t })));
  about.appendChild(ul);
  about.appendChild(el("p", {
    class: "meta",
    text: "Built on the tx-law-agent and tx-law-agent-Courtoutcomes research, with fraud signals from the DeFastra deep-check tools.",
  }));
  main.appendChild(about);

  main.appendChild(disclaimerBox());
}

// ---------------------------------------------------------------------------
// navigation
// ---------------------------------------------------------------------------
const SCREENS = {
  home: { title: "Texas Law Guide", sub: "Plain-language help for Texas cases", render: renderHome },
  start: { title: "Tell us what happened", sub: "About a minute", render: renderStart },
  situation: { title: "Your situation", sub: "Law, real cases, deadlines", render: renderSituation },
  attorneys: { title: "Attorneys", sub: "DFW area", render: renderAttorneys },
  court: { title: "Court & deadlines", sub: "Look up your case", render: renderCourt },
  safety: { title: "Is this message real?", sub: "Fraud-check tools", render: renderSafety },
  more: { title: "More", sub: "Laws, data, settings", render: renderMore },
};

const TABS = [
  { id: "home", label: "Home", icon: "\u2302" },
  { id: "situation", label: "My case", icon: "\u2696" },
  { id: "attorneys", label: "Attorneys", icon: "\u2695" },
  { id: "court", label: "Court", icon: "\u2691" },
  { id: "safety", label: "Safety", icon: "\u26A0" },
];

function go(id) {
  state.screen = id;
  const cfg = SCREENS[id] || SCREENS.home;
  $("#title").textContent = cfg.title;
  $("#subtitle").textContent = cfg.sub;
  const main = clear($("#main"));
  cfg.render(main);
  const tabs = document.querySelectorAll(".tabbar button");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle("active", tabs[i].getAttribute("data-tab") === id);
  }
  window.scrollTo(0, 0);
}

function buildTabs() {
  const bar = clear($("#tabbar"));
  TABS.forEach((t) => {
    const b = el("button", { "data-tab": t.id });
    b.appendChild(el("span", { class: "ico", text: t.icon }));
    b.appendChild(el("span", { text: t.label }));
    b.onclick = () => go(t.id);
    bar.appendChild(b);
  });
}

document.addEventListener("click", (e) => {
  const target = e.target && e.target.closest ? e.target.closest("[data-go]") : null;
  if (target) go(target.getAttribute("data-go"));
});

buildTabs();
go("home");

// hook for automated QA
window.__txlaw = { go: go, state: state, compareOutcomes: compareOutcomes };
