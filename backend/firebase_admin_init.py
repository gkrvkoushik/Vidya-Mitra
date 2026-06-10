import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_db():
    global _db
    if not firebase_admin._apps:
        cred = None
        
        # 1. Try loading credentials directly from a JSON string environment variable
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if sa_json:
            try:
                cred_dict = json.loads(sa_json)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                print(f"[Firebase Init] Failed to load from FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
        
        # 2. Try reconstructing the credentials dynamically from individual env vars if present
        if not cred and os.getenv("private_key") and os.getenv("client_email"):
            try:
                # Handle standard newline escaping in private keys
                private_key = os.getenv("private_key").replace("\\n", "\n")
                cred_dict = {
                    "type": os.getenv("type", "service_account"),
                    "project_id": os.getenv("project_id"),
                    "private_key_id": os.getenv("private_key_id"),
                    "private_key": private_key,
                    "client_email": os.getenv("client_email"),
                    "client_id": os.getenv("client_id"),
                    "auth_uri": os.getenv("auth_uri"),
                    "token_uri": os.getenv("token_uri"),
                    "auth_provider_x509_cert_url": os.getenv("auth_provider_x509_cert_url"),
                    "client_x509_cert_url": os.getenv("client_x509_cert_url"),
                    "universe_domain": os.getenv("universe_domain")
                }
                # Filter out None values
                cred_dict = {k: v for k, v in cred_dict.items() if v is not None}
                cred = credentials.Certificate(cred_dict)
                print("[Firebase Init] Successfully reconstructed credentials from individual environment variables.")
            except Exception as e:
                print(f"[Firebase Init] Failed to reconstruct credentials from individual env vars: {e}")
        
        # 3. Fall back to file path certificate
        if not cred:
            sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
            cred = credentials.Certificate(sa_path)
            
        firebase_admin.initialize_app(cred)
    if _db is None:
        _db = firestore.client()
    return _db
