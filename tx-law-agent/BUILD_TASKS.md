# Build tasks: attorneys.json + docket_lookup.py

Two task briefs below, written so you can paste each one directly into your
VS Code agent (Copilot agent mode / Foundry agent-development skill) as its
instructions. Each has a goal, constraints, schema, subtasks, and a
definition of done. Read the "reality check" in each before you hand it
off — there's a compliance judgment call in both that the agent can't make
for you.

---

## Task 1 — Build the attorney dataset (`data/attorneys.json`)

### Reality check before you delegate this

There's no public API for the State Bar of Texas "Find a Lawyer" directory.
Two paths, pick one before writing code:

- **Path A (recommended for MVP): curated, not scraped.** Manually compile
  a seed list from sources that are *designed* for public referral, not
  just publicly viewable — the State Bar's own **Lawyer Referral Service**
  (texasbar.com/lrs) and the **Texas Criminal Defense Lawyers Association**
  member directory are opt-in referral directories, which sidesteps the
  ToS ambiguity of scraping the general attorney-lookup directory. Start
  with 1–2 practice areas and a few counties, get the schema and matching
  logic right, then expand by hand.
- **Path B: licensed data.** If you have or can get access to a commercial
  legal-directory API (Martindale-Hubbell, Avvo, etc. — check their
  developer/API terms specifically), integrate that instead. Larger
  coverage, but a procurement step, not a coding one.

Have the agent build Path A first regardless — it's the fastest way to a
working, defensible v1.

### Goal
Produce `data/attorneys.json` matching the schema `tools/attorney_finder.py`
already expects, plus a small tool to validate and append new entries
without hand-editing JSON each time.

### Schema (must match exactly)
```json
[
  {
    "name": "Jane Doe",
    "bar_number": "24012345",
    "practice_areas": ["assault - family violence", "DWI"],
    "county": "Dallas",
    "contact": {
      "phone": "214-555-0100",
      "email": "jane@example-law.com",
      "website": "https://example-law.com"
    }
  }
]
```
`practice_areas` values must use the **same normalized case-type strings**
as `case_type` in `ingestion/ingest_caselaw.py` (e.g. `"assault - family
violence"`, not `"Assault"` or `"family violence assault"`) — inconsistent
naming here silently breaks the match in `attorney_finder.py`. Keep a
`case-types.md` list of the exact allowed strings and treat it as the
source of truth.

### Subtasks for the agent
1. Create `data/case-types.md` — the canonical list of normalized case-type
   strings used across the project (pull the set already used in your
   caselaw ingestion data so the two stay in sync).
2. Create `tools/build_attorney_dataset.py`:
   - Reads a simple CSV (`data/attorneys_raw.csv`) with columns `name,
     bar_number, practice_areas, county, phone, email, website` (practice
     areas semicolon-separated) — this is the file *you* fill in by hand
     from the referral directories.
   - Validates every `bar_number` is present and every `practice_areas`
     value exists in `case-types.md`; fails loudly (with the offending row)
     if not.
   - Converts to the nested JSON schema above and writes
     `data/attorneys.json`.
3. Create `tools/validate_attorney_dataset.py` — run in CI or pre-commit:
   checks for duplicate bar numbers, checks contact fields aren't empty,
   checks every practice area against `case-types.md`.
4. Add a `README` note in `data/` on how to add a new attorney (edit the
   CSV, rerun the build script) so this stays maintainable without needing
   the agent every time.

### Definition of done
- `python tools/build_attorney_dataset.py` runs clean on a sample CSV of
  ~10 rows and produces valid JSON matching the schema.
- `python tools/validate_attorney_dataset.py` catches a deliberately broken
  row (bad practice area, duplicate bar number) with a clear error.
- `attorney_finder.py` returns a match when tested against one of the
  seeded entries.

---

## Task 2 — Build `docket_lookup.py`'s county integrations

### Reality check before you delegate this

This is the riskier of the two builds, and it's a judgment call, not a
coding problem:

- Most Texas counties run on **Tyler Technologies' Odyssey** portal (public
  case search), but a few (including some re:SearchTX counties) use
  different systems, and terms of use vary county to county — some
  explicitly restrict **automated/programmatic access** even for
  single-case, human-initiated lookups.
- Several county portals also sit behind reCAPTCHA, which is a strong
  signal the operator doesn't want automated queries, working or not.

Because of that, I'd build this in two tiers rather than assuming full
automation everywhere:

- **Tier 1 — deep-link generator (build this first, no ToS risk):** for
  every supported county, generate a pre-filled URL into that county's
  public search portal (case number pre-populated where the portal
  supports query parameters) and hand it to the user to open and view
  themselves. No scraping, no ToS exposure, still saves the user from
  hunting for the right portal.
- **Tier 2 — actual automated query:** only implement this per county
  after you've read that specific county's portal terms of use and
  confirmed single-case, on-demand automated lookups aren't prohibited.
  Skip any county with a CAPTCHA — that's not a coding problem to route
  around.

Tell the agent explicitly to build Tier 1 for all counties and Tier 2 only
for counties you name after checking their ToS yourself — don't let it
default to scraping everything it can reach.

### Goal
Replace the `NotImplementedError` stub in `tools/docket_lookup.py` with a
working Tier 1 deep-link generator for all target counties, and Tier 2
automated lookups only for the counties you explicitly approve.

### Subtasks for the agent
1. **Tier 1, all counties**: build `tools/county_portals.py` — a config
   mapping county name → portal base URL and, where the portal accepts a
   URL query parameter for case number, the pattern to build a direct
   deep link (inspect this with browser dev tools → Network tab while
   manually searching a case, don't guess it). Update `docket_lookup.py`'s
   `lookup_case()` to return `{"found": None, "deep_link": "...", "message":
   "Automated lookup isn't enabled for this county yet — open this link to
   check the case status directly."}` for any county without Tier 2 built.
2. **Tier 2, approved counties only**: for each county you name, implement
   `_query_<county>()`:
   - Use `requests` + `BeautifulSoup` if the portal returns server-rendered
     HTML; use `playwright` only if the portal requires JS execution to
     search (that's a signal to double check the ToS again — JS-rendered
     interactive search UIs are less "public API," more "designed for
     human use").
   - Respect `DOCKET_LOOKUP_RATE_LIMIT_SECONDS` — never remove or shrink
     that throttle.
   - Parse only: case status, next hearing date, current disposition if
     public. Do not pull full filings or documents in v1.
   - On any parse failure or unexpected page structure, fail to the Tier 1
     deep-link response — never guess at a status.
3. Add a test per implemented county using a real known public case number
   you look up manually first, so you can confirm the parsed result matches
   what you see in the browser.

### Definition of done
- Every county in `SUPPORTED_COUNTIES` returns at least a working Tier 1
  deep link.
- Any county with Tier 2 implemented returns a parsed status matching a
  manual check, and correctly falls back to Tier 1 on a malformed/changed
  page rather than returning stale or guessed data.
- No county with a CAPTCHA has a Tier 2 implementation.
