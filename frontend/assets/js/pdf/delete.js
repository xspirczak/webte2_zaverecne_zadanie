let pagesToDelete = [];
let originalFile = null;

document.getElementById("pdfInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    originalFile = file;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const preview = document.getElementById("pdfPreview");
    preview.innerHTML = "";
    pagesToDelete = [];

    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.5 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        await page.render({ canvasContext: context, viewport }).promise;

        canvas.classList.add("page-canvas");
        canvas.dataset.index = i;

        canvas.onclick = () => {
            const index = parseInt(canvas.dataset.index);
            if (pagesToDelete.includes(index)) {
                pagesToDelete = pagesToDelete.filter(p => p !== index);
                canvas.style.opacity = "1";
            } else {
                pagesToDelete.push(index);
                canvas.style.opacity = "0.3";
            }
        };

        preview.appendChild(canvas);
    }
});

document.getElementById("deleteBtn").onclick = async () => {
    if (!originalFile || pagesToDelete.length === 0) return;

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("pagesToDelete", JSON.stringify(pagesToDelete));

    const accessToken = localStorage.getItem("access_token");

    const response = await fetch(`${BACKEND_URL}/pdf/delete-pages`, {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.getElementById("downloadLink");
        link.href = url;
        link.download = "deleted-pages.pdf";
        link.textContent = "Stiahnuť upravený PDF";
        link.style.display = "inline-block";
    } else {
        alert("Chyba pri odstraňovaní strán.");
    }
};
