#!/usr/bin/env python3
"""
Fetch all records from an Airtable table and output as JSON.

Environment variables required:
- AIRTABLE_BASE_ID: Your Airtable base ID (appXXXXXXXXXXXX)
- AIRTABLE_TABLE_NAME: Name of your table
- AIRTABLE_PAT: Your Personal Access Token

Example usage:
    export AIRTABLE_BASE_ID="appXXXXXXXXXXXX"
    export AIRTABLE_TABLE_NAME="MiTabla"
    export AIRTABLE_PAT="patXXXXXXXXXXXX"
    python3 fetch_airtable_json.py
"""
import os
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AirtableFetcher:
    def __init__(self):
        load_dotenv()
        self.base_id = os.getenv("AIRTABLE_BASE_ID")
        self.table_name = os.getenv("AIRTABLE_TABLE_NAME")
        self.pat = os.getenv("AIRTABLE_PAT")

        if not all([self.base_id, self.table_name, self.pat]):
            raise ValueError(
                "Missing required environment variables. Please check:"
                "\n- AIRTABLE_BASE_ID"
                "\n- AIRTABLE_TABLE_NAME"
                "\n- AIRTABLE_PAT"
            )

        self.base_url = f"https://api.airtable.com/v0/{self.base_id}/{self.table_name}"
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }

    def _make_request(self, url: str, params: Optional[Dict] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """Make an HTTP request with retries and rate-limit handling."""
        max_retries = 3
        retry_delay = 1

        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', retry_delay))
                    logger.warning(f"Rate limited. Waiting {retry_after}s...")
                    time.sleep(retry_after)
                    continue
                response.raise_for_status()
                return response.json(), None
            except requests.exceptions.HTTPError as e:
                error_msg = f"HTTP Error: {e}"
                try:
                    error_data = response.json()
                    error_msg += f"\nDetails: {json.dumps(error_data, indent=2)}"
                except:
                    error_msg += f"\nResponse: {response.text[:500]}"
                return None, error_msg
            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    return None, f"Request failed: {e}"
                logger.warning(f"Request failed: {e}. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2
        return None, "Max retries exceeded"

    def fetch_all_records(self, params: Optional[Dict] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Fetch all records with pagination."""
        if params is None:
            params = {}
        records = []
        offset = None
        while True:
            if offset:
                params["offset"] = offset
            data, error = self._make_request(self.base_url, params)
            if error:
                return records, error
            if not isinstance(data, dict):
                return records, f"Unexpected response format: {data}"
            current_records = data.get("records", [])
            records.extend(current_records)
            offset = data.get("offset")
            if not offset:
                break
        return records, None

def main():
    try:
        fetcher = AirtableFetcher()

        # Test connection
        test_data, error = fetcher._make_request(fetcher.base_url, {"maxRecords": 1})
        if error:
            logger.error(f"Connection test failed: {error}")
            return 1

        # Fetch all records
        records, error = fetcher.fetch_all_records({"pageSize": 100})
        if error:
            logger.error(f"Error fetching records: {error}")
            return 1

        if not records:
            logger.warning("No records found.")
            print(json.dumps([]))
            return 0

        # Format output: include id + fields
        output = [{"id": rec.get("id"), "fields": rec.get("fields", {})} for rec in records]

        # Print JSON
        print(json.dumps(output, indent=2, ensure_ascii=False))
        logger.info(f"Fetched {len(records)} records successfully.")
        return 0

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    exit(main())
