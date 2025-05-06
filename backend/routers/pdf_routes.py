from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form
from auth import get_current_user
from models import history_table
from sqlalchemy import insert
from database import database
from fastapi.responses import FileResponse, StreamingResponse
from pypdf import PdfWriter, PdfReader
import tempfile
import os
import uuid
import io, json

router = APIRouter()

# Endpoint na zlucovanie pdf suborov
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

# Endpoint na rotovanie stran v PDF
@router.post("/rotate")
async def rotate_pdf(file: UploadFile, rotations: str = Form(...)):
    file_bytes = await file.read()
    file_stream = io.BytesIO(file_bytes)
    reader = PdfReader(file_stream)
    writer = PdfWriter()
    rotations_list = json.loads(rotations)

    for i, page in enumerate(reader.pages):
        page.rotate(rotations_list[i])
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)

    return StreamingResponse(output, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=rotated.pdf"
    })

# Endpoint na zaheslovanie PDF
@router.post("/encrypt")
async def encrypt_pdf(file: UploadFile, password: str = Form(...)):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.encrypt(user_password=password, owner_password=password)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)

    return StreamingResponse(
        output_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=secured.pdf"}
    )