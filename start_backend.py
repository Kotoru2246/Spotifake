#!/usr/bin/env python
"""
Start script for the Music Player AI Backend Service.
Run after: pip install -r BackendAI/requirements.txt
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "BackendAI.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
