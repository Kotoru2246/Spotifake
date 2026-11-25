import asyncio
import json
import logging
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from uuid import uuid4

logger = logging.getLogger("downloader_service")

# Storage for download jobs (pure JSON-serializable data only!)
DOWNLOAD_JOBS: Dict[str, Dict[str, Any]] = {}
ACTIVE_PROCESSES: Dict[str, subprocess.Popen] = {}
JOB_LOCK = threading.RLock()


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with JOB_LOCK:
        job = DOWNLOAD_JOBS.get(job_id)
        if job:
            return {
                "id": job["id"],
                "query": job["query"],
                "status": job["status"],
                "created_at": job["created_at"],
                "started_at": job["started_at"],
                "finished_at": job["finished_at"],
                "total_songs": job["total_songs"],
                "imported_count": job["imported_count"],
                "current_song": job["current_song"],
                "imported_songs": list(job["imported_songs"]),
                "logs": list(job["logs"]),
                "error": job["error"],
            }
    return None


def list_jobs() -> List[Dict[str, Any]]:
    with JOB_LOCK:
        results = []
        for j in reversed(list(DOWNLOAD_JOBS.values())):
            results.append({
                "id": j["id"],
                "query": j["query"],
                "status": j["status"],
                "created_at": j["created_at"],
                "started_at": j["started_at"],
                "finished_at": j["finished_at"],
                "total_songs": j["total_songs"],
                "imported_count": j["imported_count"],
                "current_song": j["current_song"],
                "imported_songs": list(j["imported_songs"]),
                "logs": list(j["logs"]),
                "error": j["error"],
            })
        return results


def _append_job_log(job_id: str, line: str):
    with JOB_LOCK:
        job = DOWNLOAD_JOBS.get(job_id)
        if job:
            job["logs"].append(line)
            if len(job["logs"]) > 300:
                job["logs"] = job["logs"][-300:]


def _record_song_imported(job_id: str, song_name: str):
    with JOB_LOCK:
        job = DOWNLOAD_JOBS.get(job_id)
        if job:
            job["imported_count"] += 1
            job["imported_songs"].append({"name": song_name, "time": datetime.utcnow().isoformat()})
            job["current_song"] = song_name


def _execute_spotdl(job_id: str, query: str):
    with JOB_LOCK:
        job = DOWNLOAD_JOBS[job_id]
        job["status"] = "running"
        job["started_at"] = datetime.utcnow().isoformat()

    _append_job_log(job_id, f"Initializing spotDL engine for: '{query}'...")

    # If user provided a Spotify artist URL, pre-scrape and cache the artist avatar and banner
    if "spotify.com/artist/" in query:
        try:
            from .artist_scraper import scrape_artist_metadata_from_spotify, update_or_create_artist_profile
            _append_job_log(job_id, "Fetching artist profile, avatar, and banner picture...")
            meta = scrape_artist_metadata_from_spotify(query)
            if meta and meta.get("name"):
                update_or_create_artist_profile(
                    artist_name=meta["name"],
                    spotify_url_or_id=query,
                    avatar_url=meta.get("avatar_url"),
                    banner_url=meta.get("banner_url"),
                    monthly_listeners=meta.get("monthly_listeners")
                )
                _append_job_log(job_id, f"==> Retrieved avatar & banner for artist: {meta['name']}")
        except Exception as _art_err:
            logger.warning("Artist pre-scrape error: %s", _art_err)

    python_exe = sys.executable
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    # Album is part of the name so two releases of a song don't overwrite one file.
    music_out = "music/{title} - {artist} - {album}.{output-ext}"

    cmd = [
        python_exe,
        "-u", # unbuffered binary stdout and stderr
        "-m",
        "BackendAI.spotdl_runner",  # spotdl, with full artist discographies
        "download",
        query,
        "--audio",
        "youtube-music",
        "youtube",
        "--generate-lrc",
        "--format",
        "m4a",
        "--output",
        music_out,
        "--overwrite",
        "force",
    ]

    # SponsorBlock cutting needs ffprobe. Without it spotdl fails the track
    # before the database import runs, so only ask for it when ffprobe exists.
    if shutil.which("ffprobe"):
        cmd.append("--sponsor-block")
    else:
        _append_job_log(job_id, "ffprobe not found: skipping sponsor segment removal.")

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONPATH"] = repo_root + os.pathsep + env.get("PYTHONPATH", "")
    # Piped output defaults to cp1252 on Windows, where the analyzer's emoji prints
    # raise and the song is saved without audio features.
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=repo_root,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            env=env,
        )

        with JOB_LOCK:
            ACTIVE_PROCESSES[job_id] = process

        _append_job_log(job_id, "Searching audio providers & resolving playlist tracks...")
        error_count = 0

        for raw_line in iter(process.stdout.readline, ""):
            line = raw_line.strip()
            if not line:
                continue

            _append_job_log(job_id, line)

            # spotdl exits 0 even when individual tracks fail, so count them.
            if "Error: " in line or "database import failed" in line:
                error_count += 1

            # Check for playlist count
            if "Found" in line and "songs in" in line:
                try:
                    parts = line.split("Found")[1].split("songs in")[0].strip()
                    total = int(parts)
                    with JOB_LOCK:
                        DOWNLOAD_JOBS[job_id]["total_songs"] = total
                    _append_job_log(job_id, f"==> Found {total} tracks in collection.")
                except Exception:
                    pass

            # Check for successful download / DB import
            if "Saved " in line and "to Spotifake database" in line:
                song_name = line.replace('Saved "', '').replace('" to Spotifake database with cover art and metadata', '').strip()
                _record_song_imported(job_id, song_name)
            elif "Downloaded " in line:
                song_name = line.replace('Downloaded "', '').split('":')[0].strip()
                _record_song_imported(job_id, song_name)

        process.stdout.close()
        return_code = process.wait()

        with JOB_LOCK:
            ACTIVE_PROCESSES.pop(job_id, None)
            job = DOWNLOAD_JOBS[job_id]
            job["finished_at"] = datetime.utcnow().isoformat()
            if return_code == 0:
                job["status"] = "completed"
                if error_count:
                    log_msg = f"Finished with {error_count} error(s): some songs were not saved. See the log above."
                else:
                    log_msg = "All songs downloaded and saved into Spotifake database!"
            else:
                job["status"] = "failed"
                job["error"] = f"Process exited with code {return_code}"
                log_msg = f"Process ended with status code {return_code}"
        
        _append_job_log(job_id, log_msg)

    except Exception as exc:
        logger.exception("Error executing spotdl for job %s: %s", job_id, exc)
        with JOB_LOCK:
            ACTIVE_PROCESSES.pop(job_id, None)
            job = DOWNLOAD_JOBS[job_id]
            job["status"] = "failed"
            job["error"] = str(exc)
            job["finished_at"] = datetime.utcnow().isoformat()
        _append_job_log(job_id, f"Execution error: {exc}")


def create_download_job(query: str) -> str:
    job_id = str(uuid4())
    job = {
        "id": job_id,
        "query": query.strip(),
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "finished_at": None,
        "total_songs": 0,
        "imported_count": 0,
        "current_song": "",
        "imported_songs": [],
        "logs": [],
        "error": None,
    }

    with JOB_LOCK:
        DOWNLOAD_JOBS[job_id] = job

    # Start worker thread
    thread = threading.Thread(target=_execute_spotdl, args=(job_id, query), daemon=True)
    thread.start()

    return job_id


async def stream_job_events(job_id: str):
    """
    Async generator for Server-Sent Events (SSE) streaming real-time job updates.
    Uses log index offset for 100% reliable, zero-drop streaming.
    """
    last_log_idx = 0
    last_imported_idx = 0

    while True:
        job = get_job(job_id)
        if not job:
            yield f"data: {json.dumps({'type': 'error', 'data': 'Job not found'})}\n\n"
            break

        # Emit any new logs
        logs = job.get("logs", [])
        if len(logs) > last_log_idx:
            for line in logs[last_log_idx:]:
                yield f"data: {json.dumps({'type': 'log', 'data': line})}\n\n"
            last_log_idx = len(logs)

        # Emit any newly imported songs
        imported = job.get("imported_songs", [])
        if len(imported) > last_imported_idx:
            for s in imported[last_imported_idx:]:
                yield f"data: {json.dumps({'type': 'song_imported', 'data': s})}\n\n"
            last_imported_idx = len(imported)

        # Check if finished
        if job["status"] in ["completed", "failed"]:
            yield f"data: {json.dumps({'type': 'status', 'data': {'status': job['status']}})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'status': job['status'], 'data': job})}\n\n"
            break

        yield ": keep-alive\n\n"
        await asyncio.sleep(0.3)
