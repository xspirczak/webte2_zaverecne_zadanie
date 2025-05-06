document.getElementById("mergeForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const input = document.getElementById("pdfs");
    const formData = new FormData();
    for (let file of input.files) {
        formData.append("files", file);
    }

    const response = await fetch(`${BACKEND_URL}/pdf/merge`, {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const downloadBtn = document.getElementById("downloadBtn");
        downloadBtn.style.display = "inline-block";

        downloadBtn.onclick = () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = "merged.pdf";
            a.click();
            URL.revokeObjectURL(url);  // upratanie
            downloadBtn.style.display = "none";  // skryť po stiahnutí
        };
    } else {
        alert("Chyba pri zlučovaní PDF.");
    }
});
