import urllib.parse
from sqlmodel import SQLModel, create_engine

# SQL Server MSSQLLocalDB connection string
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=(localdb)\\MSSQLLocalDB;"
    "DATABASE=MusicPlayerDb;"
    "Trusted_Connection=yes;"
)
params = urllib.parse.quote_plus(connection_string)
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

# Initialize engine with the connection string
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def create_db_and_tables() -> None:
    """Create all tables in the database if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_engine():
    """Return the configured engine."""
    return engine
