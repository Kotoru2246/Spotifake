import urllib.parse
from sqlmodel import SQLModel, create_engine

<<<<<<< HEAD
# SQL Server MSSQLLocalDB connection string
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=(localdb)\\MSSQLLocalDB;"
    "DATABASE=MusicPlayerDb;"
    "Trusted_Connection=yes;"
)
params = urllib.parse.quote_plus(connection_string)
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
=======
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
>>>>>>> 8eaff07070cea93f393666da4deb16f79450017a

