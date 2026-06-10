import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_db():
    global _db
    if not firebase_admin._apps:
        cred = None
        
        # 1. Try loading credentials directly from a JSON string environment variable (ideal for Render env vars)
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if sa_json:
            try:
                cred_dict = json.loads(sa_json)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                print(f"[Firebase Init] Failed to load from FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
        
        # 2. Fall back to file path certificate
        if not cred:
            sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
            cred = credentials.Certificate(sa_path)
            
        firebase_admin.initialize_app(cred)
    if _db is None:
        _db = firestore.client()
    return _db
