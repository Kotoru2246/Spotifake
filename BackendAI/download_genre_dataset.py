"""Download a labeled 11-genre audio dataset using yt-dlp.

Each genre gets N short audio clips downloaded from YouTube via curated search
queries. Files are saved into subfolders named by genre, and a labels.csv is
generated so the rest of the pipeline (data_extraction, train_combined_model)
can consume it immediately.

Usage:
    python BackendAI/download_genre_dataset.py --out-dir BackendAI/datasets/genre18_audio --samples 15
    python BackendAI/download_genre_dataset.py --out-dir BackendAI/datasets/genre18_audio --samples 5 --genres "Hip-Hop / Rap" "Pop" "Rock"
    python BackendAI/download_genre_dataset.py --out-dir BackendAI/datasets/genre18_audio --list-genres

Requirements:
    yt-dlp (pip install yt-dlp)
    ffmpeg must be on PATH for audio conversion.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

try:
    import yt_dlp
except ImportError:
    sys.exit("yt-dlp is required. Run: pip install yt-dlp")

# ---------------------------------------------------------------------------
# Curated search queries for each genre.
# Multiple queries per genre increase diversity.
# ---------------------------------------------------------------------------
GENRE_QUERIES: Dict[str, List[str]] = {
    "Hip-Hop / Rap": [
        "hip hop rap official audio",
        "kendrick lamar rap song audio",
        "j cole hip hop track audio",
        "drake rap music official",
        "eminem rap official audio",
        "classic hip hop boom bap track",
        "trap rap music official audio",
    ],
    "Pop": [
        "pop music official audio 2024",
        "taylor swift pop song audio",
        "ed sheeran pop track official",
        "ariana grande pop official audio",
        "billie eilish pop music audio",
        "dua lipa pop official audio",
        "the weeknd pop song audio",
    ],
    "Rock": [
        "rock music official audio",
        "classic rock guitar song audio",
        "foo fighters rock official audio",
        "linkin park rock track audio",
        "nirvana grunge rock audio",
        "AC/DC hard rock official audio",
        "red hot chili peppers rock audio",
    ],
    "Electronic / EDM": [
        "edm electronic dance music official audio",
        "martin garrix edm official audio",
        "tiesto edm track audio",
        "deadmau5 electronic music audio",
        "avicii edm official audio",
        "house music electronic official audio",
        "techno electronic dance official",
    ],
    "R&B / Soul": [
        "r&b soul music official audio",
        "usher r&b song official audio",
        "frank ocean r&b track audio",
        "sza r&b official audio",
        "h.e.r r&b music audio",
        "alicia keys r&b official audio",
        "john legend rhythm blues audio",
    ],
    "Country": [
        "country music official audio",
        "luke combs country song audio",
        "morgan wallen country official audio",
        "blake shelton country track audio",
        "carrie underwood country official",
        "classic country music official audio",
        "johnny cash country song audio",
    ],
    "Jazz": [
        "jazz music official audio",
        "miles davis jazz track audio",
        "john coltrane jazz official audio",
        "jazz piano trio audio",
        "bebop jazz official audio",
        "smooth jazz saxophone audio",
        "ella fitzgerald jazz vocal audio",
    ],
    "Classical": [
        "classical music orchestra official audio",
        "beethoven symphony orchestra audio",
        "mozart classical music audio",
        "chopin piano classical audio",
        "bach classical orchestral audio",
        "vivaldi classical music audio",
        "brahms symphony classical audio",
    ],
    "Reggae": [
        "reggae music official audio",
        "bob marley reggae official audio",
        "reggae riddim track audio",
        "dancehall reggae official audio",
        "ska reggae music audio",
        "roots reggae official audio",
        "peter tosh reggae track audio",
    ],
    "Latin": [
        "reggaeton latin music official audio",
        "bad bunny latin trap audio",
        "j balvin reggaeton official audio",
        "salsa latin music official audio",
        "bachata latin official audio",
        "maluma latin pop official audio",
        "cumbia latin music official audio",
    ],
    "K-Pop": [
        "kpop official audio 2024",
        "BTS k-pop official audio",
        "blackpink k-pop official audio",
        "twice kpop official audio",
        "stray kids kpop audio",
        "aespa kpop official audio",
        "exo kpop official audio",
    ],
    "J-Pop": [
        "j-pop official audio",
        "jpop song official audio",
        "japanese pop music audio",
        "utada hikaru j-pop official audio",
        "yoasobi j-pop official audio",
        "aimer j-pop official audio",
        "perfume j-pop official audio",
    ],
    "Metal": [
        "metal music official audio",
        "metallica metal official audio",
        "heavy metal guitar riff audio",
        "iron maiden metal official audio",
        "slipknot metal track audio",
        "tool metal official audio",
        "black sabbath metal audio",
    ],
    "Afrobeats": [
        "afrobeats official audio 2024",
        "burna boy afrobeats official audio",
        "wizkid afrobeats official audio",
        "davido afrobeats track audio",
        "afropop official audio",
        "tems afrobeats official audio",
        "rema afrobeats official audio",
    ],
    "Folk": [
        "folk music official audio",
        "bob dylan folk song audio",
        "acoustic folk guitar official audio",
        "indie folk official audio",
        "simon garfunkel folk audio",
        "fleet foxes folk official audio",
        "iron and wine folk audio",
    ],
    "Blues": [
        "blues music official audio",
        "bb king blues official audio",
        "muddy waters blues audio",
        "electric blues guitar official audio",
        "robert johnson delta blues audio",
        "stevie ray vaughan blues audio",
        "chicago blues official audio",
    ],
    "Soul": [
        "soul music official audio",
        "otis redding soul track audio",
        "aretha franklin soul official audio",
        "marvin gaye soul music audio",
        "sam cooke soul official audio",
        "stevie wonder soul track audio",
        "al green soul music audio",
    ],
    "Funk": [
        "funk music official audio",
        "james brown funk official audio",
        "parliament funkadelic official audio",
        "earth wind fire funk audio",
        "sly stone funk official audio",
        "disco funk official audio",
        "rick james funk music audio",
    ],
    "Indie / Alternative": [
        "indie alternative music official audio",
        "arctic monkeys indie official audio",
        "tame impala indie official audio",
        "radiohead alternative official audio",
        "the 1975 indie official audio",
        "vampire weekend indie audio",
        "modest mouse indie official audio",
    ],
    "Anime / Vocaloid": [
        "vocaloid official audio",
        "hatsune miku official audio",
        "anime song official audio",
        "japanese anime opening audio",
        "utadahikaru anime song official audio",
        "game soundtrack vocaloid audio",
        "anime pop official audio",
    ],
}

TARGET_GENRES = [
    "Pop",
    "Rock",
    "Hip-Hop / Rap",
    "R&B / Soul",
    "Electronic / EDM",
    "Country",
    "Jazz",
    "Blues",
    "Classical",
    "Reggae",
    "Latin",
]

STRICT_TITLE_KEYWORDS: Dict[str, List[str]] = {
    "Pop": ["pop"],
    "Rock": ["rock", "alt", "alternative", "indie"],
    "Hip-Hop / Rap": ["hip hop", "hip-hop", "rap", "trap", "drill"],
    "R&B / Soul": ["r&b", "rnb", "rhythm and blues", "soul", "neo soul", "motown"],
    "Electronic / EDM": ["edm", "electronic", "dance", "house", "techno", "trance", "dubstep"],
    "Country": ["country", "americana", "bluegrass"],
    "Jazz": ["jazz", "bebop", "swing"],
    "Blues": ["blues", "delta blues", "chicago blues"],
    "Classical": ["classical", "symphony", "orchestra", "concerto", "sonata"],
    "Reggae": ["reggae", "dancehall", "dub", "ska"],
    "Latin": ["latin", "reggaeton", "salsa", "bachata", "cumbia", "merengue"],
}


def _safe_folder_name(genre: str) -> str:
    """Convert genre name to a safe folder name."""
    return genre.replace("/", "_").replace("(", "").replace(")", "").replace(" ", "_")


def _normalize_title(title: str) -> str:
    """Normalize a title so near-duplicates can be detected reliably."""
    value = (title or "").lower().strip()
    value = re.sub(r"\[[^\]]*\]", " ", value)
    value = re.sub(r"\([^\)]*\)", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _load_manifest(manifest_path: Path) -> dict:
    if not manifest_path.exists():
        return {"video_ids": [], "title_keys": []}
    try:
        with open(manifest_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return {
            "video_ids": list(data.get("video_ids", [])),
            "title_keys": list(data.get("title_keys", [])),
        }
    except Exception:
        return {"video_ids": [], "title_keys": []}


def _save_manifest(manifest_path: Path, manifest: dict) -> None:
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)


def _load_existing_downloaded_signatures(genre_dir: Path) -> set:
    signatures = set()
    for existing_file in genre_dir.glob("*.mp3"):
        signatures.add(_normalize_title(existing_file.stem))
    return signatures


def _resolve_ffmpeg_location(explicit_path: Optional[str] = None) -> Optional[str]:
    """Return a usable ffmpeg location for yt-dlp, if available."""
    candidates = []
    if explicit_path:
        candidates.append(Path(explicit_path))
    candidates.extend([
        Path(r"C:\ffmpeg\bin\ffmpeg.exe"),
        Path(r"C:\ffmpeg\bin"),
    ])

    for candidate in candidates:
        if candidate.is_file():
            return str(candidate.parent)
        if candidate.is_dir() and (candidate / "ffmpeg.exe").exists():
            return str(candidate)

    try:
        completed = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        if completed.returncode == 0:
            return None  # available on PATH, yt-dlp can use the system lookup
    except Exception:
        pass

    return None


def prune_non_target_genre_folders(out_dir: Path, allowed_genres: List[str]) -> int:
    """Delete genre subfolders that are not in the allowed taxonomy."""
    allowed_folder_names = {_safe_folder_name(g) for g in allowed_genres}
    removed = 0
    if not out_dir.exists():
        return removed

    for child in out_dir.iterdir():
        if not child.is_dir():
            continue
        if child.name not in allowed_folder_names:
            shutil.rmtree(child, ignore_errors=True)
            removed += 1
    return removed


def download_genre(
    genre: str,
    queries: List[str],
    out_dir: Path,
    n_samples: int,
    clip_duration: int = 30,
    verbose: bool = False,
    duplicate_mode: str = "1",
    force_redownload: bool = True,
    ffmpeg_location: Optional[str] = None,
    min_video_duration: int = 120,
    max_video_duration: int = 300,
    skip_livestreams: bool = True,
    clip_position: str = "middle",
    workers: int = 4,
    strict_title_match: bool = False,
    min_view_count: int = 0,
    max_age_days: int = 0,
    cookies_from_browser: Optional[str] = None,
    cookies_path: Optional[str] = None,
    sleep_interval: float = 0.0,
    max_sleep_interval: float = 0.0,
) -> List[str]:
    """Download up to n_samples audio clips for a genre."""
    genre_dir = out_dir / _safe_folder_name(genre)
    if force_redownload and genre_dir.exists():
        shutil.rmtree(genre_dir, ignore_errors=True)
    genre_dir.mkdir(parents=True, exist_ok=True)

    downloaded: List[str] = []
    needed = n_samples
    manifest_path = out_dir / "download_manifest.json"
    if force_redownload and manifest_path.exists():
        try:
            manifest_path.unlink()
        except Exception:
            pass
    manifest = _load_manifest(manifest_path)
    skip_duplicates = str(duplicate_mode).strip() == "1"
    seen_video_ids = set(manifest.get("video_ids", [])) if skip_duplicates else set()
    seen_title_keys = set(manifest.get("title_keys", [])) if skip_duplicates else set()
    if skip_duplicates and not force_redownload:
        seen_title_keys.update(_load_existing_downloaded_signatures(genre_dir))

    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "outtmpl": str(genre_dir / "%(title).60s.%(ext)s"),
        "quiet": not verbose,
        "no_warnings": not verbose,
        "noplaylist": True,
        "max_downloads": needed,
        "download_archive": str(out_dir / "download_archive.txt"),
        "ignoreerrors": True,
        "geo_bypass": True,
    }

    resolved_ffmpeg = _resolve_ffmpeg_location(ffmpeg_location)
    if resolved_ffmpeg:
        ydl_opts["ffmpeg_location"] = resolved_ffmpeg

    # Optional cookies and rate-limiting options (set by CLI)
    temp_cookiefile = None
    cleanup_temp_cookie = False
    if cookies_path:
        ydl_opts["cookiefile"] = str(cookies_path)
    if cookies_from_browser:
        # Try to export browser cookies using the browser_cookie3 Python package
        # and write them to a Netscape-format cookies.txt file that yt-dlp accepts.
        import tempfile

        def _export_browser_cookies_to_netscape(browser_name: str, out_path: str) -> bool:
            try:
                import browser_cookie3
            except Exception:
                print("WARNING: 'browser_cookie3' not installed; cannot export browser cookies.")
                return False

            loader = None
            # Map common names to browser_cookie3 functions
            name = (browser_name or "").lower()
            try:
                if name.startswith("chrome") or name.startswith("edge"):
                    loader = browser_cookie3.chrome
                elif name.startswith("firefox") or name.startswith("ff"):
                    loader = browser_cookie3.firefox
                elif name.startswith("opera"):
                    loader = browser_cookie3.opera
                else:
                    # try generic loader
                    loader = getattr(browser_cookie3, name)
            except Exception:
                loader = None

            if loader is None:
                # fallback to browser_cookie3.load() which attempts multiple browsers
                try:
                    cj = browser_cookie3.load()
                except Exception:
                    print(f"WARNING: cannot locate browser '{browser_name}' cookies via browser_cookie3")
                    return False
            else:
                try:
                    cj = loader()
                except Exception as e:
                    print(f"WARNING: browser_cookie3 failed to load cookies for '{browser_name}': {e}")
                    return False

            # Write Netscape cookie file
            try:
                with open(out_path, "w", encoding="utf-8") as fh:
                    fh.write("# Netscape HTTP Cookie File\n")
                    for c in cj:
                        domain = c.domain
                        flag = "TRUE" if domain.startswith(".") else "FALSE"
                        path = c.path
                        secure = "TRUE" if c.secure else "FALSE"
                        expires = str(int(c.expires)) if getattr(c, "expires", None) else "0"
                        name = c.name
                        value = c.value
                        fh.write(f"{domain}\t{flag}\t{path}\t{secure}\t{expires}\t{name}\t{value}\n")
                return True
            except Exception as e:
                print(f"WARNING: failed to write cookiefile: {e}")
                return False

        try:
            tf = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
            temp_cookiefile = tf.name
            tf.close()
            ok = _export_browser_cookies_to_netscape(cookies_from_browser, temp_cookiefile)
            if ok and os.path.exists(temp_cookiefile):
                ydl_opts["cookiefile"] = temp_cookiefile
                cleanup_temp_cookie = True
            else:
                print(f"WARNING: failed to export cookies from browser '{cookies_from_browser}' via browser_cookie3")
                try:
                    if os.path.exists(temp_cookiefile):
                        os.unlink(temp_cookiefile)
                except Exception:
                    pass
                temp_cookiefile = None
                cleanup_temp_cookie = False
        except Exception as e:
            print(f"WARNING: cookies-from-browser export failed: {e}")
            try:
                if temp_cookiefile and os.path.exists(temp_cookiefile):
                    os.unlink(temp_cookiefile)
            except Exception:
                pass
            temp_cookiefile = None
            cleanup_temp_cookie = False
    if sleep_interval and sleep_interval > 0:
        ydl_opts["sleep_interval"] = float(sleep_interval)
    if max_sleep_interval and max_sleep_interval > 0:
        ydl_opts["max_sleep_interval"] = float(max_sleep_interval)

    # Ensure temporary cookiefile is removed at the end of this genre's downloads
    def _cleanup_temp_cookiefile():
        if cleanup_temp_cookie and temp_cookiefile:
            try:
                if os.path.exists(temp_cookiefile):
                    os.unlink(temp_cookiefile)
            except Exception:
                pass

    def _is_strict_title_match(title: str) -> bool:
        if not strict_title_match:
            return True
        title_norm = _normalize_title(title)
        keywords = STRICT_TITLE_KEYWORDS.get(genre, [])
        return any(kw in title_norm for kw in keywords)

    def _passes_strict_metadata(entry: dict) -> bool:
        if min_view_count > 0:
            views = entry.get("view_count")
            if not isinstance(views, (int, float)) or int(views) < min_view_count:
                return False
        if max_age_days > 0:
            age_limit = max_age_days * 86400
            ts = entry.get("timestamp")
            if isinstance(ts, (int, float)):
                if time.time() - float(ts) > age_limit:
                    return False
            else:
                return False
        return True

    def _download_single_entry(entry: dict, worker_label: str):
        video_id = entry.get("id")
        title = entry.get("title") or ""
        title_key = _normalize_title(title)
        video_url = entry.get("webpage_url") or entry.get("url")
        duration = entry.get("duration")

        if not video_url:
            return False, video_id, title_key, title

        section_start = 0
        section_end = clip_duration
        if clip_position == "middle" and isinstance(duration, (int, float)):
            center = float(duration) / 2.0
            section_start = max(0, int(center - (clip_duration / 2)))
            section_end = section_start + int(clip_duration)
        elif clip_position == "start":
            section_start = 0
            section_end = int(clip_duration)

        per_video_opts = {
            **ydl_opts,
            "download_sections": [f"*{section_start}-{section_end}"],
            "force_keyframes_at_cuts": True,
        }

        started_at = time.perf_counter()
        if verbose:
            print(
                f"  [{worker_label}] START: {title} "
                f"(clip {section_start}s-{section_end}s, {clip_position})"
            )

        # Attempt download with retry/backoff for transient YouTube rate-limiting
        attempts = 0
        max_attempts = 3
        backoff_base = 30  # seconds
        while attempts < max_attempts:
            try:
                with yt_dlp.YoutubeDL(per_video_opts) as downloader:
                    downloader.download([video_url])
                elapsed = time.perf_counter() - started_at
                return True, video_id, title_key, title, elapsed
            except Exception as download_error:
                elapsed = time.perf_counter() - started_at
                msg = str(download_error)
                print(f"  [{worker_label}] FAIL: {title} ({elapsed:.1f}s) -> {download_error}")

                # Detect YouTube rate-limit / sign-in blocks and retry with exponential backoff
                lowered = msg.lower()
                is_rate_limit = any(k in lowered for k in [
                    "rate-limited",
                    "this content isn't available",
                    "sign in to confirm",
                    "http error 429",
                ])
                if is_rate_limit and attempts + 1 < max_attempts:
                    sleep_for = backoff_base * (2 ** attempts)
                    sleep_for = min(sleep_for, 600)
                    if verbose:
                        print(f"  [{worker_label}] Detected rate-limit; sleeping {sleep_for}s before retry ({attempts+1}/{max_attempts})")
                    time.sleep(sleep_for)
                    attempts += 1
                    continue

                # Diagnostic: if yt-dlp couldn't find formats, save --list-formats output
                try:
                    if video_url and ("requested format is not available" in msg.lower() or "no video formats found" in msg.lower()):
                        debug_dir = out_dir / "yt_dlp_debug_formats"
                        debug_dir.mkdir(parents=True, exist_ok=True)
                        debug_file = debug_dir / f"{video_id or 'unknown'}.txt"
                        # Run yt-dlp --list-formats to capture available formats for debugging
                        try:
                            completed = subprocess.run([
                                sys.executable, "-m", "yt_dlp", "--list-formats", video_url
                            ], capture_output=True, text=True, timeout=30)
                            with open(debug_file, "w", encoding="utf-8") as dfh:
                                dfh.write("=== yt-dlp --list-formats output ===\n")
                                dfh.write(completed.stdout or "")
                                dfh.write("\n=== stderr ===\n")
                                dfh.write(completed.stderr or "")
                        except Exception as e:
                            try:
                                with open(debug_file, "w", encoding="utf-8") as dfh:
                                    dfh.write(f"Failed to run yt-dlp --list-formats: {e}\n")
                            except Exception:
                                pass
                except Exception:
                    pass

                return False, video_id, title_key, title, elapsed

    for query in queries:
        if needed <= 0:
            break
        search_url = f"ytsearch{max(needed * 3, needed)}:{query}"
        try:
            with yt_dlp.YoutubeDL({**ydl_opts, "quiet": True, "no_warnings": True}) as ydl:
                search_info = ydl.extract_info(search_url, download=False)
                entries = search_info.get("entries", []) if isinstance(search_info, dict) else []
                candidates = []
                queued_video_ids = set()
                queued_title_keys = set()
                max_candidates = max(needed * 4, needed)

                for entry in entries:
                    if not entry:
                        continue

                    live_status = str(entry.get("live_status") or "").lower()
                    is_live = bool(entry.get("is_live"))
                    was_live = bool(entry.get("was_live"))
                    if skip_livestreams and (is_live or was_live or live_status in {"is_live", "is_upcoming"}):
                        if verbose:
                            print(
                                "  ↷ Skipping livestream content: "
                                f"{entry.get('title') or ''} (live_status={live_status or 'unknown'})"
                            )
                        continue

                    duration = entry.get("duration")
                    if isinstance(duration, (int, float)):
                        if duration < min_video_duration or duration > max_video_duration:
                            if verbose:
                                print(
                                    f"  ↷ Skipping by duration ({int(duration)}s): "
                                    f"{entry.get('title') or ''}"
                                )
                            continue

                    title = entry.get("title") or ""
                    if not _is_strict_title_match(title):
                        if verbose:
                            print(f"  ↷ Skipping title mismatch: {title}")
                        continue
                    if not _passes_strict_metadata(entry):
                        if verbose:
                            print(f"  ↷ Skipping strict metadata filter: {title}")
                        continue

                    video_id = entry.get("id")
                    title_key = _normalize_title(title)

                    if skip_duplicates and video_id and (video_id in seen_video_ids or video_id in queued_video_ids):
                        if verbose:
                            print(f"  ↷ Skipping duplicate video id: {video_id} ({title})")
                        continue
                    if skip_duplicates and title_key and (title_key in seen_title_keys or title_key in queued_title_keys):
                        if verbose:
                            print(f"  ↷ Skipping duplicate title: {title}")
                        continue

                    candidates.append(entry)
                    if video_id:
                        queued_video_ids.add(video_id)
                    if title_key:
                        queued_title_keys.add(title_key)

                    if len(candidates) >= max_candidates:
                        break

                if not candidates:
                    continue

                worker_count = max(1, int(workers))
                if verbose:
                    print(
                        f"  → Parallel downloader active: "
                        f"{worker_count} worker(s), {len(candidates)} candidate(s)"
                    )

                with ThreadPoolExecutor(max_workers=worker_count) as executor:
                    active_futures = {}
                    next_idx = 0
                    submitted_jobs = 0

                    def _submit_next(entry_obj: dict):
                        nonlocal submitted_jobs
                        submitted_jobs += 1
                        worker_label = f"W{((submitted_jobs - 1) % worker_count) + 1}"
                        fut = executor.submit(_download_single_entry, entry_obj, worker_label)
                        active_futures[fut] = worker_label

                    # Fill the initial worker queue.
                    while next_idx < len(candidates) and len(active_futures) < worker_count:
                        entry = candidates[next_idx]
                        _submit_next(entry)
                        next_idx += 1

                    while active_futures:
                        done_future = next(as_completed(active_futures))
                        worker_label = active_futures.pop(done_future, "W?")

                        success, video_id, title_key, finished_title, elapsed = done_future.result()
                        if verbose:
                            state = "DONE" if success else "FAIL"
                            # Per-genre progress: count mp3 files in the genre folder
                            try:
                                completed_count = len(list(genre_dir.glob("*.mp3")))
                            except Exception:
                                completed_count = 0
                            print(
                                f"  [{worker_label}] {state}: {finished_title} "
                                f"({elapsed:.1f}s) | completed={completed_count}/{n_samples} | active_workers={len(active_futures)}"
                            )

                        if success:
                            if skip_duplicates and video_id:
                                seen_video_ids.add(video_id)
                            if skip_duplicates and title_key:
                                seen_title_keys.add(title_key)
                            if skip_duplicates:
                                manifest["video_ids"] = sorted(seen_video_ids)
                                manifest["title_keys"] = sorted(seen_title_keys)
                                _save_manifest(manifest_path, manifest)

                        needed = n_samples - len(list(genre_dir.glob("*.mp3")))
                        if needed <= 0:
                            if verbose:
                                print("  ✓ Reached target sample count for this genre.")
                            break

                        # Keep workers busy by immediately scheduling the next candidate.
                        if next_idx < len(candidates):
                            entry = candidates[next_idx]
                            _submit_next(entry)
                            next_idx += 1
        except yt_dlp.utils.MaxDownloadsReached:
            pass
        except Exception as e:
            print(f"  ⚠ Query '{query}' failed: {e}")

        # Count mp3 files produced so far
        current = list(genre_dir.glob("*.mp3"))
        needed = n_samples - len(current)

        if needed <= 0:
            break
        time.sleep(1)  # be polite to YouTube

    files = list(genre_dir.glob("*.mp3"))
    downloaded = [f.name for f in files[:n_samples]]
    # cleanup any temporary cookiefile created for this genre
    try:
        _cleanup_temp_cookiefile()
    except Exception:
        pass
    return downloaded


def build_labels_csv(audio_dir: Path, out_csv: Path) -> int:
    """Walk genre subfolders and build a labels CSV."""
    rows = []
    for genre_dir in sorted(audio_dir.iterdir()):
        if not genre_dir.is_dir():
            continue
        # Reverse the safe folder name to find matching canonical genre
        candidate = genre_dir.name.replace("_", " ")
        matched_genre = None
        for g in TARGET_GENRES:
            if _safe_folder_name(g) == genre_dir.name:
                matched_genre = g
                break
        if not matched_genre:
            continue

        if matched_genre not in TARGET_GENRES:
            continue

        for f in sorted(genre_dir.glob("*.mp3")):
            rows.append({
                "filename": f"{genre_dir.name}/{f.name}",
                "genre": matched_genre,
                "spotify_genres": "",
            })

    with open(out_csv, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["filename", "genre", "spotify_genres"])
        writer.writeheader()
        writer.writerows(rows)

    return len(rows)


def print_genre_list() -> None:
    print(f"Supported {len(TARGET_GENRES)} genres:")
    for i, g in enumerate(TARGET_GENRES, 1):
        print(f"  {i:2d}. {g}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download a labeled genre audio dataset"
    )
    parser.add_argument(
        "--out-dir",
        default="BackendAI/datasets/genre18_audio",
        help="Root output directory. Each genre gets its own subfolder.",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=15,
        help="Number of audio clips to download per genre (default 15).",
    )
    parser.add_argument(
        "--clip-duration",
        type=int,
        default=30,
        help="Clip length in seconds (default 30). Shorter = less disk space.",
    )
    parser.add_argument(
        "--clip-position",
        choices=["start", "middle"],
        default="middle",
        help="Where to cut each clip from the source video (default: middle).",
    )
    parser.add_argument(
        "--genres",
        nargs="+",
        metavar="GENRE",
        default=None,
        help='Genres to download. Omit for all supported genres. E.g. --genres "Pop" "Rock"',
    )
    parser.add_argument(
        "--list-genres",
        action="store_true",
        help="List all supported genre names and exit.",
    )
    parser.add_argument(
        "--min-video-duration",
        type=int,
        default=120,
        help="Minimum source video duration in seconds (default 120 = 2 minutes).",
    )
    parser.add_argument(
        "--max-video-duration",
        type=int,
        default=300,
        help="Maximum source video duration in seconds (default 300 = 5 minutes).",
    )
    parser.add_argument(
        "--skip-livestreams",
        action="store_true",
        default=True,
        help="Skip live, upcoming live, and previously-live videos (default enabled).",
    )
    parser.add_argument(
        "--allow-livestreams",
        action="store_true",
        help="Allow livestream and previously-live videos.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show yt-dlp download output.",
    )
    parser.add_argument(
        "--duplicate-mode",
        choices=["1", "2"],
        default="1",
        help="1 = skip duplicates, 2 = allow duplicates.",
    )
    parser.add_argument(
        "--force-redownload",
        action="store_true",
        help="Delete existing genre downloads and manifest before scraping.",
    )
    parser.add_argument(
        "--ffmpeg-location",
        default=None,
        help="Optional ffmpeg folder or executable path. Defaults to C:\\ffmpeg\\bin if present, otherwise PATH.",
    )
    parser.add_argument(
        "--cookies-from-browser",
        default=None,
        help="(optional) Browser name for yt-dlp to load cookies from, e.g. 'chrome' or 'firefox'.",
    )
    parser.add_argument(
        "--cookies-path",
        default=None,
        help="(optional) Path to a cookies.txt file to pass to yt-dlp.",
    )
    parser.add_argument(
        "--sleep-interval",
        type=float,
        default=0.0,
        help="Optional base sleep interval between downloads in seconds (default 0 = disabled).",
    )
    parser.add_argument(
        "--max-sleep-interval",
        type=float,
        default=0.0,
        help="Optional maximum sleep interval for randomized sleeps (default 0 = disabled).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Parallel downloads per genre (default 4).",
    )
    parser.add_argument(
        "--strict-title-match",
        action="store_true",
        help="Require video titles to contain genre keywords.",
    )
    parser.add_argument(
        "--min-view-count",
        type=int,
        default=0,
        help="Minimum YouTube views required to keep a candidate (default 0 = disabled).",
    )
    parser.add_argument(
        "--max-age-days",
        type=int,
        default=0,
        help="Maximum video age in days (default 0 = disabled).",
    )
    parser.add_argument(
        "--prune-non-target",
        dest="prune_non_target",
        action="store_true",
        help="Delete existing genre folders that are outside the 11 target genres.",
    )
    parser.add_argument(
        "--keep-non-target",
        dest="prune_non_target",
        action="store_false",
        help="Keep existing non-target genre folders in the output directory.",
    )
    parser.set_defaults(prune_non_target=True)
    args = parser.parse_args()

    if args.allow_livestreams:
        args.skip_livestreams = False

    if args.min_video_duration < 1 or args.max_video_duration < 1:
        print("Duration limits must be positive integers.")
        sys.exit(1)
    if args.min_video_duration > args.max_video_duration:
        print("--min-video-duration cannot be greater than --max-video-duration.")
        sys.exit(1)

    if args.list_genres:
        print_genre_list()
        return

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.prune_non_target:
        removed_folders = prune_non_target_genre_folders(out_dir, TARGET_GENRES)
        if removed_folders > 0:
            print(f"Pruned {removed_folders} non-target genre folder(s) from {out_dir}")

    genres_to_download = args.genres if args.genres else TARGET_GENRES
    # Validate genre names
    for g in genres_to_download:
        if g not in TARGET_GENRES:
            print(f"Unknown genre '{g}'. Run --list-genres to see valid names.")
            sys.exit(1)

    total_clips = len(genres_to_download) * args.samples
    disk_estimate_mb = total_clips * args.clip_duration * 0.016  # ~16KB/s at 128kbps
    print(f"Downloading {args.samples} clips × {len(genres_to_download)} genres "
          f"= ~{total_clips} clips (~{disk_estimate_mb:.0f} MB estimated)")
    print(
        f"Source filter: {args.min_video_duration}s to {args.max_video_duration}s "
        f"({args.min_video_duration / 60:.1f} to {args.max_video_duration / 60:.1f} minutes)"
    )
    print(f"Skip livestreams: {args.skip_livestreams}")
    print(f"Workers per genre: {max(1, int(args.workers))}")
    print(f"Strict title match: {args.strict_title_match}")
    if args.min_view_count > 0:
        print(f"Min view count: {args.min_view_count}")
    if args.max_age_days > 0:
        print(f"Max age days: {args.max_age_days}")
    print()

    results: Dict[str, int] = {}
    for genre in genres_to_download:
        queries = GENRE_QUERIES[genre]
        print(f"[{genre}] downloading up to {args.samples} clips...")
        files = download_genre(
            genre=genre,
            queries=queries,
            out_dir=out_dir,
            n_samples=args.samples,
            clip_duration=args.clip_duration,
            verbose=args.verbose,
            duplicate_mode=args.duplicate_mode,
            force_redownload=args.force_redownload,
            ffmpeg_location=args.ffmpeg_location,
            min_video_duration=args.min_video_duration,
            max_video_duration=args.max_video_duration,
            skip_livestreams=args.skip_livestreams,
            clip_position=args.clip_position,
            workers=max(1, int(args.workers)),
            strict_title_match=args.strict_title_match,
            min_view_count=max(0, int(args.min_view_count)),
            max_age_days=max(0, int(args.max_age_days)),
            cookies_from_browser=args.cookies_from_browser,
            cookies_path=args.cookies_path,
            sleep_interval=max(0.0, float(args.sleep_interval)),
            max_sleep_interval=max(0.0, float(args.max_sleep_interval)),
        )
        results[genre] = len(files)
        print(f"  -> got {len(files)} clips")

    labels_csv = out_dir / "labels.csv"
    total_rows = build_labels_csv(out_dir, labels_csv)
    print(f"\nWrote {total_rows} labeled rows to {labels_csv}")
    print()
    print("Summary:")
    for genre, count in results.items():
        status = "✓" if count >= args.samples else ("⚠" if count > 0 else "✗")
        print(f"  {status}  {genre}: {count} clips")

    print()
    print("Next — extract features and train:")
    print(f'  python BackendAI/data_extraction.py --labels "{labels_csv}" --audio-dir "{out_dir}" --out BackendAI/datasets/genre18_audio/features.csv')
    print(f'  python BackendAI/train_combined_model.py --inputs BackendAI/datasets/genre18_audio/features.csv --out BackendAI/models/genre11_rf.joblib')


if __name__ == "__main__":
    main()
