from fastapi import FastAPI

from app.db.connection import Base, engine
from app.db import models
from app.routes.organ_routes import router as organ_router
from app.routes.recipient_routes import router as recipient_router
from app.routes.hospital_routes import router as hospital_router
from app.routes.matching_routes import router as matching_router
from app.routes.transport_routes import router as transport_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IntelliTransplant API",
    description="Classical AI-Based Organ Transplant Coordination System",
    version="1.0.0"
)

app.include_router(organ_router)
app.include_router(recipient_router)
app.include_router(hospital_router)
app.include_router(matching_router)
app.include_router(transport_router)

@app.get("/")
def home():
    return {
        "project": "IntelliTransplant",
        "message": "Organ Transplant Coordination System"
    }