"""
Módulo principal de rutas de la API.

Este módulo importa y organiza todos los endpoints de la aplicación.
"""
from fastapi import APIRouter

# Importar routers de los endpoints
from .endpoints.health import router as health_router
from .endpoints.airtable import router as airtable_router

# Crear el router principal
router = APIRouter()

# Incluir los routers de los endpoints
router.include_router(
    health_router,
    tags=["health"],
    responses={404: {"description": "No encontrado"}},
)

router.include_router(
    airtable_router,
    prefix="/airtable",
    tags=["airtable"],
    responses={404: {"description": "No encontrado"}},
)
