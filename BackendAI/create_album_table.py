import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel
from db import engine
import models # imports all models including Album

def create_albums_table():
    print("Creating Albums table in the database safely...")
    # This will only create tables that don't exist yet, it won't drop data.
    SQLModel.metadata.create_all(engine)
    print("Migration complete!")

if __name__ == "__main__":
    create_albums_table()
