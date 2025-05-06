const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfInput");
const previewList = document.getElementById("pdfPreview");
const deleteBtn = document.getElementById("deleteBtn");
const message = document.getElementById("deleteMessage");
const downloadLink = document.getElementById("downloadLink");
const resetSelectionBtn = document.getElementById("resetSelectionBtn");
const removePdfBtn = document.getElementById("removePdfBtn");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const spinner = document.getElementById("loadingSpinner");

let pagesToDelete = [];
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
    pagesToDelete = [];
    previewList.innerHTML = "";
    message.textContent = "";
    downloadLink.style.display = "none";
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    resetSelectionBtn.style.display = "inline-block";
    removePdfBtn.style.display = "inline-block";
    deleteBtn.disabled = true;

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
            if (pagesToDelete.includes(index)) {
                pagesToDelete = pagesToDelete.filter(p => p !== index);
                wrapper.classList.remove("selected");
                canvas.style.opacity = "1";
            } else {
                pagesToDelete.push(index);
                wrapper.classList.add("selected");
                canvas.style.opacity = "0.4";
            }
            deleteBtn.disabled = pagesToDelete.length === 0;
        };

        wrapper.appendChild(canvas);
        wrapper.appendChild(label);
        previewList.appendChild(wrapper);
    }
}

resetSelectionBtn.addEventListener("click", () => {
    pagesToDelete = [];
    document.querySelectorAll(".preview-item").forEach(item => {
        item.classList.remove("selected");
        item.querySelector("canvas").style.opacity = "1";
    });
    deleteBtn.disabled = true;
    message.textContent = "";
    message.className = "";
});

removePdfBtn.addEventListener("click", () => {
    originalFile = null;
    fileInput.value = "";
    previewList.innerHTML = "";
    fileNameDisplay.textContent = "";
    message.textContent = "";
    message.className = "";
    downloadLink.style.display = "none";
    resetSelectionBtn.style.display = "none";
    removePdfBtn.style.display = "none";
    deleteBtn.disabled = true;
});

deleteBtn.addEventListener("click", async () => {
    message.textContent = "";
    message.className = "";
    downloadLink.style.display = "none";

    if (!originalFile || pagesToDelete.length === 0) {
        message.textContent = "Vyberte aspoň jednu stranu na vymazanie.";
        message.classList.add("text-danger", "text-center");
        return;
    }

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("pagesToDelete", JSON.stringify(pagesToDelete));

    spinner.style.display = "block";

    try {
        const response = await fetch(`${BACKEND_URL}/pdf/delete-pages`, {
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
            downloadLink.download = "deleted-pages.pdf";
            downloadLink.style.display = "inline-block";
            message.textContent = "Strany boli úspešne vymazané.";
            message.classList.add("text-success", "text-center");
        } else {
            message.textContent = "Chyba pri odstraňovaní strán.";
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
