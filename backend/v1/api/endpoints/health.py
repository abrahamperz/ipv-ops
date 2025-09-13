"""
Módulo para los endpoints de verificación de salud.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Endpoint de verificación de salud.
    
    Returns:
        dict: Estado del servicio
    """
    return {"status": "ok"}

@router.get("/")
async def hello_world():
    """
    Endpoint de prueba.
    
    Returns:
        dict: Mensaje de bienvenida
    """
    return {"message": "Bienvenido a la API de IPV Ops"}
