"""
Creates the three Azure AI Search indexes this project needs:
  - tx-statutes   : statute text, chunked by section
  - tx-caselaw    : opinion text, chunked, with case metadata
  - tx-outcomes   : one row per case, structured for comparison matching
                     (this is what outcome_comparison.py queries)

Run once before ingesting data: `python ingestion/build_index.py`
"""
import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SimpleField, SearchableField, SearchFieldDataType,
    VectorSearch, HnswAlgorithmConfiguration, VectorSearchProfile,
    SearchField,
)

load_dotenv()

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
KEY = os.environ["AZURE_SEARCH_ADMIN_KEY"]
EMBED_DIMS = 3072  # text-embedding-3-large; change if using a different model

client = SearchIndexClient(ENDPOINT, AzureKeyCredential(KEY))

vector_search = VectorSearch(
    algorithms=[HnswAlgorithmConfiguration(name="hnsw-default")],
    profiles=[VectorSearchProfile(name="vector-profile", algorithm_configuration_name="hnsw-default")],
)

def vector_field(name):
    return SearchField(
        name=name, type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
        searchable=True, vector_search_dimensions=EMBED_DIMS,
        vector_search_profile_name="vector-profile",
    )

statutes_index = SearchIndex(
    name=os.environ["AZURE_SEARCH_STATUTES_INDEX"],
    fields=[
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="section_citation", type=SearchFieldDataType.String, filterable=True),
        SearchableField(name="title", type=SearchFieldDataType.String),
        SearchableField(name="text", type=SearchFieldDataType.String),
        SimpleField(name="code_name", type=SearchFieldDataType.String, filterable=True, facetable=True),
        vector_field("text_vector"),
    ],
    vector_search=vector_search,
)

caselaw_index = SearchIndex(
    name=os.environ["AZURE_SEARCH_CASELAW_INDEX"],
    fields=[
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="case_name", type=SearchFieldDataType.String),
        SimpleField(name="citation", type=SearchFieldDataType.String, filterable=True),
        SimpleField(name="court", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="county", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="year", type=SearchFieldDataType.Int32, filterable=True, sortable=True),
        SimpleField(name="statutes_cited", type=SearchFieldDataType.Collection(SearchFieldDataType.String), filterable=True),
        SearchableField(name="opinion_text", type=SearchFieldDataType.String),
        SimpleField(name="disposition", type=SearchFieldDataType.String, filterable=True, facetable=True),
        vector_field("opinion_vector"),
    ],
    vector_search=vector_search,
)

# The comparison-critical index: one structured row per case, built for
# filtering + matching rather than free text search.
outcomes_index = SearchIndex(
    name=os.environ["AZURE_SEARCH_OUTCOMES_INDEX"],
    fields=[
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SimpleField(name="case_type", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="county", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="statutes_cited", type=SearchFieldDataType.Collection(SearchFieldDataType.String), filterable=True),
        SimpleField(name="year", type=SearchFieldDataType.Int32, filterable=True, sortable=True),
        SearchableField(name="fact_summary", type=SearchFieldDataType.String),
        SimpleField(name="disposition", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="disposition_detail", type=SearchFieldDataType.String),
        SimpleField(name="source_citation", type=SearchFieldDataType.String),
        vector_field("fact_summary_vector"),
    ],
    vector_search=vector_search,
)

for idx in (statutes_index, caselaw_index, outcomes_index):
    client.create_or_update_index(idx)
    print(f"Created/updated index: {idx.name}")
