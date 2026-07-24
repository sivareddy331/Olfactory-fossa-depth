import sys
import os

# Add backend to path
sys.path.append(r"c:\xampp\htdocs\OLfactory_backend")

try:
    from upgrade_db import upgrade_database
    print("Starting database migration...")
    upgrade_database()
    print("Migration completed successfully.")
except Exception as e:
    print(f"Migration failed: {e}")
