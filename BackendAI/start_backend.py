#!/usr/bin/env python
import os
import sys
import uvicorn

if __name__ == "__main__":
    # Add parent directory to path so BackendAI can be imported
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    uvicorn.run(
        "BackendAI.main:app",
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8000")),
        reload=True
    )
