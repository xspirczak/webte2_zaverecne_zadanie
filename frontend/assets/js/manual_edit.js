let quill;

function showAlert(message, type = "info") {
    const alertDiv = document.getElementById("editAlert");
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} text-center`;
    alertDiv.style.display = "block";
    setTimeout(() => {
        alertDiv.style.display = "none";
    }, 4000);
}
document.addEventListener("DOMContentLoaded", async () => {
    quill = new Quill("#manual-editor", {
        theme: "snow",
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });

    // Načítaj aktuálny obsah z DB
    const res = await fetch(`${BACKEND_URL}/manual`);
    const html = await res.text();
    console.log(html);
    quill.clipboard.dangerouslyPasteHTML(html); // Použi túto metódu

    // Uloženie
    document.getElementById("saveBtn").addEventListener("click", async () => {
        const html = quill.root.innerHTML;

        const response = await fetch(`${BACKEND_URL}/manual`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: html
        });

        if (response.ok) {
            showAlert("Príručka bola uložená.", "success");
            setTimeout(() => {
                window.location.href = "manual.html";
            }, 3000);
        } else {
            showAlert("Chyba pri ukladaní príručky.", "success");
        }
    });
});