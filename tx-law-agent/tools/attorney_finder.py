"""
Looks up Texas attorneys by practice area and county so a defendant can
find someone who actually handles their type of case.

The State Bar of Texas doesn't publish an official public API for its
"Find a Lawyer" directory as of this writing — you have two realistic
options:
  1. Manually build/maintain a curated attorney dataset (by practice area,
     county, and verified current bar standing) and index it the same way
     as the other data here.
  2. Integrate with a paid legal-directory API (e.g. a state bar partner
     service or a commercial lawyer-directory API) if you have access.

This module is written against option 1 (a local/indexed dataset) so it
works out of the box once you populate `ATTORNEY_DATA_PATH`. Swap in an
API call if you go with option 2 — the function signature can stay the
same so the agent config doesn't need to change.

Ranking rule: never rank by outcome or "best" — there is no reliable
per-attorney outcome dataset, and presenting one would be misleading.
Rank only by practice-area match specificity and, optionally, years of
relevant experience if the dataset includes it.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

ATTORNEY_DATA_PATH = os.environ.get("ATTORNEY_DATA_PATH", "./data/attorneys.json")


def _load_dataset() -> list[dict]:
    if not os.path.exists(ATTORNEY_DATA_PATH):
        return []
    with open(ATTORNEY_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def find_attorneys(case_type: str, county: str, limit: int = 5) -> dict:
    """
    Find Texas attorneys whose practice areas match the case type,
    preferring the given county.

    Args:
        case_type: normalized case type, e.g. "assault - family violence"
        county: Texas county the case is in
        limit: max attorneys to return

    Returns:
        dict with a ranked-by-match (not by outcome) list of attorneys,
        each flagged with how the match was made, plus a standing reminder
        for the user to verify current bar status themselves.
    """
    dataset = _load_dataset()
    if not dataset:
        return {
            "found": False,
            "message": (
                "No attorney dataset configured yet. Point ATTORNEY_DATA_PATH "
                "at a curated dataset, or direct the user to the State Bar "
                "of Texas 'Find a Lawyer' directory directly."
            ),
        }

    def match_score(atty):
        score = 0
        if case_type.lower() in [p.lower() for p in atty.get("practice_areas", [])]:
            score += 2
        if atty.get("county", "").lower() == county.lower():
            score += 1
        return score

    ranked = sorted(
        (a for a in dataset if match_score(a) > 0),
        key=match_score, reverse=True,
    )[:limit]

    return {
        "found": bool(ranked),
        "case_type": case_type,
        "county": county,
        "attorneys": [
            {
                "name": a["name"],
                "bar_number": a.get("bar_number"),
                "practice_areas": a.get("practice_areas", []),
                "county": a.get("county"),
                "contact": a.get("contact"),
                "match_reason": (
                    "Practice area match" if case_type.lower() in
                    [p.lower() for p in a.get("practice_areas", [])]
                    else "General/nearby match"
                ),
            }
            for a in ranked
        ],
        "reminder": (
            "This list is matched on stated practice area only — not on "
            "case outcomes, since no reliable per-attorney outcome data "
            "exists. Verify current bar standing at texasbar.com and "
            "speak with more than one attorney before deciding."
        ),
    }
