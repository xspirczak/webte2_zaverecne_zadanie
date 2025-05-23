const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfInput");
const previewList = document.getElementById("pdfPreview");
const splitBtn = document.getElementById("splitBtn");
const message = document.getElementById("splitMessage");
const downloadArea = document.getElementById("downloadArea");
const resetSelectionBtn = document.getElementById("resetSelectionBtn");
const removeFileBtn = document.getElementById("removeFileBtn");
const spinner = document.getElementById("loadingSpinner");
const fileNameDisplay = document.getElementById("fileNameDisplay");

let selectedPages = [];
let originalFile = null;

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
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("drop", async e => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        await handlePDF(files[0]);
    }
});

fileInput.addEventListener("change", async () => {
    if (fileInput.files.length > 0) {
        await handlePDF(fileInput.files[0]);
    }
});

async function handlePDF(file) {
    originalFile = file;
    selectedPages = [];
    previewList.innerHTML = "";
    message.textContent = "";
    downloadArea.style.display = "none";
    resetSelectionBtn.style.display = "inline-block";
    removeFileBtn.style.display = "inline-block";
    fileNameDisplay.textContent = `Nahratý súbor: ${file.name}`;
    splitBtn.disabled = true;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";
        canvas.dataset.index = i;

        const label = document.createElement("span");
        label.textContent = `Strana ${i + 1}`;

        canvas.onclick = () => {
            const index = parseInt(canvas.dataset.index);
            if (selectedPages.includes(index)) {
                selectedPages = selectedPages.filter(p => p !== index);
                wrapper.classList.remove("selected");
            } else {
                selectedPages.push(index);
                wrapper.classList.add("selected");
            }

            splitBtn.disabled = selectedPages.length === 0;
        };

        wrapper.appendChild(canvas);
        wrapper.appendChild(label);
        previewList.appendChild(wrapper);
    }
}

// Zrušiť výber strán
resetSelectionBtn.addEventListener("click", () => {
    selectedPages = [];
    document.querySelectorAll(".preview-item").forEach(item => {
        item.classList.remove("selected");
    });
    splitBtn.disabled = true;
    message.textContent = "";
    message.className = "";
});

// Odstrániť celý nahratý PDF súbor
removeFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    originalFile = null;
    selectedPages = [];
    previewList.innerHTML = "";
    fileNameDisplay.textContent = "";
    message.textContent = "";
    message.className = "";
    spinner.style.display = "none";
    downloadArea.style.display = "none";
    resetSelectionBtn.style.display = "none";
    removeFileBtn.style.display = "none";
    splitBtn.disabled = true;
});

// Rozdelenie PDF
splitBtn.addEventListener("click", async () => {
    message.textContent = "";
    message.className = "";
    downloadArea.style.display = "none";

    if (!originalFile || selectedPages.length === 0) {
        message.textContent = "Vyberte aspoň jednu stranu na rozdelenie.";
        message.classList.add("text-danger", "text-center");
        return;
    }

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("selectedPages", JSON.stringify(selectedPages));

    spinner.style.display = "block";

    try {
        const response = await fetch(`${BACKEND_URL}/pdf/split?access_type=frontend`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const zipUrl = URL.createObjectURL(blob);

            const link = document.getElementById("downloadZip");
            link.href = zipUrl;
            link.download = "split.zip";
            link.style.display = "inline-block";

            message.textContent = "PDF bolo úspešne rozdelené.";
            message.classList.add("text-success", "text-center");
            downloadArea.style.display = "block";
        } else {
            message.textContent = "Chyba pri rozdeľovaní PDF.";
            message.classList.add("text-danger", "text-center");
        }
    } catch (err) {
        console.error(err);
        message.textContent = "Chyba pri komunikácii so serverom.";
        message.classList.add("text-danger", "text-center");
    } finally {
        spinner.style.display = "none";
    }
});