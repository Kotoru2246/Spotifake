# Python Setup Guide

Your system doesn't have Python installed. Here are your options:

## Option 1: Install Python from Microsoft Store (Easiest)
Run this command in PowerShell:
```powershell
python
```
When prompted, click "Install" and wait for completion.

## Option 2: Install Python from python.org (Full Control)
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or 3.12 for Windows
3. **Important**: During installation, check **"Add Python to PATH"**
4. Click "Install Now"

## Option 3: Check if you have Python already
Try these commands:
```powershell
python --version
python3 --version
py --version
```

## After Installation
Navigate to the project folder and run:
```powershell
cd "c:\Users\jacky\OneDrive\Desktop\New folder"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r BackendAI/requirements.txt
```

## Start the AI Backend Service
```powershell
uvicorn BackendAI.main:app --reload --port 8000
```

Once Python is installed, close PowerShell and try the pip command again.
