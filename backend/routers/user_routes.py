from fastapi import APIRouter, HTTPException, Depends
from backend.auth import create_access_token, get_password_hash, verify_password
from backend.database import database
from backend.models import users_table
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Endpoint na registráciu
@router.post("/register")
async def register(user: UserRegister):
    query = users_table.select().where(users_table.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Používateľ s týmto emailom už existuje")

    hashed_password = get_password_hash(user.password)

    insert_query = users_table.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,  # <-- tu upravené!
        role="user",  # predvolená rola používateľa
        created_at=datetime.utcnow()
    )

    await database.execute(insert_query)
    return {"message": "Registrácia úspešná"}

# Endpoint na login
@router.post("/login")
async def login(user: UserLogin):
    query = users_table.select().where(users_table.c.email == user.email)
    db_user = await database.fetch_one(query)

    if not db_user:
        raise HTTPException(status_code=400, detail="Nesprávny email alebo heslo")

    # Skontroluj heslo proti `hashed_password` stĺpcu
    if not verify_password(user.password, db_user["hashed_password"]):  # <-- tu upravené!
        raise HTTPException(status_code=400, detail="Nesprávny email alebo heslo")

    # Vytvorenie tokenu
    access_token = create_access_token({"sub": db_user["email"], "role": db_user["role"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": db_user["username"],
        "role": db_user["role"]
    }
