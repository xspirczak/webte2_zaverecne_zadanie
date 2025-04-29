from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from backend.auth import get_current_user
from backend.models import history_table
from sqlalchemy import insert
from backend.database import database

router = APIRouter()

@router.get("/pdf/test")
async def pdf_test(user: dict = Depends(get_current_user)):
    return {"message": f"PDF funkcia funguje pre používateľa {user['email']}"}

# Tu budeme postupne pridávať všetky PDF funkcionality (spájanie, vymazanie strany, atď.)

# Príklad - nahranie PDF (predpríprava na reálnu funkcionalitu)
@router.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Iba PDF súbory sú podporované.")

    # Tu by sme reálne spracovali PDF pomocou pypdf (zatiaľ len simulujeme)
    content = await file.read()

    # Uloženie do histórie použitia
    query = insert(history_table).values(
        user_id=user["id"],
        action="upload_pdf",
        description=f"Nahraný súbor: {file.filename}",
        frontend=True,
        location="unknown"  # neskôr cez API si vieme zistiť lokalitu
    )
    await database.execute(query)

    return {"filename": file.filename, "message": "PDF prijaté"}
