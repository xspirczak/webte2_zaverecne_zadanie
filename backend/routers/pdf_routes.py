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
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
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
        client_ip=request.headers.get("x-forwarded-for", request.client.host)
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
        client_ip=request.headers.get("x-forwarded-for", request.client.host)
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
        client_ip=request.headers.get("x-forwarded-for", request.client.host)
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
        client_ip=request.headers.get("x-forwarded-for", request.client.host)
    )

    return StreamingResponse(output, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=deleted-pages.pdf"
    })

# Endpoint na pridanie vodoznaku do PDF
@router.post("/watermark")
async def add_watermark(
    request: Request,
    file: UploadFile = File(...),
    watermarkType: str = Form(...),
    opacity: str = Form(...),
    position: str = Form(...),
    watermarkText: str = Form(None),
    textColor: str = Form(None),
    fontSize: str = Form(None),
    watermarkImage: UploadFile = File(None),
    user=Depends(get_current_user),
    access_type: Optional[str] = Query(default="api")
):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import Color, HexColor
        from PIL import Image

        pdf_content = await file.read()
        reader = PdfReader(io.BytesIO(pdf_content))
        writer = PdfWriter()

        try:
            opacity_value = int(opacity) / 100
        except ValueError:
            opacity_value = 0.3  

        if watermarkType == "text" and watermarkText:
            
            for i, page in enumerate(reader.pages):
                watermark_stream = io.BytesIO()
                
                page_box = page.mediabox
                page_width = float(page_box.width)
                page_height = float(page_box.height)
                
                c = canvas.Canvas(watermark_stream, pagesize=(page_width, page_height))
                
                if textColor:
                    c.setFillColor(HexColor(f"#{textColor}"))
                else:
                    c.setFillColor(Color(0.5, 0.5, 0.5, alpha=opacity_value))  
                
                base_font_size = min(page_width, page_height) / 20  
                font_size = base_font_size  
                
                if fontSize == "small":
                    font_size = base_font_size * 0.75
                elif fontSize == "large":
                    font_size = base_font_size * 1.5
                
                c.setFont("Helvetica", font_size)
                
                x, y = page_width/2, page_height/2  
                
                margin = min(page_width, page_height) / 10  
                
                if position == "topLeft":
                    x, y = margin, page_height - margin
                elif position == "topRight":
                    x, y = page_width - margin, page_height - margin
                elif position == "bottomLeft":
                    x, y = margin, margin
                elif position == "bottomRight":
                    x, y = page_width - margin, margin
                
                c.setFillAlpha(opacity_value)
                if position in ["topLeft", "bottomLeft"]:
                    c.drawString(x, y, watermarkText)
                elif position in ["topRight", "bottomRight"]:
                    text_width = c.stringWidth(watermarkText, "Helvetica", font_size)
                    c.drawString(x - text_width, y, watermarkText)
                else:
                    c.drawCentredString(x, y, watermarkText)
                
                c.save()
                
                watermark_stream.seek(0)
                watermark_reader = PdfReader(watermark_stream)
                watermark_page = watermark_reader.pages[0]
                
                page.merge_page(watermark_page)
                writer.add_page(page)
                
        elif watermarkType == "image" and watermarkImage:
            
            image_content = await watermarkImage.read()
            image = Image.open(io.BytesIO(image_content))
            
            temp_img = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            image.save(temp_img.name)
            temp_img_path = temp_img.name
            
            try:
                for i, page in enumerate(reader.pages):
                    page_box = page.mediabox
                    page_width = float(page_box.width)
                    page_height = float(page_box.height)
                    
                    watermark_stream = io.BytesIO()
                    c = canvas.Canvas(watermark_stream, pagesize=(page_width, page_height))
                    
                    img_width, img_height = image.size
                    
                    scale = min(page_width/3 / img_width, page_height/3 / img_height)
                    scaled_width = img_width * scale
                    scaled_height = img_height * scale
                    
                    margin = min(page_width, page_height) / 20 
                    
                    x, y = (page_width - scaled_width)/2, (page_height - scaled_height)/2  
                    
                    if position == "topLeft":
                        x, y = margin, page_height - margin - scaled_height
                    elif position == "topRight":
                        x, y = page_width - margin - scaled_width, page_height - margin - scaled_height
                    elif position == "bottomLeft":
                        x, y = margin, margin
                    elif position == "bottomRight":
                        x, y = page_width - margin - scaled_width, margin
                    
                    c.setFillAlpha(opacity_value)
                    c.drawImage(temp_img_path, x, y, width=scaled_width, height=scaled_height, mask='auto')
                    c.save()
                    
                    watermark_stream.seek(0)
                    watermark_reader = PdfReader(watermark_stream)
                    watermark_page = watermark_reader.pages[0]
                    
                    page.merge_page(watermark_page)
                    writer.add_page(page)
            finally:
                if os.path.exists(temp_img_path):
                    os.unlink(temp_img_path)
        else:
            raise HTTPException(status_code=400, detail="Missing watermark data")

        await log_history(
            user_email=user["email"],
            action="add-watermark",
            access_type=access_type,
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
        )

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=watermarked_{file.filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

# Endpoint na pridanie compress do PDF
@router.post("/compress")
async def compress_pdf(request: Request, file: UploadFile, compressionLevel: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    try:
        from pypdf import PdfWriter, PdfReader
        import io
        
        file_bytes = await file.read()
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        pdf_writer = PdfWriter()
        
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)
        
        output_stream = io.BytesIO()
        pdf_writer.write(output_stream)
        output_stream.seek(0)
        
        await log_history(
            user_email=user["email"],
            action="compress",
            access_type=access_type,
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
        )
        
        return StreamingResponse(
            output_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=compressed_{file.filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint na pridanie extract do PDF
@router.post("/extract")
async def extract_pages(request: Request, file: UploadFile, pagesToExtract: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    try:
        from pypdf import PdfWriter, PdfReader
        
        file_bytes = await file.read()
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        pdf_writer = PdfWriter()
        
        pages_to_extract = json.loads(pagesToExtract)
        
        if not pages_to_extract:
            raise HTTPException(status_code=400, detail="No pages selected for extraction")
        
        max_page = len(pdf_reader.pages)
        valid_pages = [p for p in pages_to_extract if 1 <= p <= max_page]
        
        if not valid_pages:
            raise HTTPException(status_code=400, detail="No valid pages selected for extraction")
        
        for page_num in valid_pages:
            pdf_writer.add_page(pdf_reader.pages[page_num - 1])
        
        output_stream = io.BytesIO()
        pdf_writer.write(output_stream)
        output_stream.seek(0)
        
        await log_history(
            user_email=user["email"],
            action="extract",
            access_type=access_type,
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
        )
        
        return StreamingResponse(
            output_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=extracted_{file.filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    




# Endpoint na pridanie reorder do PDF
@router.post("/reorder")
async def reorder_pages(request: Request, file: UploadFile, pageOrder: str = Form(...), user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    try:
        from pypdf import PdfWriter, PdfReader
        
        file_bytes = await file.read()
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        pdf_writer = PdfWriter()
        
        page_order = json.loads(pageOrder)
        
        if not page_order or len(page_order) != len(pdf_reader.pages):
            raise HTTPException(status_code=400, detail="Invalid page order. Number of pages must match the original PDF.")
        
        for idx in page_order:
            if idx < 0 or idx >= len(pdf_reader.pages):
                raise HTTPException(status_code=400, detail=f"Invalid page index: {idx}")
        
        for idx in page_order:
            pdf_writer.add_page(pdf_reader.pages[idx])
        
        output_stream = io.BytesIO()
        pdf_writer.write(output_stream)
        output_stream.seek(0)
        
        await log_history(
            user_email=user["email"],
            action="reorder",
            access_type=access_type,
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
        )
        
        return StreamingResponse(
            output_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=reordered_{file.filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint na pridanie convert do PDF
@router.post("/convert")
async def convert_to_text(request: Request, file: UploadFile, user=Depends(get_current_user), access_type: Optional[str] = Query(default="api")):
    if user["role"] != "user" and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only logged in users can use this endpoint.")

    try:
        file_bytes = await file.read()
        
        from pypdf import PdfReader
        
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        full_text = "\n\n".join(text_parts)
        
        await log_history(
            user_email=user["email"],
            action="convert-to-text",
            access_type=access_type,
            client_ip=request.headers.get("x-forwarded-for", request.client.host)
        )
        
        return {"text": full_text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

