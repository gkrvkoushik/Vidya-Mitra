#!/usr/bin/env python3
"""
Script to delete AI Engineer roadmap from Firestore
Run this script to permanently delete the AI Engineer roadmap
"""

import os
import sys
sys.path.append('backend')

from firebase_admin_init import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

def delete_ai_engineer_roadmaps():
    """Delete all AI Engineer roadmaps from the database"""
    try:
        db = get_db()
        
        # Find all roadmaps with role "AI Engineer"
        docs = list(
            db.collection("roadmaps")
            .where(filter=FieldFilter("role", "==", "AI Engineer"))
            .stream()
        )
        
        if not docs:
            print("No AI Engineer roadmaps found")
            return
        
        print(f"Found {len(docs)} AI Engineer roadmap(s)")
        
        # Delete each document
        deleted_count = 0
        for doc in docs:
            data = doc.to_dict()
            uid = data.get("uid", "unknown")
            print(f"Deleting AI Engineer roadmap for user {uid[:8]}...")
            doc.reference.delete()
            deleted_count += 1
        
        print(f"Successfully deleted {deleted_count} AI Engineer roadmap(s)")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Starting AI Engineer roadmap deletion...")
    delete_ai_engineer_roadmaps()
    print("Deletion completed!")