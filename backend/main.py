from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import sys
import uvicorn

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Now import the local module
from google_sheets import get_sheet_data, get_sheet_as_dataframe

app = FastAPI(
    title="Google Sheets API",
    description="API para obtener datos de Google Sheets",
    version="1.0.0"
)

# CORS middleware configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://frontend:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SheetRange(BaseModel):
    range: str

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/api/hello")
async def hello_world():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/sheets/data")
async def get_sheet_data_endpoint(sheet_range: SheetRange):
    """
    Obtener datos de una hoja de Google Sheets
    
    - **range**: Rango de la hoja (ej: 'Hoja1!A1:Z1000')
    """
    try:
        data = await get_sheet_data(sheet_range.range)
        return {"data": data}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sheets/range/{sheet_name}")
async def get_sheet_data_by_name(
    sheet_name: str,
    start_col: str = "A",
    end_col: str = "Z",
    start_row: int = 1,
    end_row: int = 1000
):
    """
    Obtener datos de una hoja por nombre con rango personalizable
    
    - **sheet_name**: Nombre de la hoja (ej: 'Hoja1')
    - **start_col**: Columna inicial (ej: 'A')
    - **end_col**: Columna final (ej: 'Z')
    - **start_row**: Fila inicial
    - **end_row**: Fila final
    """
    range_name = f"{sheet_name}!{start_col}{start_row}:{end_col}{end_row}"
    try:
        data = await get_sheet_data(range_name)
        return {"data": data}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
