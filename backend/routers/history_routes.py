from fastapi import APIRouter, Depends, HTTPException
from backend.auth import get_current_user
from backend.database import database
from backend.models import history_table
from typing import List
from datetime import datetime
import csv
import os


router = APIRouter()

@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view history")

    query = select(history)
    return await database.fetch_all(query)

@router.get("/history/export")
async def export_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can export history")

    rows = await database.fetch_all(select(history))
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Používateľ", "Operácia", "Čas", "Zdroj", "Poloha"])
    for r in rows:
        writer.writerow([r["username"], r["operation"], r["timestamp"], r["source"], r["location"]])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=history.csv"})

@router.delete("/history")
async def clear_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete history")

    await database.execute(delete(history))
    return {"message": "História vymazaná"}
