"""
Módulo para el endpoint de integración con Airtable para la tabla 'ipv'.
"""
import os
import time
import logging
from typing import List, Dict, Any, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

# Cargar variables de entorno
load_dotenv()

class AirtableRecord(BaseModel):
    """Modelo para los registros de Airtable."""
    id: str
    createdTime: str
    fields: Dict[str, Any]

class AirtableResponse(BaseModel):
    """Modelo para la respuesta de la API de Airtable."""
    records: List[AirtableRecord]
    offset: Optional[str] = None

class AirtableService:
    """Servicio para interactuar con la API de Airtable."""
    
    def __init__(self):
        self.base_id = os.getenv("AIRTABLE_BASE_ID")
        self.pat = os.getenv("AIRTABLE_PAT")
        
        if not all([self.base_id, self.pat]):
            raise ValueError(
                "Missing required Airtable environment variables. "
                "Please set AIRTABLE_BASE_ID and AIRTABLE_PAT"
            )
            
        self.base_url = f"https://api.airtable.com/v0/{self.base_id}/ipv"
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, url: str, params: Optional[Dict] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Realiza una petición HTTP con manejo de reintentos y límites de tasa.
        """
        max_retries = 3
        retry_delay = 1  # segundos
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
                
                if response.status_code == 200:
                    return response.json(), None
                    
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', retry_delay * (attempt + 1)))
                    logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                    
                error_msg = f"Error {response.status_code}: {response.text}"
                logger.error(error_msg)
                return None, error_msg
                
            except requests.exceptions.RequestException as e:
                error_msg = f"Request failed: {str(e)}"
                logger.error(error_msg)
                if attempt == max_retries - 1:
                    return None, error_msg
                time.sleep(retry_delay * (attempt + 1))
        
        return None, "Max retries exceeded"
    
    def get_table_data(
        self,
        max_records: int = 100,
        view: Optional[str] = None,
        filter_by_formula: Optional[str] = None,
        offset: Optional[str] = None
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Obtiene datos de la tabla 'ipv' de Airtable con paginación.
        """
        params = {
            "maxRecords": min(max_records, 100),
            "view": view,
            "offset": offset
        }
        
        if filter_by_formula:
            params["filterByFormula"] = filter_by_formula
        
        return self._make_request(self.base_url, params)

# Crear una instancia del servicio
try:
    airtable_service = AirtableService()
except ValueError as e:
    logger.warning(str(e))
    airtable_service = None

@router.get("/", response_model=AirtableResponse)
async def get_ipv_table_data(
    max_records: int = Query(100, le=100, description="Número máximo de registros por página (máx 100)"),
    view: Optional[str] = Query(None, description="Nombre de la vista a utilizar"),
    filter_by_formula: Optional[str] = Query(None, description="Fórmula de filtrado de Airtable"),
    offset: Optional[str] = Query(None, description="Token de paginación")
):
    """
    Obtiene datos de la tabla 'ipv' de Airtable con soporte para paginación.
    
    Args:
        max_records: Número máximo de registros a devolver (máx 100)
        view: Nombre de la vista a utilizar (opcional)
        filter_by_formula: Fórmula de filtrado de Airtable (opcional)
        offset: Token de paginación (opcional)
        
    Returns:
        Datos de la tabla 'ipv' con soporte para paginación
    """
    if not airtable_service:
        raise HTTPException(
            status_code=500,
            detail="Airtable configuration is missing. Please check environment variables AIRTABLE_BASE_ID and AIRTABLE_PAT."
        )
    
    data, error = airtable_service.get_table_data(
        max_records=max_records,
        view=view,
        filter_by_formula=filter_by_formula,
        offset=offset
    )
    
    if error:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener datos de Airtable: {error}"
        )
        
    return data
