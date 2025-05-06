from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_user
from models import history_table
from sqlalchemy import insert
from database import database
from fastapi.responses import FileResponse
from pypdf import PdfWriter
import tempfile
import os
import uuid

router = APIRouter()

@router.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    merger = PdfWriter()
    temp_files = []

    try:
        for file in files:
            temp = tempfile.NamedTemporaryFile(delete=False)
            temp.write(await file.read())
            temp.close()
            merger.append(temp.name)
            temp_files.append(temp.name)

        output_path = f"/tmp/merged_{uuid.uuid4().hex}.pdf"
        merger.write(output_path)
        merger.close()

        return FileResponse(output_path, media_type="application/pdf", filename="merged.pdf")
    finally:
        for path in temp_files:
            os.remove(path)
