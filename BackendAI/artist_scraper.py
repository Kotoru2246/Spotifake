import os
import re
import logging
from typing import Optional, Dict, Any
from uuid import uuid4
import requests
from bs4 import BeautifulSoup
from sqlmodel import Session, select

from BackendAI.db import engine
from BackendAI.models import ArtistProfile, User

logger = logging.getLogger("artist_image_scraper")
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def scrape_artist_metadata_from_spotify(artist_url_or_id: str) -> Optional[Dict[str, Any]]:
    """
    Extracts artist avatar, name, and monthly listeners from Spotify web page without requiring an API key.
    """
    try:
        if "spotify.com" in artist_url_or_id:
            m = re.search(r"artist/([a-zA-Z0-9]+)", artist_url_or_id)
            artist_id = m.group(1) if m else artist_url_or_id.split("/")[-1].split("?")[0]
        else:
            artist_id = artist_url_or_id

        url = f"https://open.spotify.com/artist/{artist_id}"
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            logger.warning("Failed to fetch Spotify artist page %s: status %s", url, resp.status_code)
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. Name
        og_title = soup.find("meta", property="og:title")
        name = og_title["content"].strip() if og_title and og_title.get("content") else ""

        # 2. Avatar image
        og_image = soup.find("meta", property="og:image")
        avatar_url = og_image["content"].strip() if og_image and og_image.get("content") else ""

        # High resolution fallback/enhancement:
        # Spotify thumbnail is typically ab67616100005174... or ab6761610000e5eb... (640x640)
        if avatar_url and "00005174" in avatar_url:
            avatar_url = avatar_url.replace("00005174", "0000e5eb")

        # 3. Monthly listeners
        listeners_elem = soup.find(attrs={"data-testid": "monthly-listeners-label"})
        monthly_listeners = 0
        if listeners_elem and listeners_elem.text:
            cleaned = re.sub(r"[^\d]", "", listeners_elem.text)
            if cleaned.isdigit():
                monthly_listeners = int(cleaned)

        # 4. Banner Image (Search for widescreen backdrop or fallback to avatar)
        banner_url = ""
        # Check Wikipedia for high-res banner/landscape image
        if name:
            banner_url = _fetch_wikipedia_banner(name)

        if not banner_url:
            banner_url = avatar_url

        return {
            "name": name,
            "spotify_id": artist_id,
            "avatar_url": avatar_url,
            "banner_url": banner_url,
            "monthly_listeners": monthly_listeners
        }
    except Exception as e:
        logger.exception("Error scraping artist metadata for %s: %s", artist_url_or_id, e)
        return None


def _fetch_wikipedia_banner(artist_name: str) -> str:
    """Fetch landscape banner image for artist from Wikipedia API."""
    try:
        wiki_headers = {"User-Agent": "SpotifakeBot/1.0 (contact@spotifake.local)"}
        for lang in ["en", "vi"]:
            wiki_url = f"https://{lang}.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "titles": artist_name,
                "prop": "pageimages",
                "format": "json",
                "pithumbsize": 1280
            }
            res = requests.get(wiki_url, params=params, headers=wiki_headers, timeout=5)
            if res.ok:
                data = res.json()
                pages = data.get("query", {}).get("pages", {})
                for _, page in pages.items():
                    if "thumbnail" in page and "source" in page["thumbnail"]:
                        return page["thumbnail"]["source"]
    except Exception:
        pass
    return ""


def update_or_create_artist_profile(
    artist_name: str,
    spotify_url_or_id: Optional[str] = None,
    avatar_url: Optional[str] = None,
    banner_url: Optional[str] = None,
    monthly_listeners: Optional[int] = None
) -> Optional[ArtistProfile]:
    """
    Saves or updates the ArtistProfiles table in backendai.db with avatar and banner images.
    """
    if not artist_name:
        return None

    if not avatar_url and spotify_url_or_id:
        scraped = scrape_artist_metadata_from_spotify(spotify_url_or_id)
        if scraped:
            avatar_url = scraped.get("avatar_url")
            banner_url = scraped.get("banner_url")
            if not monthly_listeners:
                monthly_listeners = scraped.get("monthly_listeners")
            if not artist_name:
                artist_name = scraped.get("name")

    with Session(engine) as session:
        # Check if artist already exists
        profile = session.exec(
            select(ArtistProfile).where(ArtistProfile.stage_name == artist_name)
        ).first()

        if profile:
            if avatar_url and (not profile.profile_image_url or "placeholder" in profile.profile_image_url):
                profile.profile_image_url = avatar_url
            if banner_url and not profile.banner_image_url:
                profile.banner_image_url = banner_url
            if monthly_listeners and (not profile.followers_count or profile.followers_count == 0):
                profile.followers_count = monthly_listeners
            session.add(profile)
            session.commit()
            session.refresh(profile)
            logger.info("Updated artist profile for '%s' with avatar & banner", artist_name)
            return profile
        else:
            # Need a dummy user_id if creating new ArtistProfile
            dummy_user = session.exec(select(User).where(User.username == "artist_test")).first()
            user_id = dummy_user.id if dummy_user else uuid4()

            new_profile = ArtistProfile(
                id=uuid4(),
                user_id=user_id,
                stage_name=artist_name,
                profile_image_url=avatar_url or "",
                banner_image_url=banner_url or avatar_url or "",
                followers_count=monthly_listeners or 0,
                status="Approved",
                verified=True
            )
            session.add(new_profile)
            session.commit()
            session.refresh(new_profile)
            logger.info("Created new artist profile for '%s' with avatar & banner", artist_name)
            return new_profile
