const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfFile");
const passwordInput = document.getElementById("passwordInput");
const encryptBtn = document.getElementById("encryptBtn");
const spinner = document.getElementById("loadingSpinner");
const message = document.getElementById("encryptMessage");
const downloadLink = document.getElementById("downloadLink");
const previewArea = document.getElementById("previewArea");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const resetBtn = document.getElementById("resetBtn");

let selectedFile = null;

// ===== DRAG & DROP zóna =====
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
        selectedFile = files[0];
        fileInput.files = e.dataTransfer.files;
        await showPreview(selectedFile);
    }
});

// ===== INPUT zmena =====
fileInput.addEventListener("change", async () => {
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        await showPreview(selectedFile);
    }
});

// ===== Náhľad prvej strany PDF =====
async function showPreview(file) {
    previewArea.innerHTML = "";
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    resetBtn.style.display = "inline-block";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 0.4;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    previewArea.appendChild(canvas);
}

// ===== Reset výberu =====
resetBtn.addEventListener("click", () => {
    fileInput.value = "";
    selectedFile = null;
    previewArea.innerHTML = "";
    fileNameDisplay.textContent = "";
    resetBtn.style.display = "none";
    spinner.style.display = "none";
    message.textContent = "";
    message.className = "";
    downloadLink.style.display = "none";
});

// ===== Odoslanie formulára =====
document.getElementById("encryptForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value.trim();
    message.textContent = "";
    message.className = "";
    downloadLink.style.display = "none";

    if (!selectedFile || !password) {
        message.textContent = "Vyberte PDF a zadajte heslo.";
        message.classList.add("text-danger", "text-center");
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("password", password);

    spinner.style.display = "block";

    try {
        const response = await fetch(`${BACKEND_URL}/pdf/encrypt`, {
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
            downloadLink.download = "secured.pdf";
            downloadLink.style.display = "inline-block";

            message.textContent = "Súbor bol úspešne zaheslovaný.";
            message.classList.add("text-success", "text-center");
        } else {
            message.textContent = "Chyba pri zaheslovaní PDF.";
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

// Prepínanie zobrazenia hesla 
document.getElementById("togglePassword").addEventListener("click", () => {
    const passwordInput = document.getElementById("passwordInput");
    const icon = document.getElementById("toggleIcon");
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
});
