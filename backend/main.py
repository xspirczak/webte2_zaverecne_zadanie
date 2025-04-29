from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import database
from backend.routers import user_routes, history_routes, pdf_routes

app = FastAPI()

# CORS middleware musí byť hneď po vytvorení app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # alebo ["http://localhost:63342"], ak chceš byť presný
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(user_routes.router, prefix="/api/user")
app.include_router(history_routes.router, prefix="/api/history")
app.include_router(pdf_routes.router, prefix="/api/pdf")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
