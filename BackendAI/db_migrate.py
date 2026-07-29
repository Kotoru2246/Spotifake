from db import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE Songs ADD Language VARCHAR(50) DEFAULT ''"))
        conn.commit()
    print("Column 'Language' added successfully.")
except Exception as e:
    print(f"Failed or already exists: {e}")


--- VERSION ---

from db import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE Songs ADD Language VARCHAR(50) DEFAULT ''"))
        conn.commit()
    print("Column 'Language' added successfully.")
except Exception as e:
    print(f"Failed or already exists: {e}")