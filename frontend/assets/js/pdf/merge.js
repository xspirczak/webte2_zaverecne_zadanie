const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfs");
const previewList = document.getElementById("previewList");
const spinner = document.getElementById("loadingSpinner");
const message = document.getElementById("mergeMessage");
const downloadBtn = document.getElementById("downloadBtn");

let fileList = []; // Zachováva poradie

// Drag & drop efekty
['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
});
['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
    });
});

// Kliknutie na výber
dropZone.addEventListener("click", () => fileInput.click());

// Drop
dropZone.addEventListener("drop", e => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    handleFiles(files);
});

// Input change
fileInput.addEventListener("change", e => {
    const files = Array.from(e.target.files).filter(f => f.type === "application/pdf");
    handleFiles(files);
});

// Spracovanie súborov
function handleFiles(files) {
    fileList.push(...files);
    renderPreviews();
}

// Vykresli náhľady
function renderPreviews() {
    previewList.innerHTML = "";

    fileList.forEach(async (file, index) => {
        const readerUrl = URL.createObjectURL(file);

        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";
        wrapper.setAttribute("data-index", index);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        try {
            const pdf = await pdfjsLib.getDocument(readerUrl).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.4 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (err) {
            console.error("Chyba pri renderovaní PDF", err);
        }

        const span = document.createElement("span");
        span.textContent = file.name;

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-danger mt-2";
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => {
            fileList.splice(index, 1);
            renderPreviews();
        };

        wrapper.appendChild(canvas);
        wrapper.appendChild(span);
        wrapper.appendChild(removeBtn);
        previewList.appendChild(wrapper);
    });
}

// Umožni preusporiadanie
Sortable.create(previewList, {
    animation: 150,
    onEnd: () => {
        const newOrder = [];
        document.querySelectorAll(".preview-item").forEach(item => {
            const index = parseInt(item.getAttribute("data-index"));
            newOrder.push(fileList[index]);
        });
        fileList = newOrder;
        renderPreviews(); // znovu vykresli s novým poradím
    }
});

// Odoslanie formulára
document.getElementById("mergeForm").addEventListener("submit", async e => {
    e.preventDefault();

    spinner.style.display = "block";
    downloadBtn.style.display = "none";
    message.textContent = "";
    message.className = "";

    if (fileList.length < 2) {
        message.textContent = "Nahraj aspoň dva PDF súbory pre zlúčenie.";
        message.classList.add("text-warning");
        spinner.style.display = "none";
        return;
    }

    const accessToken = localStorage.getItem("access_token");
    const formData = new FormData();
    fileList.forEach(file => formData.append("files", file));

    try {
        const response = await fetch(`${BACKEND_URL}/pdf/merge`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            message.textContent = "PDF súbory boli úspešne zlúčené.";
            message.classList.add("text-success");

            downloadBtn.style.display = "inline-block";
            downloadBtn.onclick = () => {
                const a = document.createElement("a");
                a.href = url;
                a.download = "merged.pdf";
                a.click();
                URL.revokeObjectURL(url);
                downloadBtn.style.display = "none";
                message.textContent = "";
            };
        } else {
            message.textContent = "Chyba pri zlučovaní PDF.";
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
