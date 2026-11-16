import os
import urllib.parse
from sqlmodel import SQLModel, create_engine, Session

# SQL Server MSSQLLocalDB connection string
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=(localdb)\\MSSQLLocalDB;"
    "DATABASE=MusicPlayerDb;"
    "Trusted_Connection=yes;"
)
params = urllib.parse.quote_plus(connection_string)
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

sqlite_db_path = os.path.join(os.path.dirname(__file__), '..', 'backendai.db')
SQLITE_URL = f"sqlite:///{os.path.abspath(sqlite_db_path)}"

try:
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    print("[DB] SQL Server not available, falling back to SQLite database at:", sqlite_db_path)
    engine = create_engine(SQLITE_URL, echo=False, connect_args={"check_same_thread": False, "timeout": 30.0})
    try:
        from sqlalchemy import event
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
    except Exception:
        pass

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables() -> None:
    """Create all tables in the database if they do not exist."""
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        print(f"[DB] Table creation note: {e}")

def get_engine():
    """Return the configured engine."""
    return engine

