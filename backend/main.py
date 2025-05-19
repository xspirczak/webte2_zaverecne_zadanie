from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from database import database
from routers import user_routes, history_routes, pdf_routes, manual_routes

app = FastAPI(
    title="Tvoja API dokumentácia",
    version="1.0.0",
    description="Zadaj svoj JWT token ako Bearer token.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

#CORS middleware,
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Register routes,
app.include_router(user_routes.router, prefix="/api/user", tags=["Používateľ"])
app.include_router(history_routes.router, prefix="/api/history", tags=["História"])
app.include_router(pdf_routes.router, prefix="/api/pdf", tags=["PDF operácie"])
app.include_router(manual_routes.router, prefix="/api/manual", tags=["Príručka"])

#DB lifecycle,
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }


    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi