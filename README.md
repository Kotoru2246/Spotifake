# Modern Music Player

This workspace contains a starter architecture for a modern desktop music player with a split microservices design.

## Architecture

- `DesktopClient/`: A WPF .NET desktop client and audio engine.
- `DataAccess/`: EF Core data models, SQL Server context, and backend services.
- `BackendAI/`: Python FastAPI service for Smart Shuffle recommendations using ChromaDB.

## Getting Started

### .NET Desktop Client

1. Open `DesktopClient/` in Visual Studio or via `dotnet`.
2. Restore packages: `dotnet restore DesktopClient/DesktopClient.csproj`.
3. Update the SQL Server connection string in `DataAccess/MusicPlayerContext.cs` as needed.
4. Run the WPF application.

### Python AI Bridge

1. Create a Python environment.
2. Install dependencies: `pip install -r BackendAI/requirements.txt`.
3. Start the service: `uvicorn BackendAI.main:app --reload --port 8000`.

## Notes

- The current implementation includes stubbed Smart Shuffle logic and session/export utilities.
- Expand `BackendAI/` with ChromaDB vector queries and local file metadata ingestion when ready.
