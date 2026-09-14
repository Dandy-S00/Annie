# Texas Law Retrieval + Comparison Agent

A Microsoft Foundry agent (run/deployed from VS Code via the Foundry Toolkit
extension) that helps a defendant understand:

1. What Texas law actually says about their situation (grounded in statute text).
2. What happened in similar prior cases (grounded in retrieved case records —
   never invented).
3. Which Texas attorneys have a track record in that specific case type.

## Design principle: retrieval + comparison, not prediction

This agent **never asks the model to "predict" an outcome from memory.**
Every outcome statement is required to trace back to a retrieved document.
The pipeline is:

```
user's situation
      │
      ▼
extract fact pattern (charge/claim type, county, statute cited, key facts)
      │
      ▼
retrieve N most similar prior cases from the outcomes index
      │
      ▼
compute a plain-language summary of what actually happened in that
comparison set (e.g. "7 of 10 similar cases in this county resulted in X")
      │
      ▼
agent explains the comparison set, shows its work, and states the
confidence/limits of the comparison
```

The model is only allowed to *summarize and explain* the comparison set —
never to generate a percentage or outcome that isn't backed by retrieved
cases. See `agent/instructions.md` for the exact grounding rules.

## What this is NOT

- Not legal advice. It's a research and orientation tool.
- Not a replacement for an attorney — the explicit goal of the "find an
  attorney" tool is to get the user to a qualified human as efficiently as
  possible, matched to their specific case type.
- Not a bulk scraper of licensed legal databases (Westlaw/Lexis). Case law
  ingestion here targets public-domain sources (CourtListener/Free Law
  Project, Texas court opinion archives, Texas Statutes). If you have a
  licensed database, check its terms before bulk-indexing it — most
  prohibit exactly this use.

## Project layout

```
tx-law-agent/
├── agent/
│   ├── instructions.md       # system prompt — the grounding + tone rules
│   └── agent_config.yaml     # Foundry agent definition (model, tools)
├── ingestion/
│   ├── build_index.py        # creates the 3 Azure AI Search indexes
│   ├── ingest_statutes.py    # chunks + embeds TX statutes
│   └── ingest_caselaw.py     # chunks + embeds opinions, tags disposition
├── tools/
│   ├── outcome_comparison.py # the core retrieval+comparison function
│   ├── docket_lookup.py      # live county docket lookup (rate-limited)
│   └── attorney_finder.py    # State Bar of Texas directory lookup
├── .env.example
└── requirements.txt
```

## Setup

1. `python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in your Azure AI Search + Foundry
   project values.
4. `python ingestion/build_index.py` — creates the three indexes.
5. `python ingestion/ingest_statutes.py` and `python ingestion/ingest_caselaw.py`
   — point `SOURCE_DIR` in each at your downloaded corpus.
6. In VS Code, open the Foundry Toolkit extension, select your project, and
   use **Microsoft Foundry: Create new Hosted Agent** — when prompted for
   instructions, point it at `agent/instructions.md`, and register the three
   functions in `tools/` as the agent's tools.
7. Test in the Remote Agent Playground before deploying.

## Data source notes (fill these in before ingesting)

| Source | What it gives you | Access |
|---|---|---|
| statutes.capitol.texas.gov | Full TX statute text | Public, bulk-downloadable |
| CourtListener / Free Law Project | Appellate opinions + citations | Public bulk API |
| Texas Office of Court Administration | Aggregate disposition stats by county/case type | Public reports (use for base-rate sanity checks) |
| County docket systems (re:SearchTX, eCourts) | Individual case status/filings | Public but query-only — do NOT bulk-scrape, use `docket_lookup.py` as a live per-case tool |
| State Bar of Texas "Find a Lawyer" | Attorney practice areas, standing | Public directory, query-only |
