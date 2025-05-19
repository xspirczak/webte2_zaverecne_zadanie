from fastapi import APIRouter, HTTPException, Depends
from auth import create_access_token, get_password_hash, verify_password
from database import database
from models import users_table
from pydantic import BaseModel
from datetime import datetime
from auth import get_current_user
import re
from fastapi import status

router = APIRouter()

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str


# Regex na základnú validáciu emailu
EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials
from auth import security

@router.get("/me")
async def get_profile(
    credentials: HTTPAuthorizationCredentials = Security(security),
    user=Depends(get_current_user)
):
    query = users_table.select().where(users_table.c.email == user["email"])
    db_user = await database.fetch_one(query)

    if not db_user:
        raise HTTPException(status_code=404, detail="Používateľ neexistuje")

    return {
        "username": db_user["username"],
        "email": db_user["email"],
        "role": db_user["role"]
    }




@router.post("/register")
async def register(user: UserRegister):
    # Overenie mena
    if not user.username or len(user.username.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Používateľské meno musí mať aspoň 3 znaky."
        )

    # Overenie emailu
    if not re.match(EMAIL_REGEX, user.email.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný formát emailovej adresy."
        )

    # Overenie hesla
    if not user.password or len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Heslo musí mať aspoň 6 znakov."
        )

    # Overenie duplicity emailu
    query = users_table.select().where(users_table.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Používateľ s týmto emailom už existuje")

    # Uloženie do DB
    hashed_password = get_password_hash(user.password)

    insert_query = users_table.insert().values(
        username=user.username.strip(),
        email=user.email.strip(),
        hashed_password=hashed_password,
        role="user",
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


# Endpoint na obnovenie tokenu
@router.post("/refresh-token")
async def refresh_token(user=Depends(get_current_user)):
    new_token = create_access_token({
        "sub": user["email"],
        "role": user["role"]
    })

    return {
        "access_token": new_token,
        "token_type": "bearer"
    }