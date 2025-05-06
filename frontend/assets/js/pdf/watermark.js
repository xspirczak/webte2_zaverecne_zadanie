const dropZone = document.getElementById("dropZone");
const pdfInput = document.getElementById("pdfInput");
const pdfPreview = document.getElementById("pdfPreview");
const applyWatermarkBtn = document.getElementById("applyWatermarkBtn");
const watermarkMessage = document.getElementById("watermarkMessage");
const downloadLink = document.getElementById("downloadLink");
const resetBtn = document.getElementById("resetBtn");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const loadingSpinner = document.getElementById("loadingSpinner");
const watermarkType = document.getElementById("watermarkType");
const textWatermarkOptions = document.getElementById("textWatermarkOptions");
const imageWatermarkOptions = document.getElementById("imageWatermarkOptions");
const watermarkOpacity = document.getElementById("watermarkOpacity");
const opacityValue = document.getElementById("opacityValue");
const watermarkPosition = document.getElementById("watermarkPosition");
const watermarkImage = document.getElementById("watermarkImage");
const imagePreview = document.getElementById("imagePreview");
const watermarkImagePreview = document.getElementById("watermarkImagePreview");

let pdfFile = null;
let watermarkImageFile = null;

// Event listener pre typ vodoznaku
watermarkType.addEventListener("change", function() {
    if (this.value === "text") {
        textWatermarkOptions.style.display = "block";
        imageWatermarkOptions.style.display = "none";
    } else {
        textWatermarkOptions.style.display = "none";
        imageWatermarkOptions.style.display = "block";
    }
});

// Event listener pre priehľadnosť
watermarkOpacity.addEventListener("input", function() {
    opacityValue.textContent = this.value;
});

// Event listener pre obrázok vodoznaku
watermarkImage.addEventListener("change", function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        watermarkImageFile = file;
        
        // Aktualizácia mena súboru v custom-file-label
        const fileLabel = this.nextElementSibling;
        fileLabel.textContent = file.name;
        
        // Zobrazenie náhľadu
        const reader = new FileReader();
        reader.onload = function(e) {
            watermarkImagePreview.src = e.target.result;
            imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// Drag & drop správanie
["dragenter", "dragover"].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
});
["dragleave", "drop"].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
    });
});
dropZone.addEventListener("click", () => pdfInput.click());

dropZone.addEventListener("drop", async e => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type === "application/pdf") {
        pdfInput.files = e.dataTransfer.files;
        await handlePDF(files[0]);
    }
});

pdfInput.addEventListener("change", async () => {
    if (pdfInput.files.length > 0) {
        await handlePDF(pdfInput.files[0]);
    }
});

async function handlePDF(file) {
    pdfFile = file;
    pdfPreview.innerHTML = "";
    watermarkMessage.textContent = "";
    watermarkMessage.className = "";
    downloadLink.style.display = "none";
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    resetBtn.style.display = "inline-block";
    applyWatermarkBtn.disabled = false;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Zobrazíme len prvú stranu ako náhľad
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;
    pdfPreview.appendChild(canvas);
}

resetBtn.addEventListener("click", () => {
    pdfInput.value = "";
    pdfFile = null;
    watermarkImageFile = null;
    fileNameDisplay.textContent = "";
    pdfPreview.innerHTML = "";
    resetBtn.style.display = "none";
    applyWatermarkBtn.disabled = true;
    watermarkMessage.textContent = "";
    watermarkMessage.className = "";
    downloadLink.style.display = "none";
    
    // Reset image preview if exists
    if (imagePreview) {
        imagePreview.style.display = "none";
    }
    
    // Reset forms to defaults
    document.getElementById("watermarkText").value = "";
    document.getElementById("textColor").value = "#aaaaaa";
    document.getElementById("fontSize").value = "medium";
    watermarkOpacity.value = "30";
    opacityValue.textContent = "30";
    watermarkPosition.value = "center";
    watermarkType.value = "text";
    
    // Reset display
    textWatermarkOptions.style.display = "block";
    imageWatermarkOptions.style.display = "none";
    
    // Reset file input for watermark image
    if (watermarkImage) {
        watermarkImage.value = "";
        if (watermarkImage.nextElementSibling) {
            watermarkImage.nextElementSibling.textContent = "Vyber obrázok";
        }
    }
});

applyWatermarkBtn.addEventListener("click", async () => {
    watermarkMessage.textContent = "";
    watermarkMessage.className = "";
    downloadLink.style.display = "none";

    if (!pdfFile) {
        watermarkMessage.textContent = "Najprv vyberte PDF súbor.";
        watermarkMessage.classList.add("text-danger", "text-center");
        return;
    }

    // Validácia pre textový vodoznak
    if (watermarkType.value === "text") {
        const watermarkText = document.getElementById("watermarkText").value.trim();
        if (!watermarkText) {
            watermarkMessage.textContent = "Zadajte text vodoznaku.";
            watermarkMessage.classList.add("text-danger", "text-center");
            return;
        }
    }
    
    // Validácia pre obrázkový vodoznak
    if (watermarkType.value === "image" && !watermarkImageFile) {
        watermarkMessage.textContent = "Vyberte obrázok pre vodoznak.";
        watermarkMessage.classList.add("text-danger", "text-center");
        return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);
    
    if (watermarkType.value === "text") {
        formData.append("watermarkType", "text");
        formData.append("watermarkText", document.getElementById("watermarkText").value);
        formData.append("textColor", document.getElementById("textColor").value.replace("#", ""));
        formData.append("fontSize", document.getElementById("fontSize").value);
    } else {
        formData.append("watermarkType", "image");
        formData.append("watermarkImage", watermarkImageFile);
    }
    
    formData.append("opacity", watermarkOpacity.value);
    formData.append("position", watermarkPosition.value);

    loadingSpinner.style.display = "block";

    try {
        const response = await fetch(`${BACKEND_URL}/pdf/watermark`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = "watermarked_" + pdfFile.name;
            downloadLink.style.display = "inline-block";
            watermarkMessage.textContent = "Vodoznak bol úspešne pridaný do PDF.";
            watermarkMessage.classList.add("text-success", "text-center");
        } else {
            watermarkMessage.textContent = "Chyba pri pridávaní vodoznaku.";
            watermarkMessage.classList.add("text-danger", "text-center");
        }
    } catch (err) {
        console.error(err);
        watermarkMessage.textContent = "Chyba pri komunikácii so serverom.";
        watermarkMessage.classList.add("text-danger", "text-center");
    } finally {
        loadingSpinner.style.display = "none";
    }
});