from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from auth import get_current_user
from database import database
from models import history_table
from typing import List
from datetime import datetime
from sqlalchemy import select, delete
import csv
import io

router = APIRouter()

# GET /api/history
@router.get("/")
async def get_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view history")

    query = select(history_table).order_by(history_table.c.timestamp.desc())
    return await database.fetch_all(query)

# GET /api/history/export
@router.get("/export")
async def export_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can export history")

    rows = await database.fetch_all(select(history_table).order_by(history_table.c.timestamp.desc()))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Používateľ", "Akcia", "Dátum a čas", "Prístup", "Mesto", "Štát"])

    for r in rows:
        writer.writerow([
            r["user_email"],
            r["action"],
            r["timestamp"],
            r["access_type"],
            r["city"],
            r["country"]
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=history.csv"
    })

# DELETE /api/history
@router.delete("/")
async def clear_history(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete history")

    await database.execute(delete(history_table))
    return {"message": "História bola vymazaná"}
