import sys
sys.path.append('c:/xampp/htdocs/OLfactory_backend')
from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE patients ADD COLUMN height INTEGER NULL'))
        conn.execute(text('ALTER TABLE patients ADD COLUMN weight INTEGER NULL'))
        conn.execute(text('ALTER TABLE patients ADD COLUMN bmi VARCHAR(10) NULL'))
        conn.execute(text('ALTER TABLE patients ADD COLUMN bmi_status VARCHAR(50) NULL'))
        conn.commit()
    print("Migration successful")
except Exception as e:
    print(f"Migration failed or columns already exist: {e}")
