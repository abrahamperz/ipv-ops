# Google Sheets API Integration

This service provides an API to fetch data from Google Sheets using the Google Sheets API.

## Prerequisites

1. A Google Cloud Project with the Google Sheets API enabled
2. Service account credentials with access to the Google Sheet
3. Python 3.8+

## Setup Instructions

### 1. Enable Google Sheets API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "Service account"
3. Fill in the service account details and click "Create"
4. Grant the service account "Editor" role (or more restrictive as needed)
5. Click "Done"
6. Find your service account in the list and click on the email address
7. Go to the "Keys" tab
8. Click "Add Key" > "Create new key"
9. Select JSON format and click "Create"
10. Save the downloaded JSON file as `credentials.json` in the `backend` directory

### 3. Share Google Sheet with Service Account

1. Open your Google Sheet
2. Click the "Share" button in the top-right corner
3. Add the service account email (found in the `client_email` field of `credentials.json`)
4. Grant "Editor" permissions
5. Copy the Sheet ID from the URL (it's the long string between `/d/` and `/edit`)

### 4. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set:
   - `GOOGLE_SHEET_ID`: Your Google Sheet ID
   - `GOOGLE_CREDENTIALS_FILE`: Path to your credentials file (default: `credentials.json`)

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the API

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/hello`: Test endpoint
- `POST /api/sheets/data`: Get sheet data by range
  - Body: `{"range": "Sheet1!A1:Z1000"}`
- `GET /api/sheets/range/{sheet_name}`: Get sheet data with customizable range
  - Parameters:
    - `sheet_name`: Name of the sheet
    - `start_col`: Starting column (default: A)
    - `end_col`: Ending column (default: Z)
    - `start_row`: Starting row (default: 1)
    - `end_row`: Ending row (default: 1000)

## Example Usage

### Using cURL

```bash
# Get data from Sheet1, columns A to Z, rows 1 to 1000
curl -X POST http://localhost:8000/api/sheets/data \
  -H "Content-Type: application/json" \
  -d '{"range": "Sheet1!A1:Z1000"}'

# Alternative with URL parameters
curl "http://localhost:8000/api/sheets/range/Sheet1?start_col=A&end_col=Z&start_row=1&end_row=1000"
```

### Using JavaScript

```javascript
// Using fetch
const response = await fetch('http://localhost:8000/api/sheets/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    range: 'Sheet1!A1:Z1000'
  })
});
const data = await response.json();
console.log(data);
```

## Security Notes

- Never commit `credentials.json` or `.env` to version control
- Add these files to your `.gitignore`:
  ```
  credentials.json
  .env
  ```
- Restrict access to the API as needed (e.g., with authentication)
- Use the principle of least privilege when setting up service account permissions
