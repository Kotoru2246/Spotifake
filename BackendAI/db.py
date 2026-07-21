from sqlmodel import SQLModel, create_engine

# SQL Server connection string for the existing MusicPlayerDb database
SQLSERVER_CONNECTION_STRING = (
    "mssql+pyodbc://@LAPTOP-12OGD3V1/MusicPlayerDb"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&trusted_connection=yes"
    "&TrustServerCertificate=yes"
)

# Single engine — only SQL Server, no SQLite
engine = create_engine(SQLSERVER_CONNECTION_STRING, echo=False)


def create_db_and_tables() -> None:
    """Create all tables in the database."""
    pass


def get_engine():
    """Return the configured engine."""
    return engine

