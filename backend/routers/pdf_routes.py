from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, Query, File, Form, Request
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
import zipfile
from typing import List
from history import log_history
from typing import Optional

router = APIRouter()

# Testovanie requestu mimo frontendu (aby sa dosiahol zaznam api) sa da robit pomocou curl
# curl -X POST "http://localhost:8000/api/pdf/rotate" \
#    -H "Authorization: Bearer <ACCESS_TOKEN>" \
#    -F "file=@<cest_k_suboru_pdf>" \
#    -F "rotations=[<uhol_otocenia/i>]"

# Pri vyvoji a testovani na localhoste/dockeri sa zapisuje
# do historie lokacia "neznama" pretoze request ide z privatnej ip adresy

# Endpoint na zlucovanie pdf suborov
@router.post("/merge")
async def merge_pdfs(request: Request, files: list[UploadFile] = File(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

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

        await log_history(
            user_email=user["email"],
            action="merge",
            access_type=access_type,
            client_ip=request.client.host
        )

        return FileResponse(output_path, media_type="application/pdf", filename="merged.pdf")
    finally:
        for path in temp_files:
            os.remove(path)

# Endpoint na rotovanie stran v PDF
@router.post("/rotate")
async def rotate_pdf(request: Request, file: UploadFile, rotations: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

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

    await log_history(
        user_email=user["email"],
        action="rotate",
        access_type=access_type,
        client_ip=request.client.host
    )

    return StreamingResponse(output, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=rotated.pdf"
    })

# Endpoint na zaheslovanie PDF
@router.post("/encrypt")
async def encrypt_pdf(request: Request, file: UploadFile, password: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.encrypt(user_password=password, owner_password=password)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)

    await log_history(
        user_email=user["email"],
        action="encrypt",
        access_type=access_type,
        client_ip=request.client.host
    )

    return StreamingResponse(
        output_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=secured.pdf"}
    )

# Endpoint na rozdelenie PDF suboru na dve casti
@router.post("/split")
async def split_pdf(request: Request, file: UploadFile, selectedPages: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    selected = json.loads(selectedPages)
    file_bytes = await file.read()
    reader = PdfReader(io.BytesIO(file_bytes))

    writer1 = PdfWriter()
    writer2 = PdfWriter()

    for i, page in enumerate(reader.pages):
        if i in selected:
            writer1.add_page(page)
        else:
            writer2.add_page(page)

    pdf1 = io.BytesIO()
    pdf2 = io.BytesIO()
    writer1.write(pdf1)
    writer2.write(pdf2)
    pdf1.seek(0)
    pdf2.seek(0)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        zip_file.writestr("part1.pdf", pdf1.read())
        zip_file.writestr("part2.pdf", pdf2.read())
    zip_buffer.seek(0)

    await log_history(
        user_email=user["email"],
        action="split",
        access_type=access_type,
        client_ip=request.client.host
    )
    return StreamingResponse(zip_buffer, media_type="application/zip", headers={
        "Content-Disposition": "attachment; filename=split.zip"
    })

# Endpoint na odstranie vybranych stran z PDF
@router.post("/delete-pages")
async def delete_pages(request: Request, file: UploadFile, pagesToDelete: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    delete_indexes = json.loads(pagesToDelete)
    file_bytes = await file.read()
    reader = PdfReader(io.BytesIO(file_bytes))
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        if i not in delete_indexes:
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)

    await log_history(
        user_email=user["email"],
        action="delete-pages",
        access_type=access_type,
        client_ip=request.client.host
    )

    return StreamingResponse(output, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=deleted-pages.pdf"
    })