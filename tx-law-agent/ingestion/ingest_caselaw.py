"""
Ingests Texas case opinions into tx-caselaw (full text, for citation lookup)
AND tx-outcomes (structured summary, for comparison matching).

Expects CASELAW_SOURCE_DIR to contain JSON records already pulled from a
bulk source (e.g. CourtListener's bulk data / API export) in this shape:

{
  "case_name": "...",
  "citation": "...",
  "court": "...",
  "county": "...",            # fill in where available; many opinions omit this
  "year": 2023,
  "statutes_cited": ["Tex. Penal Code § 22.01", ...],
  "opinion_text": "...",
  "disposition": "affirmed" | "reversed" | "reversed and remanded" | "conviction" | ...,
  "disposition_detail": "free text on what happened",
  "case_type": "assault - family violence",   # normalize this yourself; see NOTE below
  "fact_summary": "short human/LLM-written summary of the key facts"
}

NOTE on case_type / fact_summary: opinions don't come with these fields
pre-labeled. Either curate them by hand for a smaller high-quality set, or
generate them with an LLM pass and have a human spot-check before indexing
— outcome_comparison.py's usefulness depends entirely on this metadata
being accurate. Garbage labels here produce confidently wrong comparisons.
"""
import os
import json
import uuid
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from tqdm import tqdm

load_dotenv()

SOURCE_DIR = os.environ["CASELAW_SOURCE_DIR"]

caselaw_client = SearchClient(
    os.environ["AZURE_SEARCH_ENDPOINT"], os.environ["AZURE_SEARCH_CASELAW_INDEX"],
    AzureKeyCredential(os.environ["AZURE_SEARCH_ADMIN_KEY"]),
)
outcomes_client = SearchClient(
    os.environ["AZURE_SEARCH_ENDPOINT"], os.environ["AZURE_SEARCH_OUTCOMES_INDEX"],
    AzureKeyCredential(os.environ["AZURE_SEARCH_ADMIN_KEY"]),
)

embed_client = AzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
)

def embed(text: str):
    resp = embed_client.embeddings.create(
        model=os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT"], input=text[:8000],
    )
    return resp.data[0].embedding

def main():
    caselaw_docs, outcome_docs = [], []
    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith(".json")]

    for fname in tqdm(files, desc="opinions"):
        with open(os.path.join(SOURCE_DIR, fname), "r", encoding="utf-8") as f:
            rec = json.load(f)

        case_id = str(uuid.uuid5(uuid.NAMESPACE_URL, rec["citation"]))

        caselaw_docs.append({
            "id": case_id,
            "case_name": rec["case_name"],
            "citation": rec["citation"],
            "court": rec.get("court", ""),
            "county": rec.get("county", ""),
            "year": rec.get("year", 0),
            "statutes_cited": rec.get("statutes_cited", []),
            "opinion_text": rec["opinion_text"],
            "disposition": rec.get("disposition", ""),
            "opinion_vector": embed(rec["opinion_text"]),
        })

        if rec.get("fact_summary") and rec.get("case_type"):
            outcome_docs.append({
                "id": case_id,
                "case_type": rec["case_type"],
                "county": rec.get("county", ""),
                "statutes_cited": rec.get("statutes_cited", []),
                "year": rec.get("year", 0),
                "fact_summary": rec["fact_summary"],
                "disposition": rec.get("disposition", ""),
                "disposition_detail": rec.get("disposition_detail", ""),
                "source_citation": rec["citation"],
                "fact_summary_vector": embed(rec["fact_summary"]),
            })

        if len(caselaw_docs) >= 100:
            caselaw_client.upload_documents(caselaw_docs)
            caselaw_docs = []
        if len(outcome_docs) >= 100:
            outcomes_client.upload_documents(outcome_docs)
            outcome_docs = []

    if caselaw_docs:
        caselaw_client.upload_documents(caselaw_docs)
    if outcome_docs:
        outcomes_client.upload_documents(outcome_docs)
    print("Case law + outcomes ingestion complete.")

if __name__ == "__main__":
    main()
