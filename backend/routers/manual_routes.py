from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import FileResponse, StreamingResponse, PlainTextResponse
from models import manual_table
from database import database
from sqlalchemy import select, insert, update, text
from weasyprint import HTML
from fastapi import BackgroundTasks
import asyncio
import io

router = APIRouter()

@router.get("/")
async def get_manual():
    query = select(manual_table)
    manual = await database.fetch_one(query)
    if manual:
        return PlainTextResponse(manual["content"], media_type="text/html; charset=utf-8")
    else:
        raise HTTPException(status_code=404, detail="Príručka neexistuje.")

@router.get("/{id}")
async def get_manual_by_id(id: int):
    query = select(manual_table).where(manual_table.c.id == id)
    manual = await database.fetch_one(query)
    if manual:
        return PlainTextResponse(manual["content"], media_type="text/html; charset=utf-8")
    else:
        raise HTTPException(status_code=404, detail="Príručka neexistuje.")

""" @router.post("/")
async def save_manual(request: Request):
    content_bytes = await request.body()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Neplatné kódovanie vstupných dát. Očakáva sa UTF-8.")

    encoded_content = content_str.encode("utf-8")
    query = select(manual_table)
    manual = await database.fetch_one(query)

    if manual:
        update_query = (
            update(manual_table)
            .where(manual_table.c.id == manual["id"])
            .values(content=encoded_content)
        )
        await database.execute(update_query)
    else:
        insert_query = insert(manual_table).values(content=encoded_content)
        await database.execute(insert_query)

    return {"message": "Príručka bola uložená."} """


#aktualizácia manuálu
@router.put("/{id}")
async def update_manual(id: int, request: Request):
    content_bytes = await request.body()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Neplatné kódovanie vstupných dát. Očakáva sa UTF-8.")

    encoded_content = content_str.encode("utf-8")

    query = select(manual_table).where(manual_table.c.id == id)
    manual = await database.fetch_one(query)

    if not manual:
        raise HTTPException(status_code=404, detail=f"Príručka s ID {id} neexistuje.")

    update_query = (
        update(manual_table)
        .where(manual_table.c.id == id)
        .values(content=encoded_content)
    )
    await database.execute(update_query)

    return {"message": f"Príručka s ID {id} bola aktualizovaná."}



@router.get("/pdf/{id}")
async def export_manual_pdf(id: int):
    query = select(manual_table).where(manual_table.c.id == id)
    manual = await database.fetch_one(query)

    if not manual:
        raise HTTPException(status_code=404, detail="Príručka neexistuje.")

    html_content = manual["content"]
    html_obj = HTML(string=html_content, base_url="", encoding="utf-8")

    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(None, lambda: html_obj.write_pdf())

    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=manual.pdf"
    })