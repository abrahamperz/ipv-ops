import os
from typing import List, Dict, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
import pandas as pd
from fastapi import HTTPException

# You'll need to set these environment variables
SHEET_ID = os.getenv('GOOGLE_SHEET_ID')
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def get_sheets_service():
    """Get Google Sheets API service with service account credentials"""
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=creds)
        return service.spreadsheets()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing Google Sheets API: {str(e)}"
        )

async def get_sheet_data(range_name: str) -> List[Dict[str, Any]]:
    """
    Fetch data from a Google Sheet
    
    Args:
        range_name: Sheet name and range (e.g., 'Sheet1!A1:Z1000')
    
    Returns:
        List of dictionaries representing rows with column headers as keys
    """
    if not SHEET_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Sheet ID not configured"
        )
    
    try:
        sheets = get_sheets_service()
        result = sheets.values().get(
            spreadsheetId=SHEET_ID,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            return []
            
        # Convert to list of dicts using first row as headers
        headers = values[0]
        data = []
        for row in values[1:]:
            # Ensure row has same number of columns as headers
            row_data = {}
            for i, header in enumerate(headers):
                row_data[header] = row[i] if i < len(row) else None
            data.append(row_data)
            
        return data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data from Google Sheet: {str(e)}"
        )

async def get_sheet_as_dataframe(range_name: str) -> pd.DataFrame:
    """
    Fetch data from a Google Sheet and return as pandas DataFrame
    
    Args:
        range_name: Sheet name and range (e.g., 'Sheet1!A1:Z1000')
    
    Returns:
        pandas DataFrame containing the sheet data
    """
    data = await get_sheet_data(range_name)
    return pd.DataFrame(data)
