from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def extract_section(soup, section_id):
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


async def fetch_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers=headers)
        r.raise_for_status()
        return r.text


@app.get("/scrape")
async def scrape(url: str = Query(...)):
    try:
        html = await fetch_page(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    soup = BeautifulSoup(html, "html.parser")

    drug_name = soup.find("h1").get_text(strip=True)

    result = {
        "drug": drug_name,
        "uses": extract_section(soup, "why"),
        "how_to_use": extract_section(soup, "how"),
        "side_effects": extract_section(soup, "side-effects"),
        "precautions": extract_section(soup, "precautions"),
        "other_uses": extract_section(soup, "other-uses")
    }

    return result