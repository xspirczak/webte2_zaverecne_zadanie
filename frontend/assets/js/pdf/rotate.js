const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfFile");
const previewList = document.getElementById("previewList");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const resetBtn = document.getElementById("resetBtn");
const submitBtn = document.getElementById("submitBtn");
const spinner = document.getElementById("loadingSpinner");
const message = document.getElementById("rotateMessage");
const downloadBtn = document.getElementById("downloadBtn");

let rotations = [];
let originalFile = null;
let pages = [];

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

resetBtn.addEventListener("click", () => {
    fileInput.value = "";
    originalFile = null;
    pages = [];
    previewList.innerHTML = "";
    fileNameDisplay.textContent = "";
    resetBtn.style.display = "none";
    submitBtn.style.display = "none";
    downloadBtn.style.display = "none";
    message.textContent = "";
    message.className = "";
});

async function handlePDF(file) {
    originalFile = file;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    rotations = Array(pdf.numPages).fill(0);
    pages = [];
    previewList.innerHTML = "";
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    resetBtn.style.display = "inline-block";

    const CANVAS_WIDTH = 220;
    const CANVAS_HEIGHT = 220;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(page);

        const viewportOriginal = page.getViewport({ scale: 1 });
        const scale = Math.min(CANVAS_WIDTH / viewportOriginal.width, CANVAS_HEIGHT / viewportOriginal.height);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.dataset.pageIndex = i - 1;
        const ctx = canvas.getContext("2d");

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        ctx.save();
        ctx.translate((CANVAS_WIDTH - viewport.width) / 2, (CANVAS_HEIGHT - viewport.height) / 2);
        await page.render({ canvasContext: ctx, viewport }).promise;
        ctx.restore();

        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";

        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group mt-2";

        const btnLeft = document.createElement("button");
        btnLeft.type = "button";
        btnLeft.className = "btn btn-sm btn-outline-secondary mr-2";
        btnLeft.innerHTML = '<i class="fas fa-undo-alt"></i>';
        btnLeft.onclick = () => rotatePage(canvas, -90);

        const btnRight = document.createElement("button");
        btnRight.type = "button";
        btnRight.className = "btn btn-sm btn-outline-secondary";
        btnRight.innerHTML = '<i class="fas fa-redo-alt"></i>';
        btnRight.onclick = () => rotatePage(canvas, 90);


        btnGroup.appendChild(btnLeft);
        btnGroup.appendChild(btnRight);

        const label = document.createElement("span");
        label.textContent = `Strana ${i}`;

        wrapper.appendChild(canvas);
        wrapper.appendChild(label);
        wrapper.appendChild(btnGroup);
        previewList.appendChild(wrapper);
    }

    submitBtn.style.display = "inline-block";
    downloadBtn.style.display = "none";
}

async function rotatePage(canvas, degrees) {
    const pageIndex = parseInt(canvas.dataset.pageIndex);
    const page = pages[pageIndex];
    rotations[pageIndex] = (rotations[pageIndex] + degrees + 360) % 360;

    const context = canvas.getContext("2d");
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(canvas.width / baseViewport.width, canvas.height / baseViewport.height);
    const finalViewport = page.getViewport({ scale, rotation: rotations[pageIndex] });

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(
        (canvas.width - finalViewport.width) / 2,
        (canvas.height - finalViewport.height) / 2
    );
    await page.render({ canvasContext: context, viewport: finalViewport }).promise;
    context.restore();
}

submitBtn.addEventListener("click", async () => {
    if (!originalFile) return;

    spinner.style.display = "block";
    message.textContent = "";
    message.className = "";
    downloadBtn.style.display = "none";

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("rotations", JSON.stringify(rotations));

<<<<<<< Updated upstream
    try {
        const res = await fetch(`${BACKEND_URL}/pdf/rotate`, {
            method: "POST",
            body: formData
        });
=======
    const accessToken = localStorage.getItem("access_token");
    
    const response = await fetch(`${BACKEND_URL}/pdf/rotate`, {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });
>>>>>>> Stashed changes

        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            downloadBtn.href = url;
            downloadBtn.download = "rotated.pdf";
            downloadBtn.style.display = "inline-block";
            message.textContent = "PDF bolo úspešne otočené.";
            message.classList.add("text-success");
        } else {
            message.textContent = "Chyba pri otáčaní PDF.";
            message.classList.add("text-danger");
        }
    } catch (err) {
        console.error(err);
        message.textContent = "Chyba pri komunikácii so serverom.";
        message.classList.add("text-danger");
    } finally {
        spinner.style.display = "none";
    }
});