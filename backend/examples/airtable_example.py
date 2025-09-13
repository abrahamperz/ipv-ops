"""
Example script demonstrating how to use the Airtable client.

Before running this script, make sure to set the following environment variables in your .env file:
- AIRTABLE_API_KEY: Your Airtable API key
- AIRTABLE_BASE_ID: The ID of your Airtable base
- AIRTABLE_TABLE_NAME: The name of the table to interact with
"""
import os
from dotenv import load_dotenv
from v1.api.airtable import get_airtable_client

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize the Airtable client
    client = get_airtable_client()
    
    # Example 1: Get all records
    print("Fetching all records...")
    all_records = client.get_all_records()
    print(f"Found {len(all_records)} records")
    
    if all_records:
        # Print the first record as an example
        first_record = all_records[0]
        print("\nFirst record:")
        for key, value in first_record['fields'].items():
            print(f"{key}: {value}")
    
    # Example 2: Get a single record by ID (uncomment and replace with a valid record ID)
    """
    record_id = "rec1234567890"  # Replace with a valid record ID
    print(f"\nFetching record with ID: {record_id}")
    record = client.get_record_by_id(record_id)
    if record:
        print("Record found:")
        print(record)
    else:
        print("Record not found")
    """
    
    # Example 3: Query records with a formula (uncomment and modify as needed)
    """
    # Example: Find records where the 'Status' field is 'Active'
    formula = "{Status} = 'Active'"
    print(f"\nQuerying records with formula: {formula}")
    active_records = client.query_records(formula)
    print(f"Found {len(active_records)} active records")
    """

if __name__ == "__main__":
    main()
