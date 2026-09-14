"""
Live, per-case lookup of a docket's public status in a given Texas county.

Deliberately NOT a bulk scraper — county systems (re:SearchTX, eCourts,
Odyssey-based portals) are public but generally restrict automated bulk
access in their terms of use. This function queries one case at a time,
on explicit user request, and is rate-limited.

You'll need to implement `_query_county_system` per county, since each
runs its own portal (some share the Odyssey platform, which helps, but
URL structure and auth still vary). Treat this as a stub / integration
point, not a finished implementation.
"""
import os
import time
from dotenv import load_dotenv

load_dotenv()

RATE_LIMIT_SECONDS = float(os.environ.get("DOCKET_LOOKUP_RATE_LIMIT_SECONDS", 3))
_last_call = 0.0

# Map county name -> portal integration. Fill in as you build out coverage.
SUPPORTED_COUNTIES = {
    "dallas": "resarchtx",
    "tarrant": "odyssey_tarrant",
    "harris": "odyssey_harris",
    # add counties as you build/verify each integration
}


def lookup_case(county: str, case_number: str) -> dict:
    """
    Look up the public status of one specific case number in one county.

    Args:
        county: Texas county name, e.g. "Dallas"
        case_number: the case/docket number as filed

    Returns:
        dict with case status if found, or a clear "not available" message.
        Never fabricates a status if the lookup fails or the county isn't
        supported yet.
    """
    global _last_call
    elapsed = time.time() - _last_call
    if elapsed < RATE_LIMIT_SECONDS:
        time.sleep(RATE_LIMIT_SECONDS - elapsed)
    _last_call = time.time()

    key = county.strip().lower()
    if key not in SUPPORTED_COUNTIES:
        return {
            "found": False,
            "message": (
                f"No integration configured yet for {county} County. "
                f"Direct the user to that county's district/county clerk "
                f"public search portal instead."
            ),
        }

    # TODO: implement per-county query against SUPPORTED_COUNTIES[key].
    # Each portal has its own request format; this is the integration point.
    raise NotImplementedError(
        f"Implement _query_{SUPPORTED_COUNTIES[key]}() for {county} County "
        f"before enabling this lookup."
    )
