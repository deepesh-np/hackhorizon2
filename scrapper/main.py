from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup

app = FastAPI(title="Vitality Drug Info Scraper", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "drug-info-scraper"}


def extract_section(soup, section_id):
    """Extract text content from a MedlinePlus section by its heading ID."""
    section = soup.find(id=section_id)
    if not section:
        return None

    content = []
    node = section.parent

    for sibling in node.find_next_siblings():
        if sibling.name == "h2":
            break
        text = sibling.get_text(" ", strip=True)
        if text:
            content.append(text)

    return " ".join(content)


def extract_section_list(soup, section_id):
    """Extract content as a list of bullet points from a MedlinePlus section."""
    section = soup.find(id=section_id)
    if not section:
        return []

    items = []
    node = section.parent

    for sibling in node.find_next_siblings():
        if sibling.name == "h2":
            break
        list_items = sibling.find_all("li")
        if list_items:
            for li in list_items:
                text = li.get_text(" ", strip=True)
                if text:
                    items.append(text)
        else:
            text = sibling.get_text(" ", strip=True)
            if text:
                items.append(text)

    return items


async def fetch_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
    }

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        r = await client.get(url, headers=headers)
        r.raise_for_status()
        return r.text


@app.get("/scrape")
async def scrape(url: str = Query(..., description="MedlinePlus drug info page URL")):
    """
    Scrape a MedlinePlus drug information page and return structured data.
    Example: /scrape?url=https://medlineplus.gov/druginfo/meds/a682659.html
    """
    if "medlineplus.gov" not in url:
        raise HTTPException(status_code=400, detail="Only medlineplus.gov URLs are supported")

    try:
        html = await fetch_page(url)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch page: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {str(e)}")

    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.find("h1")
    drug_name = title_tag.get_text(strip=True) if title_tag else "Unknown Drug"

    result = {
        "drug": drug_name,
        "source_url": url,
        "uses": extract_section(soup, "why"),
        "how_to_use": extract_section(soup, "how"),
        "dosage": extract_section(soup, "other-information"),
        "side_effects": extract_section(soup, "side-effects"),
        "side_effects_list": extract_section_list(soup, "side-effects"),
        "precautions": extract_section(soup, "precautions"),
        "precautions_list": extract_section_list(soup, "precautions"),
        "special_dietary": extract_section(soup, "special-dietary"),
        "storage": extract_section(soup, "storage-conditions"),
        "overdose": extract_section(soup, "overdose"),
        "other_uses": extract_section(soup, "other-uses"),
        "brand_names": extract_section(soup, "brand-name-1"),
    }

    return result


@app.get("/search-medline")
async def search_medline(q: str = Query(..., min_length=2, description="Drug name to search on MedlinePlus")):
    """
    Search MedlinePlus for a drug name and return the first matching page URL + scraped data.
    Example: /search-medline?q=ibuprofen
    """
    search_url = f"https://medlineplus.gov/druginformation.html"

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html",
            }
            r = await client.get(
                f"https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&v%3Asources=medlineplus-bundle&query={q}+drug+information&",
                headers=headers,
            )

            if r.status_code != 200:
                drug_url = f"https://medlineplus.gov/druginfo/meds/a682159.html"
                return {"drug": q, "search_note": "Auto-search unavailable. Try providing a direct URL via /scrape?url=...", "source_url": None}

            soup = BeautifulSoup(r.text, "html.parser")
            links = soup.find_all("a", href=True)

            for link in links:
                href = link["href"]
                if "/druginfo/meds/" in href:
                    full_url = href if href.startswith("http") else f"https://medlineplus.gov{href}"
                    return await scrape(url=full_url)

    except Exception as e:
        pass

    return {"drug": q, "search_note": "No direct match found on MedlinePlus. Try /scrape?url=... with a specific URL.", "source_url": None}