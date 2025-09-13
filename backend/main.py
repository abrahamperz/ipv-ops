"""
Punto de entrada principal para la aplicación FastAPI.
"""
import uvicorn
from fastapi import FastAPI

# Importar rutas de la API
from v1.api.routes import router as api_router

# Crear la aplicación FastAPI
app = FastAPI(
    title="Google Sheets API",
    description="API para obtener datos de Google Sheets",
    version="1.0.0"
)

# Incluir rutas de la API
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
