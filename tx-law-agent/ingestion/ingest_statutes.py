"""
Ingests Texas statute text into the tx-statutes index.

Expects STATUTES_SOURCE_DIR to contain plain-text or HTML files already
downloaded from statutes.capitol.texas.gov (bulk download, not live-scraped
per request), one file per code (Penal Code, Civil Practice & Remedies, etc).

This script chunks by section (statutes are naturally pre-chunked — don't
use a generic sliding-window splitter here, it breaks legal references).
"""
import os
import re
import uuid
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from tqdm import tqdm

load_dotenv()

SOURCE_DIR = os.environ["STATUTES_SOURCE_DIR"]
INDEX_NAME = os.environ["AZURE_SEARCH_STATUTES_INDEX"]

search_client = SearchClient(
    os.environ["AZURE_SEARCH_ENDPOINT"], INDEX_NAME,
    AzureKeyCredential(os.environ["AZURE_SEARCH_ADMIN_KEY"]),
)

embed_client = AzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_ad_token_provider=None,  # swap in azure-identity token provider for prod
)

# Adjust this pattern to match your source formatting. TX statute exports
# typically mark sections like "Sec. 22.01." — this splits on that.
SECTION_PATTERN = re.compile(r"(Sec\.\s+\d+[A-Za-z]?\.\d+\.)", re.MULTILINE)

def embed(text: str):
    resp = embed_client.embeddings.create(
        model=os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT"], input=text[:8000],
    )
    return resp.data[0].embedding

def parse_code_file(path: str, code_name: str):
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()
    parts = SECTION_PATTERN.split(raw)
    # parts alternates [preamble, "Sec. X.Y.", body, "Sec. X.Z.", body, ...]
    for i in range(1, len(parts) - 1, 2):
        citation = parts[i].strip().rstrip(".")
        body = parts[i + 1].strip()
        if len(body) < 20:
            continue
        title = body.split(".")[0][:120]
        yield {
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{code_name}-{citation}")),
            "section_citation": citation,
            "title": title,
            "text": body,
            "code_name": code_name,
        }

def main():
    docs = []
    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith((".txt", ".html"))]
    for fname in tqdm(files, desc="codes"):
        code_name = os.path.splitext(fname)[0].replace("_", " ")
        for doc in parse_code_file(os.path.join(SOURCE_DIR, fname), code_name):
            doc["text_vector"] = embed(doc["text"])
            docs.append(doc)
            if len(docs) >= 100:
                search_client.upload_documents(docs)
                docs = []
    if docs:
        search_client.upload_documents(docs)
    print("Statute ingestion complete.")

if __name__ == "__main__":
    main()
