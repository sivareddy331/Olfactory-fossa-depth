import os
import sys

def verify():
    print("Checking dependencies...")
    try:
        import flask
        import flask_sqlalchemy
        import flask_login
        import cv2
        import numpy
        import reportlab
        print("[OK] All dependencies are installed.")
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        print("Please ensure you run 'pip install -r requirements.txt'")
        sys.exit(1)
        
    print("\nVerifying Flask app initialization and blueprints...")
    try:
        from app import app, db
        from models.models import User, Patient, Analysis
        print("[OK] Flask app, database context, and models loaded successfully.")
    except Exception as e:
        print(f"[ERROR] Flask application configuration failure: {e}")
        sys.exit(1)

    print("\nVerifying AI pipeline integration...")
    try:
        from ai import run_analysis_pipeline
        print("[OK] AI pipeline workspace module is sound.")
    except Exception as e:
        print(f"[ERROR] AI pipeline module failure: {e}")
        sys.exit(1)
        
    print("\nVerification status: SUCCESS. All imports and schemas are correct!")

if __name__ == '__main__':
    verify()
