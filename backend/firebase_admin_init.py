import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_db():
    global _db
    if not firebase_admin._apps:
        sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)
    if _db is None:
        _db = firestore.client()
    return _db
