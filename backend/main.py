from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from extractors import fetch_doi_metadata, fetch_url_metadata, search_crossref
from formatters import format_citation
import fitz 
import re

app = FastAPI()

# CORS configuration configured correctly for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard DOI pattern recognition parameters used for string separation
DOI_PATTERN = re.compile(r'(10\.\d{4,9}/[-._;()/:A-Z0-9]+)', re.IGNORECASE)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), style: str = "apa"):
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        
        # Extracts text parameter from the initial pages using PyMuPDF (fitz)
        text = "".join([doc[i].get_text() for i in range(min(3, len(doc)))])
        
        match = DOI_PATTERN.search(text)
        if not match:
            raise HTTPException(status_code=404, detail="No DOI found in PDF.")
        
        doi = match.group(1).strip().rstrip('.')
        data = fetch_doi_metadata(doi)
        if not data:
            raise HTTPException(status_code=404, detail="Could not fetch DOI metadata.")
            
        formatted = format_citation(data, style)
        
        # CRITICAL FIX: Extract bibtex from data dictionary if it exists, fallback safely
        # This keeps the BibTeX module functional on your frontend layout
        bibtex = data.get("bibtex", "")
        
        return {
            "formatted": formatted, 
            "doi": doi,
            "bibtex": bibtex
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cite")
async def generate_citation(source: str, style: str = "apa"):
    data = fetch_doi_metadata(source) if source.startswith("10.") else fetch_url_metadata(source)
    if not data:
        raise HTTPException(status_code=404, detail="Source not found")
    
    formatted = format_citation(data, style)
    bibtex = data.get("bibtex", "")
    
    # CRITICAL FIX: Return bibtex block parameter along with formatted output string
    return {
        "formatted": formatted,
        "bibtex": bibtex
    }

@app.get("/search")
async def search_papers(query: str):
    if not query:
        raise HTTPException(status_code=400, detail="Query string is required")
    
    results = search_crossref(query)
    if not results:
        raise HTTPException(status_code=404, detail="No papers found for this topic.")
    
    return {"results": results}