from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import database
from routers import user_routes, history_routes, pdf_routes, manual_routes

app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    #root_path="/api"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # alebo ["http://localhost:63342"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(user_routes.router, prefix="/api/user")
app.include_router(history_routes.router, prefix="/api/history")
app.include_router(pdf_routes.router, prefix="/api/pdf")
app.include_router(manual_routes.router, prefix="/api/manual")


@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


