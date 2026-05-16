import requests
from bs4 import BeautifulSoup
import time

def clean_field(field, default=""):
    """Correctly pulls the string out of a list to avoid brackets."""
    if not field:
        return default
    if isinstance(field, list):
        # We take the first item of the list, NOT the string representation of the list
        return str(field).strip() if len(field) > 0 else default
    return str(field).strip()

def fetch_doi_metadata(doi: str):
    url = f"https://api.crossref.org/works/{doi}"
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=20) 
            if response.status_code == 200:
                item = response.json()["message"]
                
                # These are the fields that were causing brackets
                title = clean_field(item.get("title"), "Unknown Title")
                container = clean_field(item.get("container-title"), "")
                
                # Clean up date handling
                date_parts = item.get("published-print", item.get("created", {})).get("date-parts", [])
                year_val = str(date_parts) if date_parts and date_parts else "n.d."
                
                return {
                    "id": doi,
                    "author": [{"family": a.get("family", "Unknown"), "given": a.get("given", "")} 
                               for a in item.get("author", [])],
                    "title": title,
                    "container-title": container,
                    "issued": {"date-parts": date_parts},
                    "type": "article-journal",
                    "year": year_val
                }
            elif response.status_code == 404:
                return None 
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(1) 
    return None

def fetch_url_metadata(url: str):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        raw_title = soup.title.string if soup.title else "Webpage"
        return {
            "id": url,
            "title": raw_title.strip(),
            "author": [{"family": "Webmaster", "given": ""}],
            "issued": {"date-parts": []},
            "type": "webpage",
            "year": "2024"
        }
    except:
        return None

def search_crossref(query: str, limit: int = 5):
    url = f"https://api.crossref.org/works?query={query}&rows={limit}"
    try:
        response = requests.get(url, timeout=20)
        if response.status_code == 200:
            items = response.json()["message"]["items"]
            results = []
            for item in items:
                # CLEANING TITLES HERE:
                title = clean_field(item.get("title"), "Unknown Title")
                publisher = clean_field(item.get("publisher"), "Unknown Publisher")
                doi = item.get("DOI")
                
                # CLEANING YEAR HERE:
                date_info = item.get("published-print") or item.get("created") or {}
                date_parts = date_info.get("date-parts", [])
                year = str(date_parts) if date_parts and date_parts else "n.d."
                
                if doi:
                    results.append({
                        "title": title, # No more brackets!
                        "doi": doi,
                        "year": year,
                        "publisher": publisher
                    })
            return results
    except Exception as e:
        print(f"Search Error: {e}")
    return []