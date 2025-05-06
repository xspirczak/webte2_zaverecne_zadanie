let selectedPages = [];
let originalFile = null;

document.getElementById("pdfInput").addEventListener("change", async () => {
    const file = event.target.files[0];
    if (!file) return;
    originalFile = file;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const preview = document.getElementById("pdfPreview");
    preview.innerHTML = "";

    selectedPages = [];

    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        canvas.classList.add("page-canvas");
        canvas.dataset.index = i;

        // Click na výber / zrušenie výberu
        canvas.onclick = () => {
            const index = parseInt(canvas.dataset.index);
            if (selectedPages.includes(index)) {
                selectedPages = selectedPages.filter(p => p !== index);
                canvas.style.border = "";
            } else {
                selectedPages.push(index);
                canvas.style.border = "3px solid blue";
            }
        };

        preview.appendChild(canvas);
    }
});

document.getElementById("splitBtn").onclick = async () => {
    if (!originalFile || selectedPages.length === 0) return;

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("selectedPages", JSON.stringify(selectedPages));

    const accessToken = localStorage.getItem("access_token");
    const response = await fetch(`${BACKEND_URL}/pdf/split`, {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });

    if (response.ok) {
        const blob = await response.blob();
        const zipUrl = URL.createObjectURL(blob);
        const downloadLink = document.getElementById("downloadFirst");
        downloadLink.href = zipUrl;
        downloadLink.download = "split.zip";
        downloadLink.textContent = "Stiahnuť ZIP s PDF";
        downloadLink.style.display = "inline-block";
    } else {
        alert("Chyba pri rozdeľovaní.");
    }
};
