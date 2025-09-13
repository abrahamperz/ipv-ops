#!/usr/bin/env python3
"""
List all tables in an Airtable base.

Environment variables required:
- AIRTABLE_BASE_ID: Your Airtable base ID
- AIRTABLE_PAT: Your Personal Access Token
"""
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get credentials
base_id = os.getenv("AIRTABLE_BASE_ID")
pat = os.getenv("AIRTABLE_PAT")

if not all([base_id, pat]):
    print("Error: Missing required environment variables.")
    print("Please set AIRTABLE_BASE_ID and AIRTABLE_PAT in your .env file")
    exit(1)

# API endpoint for listing tables
url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
headers = {
    "Authorization": f"Bearer {pat}",
    "Content-Type": "application/json"
}

print(f"Fetching tables for base: {base_id}")
try:
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    
    tables = response.json().get('tables', [])
    
    if not tables:
        print("No tables found in the base.")
    else:
        print("\nAvailable tables:")
        for i, table in enumerate(tables, 1):
            print(f"{i}. {table['name']} (ID: {table['id']})")
            
except requests.exceptions.HTTPError as e:
    print(f"\nError: {e}")
    if e.response is not None:
        print(f"Status Code: {e.response.status_code}")
        try:
            error_details = e.response.json()
            print("Error Details:")
            print(json.dumps(error_details, indent=2))
        except:
            print(f"Response: {e.response.text[:500]}")
    
    print("\nTroubleshooting steps:")
    print("1. Verify your AIRTABLE_PAT is correct and has the right permissions")
    print("2. Check that the BASE_ID is correct")
    print("3. Make sure your base is shared with the account that generated the token")
    print("4. Ensure your token has 'schema.bases:read' permission")
    
except Exception as e:
    print(f"An error occurred: {str(e)}")
