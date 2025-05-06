const input = document.getElementById("pdfFile");
const preview = document.getElementById("preview");
const submitBtn = document.getElementById("submitBtn");
const downloadBtn = document.getElementById("downloadBtn");

let rotations = [];
let originalFile = null;

input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    originalFile = file;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    preview.innerHTML = "";
    rotations = Array(pdf.numPages).fill(0);

    // Presná cieľová veľkosť canvasu pre každý náhľad
    const CANVAS_WIDTH = 250;
    const CANVAS_HEIGHT = 250;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Vypočítaj mierku, aby sa stránka zmestila do cieľového canvasu
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
            CANVAS_WIDTH / unscaledViewport.width,
            CANVAS_HEIGHT / unscaledViewport.height
        );

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Nastav pevné rozmery canvasu
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // Vycentruj náhľad na ploche canvasu
        context.save();
        context.translate(
            (CANVAS_WIDTH - viewport.width) / 2,
            (CANVAS_HEIGHT - viewport.height) / 2
        );

        await page.render({ canvasContext: context, viewport }).promise;
        context.restore();

        const container = document.createElement("div");
        container.className = "page-container";

        const btnLeft = document.createElement("button");
        btnLeft.textContent = "⟲";
        btnLeft.onclick = () => rotatePage(i - 1, -90, canvas, page);

        const btnRight = document.createElement("button");
        btnRight.textContent = "⟳";
        btnRight.onclick = () => rotatePage(i - 1, 90, canvas, page);

        container.appendChild(canvas);
        container.appendChild(btnLeft);
        container.appendChild(btnRight);
        preview.appendChild(container);
    }

    submitBtn.style.display = "block";
    downloadBtn.style.display = "none";
});

function rotatePage(index, degrees, canvas, page) {
    rotations[index] = (rotations[index] + degrees + 360) % 360;

    const context = canvas.getContext("2d");

    // Získaj originálny viewport
    const unscaledViewport = page.getViewport({ scale: 1, rotation: rotations[index] });
    const scale = Math.min(
        canvas.width / unscaledViewport.width,
        canvas.height / unscaledViewport.height
    );
    const viewport = page.getViewport({ scale, rotation: rotations[index] });

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(
        (canvas.width - viewport.width) / 2,
        (canvas.height - viewport.height) / 2
    );
    page.render({ canvasContext: context, viewport });
    context.restore();
}

submitBtn.onclick = async () => {
    if (!originalFile) return;

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("rotations", JSON.stringify(rotations));

    const response = await fetch(`${BACKEND_URL}/pdf/rotate`, {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = "rotated.pdf";
        downloadBtn.style.display = "inline-block";
    } else {
        alert("Chyba pri otáčaní PDF.");
    }
};
