"""
The core tool: retrieves comparable prior cases and returns their actual
dispositions. The agent is instructed to treat this tool's output as the
ONLY source for "what usually happens" answers — it must never generate a
likelihood from its own training data.

This module does retrieval + arithmetic only. It does not editorialize or
predict; it hands the model a structured, honest comparison set and lets
the model explain it in plain language, per agent/instructions.md.
"""
import os
from collections import Counter
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery

load_dotenv()

outcomes_client = SearchClient(
    os.environ["AZURE_SEARCH_ENDPOINT"], os.environ["AZURE_SEARCH_OUTCOMES_INDEX"],
    AzureKeyCredential(os.environ["AZURE_SEARCH_ADMIN_KEY"]),
)
embed_client = AzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
)

MIN_COMPARISON_SET = 5  # below this, the tool reports "not enough data" rather than guessing


def _embed(text: str):
    resp = embed_client.embeddings.create(
        model=os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT"], input=text[:8000],
    )
    return resp.data[0].embedding


def compare_outcomes(
    case_type: str,
    fact_summary: str,
    county: str | None = None,
    statutes_cited: list[str] | None = None,
    top_k: int = 15,
) -> dict:
    """
    Retrieve the most similar prior cases and summarize their dispositions.

    Args:
        case_type: normalized case type, e.g. "assault - family violence"
        fact_summary: short plain-language description of the user's situation
        county: optional county filter — narrows to local patterns, but
            shrinks the comparison set; the tool will widen automatically
            if the filtered set is too small (see 'note' in the response)
        statutes_cited: optional list of statute citations involved
        top_k: how many similar cases to retrieve before summarizing

    Returns:
        dict with the comparison set, disposition breakdown, and honest
        caveats — structured so the model can only report what's here.
    """
    vector = _embed(f"{case_type}. {fact_summary}")
    filters = [f"case_type eq '{case_type}'"]
    note = None

    def run_search(filter_str):
        return list(outcomes_client.search(
            search_text=None,
            vector_queries=[VectorizedQuery(vector=vector, k_nearest_neighbors=top_k, fields="fact_summary_vector")],
            filter=filter_str,
            select=["case_type", "county", "year", "disposition", "disposition_detail", "source_citation"],
        ))

    filter_str = " and ".join(filters + ([f"county eq '{county}'"] if county else []))
    results = run_search(filter_str)

    if county and len(results) < MIN_COMPARISON_SET:
        note = (
            f"Fewer than {MIN_COMPARISON_SET} matches in {county} County — "
            f"widened the comparison to statewide cases of this type."
        )
        results = run_search(" and ".join(filters))

    if len(results) < MIN_COMPARISON_SET:
        return {
            "comparable_cases_found": len(results),
            "sufficient_for_comparison": False,
            "message": (
                "Not enough comparable cases in the index to build a reliable "
                "comparison. Do not state or imply a likely outcome here."
            ),
            "cases": results,
        }

    disposition_counts = Counter(r["disposition"] for r in results if r.get("disposition"))
    total = sum(disposition_counts.values())

    return {
        "comparable_cases_found": len(results),
        "sufficient_for_comparison": True,
        "matched_on": {"case_type": case_type, "county": county, "statutes_cited": statutes_cited},
        "note": note,
        "disposition_breakdown": [
            {"disposition": d, "count": c, "fraction": f"{c}/{total}"}
            for d, c in disposition_counts.most_common()
        ],
        "cases": [
            {
                "citation": r["source_citation"],
                "county": r.get("county"),
                "year": r.get("year"),
                "disposition": r.get("disposition"),
                "disposition_detail": r.get("disposition_detail"),
            }
            for r in results
        ],
        "caveats": [
            "This reflects reported/published case outcomes only — plea "
            "deals and settlements that don't appear in the index aren't "
            "captured, and may be far more common than what's shown here.",
            "County-to-county variation can be significant; a widened "
            "statewide comparison may not reflect local patterns.",
            "This is a pattern in past cases, not a forecast for this case.",
        ],
    }
